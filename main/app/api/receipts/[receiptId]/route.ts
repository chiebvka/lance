import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { receiptCreateSchema } from '@/validation/receipt';

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

  const { receiptId } = await context.params;
  const body = await req.json();

  // Permit partials based on create schema shape
  const parsed = receiptCreateSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid fields', details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data as any;

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

  // Prepare update payload
  const updatePayload: any = {
    ...data,
    ...(normalizedDetails ? { receiptDetails: normalizedDetails } : {}),
  };

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

  const { data: updated, error: updateError } = await supabase
    .from('receipts')
    .update(updatePayload)
    .eq('id', receiptId)
    .eq('createdBy', user.id)
    .select()
    .single();
  if (updateError || !updated) {
    return NextResponse.json({ success: false, error: updateError?.message || 'Failed to update receipt' }, { status: 500 });
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

