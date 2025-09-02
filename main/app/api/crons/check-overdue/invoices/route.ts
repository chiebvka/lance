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

          // Send email reminders to both customer and organization
          await sendInvoiceReminderEmails(supabase, invoice, organization);
          console.log(`Invoice reminder emails sent for invoice ${invoice.id}`);
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

async function sendInvoiceReminderEmails(supabase: any, invoice: any, organization: any) {
  try {
    // Get organization details with fallbacks
    let organizationName = 'Bexforte';
    let organizationEmail = null;
    let logoUrl = "https://www.bexforte.com/favicon.ico";
    
    if (organization) {
      organizationName = organization.name || invoice.organizationName || 'Bexforte';
      organizationEmail = organization.email || invoice.organizationEmail;
      logoUrl = organization.logoUrl || invoice.organizationLogo || "https://www.bexforte.com/favicon.ico";
    }

    // If no organization email, try to get from profiles table via createdBy
    if (!organizationEmail && invoice.createdBy) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('profile_id', invoice.createdBy)
        .single();
      
      if (profile?.email) {
        organizationEmail = profile.email;
      }
    }

    // Prepare email targets
    const sendTargets: Array<{ to: string; name?: string; type: 'customer' | 'organization' }> = [];
    
    // Add customer email if available
    const customerEmail = invoice.customers?.email || invoice.recepientEmail;
    const customerName = invoice.customers?.name || invoice.recepientName;
    if (customerEmail) {
      sendTargets.push({ 
        to: customerEmail, 
        name: customerName || customerEmail.split('@')[0], 
        type: 'customer' 
      });
    }
    
    // Add organization email if available
    if (organizationEmail) {
      sendTargets.push({ 
        to: organizationEmail, 
        name: organizationName, 
        type: 'organization' 
      });
    }

    // Send emails to all targets
    for (const target of sendTargets) {
      try {
        const emailHtml = await render(InvoiceReminder({
          invoiceId: invoice.id,
          clientName: target.name || 'Customer',
          invoiceName: invoice.invoiceNumber || `INV-${invoice.id.slice(-6)}`,
          logoUrl: logoUrl,
          invoiceLink: `${baseUrl}/i/${invoice.id}`,
          senderName: organizationName
        }));

        const fromEmail = 'no_reply@bexforte.com';
        const fromName = 'Bexbot';

        await sendgrid.send({
          to: target.to,
          from: `${fromName} <${fromEmail}>`,
          subject: `Reminder: Overdue Invoice - ${invoice.invoiceNumber || `INV-${invoice.id.slice(-6)}`}`,
          html: emailHtml,
          customArgs: {
            invoiceId: invoice.id,
            invoiceName: invoice.invoiceNumber || "",
            customerId: invoice.customerId || "",
            customerName: invoice.customers?.name || "",
            organizationId: invoice.organizationId || "",
            userId: invoice.createdBy || "",
            type: "invoice_overdue",
            recipientType: target.type,
          },
        });
        
        console.log(`Invoice reminder email sent to ${target.type}: ${target.to}`);
      } catch (emailError: any) {
        console.error(`Failed to send email to ${target.type} (${target.to}):`, emailError);
        // Continue with other emails even if one fails
      }
    }
    
    if (sendTargets.length === 0) {
      console.warn(`No valid email addresses found for invoice ${invoice.id}`);
    }
    
  } catch (emailError: any) {
    console.error("SendGrid Invoice Reminder Error:", emailError);
  }
} 