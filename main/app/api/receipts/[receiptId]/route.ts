import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { receiptCreateSchema } from '@/validation/receipt';
import sendgrid from "@sendgrid/mail";
import IssueReceipt from '../../../../emails/IssueReceipt';
import { render } from "@react-email/components";
import { ratelimit } from '@/utils/rateLimit';


const sendgridApiKey = process.env.SENDGRID_API_KEY || "";
if (!sendgridApiKey) {
  console.error('[sendReceiptEmail] SENDGRID_API_KEY is not set');
}
sendgrid.setApiKey(sendgridApiKey);

async function sendReceiptEmail(supabase: any, user: any, receipt: any, recipientEmail: string, recepientName: string | null, organizationName: string, logoUrl: string, organizationId: string) {
  try {
    const fromEmail = 'no_reply@receipts.bexforte.com';
    const fromName = 'Bexbot';
    const senderName = organizationName || 'Bexforte';

    const finalLogoUrl = logoUrl || 'https://www.bexoni.com/favicon.ico';

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

    console.log(`[sendReceiptEmail] Rendering email template with:`, {
      receiptId: receipt.id,
      clientName: recepientName || 'Valued Customer',
      receiptName: receipt.receiptNumber || 'Receipt',
      senderName,
      logoUrl: finalLogoUrl,
    });

    const emailHtml = await render(IssueReceipt({
      receiptId: receipt.id,
      clientName: recepientName || 'Valued Customer',
      receiptName: receipt.receiptNumber || 'Receipt',
      senderName,
      logoUrl: finalLogoUrl,
    }));
    
    console.log(`[sendReceiptEmail] Email template rendered successfully, length: ${emailHtml.length}`);

    console.log(`[sendReceiptEmail] Sending via SendGrid to: ${recipientEmail}`);
    
    await sendgrid.send({
      to: recipientEmail,
      from: `${fromName} <${fromEmail}>`,
      subject: `${senderName} sent you a receipt`,
      html: emailHtml,
      customArgs: {
        receiptId: receipt.id,
        receiptName: receipt.receiptNumber || '',
        customerId: receipt.customerId || '',
        customerName: customerName,
        organizationId: organizationId,
        userId: user.id,
        type: 'receipt_updated',
      },
    });
    
    console.log(`[sendReceiptEmail] SendGrid call completed successfully`);
    
    console.log(`[sendReceiptEmail] Email sent successfully to ${recipientEmail}`);
  } catch (emailError) {
    console.error('SendGrid Error (receipt):', emailError);
    // Re-throw the error so the calling function can handle it
    throw emailError;
  }
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ receiptId: string }> }
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { receiptId } = await context.params;
  try {
    const { data: receipt, error } = await supabase
      .from('receipts')
      .select(`*, organization:organizationId(logoUrl,name,email)`) 
      .eq('id', receiptId)
      .eq('createdBy', user.id)
      .single();
    if (error || !receipt) {
      return NextResponse.json({ success: false, error: 'Receipt not found' }, { status: 404 });
    }

    const processJsonField = (field: any) => {
      if (typeof field === 'string') {
        try { return JSON.parse(field); } catch { return field; }
      }
      return field;
    };

    const normalized = {
      ...receipt,
      receiptDetails: processJsonField(receipt.receiptDetails),
      paymentDetails: processJsonField(receipt.paymentDetails),
      paymentInfo: processJsonField(receipt.paymentInfo),
      OrganizationLogo: receipt.organization?.logoUrl || null,
      organizationNameFromOrg: receipt.organization?.name || null,
      organizationEmailFromOrg: receipt.organization?.email || null,
    };

    return NextResponse.json({ success: true, receipt: normalized }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to fetch receipt' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ receiptId: string }> }
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { success: rateLimitSuccess } = await ratelimit.limit(user.id);
  if (!rateLimitSuccess) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
  }

  const { receiptId } = await context.params;
  const body = await req.json();

  console.log('[API][PUT] Incoming body:', body);

  // Permit partials based on create schema shape
  const parsed = receiptCreateSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid fields', details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data as any;
  
  console.log('[API][PUT] Parsed data after validation:', data);
  console.log('[API][PUT] emailToCustomer value:', data.emailToCustomer);

  // Get existing receipt data to check current state and customer
  const { data: existingReceipt, error: checkError } = await supabase
    .from("receipts")
    .select("state, customerId, recepientEmail, recepientName")
    .eq("id", receiptId)
    .single();

  if (checkError || !existingReceipt) {
    return NextResponse.json({ success: false, error: "Receipt not found" }, { status: 404 });
  }

  console.log('[API][PUT] Existing receipt state:', existingReceipt.state);
  console.log('[API][PUT] Existing receipt customerId:', existingReceipt.customerId);

  // Normalize details if present
  let normalizedDetails: any = undefined;
  if (Array.isArray(data.receiptDetails)) {
    normalizedDetails = data.receiptDetails.map((item: any, index: number) => {
      const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : (typeof item.price === 'number' ? item.price : 0);
      const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
      const total = typeof item.total === 'number' ? item.total : Math.round(quantity * unitPrice * 100) / 100;
      return {
        position: item.position ?? index + 1,
        description: item.description ?? '',
        quantity,
        unitPrice,
        total,
      };
    });
  }

  // Resolve customer data if customerId is provided
  let finalRecipientEmail = data.recepientEmail;
  let finalRecipientName = data.recepientName;

  if (data.customerId) {
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("name, email")
      .eq("id", data.customerId)
      .single();
    
    if (customerError) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }
    
    finalRecipientEmail = customer.email;
    finalRecipientName = customer.name;
  } else if (existingReceipt.customerId && data.emailToCustomer) {
    // If no customerId provided but we're sending email and receipt has existing customer,
    // fetch the customer data to get the email
    const { data: existingCustomer, error: customerError } = await supabase
      .from("customers")
      .select("name, email")
      .eq("id", existingReceipt.customerId)
      .single();
    
    if (!customerError && existingCustomer) {
      finalRecipientEmail = existingCustomer.email;
      finalRecipientName = existingCustomer.name;
    }
  }

  console.log('[API][PUT] Final recipient email:', finalRecipientEmail);
  console.log('[API][PUT] Final recipient name:', finalRecipientName);

  // Prepare update payload - exclude emailToCustomer as it's not a database field
  const { emailToCustomer, ...dataForUpdate } = data;
  
  console.log('[API][PUT] emailToCustomer flag:', emailToCustomer);
  console.log('[API][PUT] Data for database update (excluding emailToCustomer):', dataForUpdate);
  
  // Build update payload dynamically - only include fields that are provided
  const updatePayload: any = {
    updatedAt: new Date().toISOString(),
  };
  
  // Add fields only if they're provided in the request
  if (dataForUpdate.state !== undefined) updatePayload.state = dataForUpdate.state;
  if (dataForUpdate.customerId !== undefined) updatePayload.customerId = dataForUpdate.customerId;
  if (dataForUpdate.projectId !== undefined) updatePayload.projectId = dataForUpdate.projectId;
  if (dataForUpdate.organizationName !== undefined) updatePayload.organizationName = dataForUpdate.organizationName;
  if (dataForUpdate.OrganizationLogo !== undefined) updatePayload.OrganizationLogo = dataForUpdate.OrganizationLogo;
  if (dataForUpdate.organizationEmail !== undefined) updatePayload.organizationEmail = dataForUpdate.organizationEmail;
  if (dataForUpdate.recepientName !== undefined) updatePayload.recepientName = finalRecipientName || dataForUpdate.recepientName;
  if (dataForUpdate.recepientEmail !== undefined) updatePayload.recepientEmail = finalRecipientEmail || dataForUpdate.recepientEmail;
  if (dataForUpdate.issueDate !== undefined) updatePayload.issueDate = dataForUpdate.issueDate;
  if (dataForUpdate.paymentConfirmedAt !== undefined) updatePayload.paymentConfirmedAt = dataForUpdate.paymentConfirmedAt;
  if (dataForUpdate.currency !== undefined) updatePayload.currency = dataForUpdate.currency;
  if (dataForUpdate.hasVat !== undefined) updatePayload.hasVat = dataForUpdate.hasVat;
  if (dataForUpdate.hasTax !== undefined) updatePayload.hasTax = dataForUpdate.hasTax;
  if (dataForUpdate.hasDiscount !== undefined) updatePayload.hasDiscount = dataForUpdate.hasDiscount;
  if (dataForUpdate.vatRate !== undefined) updatePayload.vatRate = dataForUpdate.vatRate;
  if (dataForUpdate.taxRate !== undefined) updatePayload.taxRate = dataForUpdate.taxRate;
  if (dataForUpdate.discount !== undefined) updatePayload.discount = dataForUpdate.discount;
  if (dataForUpdate.notes !== undefined) updatePayload.notes = dataForUpdate.notes;
  if (dataForUpdate.paymentMethod !== undefined) updatePayload.paymentMethod = dataForUpdate.paymentMethod;
  if (dataForUpdate.paymentStatus !== undefined) updatePayload.paymentStatus = dataForUpdate.paymentStatus;
  if (dataForUpdate.paymentDate !== undefined) updatePayload.paymentDate = dataForUpdate.paymentDate;
  if (dataForUpdate.paymentNotes !== undefined) updatePayload.paymentNotes = dataForUpdate.paymentNotes;
  
  // Add receipt details if provided
  if (normalizedDetails) {
    updatePayload.receiptDetails = normalizedDetails;
  }
  
  // If sending email, update email-related fields
  if (emailToCustomer && finalRecipientEmail) {
    updatePayload.sentViaEmail = true;
    updatePayload.emailSentAt = new Date().toISOString();
  }

  // Recalculate totals if any monetary fields or details changed
  if (normalizedDetails || 'hasDiscount' in data || 'discount' in data || 'hasTax' in data || 'taxRate' in data || 'hasVat' in data || 'vatRate' in data) {
    const details = normalizedDetails ?? (await (async () => {
      const { data: current } = await supabase
        .from('receipts')
        .select('receiptDetails')
        .eq('id', receiptId)
        .single();
      return current?.receiptDetails || [];
    })());

    const subTotalAmount = details.reduce((sum: number, it: any) => sum + (typeof it.total === 'number' ? it.total : 0), 0);
    const hasDiscount = data.hasDiscount ?? false;
    const discountRate = typeof data.discount === 'number' ? data.discount : 0;
    const hasTax = data.hasTax ?? false;
    const taxRate = typeof data.taxRate === 'number' ? data.taxRate : 0;
    const hasVat = data.hasVat ?? false;
    const vatRate = typeof data.vatRate === 'number' ? data.vatRate : 0;
    const discountAmt = hasDiscount && discountRate ? subTotalAmount * (discountRate / 100) : 0;
    const subAfterDiscount = subTotalAmount - discountAmt;
    const taxAmt = hasTax && taxRate ? subAfterDiscount * (taxRate / 100) : 0;
    const vatAmt = hasVat && vatRate ? subAfterDiscount * (vatRate / 100) : 0;
    const totalAmount = subAfterDiscount + taxAmt + vatAmt;
    updatePayload.subTotalAmount = subTotalAmount;
    updatePayload.totalAmount = totalAmount;
  }

  // Ensure state transitions e.g., mark settled with Date
  if (updatePayload.state === 'settled' && typeof updatePayload.paymentConfirmedAt === 'string') {
    // Ensure supabase can accept string timestamp; keep as-is
  }

  console.log('[API][PUT] Update payload:', updatePayload);
  
  const { data: updated, error: updateError } = await supabase
    .from('receipts')
    .update(updatePayload)
    .eq('id', receiptId)
    .eq('createdBy', user.id)
    .select('*, organization:organizationId(logoUrl,name,email)')
    .single();
    
  if (updateError || !updated) {
    console.error('[API][PUT] Database update error:', updateError);
    return NextResponse.json({ success: false, error: updateError?.message || 'Failed to update receipt' }, { status: 500 });
  }
  
  console.log('[API][PUT] Receipt updated successfully:', updated.id);

  // Handle sending email if requested
  if (data.emailToCustomer && finalRecipientEmail && updated) {
    console.log(`[API][PUT] Sending email to: ${finalRecipientEmail} for receipt: ${receiptId}`);
    const organizationName = updated.organization?.name || updated.organizationName || 'Bexforte';
    const logoUrl = updated.organization?.logoUrl || updated.organizationLogo || 'https://www.bexoni.com/favicon.ico';
    
    console.log(`[API][PUT] Organization details - name: ${organizationName}, logo: ${logoUrl}, orgId: ${updated.organizationId}`);
    console.log(`[API][PUT] User details - id: ${user.id}`);
    console.log(`[API][PUT] Receipt details - id: ${updated.id}, customerId: ${updated.customerId}`);
    
    try {
      await sendReceiptEmail(
          supabase,
          user,
          updated,
          finalRecipientEmail,
          finalRecipientName || null,
          organizationName,
          logoUrl,
          updated.organizationId
      );
      
      console.log(`[API][PUT] Email sent successfully to: ${finalRecipientEmail}`);
      
      // Update the receipt to mark email as sent
      const { error: emailUpdateError } = await supabase
        .from('receipts')
        .update({ 
          sentViaEmail: true, 
          emailSentAt: new Date().toISOString() 
        })
        .eq('id', receiptId)
        .eq('createdBy', user.id);
        
      if (emailUpdateError) {
        console.error('[API][PUT] Error updating email sent status:', emailUpdateError);
      } else {
        console.log('[API][PUT] Email sent status updated successfully');
      }
        
    } catch (emailError) {
      console.error('[API][PUT] Failed to send receipt email:', emailError);
      // Don't fail the entire request if email fails, but log the error
    }
  } else {
    console.log(`[API][PUT] Email not sent. emailToCustomer: ${data.emailToCustomer}, finalRecipientEmail: ${finalRecipientEmail}, updated: ${!!updated}`);
  }

  return NextResponse.json({ success: true, receipt: updated }, { status: 200 });
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ receiptId: string }> }
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { receiptId } = await context.params;
  const { error } = await supabase
    .from('receipts')
    .delete()
    .eq('id', receiptId)
    .eq('createdBy', user.id);
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true }, { status: 200 });
}

