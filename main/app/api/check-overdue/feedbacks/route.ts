import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import sendgrid from "@sendgrid/mail";
import { render } from "@react-email/components";
import FeedbackReminder from "@/emails/FeedbackReminder";

var validator = require('validator');

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

export async function GET() {
  const supabase = await createClient();
  const now = new Date(); // 01:33 PM ADT, July 22, 2025

  try {
    const { data: overdueFeedback, error: queryError } = await supabase
      .from("feedbacks")
      .select("*")
      .lt("dueDate", now.toISOString())
      .neq("state", "overdue")
      .eq("state", "sent");

    if (queryError) {
      console.error("Error querying overdue feedback:", queryError);
      return NextResponse.json({ success: false, error: queryError.message }, { status: 500 });
    }

    if (!overdueFeedback || overdueFeedback.length === 0) {
      console.log("No overdue feedback found.");
      return NextResponse.json({ success: true, message: "No overdue feedback" }, { status: 200 });
    }

    for (const feedback of overdueFeedback) {
      const { error: updateError } = await supabase
        .from("feedbacks")
        .update({ state: "overdue" })
        .eq("id", feedback.id);

      if (updateError) {
        console.error(`Error updating feedback ${feedback.id}:`, updateError);
        continue;
      }

      await sendReminderEmail(supabase, feedback, "feedback");
    }

    return NextResponse.json({ success: true, message: "Overdue feedback processed" }, { status: 200 });
  } catch (error) {
    console.error("Error in check-overdue-feedback:", error);
    return NextResponse.json({ success: false, error: "Failed to process overdue feedback" }, { status: 500 });
  }
}

async function sendReminderEmail(supabase: any, feedback: any, type: string) {
  try {
    const fromEmail = 'no_reply@feedback.bexforte.com';
    const fromName = 'Bexforte Reminder';
    let finalRecipientName = feedback.recipientName || feedback.recepientEmail.split('@')[0];

    const emailHtml = await render(FeedbackReminder({
      feedbackId: feedback.id,
      clientName: finalRecipientName,
      feedbackName: feedback.name,
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