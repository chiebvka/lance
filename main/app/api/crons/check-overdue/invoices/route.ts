import { createServiceRoleClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import sendgrid from "@sendgrid/mail";
import { render } from "@react-email/components";
import { baseUrl } from "@/utils/universal";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

export async function GET(request: NextRequest) {
  // 1. Secret token check
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const now = new Date();

  try {
    // Find overdue invoices that haven't been marked as overdue yet
    const { data: overdueInvoices, error: queryError } = await supabase
      .from("invoices")
      .select(`
        *,
        customers!inner(name, email),
        projects!inner(name)
      `)
      .lt("dueDate", now.toISOString())
      .neq("status", "paid")
      .neq("status", "overdue")
      .eq("allowReminders", true);

    if (queryError) {
      console.error("Error querying overdue invoices:", queryError);
      return NextResponse.json({ success: false, error: queryError.message }, { status: 500 });
    }

    if (!overdueInvoices || overdueInvoices.length === 0) {
      console.log("No overdue invoices found.");
      return NextResponse.json({ success: true, message: "No overdue invoices" }, { status: 200 });
    }

    let processedCount = 0;
    for (const invoice of overdueInvoices) {
      try {
        // Check organization's invoice notification preference
        const { data: organization, error: orgError } = await supabase
          .from("organization")
          .select("invoiceNotifications")
          .eq("id", invoice.organizationId)
          .single();

        if (orgError) {
          console.error(`Error fetching organization settings for invoice ${invoice.id}:`, orgError);
          continue;
        }

        // Update invoice status to overdue (always do this)
        const { error: updateError } = await supabase
          .from("invoices")
          .update({ status: "overdue" })
          .eq("id", invoice.id);

        if (updateError) {
          console.error(`Error updating invoice ${invoice.id}:`, updateError);
          continue;
        }

        // Only send emails and create notifications if organization has invoiceNotifications enabled
        if (organization?.invoiceNotifications) {
          // Create notification for the organization
          const { error: notificationError } = await supabase
            .from("notifications")
            .insert({
              organizationId: invoice.organizationId,
              title: "Invoice Overdue",
              message: `Invoice #${invoice.invoiceNumber} for ${invoice.customers?.name || 'Unknown Customer'} is overdue. Amount: ${invoice.currency} ${invoice.totalAmount}`,
              type: "warning",
              actionUrl: `${baseUrl}/protected/invoices/${invoice.id}`,
              metadata: {
                invoiceNumber: invoice.invoiceNumber,
                customerName: invoice.customers?.name,
                amount: invoice.totalAmount,
                currency: invoice.currency,
                dueDate: invoice.dueDate
              },
              tableName: "invoices",
              tableId: invoice.id,
              state: "active"
            });

          if (notificationError) {
            console.error(`Error creating notification for invoice ${invoice.id}:`, notificationError);
            continue;
          }

          // Send email reminder if customer email exists
          if (invoice.customers?.email) {
            await sendInvoiceReminderEmail(invoice);
            console.log(`Invoice reminder email sent for invoice ${invoice.id}`);
          } else {
            console.log(`Skipping email for invoice ${invoice.id} - no customer email available`);
          }
        } else {
          console.log(`Skipping email and notification for invoice ${invoice.id} - organization has invoiceNotifications disabled`);
        }

        processedCount++;
      } catch (error) {
        console.error(`Error processing invoice ${invoice.id}:`, error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${processedCount} overdue invoices` 
    }, { status: 200 });
  } catch (error) {
    console.error("Error in check-overdue-invoices:", error);
    return NextResponse.json({ success: false, error: "Failed to process overdue invoices" }, { status: 500 });
  }
}

async function sendInvoiceReminderEmail(invoice: any) {
  try {
    const fromEmail = 'no_reply@bexforte.com';
    const fromName = 'Bexforte';
    
    const emailHtml = `
      <h2>Invoice Overdue Reminder</h2>
      <p>Dear ${invoice.customers?.name},</p>
      <p>This is a reminder that invoice #${invoice.invoiceNumber} is overdue.</p>
      <p><strong>Amount:</strong> ${invoice.currency} ${invoice.totalAmount}</p>
      <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
      <p>Please process this payment as soon as possible.</p>
    `;

    await sendgrid.send({
      to: invoice.customers.email,
      from: `${fromName} <${fromEmail}>`,
      subject: `Invoice Overdue - #${invoice.invoiceNumber}`,
      html: emailHtml,
    });

    console.log("Invoice reminder email sent to:", invoice.customers.email);
  } catch (emailError: any) {
    console.error("SendGrid Invoice Reminder Error:", emailError);
  }
} 