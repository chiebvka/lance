import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import sendgrid from "@sendgrid/mail";
import { render } from "@react-email/components";
import FeedbackReminder from "@/emails/FeedbackReminder";
import { baseUrl } from "@/utils/universal";
import { ratelimit } from "@/utils/rateLimit";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

// --- CRON: GET all overdue feedbacks and send reminders ---
export async function GET() {
  const supabase = await createClient();
  const now = new Date();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }


  // Find all feedbacks that are overdue and not completed
  const { data: feedbacks, error } = await supabase
    .from("feedbacks")
    .select("*")
    .lt("dueDate", now.toISOString())
    .in("state", ["sent", "overdue"]);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  let sentCount = 0;
  for (const feedback of feedbacks || []) {
    const sent = await sendReminderEmail(feedback);
    if (sent) sentCount++;
  }

  return NextResponse.json({ success: true, sentCount }, { status: 200 });
}

// --- MANUAL: POST to send reminder for a specific feedbackId ---
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // 2. Rate limit check (use user.id as key)
  const { success } = await ratelimit.limit(user.id);
  if (!success) {
  return NextResponse.json({ success: false, error: "Too Many Requests" }, { status: 429 });
  }
  const { feedbackId } = await request.json();

  if (!feedbackId) {
    return NextResponse.json({ success: false, error: "Missing feedbackId" }, { status: 400 });
  }

  // Fetch the feedback
  const { data: feedback, error } = await supabase
    .from("feedbacks")
    .select("*")
    .eq("id", feedbackId)
    .eq("createdBy", user.id)
    .single();

  if (error || !feedback) {
    return NextResponse.json({ success: false, error: "Feedback not found" }, { status: 404 });
  }

  // Only allow if state is "sent" or "overdue"
  if (!["sent", "overdue"].includes(feedback.state)) {
    return NextResponse.json({ success: false, error: "Cannot send reminder for this feedback state" }, { status: 400 });
  }

  const sent = await sendReminderEmail(feedback);

  if (sent) {
    return NextResponse.json({ success: true, message: "Reminder sent" }, { status: 200 });
  } else {
    return NextResponse.json({ success: false, error: "Failed to send reminder" }, { status: 500 });
  }
}

// --- Helper: Send Reminder Email ---
async function sendReminderEmail(feedback: any) {
  try {
    const fromEmail = 'no_reply@feedback.bexforte.com';
    const fromName = 'Bexbot';
    const recipientName = feedback.recepientName || feedback.recepientEmail?.split('@')[0] || "User";
    const token = feedback.token; // <-- get the token from the feedback record
        // Build the feedback link with the token

    const feedbackLink = `${baseUrl}/f/${feedback.id}?token=${token}`;

    const emailHtml = await render(FeedbackReminder({
      feedbackId: feedback.id,
      clientName: recipientName,
      feedbackName: feedback.name,
      feedbackLink,
    }));

    await sendgrid.send({
      to: feedback.recepientEmail,
      from: `${fromName} <${fromEmail}>`,
      subject: `Reminder: Pending Feedback - ${feedback.name}`,
      html: emailHtml,
    });

    return true;
  } catch (error) {
    console.error("SendGrid Reminder Error:", error);
    return false;
  }
}