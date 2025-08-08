import { createServiceRoleClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import sendgrid from "@sendgrid/mail";
import { render } from "@react-email/components";
import { baseUrl } from "@/utils/universal";
import InvoiceReminder from "@/emails/InvoiceReminder";

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
        customers(id, name, email),
        organization!inner(id, name, email, logoUrl)
      `)
      .lt("dueDate", now.toISOString())
      .neq("state", "settled")
      .neq("state", "overdue")
      .eq("state", "sent")
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
        // Organization data is already included in the query
        const organization = invoice.organization;

        if (!organization) {
          console.error(`No organization found for invoice ${invoice.id}`);
          continue;
        }

        // Update invoice state to overdue (always do this)
        const { error: updateError } = await supabase
          .from("invoices")
          .update({ state: "overdue" })
          .eq("id", invoice.id);

        if (updateError) {
          console.error(`Error updating invoice ${invoice.id}:`, updateError);
          continue;
        }

        // Only send emails and create notifications if organization has invoiceNotifications enabled
        // Note: null values default to true (enabled), only false explicitly disables
        if (organization?.invoiceNotifications !== false) {
          // Create notification for the organization
          const { error: notificationError } = await supabase
            .from("notifications")
            .insert({
              organizationId: invoice.organizationId,
              title: "Invoice Overdue",
              message: `Invoice #${invoice.invoiceNumber} for ${invoice.customers?.name || invoice.recepientName || 'Unknown Customer'} is overdue. Amount: ${invoice.currency} ${invoice.totalAmount}`,
              type: "warning",
              actionUrl: `${baseUrl}/protected/invoices?invoiceId=${invoice.id}&type=details`,
              metadata: {
                invoiceNumber: invoice.invoiceNumber,
                customerName: invoice.customers?.name || invoice.recepientName,
                customerEmail: invoice.customers?.email || invoice.recepientEmail,
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

          // Send email reminder - use customer email if available, otherwise use recipient email
          const recipientEmail = invoice.customers?.email || invoice.recepientEmail;
          const recipientName = invoice.customers?.name || invoice.recepientName;
          
          if (recipientEmail) {
            await sendInvoiceReminderEmail(supabase, invoice, organization, recipientEmail, recipientName);
            console.log(`Invoice reminder email sent for invoice ${invoice.id} to ${recipientEmail}`);
          } else {
            console.log(`Skipping email for invoice ${invoice.id} - no recipient email available`);
          }
        } else {
          console.log(`Skipping email and notification for invoice ${invoice.id} - organization has invoiceNotifications explicitly disabled (value: ${organization?.invoiceNotifications})`);
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

async function sendInvoiceReminderEmail(supabase: any, invoice: any, organization: any, recipientEmail: string, recipientName: string) {
  try {
    const fromEmail = 'no_reply@bexforte.com';
    const fromName = organization?.name || 'Bexforte';
    
    // Use organization logo if available, otherwise fallback
    const logoUrl = organization?.logoUrl || "https://www.bexoni.com/favicon.ico";
    
    // Final recipient name fallback
    const finalRecipientName = recipientName || recipientEmail.split('@')[0];
    
    const invoiceLink = `${baseUrl}/i/${invoice.id}`;

    const emailHtml = await render(InvoiceReminder({
      invoiceId: invoice.id,
      clientName: finalRecipientName,
      invoiceName: invoice.invoiceNumber || `INV-${invoice.id.slice(-6)}`,
      logoUrl: logoUrl,
      invoiceLink: invoiceLink,
      senderName: organization?.name || 'Bexforte'
    }));

    await sendgrid.send({
      to: recipientEmail,
      from: `${fromName} <${fromEmail}>`,
      subject: `Reminder: Overdue Invoice - ${invoice.invoiceNumber || `INV-${invoice.id.slice(-6)}`}`,
      html: emailHtml,
    });

    console.log("Invoice reminder email sent to:", recipientEmail);
  } catch (emailError: any) {
    console.error("SendGrid Invoice Reminder Error:", emailError);
  }
} 