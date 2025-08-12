import type { SupabaseClient } from '@supabase/supabase-js'

export async function getReceiptsWithDetails(
  supabase: SupabaseClient,
  userId: string
) {

  const { data, error } = await supabase
    .from('receipts')
    .select(`
        id,
        receiptNumber,
        currency,
        totalAmount,
        subTotalAmount,
        taxRate,
        vatRate,
        state,
        paymentConfirmedAt,
        issueDate,
        emailSentAt,
        sentViaEmail,
        recepientEmail,
        recepientName,
        notes,
        receiptDetails,
        paymentDetails,
        paymentLink,
        paymentType,
        creationMethod,
        created_at,
        updatedAt,
        createdBy,
        organizationId,
        organizationName,
        organizationLogo,
        organizationEmail,
        projectId(
          id,
          name
        ),
        invoiceId(
          id,
          invoiceNumber
        ),
        customerId(
          id,
          name
        ),
        organizationId(
          id,
          name,
          email,
          logoUrl
        )
      `)
    .eq('createdBy', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Turn null into [] so the rest of the code can assume an array
  const receipts = data ?? []

  const receiptsWithDetails = receipts.map((receipt) => {
    return {
      id: receipt.id,
      customerId: receipt.customerId?.[0]?.id || null,
      projectId: receipt.projectId?.[0]?.id || null,
      // Organization data from organization table (most up-to-date)
      organizationLogoUrl: receipt.organizationId?.[0]?.logoUrl || null,
      organizationNameFromOrg: receipt.organizationId?.[0]?.name || null,
      organizationEmailFromOrg: receipt.organizationId?.[0]?.email || null,
      // Fallback organization data from receipt table (saved when receipt was created)
      organizationName: receipt.organizationName || null,
      organizationLogo: receipt.organizationLogo || null,
      organizationEmail: receipt.organizationEmail || null,
      recepientName: receipt.recepientName || null,
      recepientEmail: receipt.recepientEmail || null,
      issueDate: receipt.issueDate,
      paymentConfirmedAt: receipt.paymentConfirmedAt,
      currency: receipt.currency || 'USD',
      hasVat: receipt.vatRate ? true : false,
      hasTax: receipt.taxRate ? true : false,
      hasDiscount: false, // Default value
      vatRate: receipt.vatRate || null,
      taxRate: receipt.taxRate || null,
      discount: null, // Default value
      notes: receipt.notes,
      paymentInfo: null, // Default value
      paymentDetails: receipt.paymentDetails,
      receiptDetails: receipt.receiptDetails,
      subTotalAmount: receipt.subTotalAmount || null,
      totalAmount: receipt.totalAmount || null,
      state: receipt.state || 'draft',
      sentViaEmail: receipt.sentViaEmail || false,
      emailSentAt: receipt.emailSentAt,
      createdBy: receipt.createdBy,
      organizationId: receipt.organizationId?.[0]?.id || null,
      created_at: receipt.created_at,
      updatedAt: receipt.updatedAt,
      receiptNumber: receipt.receiptNumber || null,
      paymentLink: receipt.paymentLink,
      paymentType: receipt.paymentType,
      projectName: receipt.projectId?.[0]?.name || null,
      allowReminders: false, // Default value
      fts: null, // Default value
      creationMethod: receipt.creationMethod || 'manual',
    };
  });
  return receiptsWithDetails
}
