import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ratelimit } from '@/utils/rateLimit';

export async function POST(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const supabase = await createClient();
    const { invoiceId } = params;

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
      return NextResponse.json({ 
        error: 'You must be part of an organization to create receipts. Please contact your administrator.' 
      }, { status: 403 });
    }

    // Get the invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        customers (
          id,
          name,
          email
        )
      `)
      .eq('id', invoiceId)
      .eq('organizationId', profile.organizationId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check if invoice state allows receipt creation (settled or unassigned)
    const allowedStates = ['settled', 'unassigned'];
    if (!allowedStates.includes(invoice.state?.toLowerCase() || '')) {
      return NextResponse.json({ 
        error: `Cannot create receipt from invoice with state: ${invoice.state}. Only settled and unassigned invoices can generate receipts.` 
      }, { status: 400 });
    }

    // Get organization information
    const { data: organization, error: orgError } = await supabase
      .from('organization')
      .select('name, email, logoUrl, baseCurrency')
      .eq('id', profile.organizationId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if a receipt already exists for this invoice
    const { data: existingReceipt, error: existingReceiptError } = await supabase
      .from('receipts')
      .select('id')
      .eq('invoiceId', invoiceId)
      .maybeSingle();

    if (existingReceiptError) {
      console.error('Error checking existing receipt:', existingReceiptError);
      return NextResponse.json({ error: 'Error checking existing receipt' }, { status: 500 });
    }

    if (existingReceipt) {
      return NextResponse.json({ 
        error: 'A receipt has already been created for this invoice' 
      }, { status: 409 });
    }

    // Prepare receipt data from invoice
    const receiptData = {
      invoiceId: invoice.id,
      projectId: invoice.projectId,
      organizationId: profile.organizationId,
      organizationName: invoice.organizationName || organization.name,
      organizationEmail: invoice.organizationEmail || organization.email || profile.email,
      organizationLogo: invoice.organizationLogo || organization.logoUrl,
      customerId: invoice.customerId,
      recepientName: invoice.recepientName,
      recepientEmail: invoice.recepientEmail,
      paymentConfirmedAt: new Date().toISOString(),
      issueDate: new Date().toISOString(), // Current date for receipt
      // dueDate is left null for receipts as specified
      currency: invoice.currency || organization.baseCurrency || 'CAD',
      receiptDetails: invoice.invoiceDetails, // Copy invoice details to receipt details
      subTotalAmount: invoice.subTotalAmount,
      paymentDetails: invoice.paymentDetails,
      totalAmount: invoice.totalAmount,
      hasVat: invoice.hasVat,
      hasTax: invoice.hasTax,
      hasDiscount: invoice.hasDiscount,
      vatRate: invoice.vatRate,
      taxRate: invoice.taxRate,
      discount: invoice.discount,
      notes: invoice.notes,
      creationMethod: 'invoice', // Set creation method as specified
      state: 'settled', // Receipts are typically settled by default
      createdBy: user.id,
      created_at: new Date().toISOString(),
    };

    // Create the receipt
    console.log("Attempting to insert into 'receipts' table...");
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .insert(receiptData)
      .select()
      .single();

    if (receiptError) {
      console.error("Supabase Receipt Insert Error:", receiptError);
      return NextResponse.json({ 
        success: false, 
        error: receiptError.message 
      }, { status: 500 });
    }

    if (!receipt) {
      return NextResponse.json({ 
        success: false, 
        error: "Failed to create receipt; receipt data is null after insert." 
      }, { status: 500 });
    }

    console.log("Receipt created successfully. Receipt ID:", receipt.id);

    return NextResponse.json({ 
      success: true, 
      data: receipt,
      message: 'Receipt created successfully from invoice'
    }, { status: 201 });

  } catch (error) {
    console.error("Error during receipt creation:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to create receipt" 
    }, { status: 500 });
  }
}
