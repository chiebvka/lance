import { ratelimit } from "@/utils/rateLimit";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";
import { feedbackAnswerSchema } from "@/validation/feedback";
import { NextResponse } from "next/server";
import { isOrgSubscriptionActive, deriveInactiveReason } from "@/utils/subscription";
import sendgrid from "@sendgrid/mail";
import { render } from "@react-email/components";
import FeedbackAnswer from "@/emails/FeedbackAnswer";
import { baseUrl } from "@/utils/universal";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

interface Question {
  id: string;
  type: string;
  text: string;
  required?: boolean;
  options?: any;
}

export async function PATCH(request: Request) {
  // Use service role client for updating feedback and creating notifications
  const supabase = await createServiceRoleClient();

  // Rate limit check using IP address (for unauthenticated users)
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return NextResponse.json({ success: false, error: "Too Many Requests" }, { status: 429 });
  }

  const body = await request.json();

  // Validate the incoming data
  const validationResult = feedbackAnswerSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input data", details: validationResult.error.flatten() },
      { status: 400 }
    );
  }

  const { feedbackId, token, answers } = validationResult.data;

  try {
    // Validate the token and check the feedback state
    const { data: feedback, error: fetchError } = await supabase
      .from("feedbacks")
      .select(`
        id, 
        token, 
        state, 
        questions, 
        dueDate, 
        filledOn,
        name,
        organizationId,
        customerId,
        recepientEmail,
        recepientName,
        organization:organizationId (
          id,
          name,
          email,
          logoUrl,
          feedbackNotifications
        )
      `)
      .eq("id", feedbackId)
      .eq("token", token)
      .single();

    if (fetchError || !feedback) {
      return NextResponse.json({ success: false, error: "Invalid or expired link" }, { status: 400 });
    }

    if (feedback.state === "completed") {
      return NextResponse.json({ success: false, error: "Feedback already completed" }, { status: 400 });
    }

    // Verify that all questionIds in answers exist in the original questions
    const originalQuestions: Question[] = feedback.questions || [];
    const submittedQuestionIds = new Set(answers.map((a) => a.questionId));
    const validQuestionIds = new Set(originalQuestions.map((q: Question) => q.id));

    // Convert Set to Array for iteration compatibility
    const submittedIds = Array.from(submittedQuestionIds);
    if (!submittedIds.every((id) => validQuestionIds.has(id))) {
      return NextResponse.json(
        { success: false, error: "One or more question IDs are invalid" },
        { status: 400 }
      );
    }

    // Update the feedback with answers and state using service role client
    const currentTimestamp = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("feedbacks")
      .update({
        answers: answers,
        state: "completed",
        filledOn: currentTimestamp,
        updated_at: currentTimestamp
      })
      .eq("id", feedbackId)
      .eq("token", token);

    if (updateError) {
      console.error("Error updating feedback:", updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    // Create organization notification if enabled (default true unless explicitly false)
    const organization = (feedback as any)?.organization;
    if (organization && organization.feedbackNotifications !== false) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          organizationId: feedback.organizationId,
          title: 'Feedback Form Completed',
          message: `Feedback form "${feedback.name}" has been completed.`,
          type: 'success',
          actionUrl: `${baseUrl}/protected/feedback?feedbackId=${feedbackId}`,
          metadata: {
            feedbackId,
            feedbackName: feedback.name,
            completedOn: currentTimestamp,
          },
          tableName: 'feedbacks',
          tableId: feedbackId,
          state: 'active',
        });
      if (notifError) {
        console.error('Notification creation error:', notifError);
      }
    }

    // Send confirmation emails to customer and organization
    try {
      const logoUrl = organization?.logoUrl || 'https://www.bexoni.com/favicon.ico';
      const senderName = organization?.name || 'Bexforte';
      const feedbackLink = `${baseUrl}/f/${feedbackId}?token=${token}`;

      const emailHtml = await render(FeedbackAnswer({
        senderName,
        clientName: (feedback as any)?.recepientName || 'Customer',
        feedbackName: feedback.name,
        feedbackId: feedback.id,
        logoUrl: logoUrl,
        feedbackLink,
      }));

      const fromEmail = 'no_reply@feedback.bexforte.com';
      const fromName = senderName;

      // Prepare email targets with proper fallbacks
      const sendTargets: Array<{ to: string; name?: string; type: 'customer' | 'organization' }> = [];
      
      // Add customer email if available
      const customerEmail = (feedback as any)?.recepientEmail;
      if (customerEmail) {
        sendTargets.push({ 
          to: customerEmail, 
          name: (feedback as any)?.recepientName || 'Customer', 
          type: 'customer' 
        });
      }
      
      // Add organization email if available
      const organizationEmail = organization?.email;
      if (organizationEmail) {
        sendTargets.push({ 
          to: organizationEmail, 
          name: organization?.name || 'Organization', 
          type: 'organization' 
        });
      }

      // Send emails to all targets
      for (const target of sendTargets) {
        try {
          await sendgrid.send({
            to: target.to,
            from: `${fromName} <${fromEmail}>`,
            subject: `Feedback Form Completed: ${feedback.name}`,
            html: emailHtml,
            customArgs: {
              feedbackId: feedback.id,
              feedbackName: feedback.name || '',
              customerId: feedback.customerId || '',
              customerName: (feedback as any)?.recepientName || '',
              organizationId: feedback.organizationId || '',
              userId: feedback.customerId || '',
              type: 'feedback_submitted',
              recipientType: target.type,
            },
          });
          
          console.log(`[submit-feedback] Email sent successfully to ${target.type}: ${target.to}`);
        } catch (emailError: any) {
          console.error(`[submit-feedback] Failed to send email to ${target.type} (${target.to}):`, emailError);
          // Continue with other emails even if one fails
        }
      }
      
      if (sendTargets.length === 0) {
        console.warn('[submit-feedback] No valid email addresses found for customer or organization');
      }
      
    } catch (emailErr: any) {
      console.error('Feedback answer email error:', emailErr);
    }

    return NextResponse.json({ success: true, message: "Feedback submitted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error in submit-feedback:", error);
    return NextResponse.json({ success: false, error: "Failed to submit feedback" }, { status: 500 });
  }
}

// Add GET route to fetch feedback data
export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const feedbackId = searchParams.get('feedbackId');
  const token = searchParams.get('token');

  if (!feedbackId || !token) {
    return NextResponse.json({ error: "Missing feedbackId or token" }, { status: 400 });
  }

  try {
    const { data: feedback, error } = await supabase
      .from("feedbacks")
      .select(`
        id,
        name,
        state,
        questions,
        dueDate,
        filledOn,
        organizationName,
        organizationLogo,
        organizationEmail,
        recepientEmail,
        recepientName,
        organization:organizationId (
          id,
          name,
          email,
          logoUrl,
          subscriptionstatus,
          trialEndsAt
        ),
        message,
        created_at
      `)
      .eq("id", feedbackId)
      .eq("token", token)
      .single();

    if (error || !feedback) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
    }

    // Gate by organization subscription (non-auth public preview)
    const orgStatus = (feedback as any)?.organization?.subscriptionstatus ?? null;
    const orgTrialEndsAt = (feedback as any)?.organization?.trialEndsAt ?? null;
    if (!isOrgSubscriptionActive(orgStatus, orgTrialEndsAt)) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization subscription inactive",
          reason: deriveInactiveReason(orgStatus, orgTrialEndsAt),
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: feedback }, { status: 200 });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }
}
