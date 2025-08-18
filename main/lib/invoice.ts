import type { SupabaseClient } from '@supabase/supabase-js'
import { Invoice } from '@/hooks/invoices/use-invoices';

export async function getOrganizationInvoices(
  supabase: SupabaseClient): Promise<Invoice[]> {
    // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  // Get user's profile to find their organization
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organizationId')
    .eq('profile_id', user.id)
    .single();

  if (profileError || !profile?.organizationId) {
    throw new Error('Organization not found');
  }


  const { data: invoices, error: invoicesError } = await supabase
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
        project:projectId (id, name),
        customer:customerId (id, name),
        org:organizationId (id, name, email, logoUrl)
      `)
      .eq('organizationId', profile.organizationId)
    .order('created_at', { ascending: false })

  if (invoicesError){
    console.error(invoicesError)
    throw invoicesError
  }

    // Process receipts to ensure JSON fields are properly serialized and flatten relations
    const processJsonField = (field: any) => {
      if (typeof field === 'string' && (field.trim().startsWith('{') || field.trim().startsWith('['))) {
        try {
          return JSON.parse(field);
        } catch (error) {
          console.warn('Failed to parse JSON field:', field);
          return field;
        }
      }
      return field;
    };

  // Turn null into [] so the rest of the code can assume an array
  // const invoices = data ?? []

  // const invoicesWithDetails = invoices.map((invoice) => {
  //   return {
  //     id: invoice.id,
  //     customerId: invoice.customerId?.[0]?.id || null,
  //     projectId: invoice.projectId?.[0]?.id || null,
  //     // Organization data from organization table (most up-to-date)
  //     organizationLogoUrl: invoice.organizationId?.[0]?.logoUrl || null,
  //     organizationNameFromOrg: invoice.organizationId?.[0]?.name || null,
  //     organizationEmailFromOrg: invoice.organizationId?.[0]?.email || null,
  //     // Fallback organization data from invoice table (saved when invoice was created)
  //     organizationName: invoice.organizationName || null,
  //     organizationLogo: invoice.organizationLogo || null,
  //     organizationEmail: invoice.organizationEmail || null,
  //     recepientName: invoice.recepientName || null,
  //     recepientEmail: invoice.recepientEmail || null,
  //     issueDate: invoice.issueDate,
  //     dueDate: invoice.dueDate,
  //     currency: invoice.currency || 'USD',
  //     hasVat: invoice.vatRate ? true : false,
  //     hasTax: invoice.taxRate ? true : false,
  //     hasDiscount: false, // Default value
  //     vatRate: invoice.vatRate || null,
  //     taxRate: invoice.taxRate || null,
  //     discount: null, // Default value
  //     notes: invoice.notes,
  //     paymentInfo: null, // Default value
  //     paymentDetails: invoice.paymentDetails,
  //     invoiceDetails: invoice.invoiceDetails,
  //     subTotalAmount: invoice.subTotalAmount || null,
  //     totalAmount: invoice.totalAmount || null,
  //     state: invoice.state || 'draft',
  //     sentViaEmail: invoice.sentViaEmail || false,
  //     emailSentAt: invoice.emailSentAt,
  //     createdBy: invoice.createdBy,
  //     organizationId: invoice.organizationId?.[0]?.id || null,
  //     created_at: invoice.created_at,
  //     updatedAt: invoice.updatedAt,
  //     invoiceNumber: invoice.invoiceNumber || null,
  //     status: invoice.status || 'pending',
  //     paidOn: invoice.paidOn,
  //     paymentLink: invoice.paymentLink,
  //     paymentType: invoice.paymentType,
  //     projectName: invoice.projectId?.[0]?.name || null,
  //     allowReminders: false, // Default value
  //     fts: null, // Default value
  //   };
  // });


  const processedInvoices = (invoices || []).map((invoice: any): Invoice => ({
    id: invoice.id,
    customerId:  invoice.customer?.id || null,
    projectId:  invoice.project?.id || null,
    // Organization data from organization table (most up-to-date)
    organizationLogoUrl: invoice.org?.logoUrl || null,
    organizationNameFromOrg: invoice.org?.name || null,
    organizationEmailFromOrg: invoice.org?.email || null,
    // Fallback organization data from invoice table (saved when invoice was created)
    organizationName: invoice.organizationName || null,
    organizationLogo: invoice.organizationLogo || null,
    organizationEmail: invoice.organizationEmail || null,
    recepientName: invoice.recepientName || null,
    recepientEmail: invoice.recepientEmail || null,
    issueDate: invoice.issueDate || null,
    dueDate: invoice.dueDate || null,
    currency: invoice.currency || null,
    hasVat: !!invoice.vatRate,
    hasTax: !!invoice.taxRate,
    hasDiscount: false, // Default as per original
    vatRate: invoice.vatRate || null,
    taxRate: invoice.taxRate || null,
    discount: null, // Default
    notes: invoice.notes || null,
    paymentInfo: null, // Default
    paymentDetails: processJsonField(invoice.paymentDetails),
    invoiceDetails: processJsonField(invoice.invoiceDetails),
    subTotalAmount: invoice.subTotalAmount || null,
    totalAmount: invoice.totalAmount || null,
    state: invoice.state || null,
    status: invoice.status || null,
    sentViaEmail: invoice.sentViaEmail || null,
    emailSentAt: invoice.emailSentAt || null,
    createdBy: invoice.createdBy || null,
    organizationId: invoice.organizationId || null,
    created_at: invoice.created_at || null,
    updatedAt: invoice.updatedAt || null,
    paidOn: invoice.paidOn || null,
    invoiceNumber: invoice.invoiceNumber || null,
    paymentLink: invoice.paymentLink || null,
    paymentType: invoice.paymentType || null,
    projectName: invoice.project?.name || null,
    allowReminders: false, // Default
    fts: null, // Default
    // Additional formatted fields (if needed; can compute client-side)
    customerName: invoice.customer?.name || undefined,
    issueDateFormatted: undefined,
    dueDateFormatted: undefined,
    totalAmountFormatted: undefined,
  }));


  return processedInvoices
}
