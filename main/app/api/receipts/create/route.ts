import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ratelimit } from '@/utils/rateLimit';
import { receiptCreateSchema } from '@/validation/receipt';
import { render } from "@react-email/components";
import sendgrid from "@sendgrid/mail";
import IssueReceipt from '../../../../emails/IssueReceipt';

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    // Profile/org
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organizationId, email')
      .eq('profile_id', user.id)
      .single();
    if (profileError || !profile?.organizationId) {
      return NextResponse.json({ error: 'You must be part of an organization to create receipts.' }, { status: 403 });
    }

    const rawBody = await request.json();
    const parsed = receiptCreateSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid fields!', details: parsed.error.flatten() }, { status: 400 });
    }
    const body = parsed.data as any;

    // Fetch org for defaults
    const { data: organization, error: orgError } = await supabase
      .from('organization')
      .select('name, email, logoUrl, baseCurrency')
      .eq('id', profile.organizationId)
      .single();
    if (orgError || !organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
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
      paymentConfirmedAt,
      currency,
      hasVat,
      hasTax,
      hasDiscount,
      vatRate,
      taxRate,
      discount,
      notes,
      receiptDetails,
      state = 'draft',
      emailToCustomer = false,
      creationMethod,
      invoiceId,
    } = body;

    // Final org fields
    const finalOrganizationName = organizationName || organization.name || (profile.email ? profile.email.split('@')[0] : null);
    const finalOrganizationLogoUrl = organizationLogoUrl || organization.logoUrl;
    const finalOrganizationEmail = organizationEmail || organization.email || profile.email;
    const finalCurrency = currency || organization.baseCurrency || 'CAD';

    // Customer fallback population
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
      finalRecepientName = customer?.name ?? finalRecepientName;
      finalRecepientEmail = customer?.email ?? finalRecepientEmail;
    }

    // Normalize line items: allow client to send price instead of unitPrice
    const normalizedDetails = (receiptDetails ?? []).map((item: any, index: number) => {
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

    // Totals
    const subTotalAmount = normalizedDetails.reduce((sum: number, it: any) => sum + (it.total || 0), 0);
    const discountAmt = hasDiscount && discount ? subTotalAmount * (discount / 100) : 0;
    const subAfterDiscount = subTotalAmount - discountAmt;
    const taxAmt = hasTax && taxRate ? subAfterDiscount * (taxRate / 100) : 0;
    const vatAmt = hasVat && vatRate ? subAfterDiscount * (vatRate / 100) : 0;
    const totalAmount = subAfterDiscount + taxAmt + vatAmt;

    // Dates
    const finalIssueDate = issueDate || new Date();
    const finalPaymentConfirmedAt = paymentConfirmedAt ?? null;

    // State
    let finalState = state;
    if (!customerId && state === 'draft') {
      finalState = 'unassigned';
    }

    // creationMethod default to manual
    const finalCreationMethod = creationMethod || 'manual';

    const insertPayload: any = {
      customerId,
      projectId,
      organizationName: finalOrganizationName,
      organizationLogo: finalOrganizationLogoUrl,
      organizationEmail: finalOrganizationEmail,
      recepientName: finalRecepientName,
      recepientEmail: finalRecepientEmail,
      issueDate: finalIssueDate,
      paymentConfirmedAt: finalPaymentConfirmedAt,
      currency: finalCurrency,
      hasVat: hasVat || false,
      hasTax: hasTax || false,
      hasDiscount: hasDiscount || false,
      vatRate: vatRate || 0,
      taxRate: taxRate || 0,
      discount: discount || 0,
      notes,
      receiptDetails: normalizedDetails,
      subTotalAmount,
      totalAmount,
      state: finalState,
      sentViaEmail: emailToCustomer,
      emailSentAt: emailToCustomer ? new Date().toISOString() : null,
      createdBy: user.id,
      organizationId: profile.organizationId,
      created_at: new Date().toISOString(),
      creationMethod: finalCreationMethod,
      invoiceId: invoiceId || null,
    };

    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .insert(insertPayload)
      .select()
      .single();

    if (receiptError || !receipt) {
      return NextResponse.json({ success: false, error: receiptError?.message || 'Failed to create receipt' }, { status: 500 });
    }

    if (emailToCustomer && finalRecepientEmail) {
      await sendReceiptEmail(supabase, user, receipt, finalRecepientEmail, finalRecepientName || null, finalOrganizationName, finalOrganizationLogoUrl || '');
    }

    return NextResponse.json({ success: true, data: receipt }, { status: 200 });
  } catch (error) {
    console.error('Receipt create error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create receipt' }, { status: 500 });
  }
}

async function sendReceiptEmail(supabase: any, user: any, receipt: any, recipientEmail: string, recepientName: string | null, organizationName: string, logoUrl: string) {
  try {
    const fromEmail = 'no_reply@receipts.bexforte.com';
    const fromName = 'Bexforte';
    const senderName = organizationName || 'Bexforte';

    const finalLogoUrl = logoUrl || 'https://www.bexoni.com/favicon.ico';

    const emailHtml = await render(IssueReceipt({
      receiptId: receipt.id,
      clientName: recepientName || 'Valued Customer',
      receiptName: receipt.receiptNumber || 'Receipt',
      senderName,
      logoUrl: finalLogoUrl,
    }));

    await sendgrid.send({
      to: recipientEmail,
      from: `${fromName} <${fromEmail}>`,
      subject: `${senderName} sent you a receipt`,
      html: emailHtml,
      customArgs: {
        receiptId: receipt.id,
        customerId: receipt.customerId || '',
        userId: user.id,
        type: 'receipt_sent',
      },
    });
  } catch (emailError) {
    console.error('SendGrid Error (receipt):', emailError);
  }
}
 