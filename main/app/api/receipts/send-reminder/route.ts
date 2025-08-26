
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import sendgrid from "@sendgrid/mail";
import { render } from "@react-email/components";
import { baseUrl } from "@/utils/universal";
import { ratelimit } from "@/utils/rateLimit";
import ReceiptReminder from "@/emails/ReceiptReminder";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");


// --- CRON: GET all overdue feedbacks and send reminders ---
export async function GET() {
    const supabase = await createClient();
    const now = new Date();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  
  // Find all receipts that are overdue and not completed
  const { data: receipts, error } = await supabase
    .from("receipts")
    .select("*")
    .lt("paymentConfirmedAt", now.toISOString())
    .in("state", ["sent", "overdue"]);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  let sentCount = 0;
  for (const receipt of receipts || []) {
    const sent = await sendReminderEmail(receipt, supabase);
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
    const { receiptId } = await request.json();
  
    if (!receiptId) {
      return NextResponse.json({ success: false, error: "Missing invoiceId" }, { status: 400 });
    }
  
    // Fetch the feedback
    const { data: receipt, error } = await supabase
      .from("receipts")
      .select("*")
      .eq("id", receiptId)
      .eq("createdBy", user.id)
      .single();
  
    if (error || !receipt) {
      return NextResponse.json({ success: false, error: "Receipt not found" }, { status: 404 });
    }
  
    // Only allow if state is "sent" or "overdue"
    if (!["sent", "overdue"].includes(receipt.state)) {
      return NextResponse.json({ success: false, error: "Cannot send reminder for this invoice state" }, { status: 400 });
    }
  
    const sent = await sendReminderEmail(receipt, supabase);
  
    if (sent) {
      return NextResponse.json({ success: true, message: "Reminder sent" }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, error: "Failed to send reminder" }, { status: 500 });
    }
  }
  




// --- Helper: Send Reminder Email ---
async function sendReminderEmail(receipt: any, supabase: any) {
    try {
      const fromEmail = 'no_reply@receipts.bexforte.com';
      const fromName = 'Bexbot';
      const recipientName = receipt.recepientName || receipt.recepientEmail?.split('@')[0] || "User";

      // Get customer name if customerId exists
      let customerName = "";
      if (receipt.customerId) {
        const { data: customer } = await supabase
          .from('customers')
          .select('name')
          .eq('id', receipt.customerId)
          .single();
        customerName = customer?.name || "";
      }

      const receiptLink = `${baseUrl}/r/${receipt.id}`;

      const emailHtml = await render(ReceiptReminder({
        receiptId: receipt.id,
        clientName: recipientName,
        receiptName: receipt.receiptNumber,
        receiptLink,
      }));

      await sendgrid.send({
        to: receipt.recepientEmail,
        from:  `${fromName} <${fromEmail}>`,
        subject: `Reminder: Ready Receipt - ${receipt.receiptNumber}`,
        html: emailHtml,
        customArgs: {
          receiptId: receipt.id,
          receiptName: receipt.receiptNumber || "",
          customerId: receipt.customerId || "",
          customerName: customerName,
          organizationId: receipt.organizationId || "",
          userId: receipt.createdBy,
          type: "receipt_reminder",
      },
      });

      return true;
    } catch (error) {
      console.error("SendGrid Reminder Error:", error);
      return false;
    }
  }