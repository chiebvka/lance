import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { invoiceEditSchema } from "@/validation/invoice"
import { render } from "@react-email/components";
import sendgrid from "@sendgrid/mail";
import IssueInvoice from '../../../../emails/IssueInvoice';
import { ratelimit } from '@/utils/rateLimit';

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

async function sendInvoiceEmail(supabase: any, user: any, invoice: any, recipientEmail: string, recipientName: string | null, organizationName: string, logoUrl: string, organizationId: string) {
  try {
    const fromEmail = 'no_reply@invoices.bexforte.com';
    const fromName = 'Bexbot';
    const senderName = organizationName || 'Bexforte';

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

    const emailHtml = await render(IssueInvoice({
      invoiceId: invoice.id,
      clientName: recipientName || recipientEmail.split('@')[0],
      invoiceName: `Invoice #${invoice.invoiceNumber}`,
      senderName: senderName,
      logoUrl: logoUrl || "https://www.bexoni.com/favicon.ico",
    }));

    await sendgrid.send({
      to: recipientEmail,
      from: `${fromName} <${fromEmail}>`,
      subject: `${senderName} sent you an invoice`,
      html: emailHtml,
      customArgs: {
        invoiceId: invoice.id,
        invoiceName: invoice.invoiceNumber || "",
        customerId: invoice.customerId || "",
        customerName: customerName,
        organizationId: organizationId,
        userId: user.id,
        type: "invoice_updated",
      },
    });

    console.log("Invoice email sent to:", recipientEmail);
  } catch (emailError: any) {
    console.error("SendGrid Error:", emailError);
  }
}

export async function GET(
  request: NextRequest,
  context: any
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 })
  }

  const { params } = context;
  const { invoiceId } = params

  try {
    // Get user's profile to find their organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organizationId')
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Fetch the invoice with organization check
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        *,
        organization:organizationId (
          logoUrl,
          name,
          email
        )
      `)
      .eq("id", invoiceId)
      .eq("organizationId", profile.organizationId)
      .single()

    if (invoiceError) throw invoiceError
    if (!invoice) throw new Error("Invoice not found or access denied")

    // Fetch the customer if exists
    let customer = null
    if (invoice.customerId) {
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id, name, email")
        .eq("id", invoice.customerId)
        .single()
      if (customerError) throw customerError
      customer = customerData
    }

    // Process JSON fields
    const processJsonField = (field: any) => {
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch (error) {
          console.warn('Failed to parse JSON field:', field);
          return field;
        }
      }
      return field;
    };

    const invoiceResponse = {
      ...invoice,
      customer,
      invoiceDetails: processJsonField(invoice.invoiceDetails),
      // Keep paymentDetails and paymentInfo as raw strings/values - don't parse them
      paymentDetails: invoice.paymentDetails,
      paymentInfo: invoice.paymentInfo,
      // Flatten organization data for easier access
      organizationLogoUrl: invoice.organization?.logoUrl || null,
      organizationNameFromOrg: invoice.organization?.name || null,
      organizationEmailFromOrg: invoice.organization?.email || null,
    }

    return NextResponse.json({ success: true, invoice: invoiceResponse })
  } catch (e) {
    const error = e as Error
    console.error(`Error fetching invoice ${context.params.invoiceId}:`, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: any
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 })
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

  const { params } = context;
  const { invoiceId } = params
  const body = await request.json()

      console.log('[API][PUT] Incoming body:', body);

  try {
    // Get user's profile to find their organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organizationId, email')
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if invoice exists and belongs to the user's organization
    const { data: existingInvoice, error: checkError } = await supabase
      .from("invoices")
      .select("organizationId, state, customerId, recepientEmail, subTotalAmount, totalAmount")
      .eq("id", invoiceId)
      .single();

    if (checkError || !existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (existingInvoice.organizationId !== profile.organizationId) {
      return NextResponse.json({ error: "Unauthorized to update this invoice" }, { status: 403 });
    }

    console.log('[API][PUT] Existing invoice state:', existingInvoice.state);
    console.log('[API][PUT] Existing invoice customerId:', existingInvoice.customerId);

    // Allow updating for most states (we handle state transitions in the UI)
    if (!["draft", "unassigned", "sent", "overdue", "cancelled", "settled"].includes(existingInvoice.state)) {
      return NextResponse.json({ error: "Invalid invoice state for updates" }, { status: 400 });
    }

    const validation = invoiceEditSchema.safeParse(body)
    if (!validation.success) {
      console.error('[API][PUT] Validation failed:', validation.error.flatten().fieldErrors);
      return NextResponse.json(
        {
          error: "Invalid input.",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    console.log('[API][PUT] Validation success. Data:', validation.data);
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
      invoiceDetails = [],
      state,
      emailToCustomer = false,
    } = validation.data

    // Get organization data for defaults
    const { data: organization } = await supabase
      .from('organization')
      .select('name, email, logoUrl')
      .eq('id', profile.organizationId)
      .single();

    // Resolve customer data if customerId is provided
    let finalRecipientEmail = recepientEmail;
    let finalRecipientName = recepientName;

    if (customerId) {
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("name, email")
        .eq("id", customerId)
        .single();
      
      if (customerError) {
        return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
      }
      
      finalRecipientEmail = customer.email;
      finalRecipientName = customer.name;
    } else if (existingInvoice.customerId && emailToCustomer) {
      // If no customerId provided but we're sending email and invoice has existing customer,
      // fetch the customer data to get the email
      const { data: existingCustomer, error: customerError } = await supabase
        .from("customers")
        .select("name, email")
        .eq("id", existingInvoice.customerId)
        .single();
      
      if (!customerError && existingCustomer) {
        finalRecipientEmail = existingCustomer.email;
        finalRecipientName = existingCustomer.name;
      }
    }

    console.log('[API][PUT] Final recipient email:', finalRecipientEmail);
    console.log('[API][PUT] Final recipient name:', finalRecipientName);

    // Calculate totals from invoice details (only if invoiceDetails is provided)
    let subtotal, discountValue, taxAmount, vatAmount, totalAmount;
    
    if (invoiceDetails && invoiceDetails.length > 0) {
      // Full update with invoice details - recalculate totals
      subtotal = invoiceDetails.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
      discountValue = subtotal * ((discount || 0) / 100);
      taxAmount = hasTax ? subtotal * ((taxRate || 0) / 100) : 0;
      vatAmount = hasVat ? subtotal * ((vatRate || 0) / 100) : 0;
      totalAmount = subtotal + taxAmount + vatAmount - discountValue;
    } else {
      // State-only update - keep existing totals
      subtotal = existingInvoice.subTotalAmount;
      totalAmount = existingInvoice.totalAmount;
    }

    // Determine final state
    let finalState = state || existingInvoice.state;
    // Special handling for cancelled invoices being assigned a customer
    if (existingInvoice.state === 'cancelled' && customerId && !emailToCustomer) {
        finalState = 'draft';
    } else if (emailToCustomer && finalRecipientEmail) {
        finalState = "sent";
    }

    // Update the invoice - build payload dynamically
    const updatePayload: any = {
      state: finalState,
      updatedAt: new Date().toISOString(),
    };

    // Add fields only if they're provided in the request
    if (customerId !== undefined) updatePayload.customerId = customerId || null;
    if (projectId !== undefined) updatePayload.projectId = projectId || null;
    if (organizationName !== undefined) updatePayload.organizationName = organizationName || organization?.name || null;
    if (organizationLogoUrl !== undefined) updatePayload.organizationLogo = organizationLogoUrl || organization?.logoUrl || null;
    if (organizationEmail !== undefined) updatePayload.organizationEmail = organizationEmail || organization?.email || null;
    if (recepientName !== undefined) updatePayload.recepientName = finalRecipientName || null;
    if (recepientEmail !== undefined) updatePayload.recepientEmail = finalRecipientEmail || null;
    if (issueDate !== undefined) updatePayload.issueDate = issueDate || null;
    if (dueDate !== undefined) updatePayload.dueDate = dueDate || null;
    if (currency !== undefined) updatePayload.currency = currency || 'USD';
    if (hasVat !== undefined) updatePayload.hasVat = hasVat || false;
    if (hasTax !== undefined) updatePayload.hasTax = hasTax || false;
    if (hasDiscount !== undefined) updatePayload.hasDiscount = hasDiscount || false;
    if (vatRate !== undefined) updatePayload.vatRate = vatRate || 0;
    if (taxRate !== undefined) updatePayload.taxRate = taxRate || 0;
    if (discount !== undefined) updatePayload.discount = discount || 0;
    if (notes !== undefined) updatePayload.notes = notes || null;
    if (paymentInfo !== undefined) updatePayload.paymentInfo = paymentInfo || null;
    if (paymentDetails !== undefined) updatePayload.paymentDetails = paymentDetails || null;
    
    // Add paidOn if provided (for settle action)
    if (validation.data.paidOn !== undefined) updatePayload.paidOn = validation.data.paidOn;
    
    // Only include invoice details and totals if they're being updated
    if (invoiceDetails && invoiceDetails.length > 0) {
      updatePayload.invoiceDetails = invoiceDetails;
      updatePayload.subTotalAmount = subtotal;
      updatePayload.totalAmount = totalAmount;
    }

    // If sending email, update email-related fields
    if (emailToCustomer && finalRecipientEmail) {
      updatePayload.sentViaEmail = true;
      updatePayload.emailSentAt = new Date().toISOString();
    }

    const { error: updateError, data: updatedInvoice } = await supabase
      .from("invoices")
      .update(updatePayload)
      .eq("id", invoiceId)
      .eq("organizationId", profile.organizationId)
      .select()
      .single();

    if (updateError) throw updateError

    // Send email if requested and recipient email exists
    if (emailToCustomer && finalRecipientEmail && updatedInvoice) {
      console.log(`[API][PUT] Sending email to: ${finalRecipientEmail} for invoice: ${invoiceId}`);
      try {
        await sendInvoiceEmail(
          supabase,
          user,
          updatedInvoice,
          finalRecipientEmail,
          finalRecipientName || null,
          organizationName || organization?.name || 'Bexforte',
          organizationLogoUrl || organization?.logoUrl || '',
          profile.organizationId
        );
        console.log(`[API][PUT] Email sent successfully to: ${finalRecipientEmail}`);
      } catch (emailError) {
        console.error('Failed to send invoice email:', emailError);
        // Don't fail the entire request if email fails
      }
    } else {
      console.log(`[API][PUT] Email not sent. emailToCustomer: ${emailToCustomer}, finalRecipientEmail: ${finalRecipientEmail}, updatedInvoice: ${!!updatedInvoice}`);
    }

    return NextResponse.json({
      success: true,
      message: "Invoice updated successfully",
      invoice: updatedInvoice
    })
  } catch (e) {
    const error = e as Error
    console.error(`[API][PUT] Error updating invoice ${invoiceId}:`, error.message, error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: any
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 })
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

  const { params } = context;
  const { invoiceId } = params

  try {
    // Get user's profile to find their organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organizationId')
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if invoice exists and belongs to the user's organization
    const { data: existingInvoice, error: checkError } = await supabase
      .from("invoices")
      .select("organizationId, state")
      .eq("id", invoiceId)
      .single();

    if (checkError || !existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (existingInvoice.organizationId !== profile.organizationId) {
      return NextResponse.json({ error: "Unauthorized to delete this invoice" }, { status: 403 });
    }

    // Only allow deletion of draft and unassigned invoices
    // if (!["draft", "unassigned"].includes(existingInvoice.state)) {
    //   return NextResponse.json({ error: "Only draft and unassigned invoices can be deleted" }, { status: 400 });
    // }

    const { error: invoiceDeleteError } = await supabase
      .from("invoices")
      .delete()
      .eq("id", invoiceId)
      .eq("organizationId", profile.organizationId)

    if (invoiceDeleteError) throw invoiceDeleteError

    return NextResponse.json({ success: true, message: "Invoice deleted successfully" })
  } catch (e) {
    const error = e as Error
    console.error(`Error deleting invoice ${invoiceId}:`, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
