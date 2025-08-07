import type { SupabaseClient } from '@supabase/supabase-js'

export async function getInvoicesWithDetails(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
        id,
        invoiceNumber,
        currency,
        totalAmount,
        subTotalAmount,
        taxRate,
        vatRate,
        status,
        state,
        dueDate,
        issueDate,
        paidOn,
        emailSentAt,
        sentViaEmail,
        recepientEmail,
        recepientName,
        notes,
        invoiceDetails,
        paymentDetails,
        paymentLink,
        paymentType,
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
  const invoices = data ?? []

  const invoicesWithDetails = invoices.map((invoice) => {
    return {
      id: invoice.id,
      customerId: invoice.customerId?.[0]?.id || null,
      projectId: invoice.projectId?.[0]?.id || null,
      // Organization data from organization table (most up-to-date)
      organizationLogoUrl: invoice.organizationId?.[0]?.logoUrl || null,
      organizationNameFromOrg: invoice.organizationId?.[0]?.name || null,
      organizationEmailFromOrg: invoice.organizationId?.[0]?.email || null,
      // Fallback organization data from invoice table (saved when invoice was created)
      organizationName: invoice.organizationName || null,
      organizationLogo: invoice.organizationLogo || null,
      organizationEmail: invoice.organizationEmail || null,
      recepientName: invoice.recepientName || null,
      recepientEmail: invoice.recepientEmail || null,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      currency: invoice.currency || 'USD',
      hasVat: invoice.vatRate ? true : false,
      hasTax: invoice.taxRate ? true : false,
      hasDiscount: false, // Default value
      vatRate: invoice.vatRate || null,
      taxRate: invoice.taxRate || null,
      discount: null, // Default value
      notes: invoice.notes,
      paymentInfo: null, // Default value
      paymentDetails: invoice.paymentDetails,
      invoiceDetails: invoice.invoiceDetails,
      subTotalAmount: invoice.subTotalAmount || null,
      totalAmount: invoice.totalAmount || null,
      state: invoice.state || 'draft',
      sentViaEmail: invoice.sentViaEmail || false,
      emailSentAt: invoice.emailSentAt,
      createdBy: invoice.createdBy,
      organizationId: invoice.organizationId?.[0]?.id || null,
      created_at: invoice.created_at,
      updatedAt: invoice.updatedAt,
      invoiceNumber: invoice.invoiceNumber || null,
      status: invoice.status || 'pending',
      paidOn: invoice.paidOn,
      paymentLink: invoice.paymentLink,
      paymentType: invoice.paymentType,
      projectName: invoice.projectId?.[0]?.name || null,
      allowReminders: false, // Default value
      fts: null, // Default value
    };
  });
  return invoicesWithDetails
}
