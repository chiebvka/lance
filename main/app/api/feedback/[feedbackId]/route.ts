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

async function sendFeedbackEmail(supabase: any, user: any, feedback: any, recipientEmail: string, recepientName: string, feedbackName: string, token: string, message?: string, organizationId?: string, customerName?: string) {
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
            subject: `You have a form to fill out`,
            html: emailHtml,
            customArgs: {
                feedbackId: feedback.id,
                feedbackName: feedbackName || '',
                customerId: feedback.customerId || "",
                customerName: customerName,
                organizationId: feedback.organizationId || '',
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

    // Check if feedback exists and belongs to user, and get current state
    const { data: existingFeedback, error: checkError } = await supabase
        .from("feedbacks")
        .select("createdBy, state, recepientEmail, dueDate, customerId, recepientName")
        .eq("id", feedbackId)
        .single();

    if (checkError || !existingFeedback) {
        return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    if (existingFeedback.createdBy !== user.id) {
        return NextResponse.json({ error: "Unauthorized to update this feedback" }, { status: 403 });
    }

    // Allow updating for most states (we handle state transitions in the UI)
    if (!["draft", "unassigned", "sent", "overdue", "cancelled", "completed"].includes(existingFeedback.state)) {
        return NextResponse.json({ error: "Invalid feedback state for updates" }, { status: 400 });
    }

    const currentTimestamp = new Date().toISOString();
    let finalRecipientEmail = data.recepientEmail;
    let finalRecipientName = data.recepientName;
    let customerName = "";

    // Resolve customer data if customerId is provided
    if (data.customerId) {
        const { data: customer, error: customerError } = await supabase
            .from("customers")
            .select("name, email")
            .eq("id", data.customerId)
            .single();
        
        if (customerError) {
            return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
        }
        
        finalRecipientEmail = customer.email;
        finalRecipientName = customer.name;
        customerName = customer.name || "";
    } else if (existingFeedback.customerId && data.emailToCustomer) {
        // If no customerId provided but we're sending email and feedback has existing customer,
        // fetch the customer data to get the email
        const { data: existingCustomer, error: customerError } = await supabase
            .from("customers")
            .select("name, email")
            .eq("id", existingFeedback.customerId)
            .single();
        
        if (!customerError && existingCustomer) {
            finalRecipientEmail = existingCustomer.email;
            finalRecipientName = existingCustomer.name;
        }
    }

    // Build update payload dynamically
    const updatePayload: any = {
        updated_at: currentTimestamp,
    };

    // Handle different actions
    switch (action) {
        case 'mark_completed':
            updatePayload.state = 'completed';
            updatePayload.filledOn = data.filledOn || currentTimestamp;
            break;

        case 'restart':
            updatePayload.state = data.emailToCustomer ? 'sent' : 'draft';
            if (data.emailToCustomer) {
                updatePayload.token = crypto.randomUUID();
                updatePayload.sentAt = currentTimestamp;
            }
            break;

        case 'cancel':
            updatePayload.state = 'cancelled';
            updatePayload.token = null;
            break;

        case 'unassign':
            updatePayload.customerId = null;
            updatePayload.recepientName = null;
            updatePayload.recepientEmail = null;
            updatePayload.token = null;
            if (data.setToDraft) {
                updatePayload.state = 'draft';
            } else if (!['cancelled', 'completed', 'draft'].includes(existingFeedback.state)) {
                updatePayload.state = 'unassigned';
            }
            break;

        case 'assign_customer':
            updatePayload.customerId = data.customerId;
            updatePayload.recepientName = finalRecipientName;
            updatePayload.recepientEmail = finalRecipientEmail;
            if (data.emailToCustomer) {
                updatePayload.state = 'sent';
                updatePayload.token = crypto.randomUUID();
                updatePayload.sentAt = currentTimestamp;
            } else if (existingFeedback.state === 'cancelled') {
                updatePayload.state = 'draft';
            }
            break;

        case 'update_customer':
            updatePayload.customerId = data.customerId;
            updatePayload.recepientName = finalRecipientName;
            updatePayload.recepientEmail = finalRecipientEmail;
            if (data.emailToCustomer) {
                updatePayload.state = 'sent';
                updatePayload.token = crypto.randomUUID();
                updatePayload.sentAt = currentTimestamp;
            }
            break;

        case 'set_unassigned':
            updatePayload.state = 'unassigned';
            break;

        case 'send_feedback':
            if (!finalRecipientEmail || !validator.isEmail(finalRecipientEmail)) {
                return NextResponse.json({ success: false, error: "Invalid email address." }, { status: 400 });
            }
            updatePayload.state = 'sent';
            updatePayload.token = crypto.randomUUID();
            updatePayload.sentAt = currentTimestamp;
            break;

        default:
            // Handle general updates
            if (data.state !== undefined) updatePayload.state = data.state;
            if (data.customerId !== undefined) updatePayload.customerId = data.customerId;
            if (data.projectId !== undefined) updatePayload.projectId = data.projectId;
            if (data.name !== undefined) updatePayload.name = data.name;
            if (data.questions !== undefined) updatePayload.questions = data.questions;
            if (data.answers !== undefined) updatePayload.answers = data.answers;
            if (data.dueDate !== undefined) updatePayload.dueDate = data.dueDate;
            if (data.message !== undefined) updatePayload.message = data.message;
            if (data.templateId !== undefined) updatePayload.templateId = data.templateId;
            
            // Handle customer assignment in general updates
            if (data.customerId !== undefined) {
                updatePayload.recepientName = finalRecipientName;
                updatePayload.recepientEmail = finalRecipientEmail;
            }
            
            // Handle sending email in general updates
            if (data.emailToCustomer && finalRecipientEmail) {
                updatePayload.state = 'sent';
                updatePayload.token = crypto.randomUUID();
                updatePayload.sentAt = currentTimestamp;
            }
            break;
    }

    try {
        const { data: updatedFeedback, error: updateError } = await supabase
            .from("feedbacks")
            .update(updatePayload)
            .eq("id", feedbackId)
            .select()
            .single();

        if (updateError) {
            console.error("Supabase Feedback Update Error:", updateError);
            return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
        }

        // Send email if requested
        if ((action === 'send_feedback' || data.emailToCustomer || 
             (action === 'restart' && data.emailToCustomer) ||
             (action === 'assign_customer' && data.emailToCustomer) ||
             (action === 'update_customer' && data.emailToCustomer)) && 
            finalRecipientEmail && updatedFeedback) {
            
            const feedbackName = updatedFeedback.name || 'Feedback Form';
            const token = updatedFeedback.token;
            
            if (token) {
                await sendFeedbackEmail(
                    supabase, 
                    user, 
                    updatedFeedback, 
                    finalRecipientEmail, 
                    finalRecipientName || '', 
                    feedbackName, 
                    token, 
                    data.message || "", 
                    updatedFeedback.organizationId, 
                    customerName
                );
            }
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