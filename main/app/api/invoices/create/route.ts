import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ratelimit } from '@/utils/rateLimit';
import { invoiceCreateSchema } from '@/validation/invoice';
import { render } from "@react-email/components";
import sendgrid from "@sendgrid/mail";
import IssueInvoice from '../../../../emails/IssueInvoice';

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') ?? 
      request.headers.get('x-real-ip') ?? 
      '127.0.0.1';
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          limit,
          reset,
          remaining
        }, 
        { status: 429 }
      );
    }

    // Get user's profile to find their organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organizationId, email')
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile?.organizationId) {
      return NextResponse.json({ error: 'You must be part of an organization to create invoices. Please contact your administrator.' }, { status: 403 });
    }

    const body = await request.json();

    // Validate the request body 
    const validationResult = invoiceCreateSchema.safeParse(body);

    if (!validationResult.success) {
      console.error("Validation Errors:", JSON.stringify(validationResult.error.flatten(), null, 2));
      return NextResponse.json(
        { error: "Invalid fields!", details: validationResult.error.flatten() }, 
        { status: 400 }
      );
    }

    const {
      customerId,
      projectId,
      organizationName,
      organizationLogoUrl,
      organizationEmail,
      recepientName,
      recepientEmail,
      issueDate,
      dueDate,
      currency,
      hasVat,
      hasTax,
      hasDiscount,
      vatRate,
      taxRate,
      discount,
      notes,
      paymentInfo,
      paymentDetails,
      invoiceDetails,
      state = "draft",
      emailToCustomer = false,
    } = validationResult.data;

    // Get organization information
    const { data: organization, error: orgError } = await supabase
      .from('organization')
      .select('name, email, logoUrl, baseCurrency')
      .eq('id', profile.organizationId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Set organization fields with fallbacks
    const finalOrganizationName = organizationName || organization.name || (profile.email ? profile.email.split('@')[0] : null);
    const finalOrganizationLogoUrl = organizationLogoUrl || organization.logoUrl;
    const finalOrganizationEmail = organizationEmail || organization.email || profile.email;
    const finalCurrency = currency || organization.baseCurrency || 'CAD';

    // Handle customer information if customerId is provided
    let finalRecepientName = recepientName;
    let finalRecepientEmail = recepientEmail;

    if (customerId) {
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('name, email')
        .eq('id', customerId)
        .single();

      if (customerError) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }

      finalRecepientName = customer.name;
      finalRecepientEmail = customer.email;
    }

    // Calculate totals
    const subTotalAmount = invoiceDetails.reduce((sum, item) => {
      const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
      return sum + itemTotal;
    }, 0);

    let totalAmount = subTotalAmount;

    // Apply discount if enabled
    if (hasDiscount && discount && discount > 0) {
      totalAmount = totalAmount - (totalAmount * (discount / 100));
    }

    // Apply tax if enabled
    if (hasTax && taxRate && taxRate > 0) {
      totalAmount = totalAmount + (totalAmount * (taxRate / 100));
    }

    // Apply VAT if enabled
    if (hasVat && vatRate && vatRate > 0) {
      totalAmount = totalAmount + (totalAmount * (vatRate / 100));
    }

    // Set default dates if not provided
    const finalIssueDate = issueDate || new Date();
    const finalDueDate = dueDate || new Date(finalIssueDate.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days from issue date

    // Determine final state
    let finalState = state;
    if (!customerId && state === "draft") {
      finalState = "unassigned";
    }

    console.log("Attempting to insert into 'invoices' table...");
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        customerId,
        projectId,
        organizationName: finalOrganizationName,
        organizationLogo: finalOrganizationLogoUrl,
        organizationEmail: finalOrganizationEmail,
        recepientName: finalRecepientName,
        recepientEmail: finalRecepientEmail,
        issueDate: finalIssueDate,
        dueDate: finalDueDate,
        currency: finalCurrency,
        hasVat: hasVat || false,
        hasTax: hasTax || false,
        hasDiscount: hasDiscount || false,
        vatRate: vatRate || 0,
        taxRate: taxRate || 0,
        discount: discount || 0,
        notes,
        paymentInfo,
        paymentDetails,
        invoiceDetails,
        subTotalAmount,
        totalAmount,
        state: finalState,
        sentViaEmail: emailToCustomer,
        emailSentAt: emailToCustomer ? new Date().toISOString() : null,
        createdBy: user.id,
        organizationId: profile.organizationId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("Supabase Invoice Insert Error:", invoiceError);
      return NextResponse.json({ success: false, error: invoiceError.message }, { status: 500 });
    }

    if (!invoice) {
      return NextResponse.json({ success: false, error: "Failed to create invoice; invoice data is null after insert." }, { status: 500 });
    }

    console.log("Invoice created successfully. Invoice ID:", invoice.id);

    // Send email if emailToCustomer is true and customer exists
    if (emailToCustomer && finalRecepientEmail && invoice) {
      await sendInvoiceEmail(supabase, user, invoice, finalRecepientEmail, finalRecepientName || null, finalOrganizationName, finalOrganizationLogoUrl);
    }

    return NextResponse.json({ success: true, data: invoice }, { status: 200 });

  } catch (error) {
    console.error("Error during invoice creation:", error);
    return NextResponse.json({ success: false, error: "Failed to create invoice" }, { status: 500 });
  }
}

async function sendInvoiceEmail(supabase: any, user: any, invoice: any, recipientEmail: string, recepientName: string | null, organizationName: string, logoUrl: string) {
  try {
    const fromEmail = 'no_reply@invoices.bexforte.com';
    const fromName = 'Bexbot';
    const senderName = organizationName || 'Bexforte';

    const finalLogoUrl = logoUrl || "https://www.bexoni.com/favicon.ico";
    
    const emailHtml = await render(IssueInvoice({
      invoiceId: invoice.id,
      clientName: recepientName || "Valued Customer",
      invoiceName: invoice.invoiceNumber || "Invoice",
      senderName: senderName,
      logoUrl: finalLogoUrl,
    }));

    console.log(`Attempting to send invoice email from: ${fromEmail} to: ${recipientEmail}`);

    await sendgrid.send({
      to: recipientEmail,
      from: `${fromName} <${fromEmail}>`,
      subject: `${senderName} sent you an invoice`,
      html: emailHtml,
      customArgs: {
        invoiceId: invoice.id,
        customerId: invoice.customerId || "",
        userId: user.id,
        type: "invoice_sent",
      },
    });

    console.log("Invoice email sent to:", recipientEmail);

  } catch (emailError: any) {
    console.error("SendGrid Error:", emailError);
    // Don't fail the main request if email fails
  }
}