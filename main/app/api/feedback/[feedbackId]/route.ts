import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { feedbackCreateSchema } from "@/validation/feedback";
import { render } from "@react-email/components";
import sendgrid from "@sendgrid/mail";

import { baseUrl } from "@/utils/universal";
import crypto from "crypto";
import IssueFeedback from "@/emails/IssueFeedback";
var validator = require('validator');

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

async function sendFeedbackEmail(supabase: any, user: any, feedback: any, recipientEmail: string, recepientName: string, feedbackName: string, token: string, message?: string) {
    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('profile_id', user.id)
            .single();

        const { data: organization } = await supabase
            .from('organization')
            .select('name, email, logoUrl')
            .eq('createdBy', user.id)
            .maybeSingle();

        const fromEmail = 'no_reply@feedback.bexforte.com';
        
        let fromName = 'Bexbot';
        let senderName = organization?.name || (profile?.email ? profile.email.split('@')[0] : 'Bexforte Feedback');
        const logoUrl = organization?.logoUrl || "https://www.bexoni.com/favicon.ico";
        
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
            finalFeedbackName = "Feedback Form";
        }

        let finalrecepientName = recepientName;
        if (feedback.customerId) {
            const { data: customer } = await supabase
                .from('customers')
                .select('name')
                .eq('id', feedback.customerId)
                .single();
            finalrecepientName = customer?.name || finalrecepientName;
        }
        if (!finalrecepientName && feedback.recepientName) {
            finalrecepientName = feedback.recepientName;
        }
        if (!finalrecepientName) {
            finalrecepientName = recipientEmail.split('@')[0];
        }

        const feedbackLink = `${baseUrl}/f/${feedback.id}?token=${token}`;

        const emailHtml = await render(IssueFeedback({
            feedbackId: feedback.id,
            clientName: finalrecepientName || "Valued Customer",
            feedbackName: finalFeedbackName,
            projectName: feedback.projectId ? finalFeedbackName : undefined,
            senderName: fromName,
            logoUrl: logoUrl,
            feedbackLink,
        }));

        await sendgrid.send({
            to: recipientEmail,
            from:  `${fromName} <${fromEmail}>`,
            subject: `You have an updated form to fill out`,
            html: emailHtml,
            customArgs: {
                feedbackId: feedback.id,
                customerId: feedback.customerId || "",
                userId: user.id,
                type: "feedback_updated",
                token: token,
            },
        });

        console.log("Feedback email sent to:", recipientEmail);

    } catch (emailError: any) {
        console.error("SendGrid Error:", emailError);
    }
}


export async function GET(
    request: NextRequest,
    context: any
  ) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
  
    if (!user) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 })
    }
  
    const { params } = context;
    const { feedbackId } = params
  
    try {
      // Fetch the feedback
      const { data: feedback, error: feedbackError } = await supabase
        .from("feedbacks")
        .select("*")
        .eq("id", feedbackId)
        .eq("createdBy", user.id)
        .single()
  
      if (feedbackError) throw feedbackError
      if (!feedback) throw new Error("feedback not found")
  
      // Fetch the customer
      let customer = null
      if (feedback.customerId) {
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("id, name, email")
          .eq("id", feedback.customerId)
          .single()
        if (customerError) throw customerError
        customer = customerData
      }
  
   
  
      // Remap paymentTerms to paymentMilestones for frontend consistency
      const projectResponse = {
        ...feedback,
        customer
      }
  
      return NextResponse.json({ success: true, project: projectResponse })
    } catch (e) {
      const error = e as Error
      console.error(`Error fetching project ${context.params.projectId}:`, error.message)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
}

export async function PATCH(
    request: Request, 
    context: { params: Promise<{ feedbackId: string }> }
) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { feedbackId } = await context.params;
    const { action, ...data } = body;
    
    if (!feedbackId) {
        return NextResponse.json({ error: "Feedback ID is required" }, { status: 400 });
    }

    // Check if feedback exists and belongs to user, and get current recipient/dueDate
    const { data: existingFeedback, error: checkError } = await supabase
        .from("feedbacks")
        .select("createdBy, state, recepientEmail, dueDate")
        .eq("id", feedbackId)
        .single();

    if (checkError || !existingFeedback) {
        return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    if (existingFeedback.createdBy !== user.id) {
        return NextResponse.json({ error: "Unauthorized to update this feedback" }, { status: 403 });
    }

    // Allow updating/sending for draft, overdue, and sent states
    if (!["draft", "overdue", "sent"].includes(existingFeedback.state)) {
        return NextResponse.json({ error: "Only draft, overdue, and sent feedback can be updated" }, { status: 400 });
    }

    // Clean and validate the data - handle null values properly
    const cleanData = {
        ...data,
        recipientEmail: data.recipientEmail === "" ? undefined : data.recipientEmail,
        recepientName: data.recepientName,
        message: data.message,
        templateId: data.templateId || undefined,
        name: data.name || (data.questions && data.questions.length > 0 ? data.questions[0].text : 'Untitled Feedback'),
    }

    const validatedFields = feedbackCreateSchema.safeParse(cleanData);

    if (!validatedFields.success) {
        console.error("Feedback Update Validation Errors:", JSON.stringify(validatedFields.error.flatten(), null, 2));
        return NextResponse.json(
            { error: "Invalid feedback fields!", details: validatedFields.error.flatten() }, 
            { status: 400 }
        );
    }

    const {
        name, customerId, projectId, templateId, dueDate,
        recipientEmail, recepientName, message, questions, answers = []
    } = validatedFields.data;

    const currentTimestamp = new Date().toISOString();
    let finalRecipientEmail = recipientEmail;
    let customerName = "";

    if (customerId) {
        const { data: customer, error: customerError } = await supabase
            .from("customers").select("name, email").eq("id", customerId).single();
        if (customerError) {
            return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
        }
        finalRecipientEmail = customer.email;
        customerName = customer.name || "";
    }

    // New Due Date Logic
    let finalDueDate;
    const recipientHasChanged = finalRecipientEmail && finalRecipientEmail !== existingFeedback.recepientEmail;

    if (recipientHasChanged) {
        if (dueDate) {
            // New recipient, new due date provided: use it.
            finalDueDate = dueDate;
        } else {
            // New recipient, no due date provided: default to 3 days from now.
            const now = new Date();
            const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
            finalDueDate = threeDaysFromNow;
        }
    } else {
        // Recipient hasn't changed. Only update due date if a new one is provided.
        // Otherwise, keep the existing one.
        finalDueDate = dueDate || existingFeedback.dueDate;
    }

    try {
        const updatePayload: any = {
            name, customerId, projectId, templateId,
            dueDate: finalDueDate,
            recepientEmail: finalRecipientEmail,
            recepientName: customerId ? null : recepientName,
            questions, answers, message,
            updated_at: currentTimestamp,
        };

        if (action === 'send_feedback') {
            if (!finalRecipientEmail || !validator.isEmail(finalRecipientEmail)) {
                return NextResponse.json({ success: false, error: "Invalid email address." }, { status: 400 });
            }
            updatePayload.token = crypto.randomUUID();
            updatePayload.state = 'sent';
            updatePayload.sentAt = currentTimestamp;
        }

        const { data: updatedFeedback, error: updateError } = await supabase
            .from("feedbacks")
            .update(updatePayload)
            .eq("id", feedbackId)
            .in("state", ["draft", "overdue", "sent"])
            .select()
            .single();

        if (updateError) {
            console.error("Supabase Feedback Update Error:", updateError);
            return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
        }

        if (action === 'send_feedback' && finalRecipientEmail) {
            await sendFeedbackEmail(supabase, user, updatedFeedback, finalRecipientEmail, customerName, name, updatedFeedback.token, message || "");
        }

        return NextResponse.json({ success: true, data: updatedFeedback }, { status: 200 });

    } catch (error) {
        console.error("Error updating feedback:", error);
        return NextResponse.json({ success: false, error: "Failed to update feedback" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    context: any
  ) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
  
    const { params } = context;
    const { feedbackId } = params
  
    try {
      const { error: feedbackDeleteError } = await supabase
        .from("feedbacks")
        .delete()
        .eq("id", feedbackId)
        .eq("createdBy", user?.id)
  
      if (feedbackDeleteError) throw feedbackDeleteError
  
      return NextResponse.json({ success: true, message: "Feedback deleted successfully" })
    } catch (e) {
      const error = e as Error
      console.error(`Error deleting feedback ${feedbackId}:`, error.message)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
  }