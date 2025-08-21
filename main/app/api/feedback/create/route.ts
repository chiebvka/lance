import { createClient } from "@/utils/supabase/server";

import { NextResponse } from "next/server";
import { render } from "@react-email/components";
import sendgrid from "@sendgrid/mail";
import IssueFeedback from '../../../../emails/IssueFeedback';
import { feedbackCreateSchema, feedbackTemplateSchema } from "@/validation/feedback";
import { baseUrl } from "@/utils/universal";
import crypto from "crypto";
import { ratelimit } from "@/utils/rateLimit";
var validator = require('validator');

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

export async function POST(request: Request) {
    const supabase = await createClient();
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        // Check if user has an organization
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('organizationId')
            .eq('profile_id', user.id)
            .single();

        if (profileError || !profile?.organizationId) {
            return NextResponse.json({ 
                success: false, 
                error: "You must be part of an organization to create feedback or templates. Please contact your administrator." 
            }, { status: 403 });
        }

        // 2. Rate limit check (use user.id as key)
        const { success } = await ratelimit.limit(user.id);
        if (!success) {
        return NextResponse.json({ success: false, error: "Too Many Requests" }, { status: 429 });
        }
        
        const body = await request.json();
        const { action, ...data } = body;

        // Handle different actions
        if (action === "save_template") {
            return await handleSaveTemplate(supabase, user, data, profile.organizationId);
        } else if (action === "save_draft" || action === "send_feedback") {
            return await handleCreateFeedback(supabase, user, data, action, profile.organizationId);
        } else if (action === "delete_draft") {
            return await handleDeleteDraft(supabase, user, data);
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

    } catch (error) {
        console.error("Error during feedback operation:", error);
        return NextResponse.json({ success: false, error: "Failed to process feedback" }, { status: 500 });
    }
}

async function handleDeleteDraft(supabase: any, user: any, data: any) {
    const { draftId } = data;

    if (!draftId) {
        return NextResponse.json({ error: "Draft ID is required" }, { status: 400 });
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organizationId')
        .eq('profile_id', user.id)
        .single();

    if (profileError || !profile?.organizationId) {
        return NextResponse.json({ 
            error: "You must be part of an organization to manage drafts." 
        }, { status: 403 });
    }

    // Check if user owns this draft and it belongs to their organization
    const { data: existingDraft, error: checkError } = await supabase
        .from("feedbacks")
        .select("createdBy, organizationId")
        .eq("id", draftId)
        .eq("state", "draft")
        .single();

    if (checkError || !existingDraft) {
        return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    if (existingDraft.createdBy !== user.id) {
        return NextResponse.json({ error: "Unauthorized to delete this draft" }, { status: 403 });
    }

    if (existingDraft.organizationId !== profile.organizationId) {
        return NextResponse.json({ error: "Unauthorized to delete this draft" }, { status: 403 });
    }

    // Delete the draft
    const { error: deleteError } = await supabase
        .from("feedbacks")
        .delete()
        .eq("id", draftId);

    if (deleteError) {
        console.error("Supabase Draft Delete Error:", deleteError);
        return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
    }

    console.log("Draft deleted successfully. Draft ID:", draftId);
    return NextResponse.json({ success: true, message: "Draft deleted successfully" }, { status: 200 });
}

async function handleSaveTemplate(supabase: any, user: any, data: any, organizationId: string) {
    // Add the createdBy field before validation
    const templateData = {
        ...data,
        createdBy: user.id,
        organizationId: organizationId
    };

    const validatedFields = feedbackTemplateSchema.safeParse(templateData);

    if (!validatedFields.success) {
        console.error("Template Validation Errors:", JSON.stringify(validatedFields.error.flatten(), null, 2));
        return NextResponse.json(
            { error: "Invalid template fields!", details: validatedFields.error.flatten() }, 
            { status: 400 }
        );
    }

    const { name, questions, isDefault } = validatedFields.data;

    console.log("Attempting to insert into 'feedback_templates' table...");
    const { data: template, error: templateError } = await supabase
        .from("feedback_templates")
        .insert({
            name,
            questions,
            isDefault: isDefault || false,
            createdBy: user.id,
            organizationId: organizationId,
            created_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (templateError) {
        console.error("Supabase Template Insert Error:", templateError);
        return NextResponse.json({ success: false, error: templateError.message }, { status: 500 });
    }

    console.log("Template saved successfully. Template ID:", template.id);
    return NextResponse.json({ success: true, data: template }, { status: 200 });
}

async function handleCreateFeedback(supabase: any, user: any, data: any, action: string, organizationId: string) {
    // Clean the data before validation
    const cleanData = {
        ...data,
        // Handle optional fields
        recipientEmail: data.recipientEmail || undefined,
        recepientName: data.recepientName || undefined, 
        message: data.message || undefined,
        templateId: data.templateId || undefined,
        answers: data.answers || undefined,
        // Determine the name: use provided name or fallback to first question
        name: data.name || (data.questions && data.questions.length > 0 ? data.questions[0].text : 'Untitled Feedback'),
    }
    
    const validatedFields = feedbackCreateSchema.safeParse(cleanData);

    if (!validatedFields.success) {
        console.error("Feedback Validation Errors:", JSON.stringify(validatedFields.error.flatten(), null, 2));
        return NextResponse.json(
            { error: "Invalid feedback fields!", details: validatedFields.error.flatten() }, 
            { status: 400 }
        );
    }

    const {
        name,
        customerId,
        projectId,
        templateId,
        dueDate,
        recipientEmail,
        recepientName,
        message,
        questions,
        answers = []
    } = validatedFields.data;

    // Determine the state based on action
    const state = action === "send_feedback" ? "sent" : "draft";
    
    // Handle due date logic
    let finalDueDate = dueDate;
    
    // If no due date is provided and we're sending the feedback, set it to 3 days from now
    if (!finalDueDate && action === "send_feedback") {
        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)); // Add 3 days in milliseconds
        finalDueDate = threeDaysFromNow;
        console.log("No due date provided, setting to 3 days from send time:", finalDueDate.toISOString());
    }
    
    // For drafts, only set due date if explicitly provided
    if (action === "save_draft" && !finalDueDate) {
        finalDueDate = null;
    }

    // Determine recipient email - either from customer or direct recipient
    let finalRecipientEmail = recipientEmail;
    let customerName = "";

    if (customerId) {
        const { data: customer, error: customerError } = await supabase
            .from("customers")
            .select("name, email")
            .eq("id", customerId)
            .single();

        if (customerError) {
            return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
        }

        finalRecipientEmail = customer.email;
        customerName = customer.name || "";
    }

    // Email validation - ONLY apply when sending feedback, not when saving drafts
    if (action === "send_feedback") {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!finalRecipientEmail || !emailRegex.test(finalRecipientEmail) || !validator.isEmail(finalRecipientEmail)) {
            return NextResponse.json({ 
                success: false, 
                error: "Invalid email address. Please provide a valid email format." 
            }, { status: 400 });
        }
    }

    // Get organization information when sending feedback (not for drafts)
    let organizationName = null;
    let organizationLogo = null;
    let organizationEmail = null;

    if (action === "send_feedback") {
        // Get user profile with organizationId
        const { data: profile } = await supabase
            .from('profiles')
            .select('email, organizationId')
            .eq('profile_id', user.id)
            .single();

        if (profile) {
            // If user has an organization, get organization details
            if (profile.organizationId) {
                const { data: organization } = await supabase
                    .from('organization')
                    .select('name, email, logoUrl')
                    .eq('id', profile.organizationId)
                    .single();

                if (organization) {
                    // Set organization fields with fallbacks
                    organizationName = organization.name || (profile.email ? profile.email.split('@')[0] : null);
                    organizationLogo = organization.logoUrl || null; // Empty fallback as requested
                    organizationEmail = organization.email || profile.email;
                } else {
                    // Organization not found, use profile fallbacks
                    organizationName = profile.email ? profile.email.split('@')[0] : null;
                    organizationLogo = null;
                    organizationEmail = profile.email;
                }
            } else {
                // No organization linked, use profile fallbacks
                organizationName = profile.email ? profile.email.split('@')[0] : null;
                organizationLogo = null;
                organizationEmail = profile.email;
            }
        }

        console.log("Organization data retrieved:", {
            organizationName,
            organizationLogo,
            organizationEmail
        });
    }

    // Generate token for feedback access
    const token = crypto.randomUUID();

    // Get current timestamp for sent date
    const currentTimestamp = new Date().toISOString();

    console.log("Attempting to insert into 'feedbacks' table...");
    const { data: feedback, error: feedbackError } = await supabase
        .from("feedbacks")
        .insert({
            name, // Add the name field to the database insert
            customerId,
            projectId,
            templateId,
            dueDate: finalDueDate,
            state,
            recepientEmail: finalRecipientEmail, // Note: matches DB column name
            recepientName: customerId ? null : recepientName, 
            questions,
            answers,
            createdBy: user.id,
            organizationId: organizationId,
            sentAt: action === "send_feedback" ? currentTimestamp : null,
            created_at: currentTimestamp,
            token: token,
            // Add organization fields only when sending feedback
            ...(action === "send_feedback" && {
                organizationName,
                organizationLogo,
                organizationEmail
            })
        })
        .select()
        .single();

    if (feedbackError) {
        console.error("Supabase Feedback Insert Error:", feedbackError);
        return NextResponse.json({ success: false, error: feedbackError.message }, { status: 500 });
    }

    if (!feedback) {
        return NextResponse.json({ success: false, error: "Failed to create feedback; feedback data is null after insert." }, { status: 500 });
    }

    console.log("Feedback created successfully. Feedback ID:", feedback.id);
    console.log("Due date set to:", finalDueDate);

    // Send email if action is "send_feedback"
    if (action === "send_feedback" && finalRecipientEmail) {
        await sendFeedbackEmail(supabase, user, feedback, finalRecipientEmail, customerName, name, token, message || "");
    }

    return NextResponse.json({ 
        success: true, 
        data: {
            ...feedback,
            calculatedDueDate: finalDueDate
        }
    }, { status: 200 });
}

async function sendFeedbackEmail(supabase: any, user: any, feedback: any, recipientEmail: string, recepientName: string, feedbackName: string, token: string, message?: string) {
    try {
        // Get user profile for sender info
        const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('profile_id', user.id)
            .single();

        // Get organization for branding
        const { data: organization } = await supabase
            .from('organization')
            .select('name, email, logoUrl')
            .eq('createdBy', user.id)
            .maybeSingle();

        const fromEmail = 'no_reply@feedback.bexforte.com';
        
        const fromName = 'Bexbot';
        let senderName = organization?.name || (profile?.email ? profile.email.split('@')[0] : 'Bexforte Feedback');

        const logoUrl = organization?.logoUrl || "https://www.bexoni.com/favicon.ico";
        
        // Get project name if project is linked
        let finalFeedbackName = feedbackName;
        if (feedback.projectId) {
            const { data: project } = await supabase
                .from('projects')
                .select('name')
                .eq('id', feedback.projectId)
                .single();
                finalFeedbackName = project?.name || finalFeedbackName; 
        }
        if (!finalFeedbackName) {
            finalFeedbackName = "Feedback Form"; // Fallback
        }

        // Determine recipient name: from customer table, recepientName, or first part of recipientEmail
        let finalrecepientName = recepientName  // Default to customerName if provided
        if (feedback.customerId) {
            const { data: customer } = await supabase
                .from('customers')
                .select('name')
                .eq('id', feedback.customerId)
                .single();
            finalrecepientName = customer?.name || finalrecepientName; // Use customer name if available
        }
        if (!finalrecepientName && feedback.recepientName) {
            finalrecepientName = feedback.recepientName; // Use recepientName from feedback table
        }
        if (!finalrecepientName) {
            finalrecepientName = recipientEmail.split('@')[0]; // Fallback to first part of recipientEmail
        }

        const emailHtml = await render(IssueFeedback({
            feedbackId: feedback.id,
            clientName: finalrecepientName || "Valued Customer",
            feedbackName: finalFeedbackName,
            projectName: feedback.projectId ? finalFeedbackName : undefined,
            senderName: fromName,
            logoUrl: logoUrl,
            feedbackLink: `${baseUrl}/f/${feedback.id}?token=${token}`,
        }));

        console.log(`Attempting to send feedback email from: ${fromEmail} to: ${recipientEmail}`);
        console.log(`Feedback link: ${baseUrl}/f/${feedback.id}?token=${token}`);

        await sendgrid.send({
            to: recipientEmail,
            from:  `${fromName} <${fromEmail}>`,
            subject: `You have a form to fill out`,
            html: emailHtml,
            customArgs: {
                feedbackId: feedback.id,
                customerId: feedback.customerId || "",
                userId: user.id,
                type: "feedback_sent",
                token: token,
            },
        });

        console.log("Feedback email sent to:", recipientEmail);

    } catch (emailError: any) {
        console.error("SendGrid Error:", emailError);
        // Don't fail the main request if email fails
    }
}