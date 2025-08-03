import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import sendgrid from "@sendgrid/mail";
import { render } from "@react-email/components";
import FeedbackReminder from "@/emails/FeedbackReminder";
import { baseUrl } from "@/utils/universal";

var validator = require('validator');

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

export async function GET(request: NextRequest) {
  // 1. Secret token check
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const now = new Date();

  try {
    const { data: overdueFeedback, error: queryError } = await supabase
      .from("feedbacks")
      .select("*")
      .lt("dueDate", now.toISOString())
      .neq("state", "overdue")
      .eq("state", "sent")
      .eq("allowReminders", true);

    if (queryError) {
      console.error("Error querying overdue feedback:", queryError);
      return NextResponse.json({ success: false, error: queryError.message }, { status: 500 });
    }

    if (!overdueFeedback || overdueFeedback.length === 0) {
      console.log("No overdue feedback found.");
      return NextResponse.json({ success: true, message: "No overdue feedback" }, { status: 200 });
    }

    let processedCount = 0;
    for (const feedback of overdueFeedback) {
      try {
        const { error: updateError } = await supabase
          .from("feedbacks")
          .update({ state: "overdue" })
          .eq("id", feedback.id);

        if (updateError) {
          console.error(`Error updating feedback ${feedback.id}:`, updateError);
          continue;
        }

        // Create notification for the organization
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            organizationId: feedback.organizationId,
            title: "Feedback Overdue",
            message: `Feedback "${feedback.name}" for ${feedback.recepientName || feedback.recepientEmail} is overdue.`,
            type: "warning",
            actionUrl: `${baseUrl}/protected/feedback/${feedback.id}`,
            metadata: {
              feedbackName: feedback.name,
              recipientName: feedback.recepientName,
              recipientEmail: feedback.recepientEmail,
              dueDate: feedback.dueDate
            },
            tableName: "feedbacks",
            tableId: feedback.id,
            state: "active"
          });

        if (notificationError) {
          console.error(`Error creating notification for feedback ${feedback.id}:`, notificationError);
          continue;
        }

        await sendReminderEmail(supabase, feedback, "feedback");
        processedCount++;
      } catch (error) {
        console.error(`Error processing feedback ${feedback.id}:`, error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${processedCount} overdue feedbacks` 
    }, { status: 200 });
  } catch (error) {
    console.error("Error in check-overdue-feedback:", error);
    return NextResponse.json({ success: false, error: "Failed to process overdue feedback" }, { status: 500 });
  }
}

async function sendReminderEmail(supabase: any, feedback: any, type: string) {
  try {
    const fromEmail = 'no_reply@feedback.bexforte.com';
    const fromName = 'Bexbot';
    let finalRecipientName = feedback.recipientName || feedback.recepientEmail.split('@')[0];
    let token = feedback.token; 
    if (!token) {
      token = crypto.randomUUID();
      await supabase.from("feedbacks").update({ token }).eq("id", feedback.id);
    }

    const feedbackLink = `${baseUrl}/f/${feedback.id}?token=${token}`;

    const emailHtml = await render(FeedbackReminder({
      feedbackId: feedback.id,
      clientName: finalRecipientName,
      feedbackName: feedback.name,
      feedbackLink,
    }));

    await sendgrid.send({
      to: feedback.recepientEmail,
      from: `${fromName} <${fromEmail}>`,
      subject: `Reminder: Overdue Feedback - ${feedback.name}`,
      html: emailHtml,
    });

    console.log("Reminder email sent to:", feedback.recepientEmail);
  } catch (emailError: any) {
    console.error("SendGrid Reminder Error:", emailError);
  }
}