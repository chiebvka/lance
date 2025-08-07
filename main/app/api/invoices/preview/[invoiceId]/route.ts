import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: any
) {
  const supabase = await createClient();
  const { params } = context;
  const { invoiceId } = params;

  if (!invoiceId) {
    return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });
  }

  try {
    // Fetch the invoice with organization and customer data
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        *,
        organization:organizationId (
          logoUrl,
          name,
          email
        ),
        customer:customerId (
          id,
          name,
          email
        )
      `)
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
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

    // Determine customer name - use customer.name if available, fallback to recepientName
    const customerName = invoice.customer?.name || invoice.recepientName || 'Customer';

    const invoiceResponse = {
      ...invoice,
      customerName,
      invoiceDetails: processJsonField(invoice.invoiceDetails),
      // Process payment info as JSONB
      paymentDetails: processJsonField(invoice.paymentDetails),
      paymentInfo: processJsonField(invoice.paymentInfo),
      // Flatten organization data for easier access
      organizationLogoUrl: invoice.organization?.logoUrl || invoice.organizationLogo || null,
      organizationName: invoice.organization?.name || invoice.organizationName || 'Company',
      organizationEmail: invoice.organization?.email || invoice.organizationEmail || null,
    };

    return NextResponse.json({ success: true, data: invoiceResponse });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}
