import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { isOrgSubscriptionActive, deriveInactiveReason } from "@/utils/subscription";



export async function GET(
    request: Request,
    context: any
  ) {
    const supabase = await createClient();
    const { params } = context;
    const { receiptId } = params;
  
    if (!receiptId) {
      return NextResponse.json({ error: "Missing receiptId" }, { status: 400 });
    }
  
    try {
      // Fetch the invoice with organization and customer data
      const { data: receipt, error: receiptError } = await supabase
        .from("receipts")
        .select(`
          *,
          organization:organizationId (
            id,
            logoUrl,
            name,
            email,
            subscriptionstatus,
            trialEndsAt
          ),
          customer:customerId (
            id,
            name,
            email
          )
        `)
        .eq("id", receiptId)
        .single();
  
      if (receiptError || !receipt) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
  
      // Gate by organization subscription (non-auth public preview)
      const orgStatus = (receipt as any)?.organization?.subscriptionstatus ?? null;
      const orgTrialEndsAt = (receipt as any)?.organization?.trialEndsAt ?? null;
      if (!isOrgSubscriptionActive(orgStatus, orgTrialEndsAt)) {
        return NextResponse.json(
          {
            success: false,
            error: "Organization subscription inactive",
            reason: deriveInactiveReason(orgStatus, orgTrialEndsAt),
          },
          { status: 403 }
        );
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
      const customerName = receipt.customer?.name || receipt.recepientName || 'Customer';
  
      const receiptResponse = {
        ...receipt,
        customerName,
        receiptDetails: processJsonField(receipt.receiptDetails),
        // Process payment info as JSONB
        paymentDetails: processJsonField(receipt.paymentDetails),
        paymentInfo: processJsonField(receipt.paymentInfo),
        // Flatten organization data for easier access
        organizationLogoUrl: receipt.organization?.logoUrl || receipt.organizationLogo || null,
        organizationName: receipt.organization?.name || receipt.organizationName || 'Company',
        organizationEmail: receipt.organization?.email || receipt.organizationEmail || null,
      };
  
      return NextResponse.json({ success: true, data: receiptResponse });
    } catch (error) {
      console.error("Error fetching receipt:", error);
      return NextResponse.json({ error: "Failed to fetch receipt" }, { status: 500 });
    }
  }
