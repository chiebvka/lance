import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import sendgrid from "@sendgrid/mail";
import { render } from "@react-email/components";
import { baseUrl } from "@/utils/universal";
import { ratelimit } from "@/utils/rateLimit";
import InvoiceReminder from "@/emails/InvoiceReminder";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

// --- CRON: GET all overdue feedbacks and send reminders ---
export async function GET() {
    const supabase = await createClient();
    const now = new Date();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  
  // Find all invoices that are overdue and not completed
  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("*")
    .lt("dueDate", now.toISOString())
    .in("state", ["sent", "overdue"]);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  let sentCount = 0;
  for (const invoice of invoices || []) {
    const sent = await sendReminderEmail(invoice, supabase);
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
  const { invoiceId } = await request.json();

  if (!invoiceId) {
    return NextResponse.json({ success: false, error: "Missing invoiceId" }, { status: 400 });
  }

  // Fetch the feedback
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .eq("createdBy", user.id)
    .single();

  if (error || !invoice) {
    return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
  }

  // Only allow if state is "sent" or "overdue"
  if (!["sent", "overdue"].includes(invoice.state)) {
    return NextResponse.json({ success: false, error: "Cannot send reminder for this invoice state" }, { status: 400 });
  }

  const sent = await sendReminderEmail(invoice, supabase);

  if (sent) {
    return NextResponse.json({ success: true, message: "Reminder sent" }, { status: 200 });
  } else {
    return NextResponse.json({ success: false, error: "Failed to send reminder" }, { status: 500 });
  }
}

// --- Helper: Send Reminder Email ---
async function sendReminderEmail(invoice: any, supabase: any) {
  try {
    const fromEmail = 'no_reply@invoices.bexforte.com';
    const fromName = 'Bexbot';
    const recipientName = invoice.recepientName || invoice.recepientEmail?.split('@')[0] || "User";

    // Get customer name if customerId exists
    let customerName = "";
    if (invoice.customerId) {
      const { data: customer } = await supabase
        .from('customers')
        .select('name')
        .eq('id', invoice.customerId)
        .single();
      customerName = customer?.name || "";
    }

    const invoiceLink = `${baseUrl}/i/${invoice.id}`;

    const emailHtml = await render(InvoiceReminder({
      invoiceId: invoice.id,
      clientName: recipientName,
      invoiceName: invoice.invoiceNumber,
      invoiceLink,
    }));

    await sendgrid.send({
      to: invoice.recepientEmail,
      from:  `${fromName} <${fromEmail}>`,
      subject: `Reminder: Pending Invoice - ${invoice.invoiceNumber}`,
      html: emailHtml,
      customArgs: {
        invoiceId: invoice.id,
        invoiceName: invoice.invoiceNumber || "",
        customerId: invoice.customerId || "",
        customerName: customerName,
        organizationId: invoice.organizationId || "",
        userId: invoice.createdBy,
        type: "invoice_reminder",
    },
    });

    return true;
  } catch (error) {
    console.error("SendGrid Reminder Error:", error);
    return false;
  }
}

