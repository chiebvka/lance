import type { SupabaseClient } from '@supabase/supabase-js';
import { Receipt } from '@/hooks/receipts/use-receipts'; // Import your Receipt type

export async function getOrganizationReceipts(supabase: SupabaseClient): Promise<Receipt[]> {
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

  // Get receipts for the organization with all related data
  const { data: receipts, error: receiptsError } = await supabase
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
      project:projectId (id, name),
      invoice:invoiceId (id, invoiceNumber),
      customer:customerId (id, name),
      org:organizationId (id, name, email, logoUrl)
    `)
    .eq('organizationId', profile.organizationId)
    .order('created_at', { ascending: false });

  if (receiptsError) {
    throw receiptsError;
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

  const processedReceipts = (receipts || []).map((receipt: any): Receipt => ({
    id: receipt.id,
    customerId:  receipt.customer?.id || null,
    projectId:  receipt.project?.id || null,
    // Organization data from organization table (most up-to-date)
    organizationLogoUrl: receipt.org?.logoUrl || null,
    organizationNameFromOrg: receipt.org?.name || null,
    organizationEmailFromOrg: receipt.org?.email || null,
    // Fallback organization data from receipt table (saved when receipt was created)
    organizationName: receipt.organizationName || null,
    organizationLogo: receipt.organizationLogo || null,
    organizationEmail: receipt.organizationEmail || null,
    recepientName: receipt.recepientName || null,
    recepientEmail: receipt.recepientEmail || null,
    issueDate: receipt.issueDate || null,
    dueDate: null, // Not in select; add if needed
    currency: receipt.currency || null,
    hasVat: !!receipt.vatRate,
    hasTax: !!receipt.taxRate,
    hasDiscount: false, // Default as per original
    vatRate: receipt.vatRate || null,
    taxRate: receipt.taxRate || null,
    discount: null, // Default
    notes: receipt.notes || null,
    creationMethod: receipt.creationMethod || null,
    paymentInfo: null, // Default
    paymentDetails: processJsonField(receipt.paymentDetails),
    receiptDetails: processJsonField(receipt.receiptDetails),
    subTotalAmount: receipt.subTotalAmount || null,
    totalAmount: receipt.totalAmount || null,
    state: receipt.state || null,
    sentViaEmail: receipt.sentViaEmail || null,
    emailSentAt: receipt.emailSentAt || null,
    createdBy: receipt.createdBy || null,
    organizationId: receipt.organizationId || null,
    created_at: receipt.created_at || null,
    updatedAt: receipt.updatedAt || null,
    paymentConfirmedAt: receipt.paymentConfirmedAt || null,
    receiptNumber: receipt.receiptNumber || null,
    paymentLink: receipt.paymentLink || null,
    paymentType: receipt.paymentType || null,
    projectName: receipt.project?.name || null,
    allowReminders: false, // Default
    fts: null, // Default
    // Additional formatted fields (if needed; can compute client-side)
    customerName: receipt.customer?.name || undefined,
    issueDateFormatted: undefined,
    dueDateFormatted: undefined,
    totalAmountFormatted: undefined,
  }));

  return processedReceipts;
}








// import type { SupabaseClient } from '@supabase/supabase-js'

// export async function getReceiptsWithDetails(
//   supabase: SupabaseClient,
//   userId: string
// ) {

//   const { data, error } = await supabase
//     .from('receipts')
//     .select(`
//         id,
//         receiptNumber,
//         currency,
//         totalAmount,
//         subTotalAmount,
//         taxRate,
//         vatRate,
//         state,
//         paymentConfirmedAt,
//         issueDate,
//         emailSentAt,
//         sentViaEmail,
//         recepientEmail,
//         recepientName,
//         notes,
//         receiptDetails,
//         paymentDetails,
//         paymentLink,
//         paymentType,
//         creationMethod,
//         created_at,
//         updatedAt,
//         createdBy,
//         organizationId,
//         organizationName,
//         organizationLogo,
//         organizationEmail,
//         projectId(
//           id,
//           name
//         ),
//         invoiceId(
//           id,
//           invoiceNumber
//         ),
//         customerId(
//           id,
//           name
//         ),
//         organizationId(
//           id,
//           name,
//           email,
//           logoUrl
//         )
//       `)
//     .eq('createdBy', userId)
//     .order('created_at', { ascending: false })

//   if (error) throw error

//   // Turn null into [] so the rest of the code can assume an array
//   const receipts = data ?? []

//   const receiptsWithDetails = receipts.map((receipt) => {
//     return {
//       id: receipt.id,
//       customerId: receipt.customerId?.[0]?.id || null,
//       projectId: receipt.projectId?.[0]?.id || null,
//       // Organization data from organization table (most up-to-date)
//       organizationLogoUrl: receipt.organizationId?.[0]?.logoUrl || null,
//       organizationNameFromOrg: receipt.organizationId?.[0]?.name || null,
//       organizationEmailFromOrg: receipt.organizationId?.[0]?.email || null,
//       // Fallback organization data from receipt table (saved when receipt was created)
//       organizationName: receipt.organizationName || null,
//       organizationLogo: receipt.organizationLogo || null,
//       organizationEmail: receipt.organizationEmail || null,
//       recepientName: receipt.recepientName || null,
//       recepientEmail: receipt.recepientEmail || null,
//       issueDate: receipt.issueDate,
//       paymentConfirmedAt: receipt.paymentConfirmedAt,
//       currency: receipt.currency || 'USD',
//       hasVat: receipt.vatRate ? true : false,
//       hasTax: receipt.taxRate ? true : false,
//       hasDiscount: false, // Default value
//       vatRate: receipt.vatRate || null,
//       taxRate: receipt.taxRate || null,
//       discount: null, // Default value
//       notes: receipt.notes,
//       paymentInfo: null, // Default value
//       paymentDetails: receipt.paymentDetails,
//       receiptDetails: receipt.receiptDetails,
//       subTotalAmount: receipt.subTotalAmount || null,
//       totalAmount: receipt.totalAmount || null,
//       state: receipt.state || 'draft',
//       sentViaEmail: receipt.sentViaEmail || false,
//       emailSentAt: receipt.emailSentAt,
//       createdBy: receipt.createdBy,
//       organizationId: receipt.organizationId?.[0]?.id || null,
//       created_at: receipt.created_at,
//       updatedAt: receipt.updatedAt,
//       receiptNumber: receipt.receiptNumber || null,
//       paymentLink: receipt.paymentLink,
//       paymentType: receipt.paymentType,
//       projectName: receipt.projectId?.[0]?.name || null,
//       allowReminders: false, // Default value
//       fts: null, // Default value
//       creationMethod: receipt.creationMethod || 'manual',
//     };
//   });
//   return receiptsWithDetails
// }
