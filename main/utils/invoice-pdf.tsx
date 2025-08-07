import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Register fonts
Font.register({
  family: 'Helvetica',
  src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf',
});

Font.register({
  family: 'Helvetica-Bold',
  src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfB.ttf',
});

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  logo: {
    width: 80,
    height: 80,
    objectFit: 'contain',
  },
  invoiceTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  invoiceNumber: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  invoiceDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  dueDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  fromSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  fromLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  fromEmail: {
    fontSize: 12,
    color: '#1f2937',
  },
  toSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  toLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  toEmail: {
    fontSize: 12,
    color: '#1f2937',
  },
  separator: {
    borderBottom: 1,
    borderColor: '#e5e7eb',
    marginVertical: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: 1,
    borderColor: '#e5e7eb',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  tableCell: {
    fontSize: 12,
    color: '#1f2937',
  },
  descriptionCell: {
    flex: 3,
  },
  quantityCell: {
    flex: 1,
    textAlign: 'center',
  },
  priceCell: {
    flex: 1,
    textAlign: 'center',
  },
  totalCell: {
    flex: 1,
    textAlign: 'right',
  },
  summarySection: {
    marginTop: 30,
    alignItems: 'flex-end',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    minWidth: 200,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 20,
  },
  summaryValue: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTop: 1,
    borderColor: '#e5e7eb',
    minWidth: 200,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginRight: 20,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
});

export interface InvoicePDFData {
  id: string;
  invoiceNumber?: string | null;
  recepientEmail?: string | null;
  recepientName?: string | null;
  created_at?: string | null;
  paidOn?: string | null;
  dueDate?: string | null;
  issueDate?: string | null;
  state?: string | null;
  status?: string | null;
  totalAmount?: number | null;
  subTotalAmount?: number | null;
  currency?: string | null;
  taxRate?: number | null;
  vatRate?: number | null;
  discount?: number | null;
  hasDiscount?: boolean | null;
  hasTax?: boolean | null;
  hasVat?: boolean | null;
  notes?: string | null;
  organizationLogo?: string | null;
  organizationLogoUrl?: string | null; // From organization table
  organizationName?: string | null;
  organizationNameFromOrg?: string | null; // From organization table
  organizationEmail?: string | null;
  organizationEmailFromOrg?: string | null; // From organization table
  invoiceDetails?: Array<{
    position: number;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }> | null;
}

export function generateInvoicePDF(invoice: InvoicePDFData) {
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return 'N/A';
    }
  };

  const currency = invoice.currency || 'USD';
  const taxRate = invoice.taxRate || 0;
  const vatRate = invoice.vatRate || 0;
  const discountRate = invoice.discount || 0;
  
  // Get line items from invoiceDetails
  console.log('Invoice details for PDF generation:', invoice.invoiceDetails);
  
  const lineItems = (invoice.invoiceDetails && Array.isArray(invoice.invoiceDetails) && invoice.invoiceDetails.length > 0) 
    ? invoice.invoiceDetails 
    : [{
        position: 1,
        description: 'Invoice Item',
        quantity: 1,
        unitPrice: invoice.totalAmount || 0,
        total: invoice.totalAmount || 0,
      }];

  console.log('Processed line items:', lineItems);

  // Determine the logo URL to use with proper fallback logic
  // Priority: organizationLogoUrl (from organization table), then organizationLogo (from invoice table)
  const logoUrl = invoice.organizationLogoUrl || invoice.organizationLogo || null;
  console.log('Logo URL for PDF:', logoUrl);

  // Determine organization details with proper fallback logic
  // Priority: organization table data, then invoice table data (saved when invoice was created), then defaults
  const orgName = invoice.organizationNameFromOrg || invoice.organizationName || 'Your Company';
  const orgEmail = invoice.organizationEmailFromOrg || invoice.organizationEmail || 'contact@company.com';

  // Calculate amounts properly
  const subtotal = invoice.subTotalAmount || lineItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = invoice.hasDiscount ? (subtotal * discountRate) / 100 : 0;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxAmount = invoice.hasTax ? (subtotalAfterDiscount * taxRate) / 100 : 0;
  const vatAmount = invoice.hasVat ? (subtotalAfterDiscount * vatRate) / 100 : 0;
  const grandTotal = invoice.totalAmount || (subtotalAfterDiscount + taxAmount + vatAmount);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.invoiceTitle}>Invoice</Text>
            <Text style={styles.invoiceNumber}>Invoice No: {invoice.invoiceNumber || invoice.id}</Text>
            <Text style={styles.invoiceDate}>Issue Date: {formatDate(invoice.issueDate)}</Text>
            <Text style={styles.dueDate}>Due Date: {formatDate(invoice.dueDate)}</Text>
          </View>
                     <View style={styles.headerRight}>
             {logoUrl && (
               <Image src={logoUrl} style={styles.logo} />
             )}
           </View>
        </View>

                 {/* From Section */}
         <View style={styles.fromSection}>
           <Text style={styles.fromLabel}>From</Text>
           <Text style={styles.fromEmail}>{orgEmail}</Text>
         </View>

        {/* To Section */}
        <View style={styles.toSection}>
          <Text style={styles.toLabel}>To</Text>
          <Text style={styles.toEmail}>{invoice.recepientEmail || 'N/A'}</Text>
        </View>

        {/* Separator */}
        <View style={styles.separator} />

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.descriptionCell]}>Description</Text>
          <Text style={[styles.tableHeaderCell, styles.quantityCell]}>Quantity</Text>
          <Text style={[styles.tableHeaderCell, styles.priceCell]}>Price</Text>
          <Text style={[styles.tableHeaderCell, styles.totalCell]}>Total</Text>
        </View>

                 {/* Table Rows */}
         {lineItems.map((item, index) => (
           <View key={index} style={styles.tableRow}>
             <Text style={[styles.tableCell, styles.descriptionCell]}>{item.description}</Text>
             <Text style={[styles.tableCell, styles.quantityCell]}>{item.quantity}</Text>
             <Text style={[styles.tableCell, styles.priceCell]}>{formatCurrency(item.unitPrice, currency)}</Text>
             <Text style={[styles.tableCell, styles.totalCell]}>{formatCurrency(item.total, currency)}</Text>
           </View>
         ))}

                 {/* Summary Section */}
         <View style={styles.summarySection}>
           <View style={styles.summaryRow}>
             <Text style={styles.summaryLabel}>Subtotal</Text>
             <Text style={styles.summaryValue}>{formatCurrency(subtotal, currency)}</Text>
           </View>
           
           {invoice.hasDiscount && discountAmount > 0 && (
             <View style={styles.summaryRow}>
               <Text style={styles.summaryLabel}>Discount ({discountRate}%)</Text>
               <Text style={styles.summaryValue}>-{formatCurrency(discountAmount, currency)}</Text>
             </View>
           )}
           
           {invoice.hasTax && taxAmount > 0 && (
             <View style={styles.summaryRow}>
               <Text style={styles.summaryLabel}>Tax ({taxRate}%)</Text>
               <Text style={styles.summaryValue}>{formatCurrency(taxAmount, currency)}</Text>
             </View>
           )}
           
           {invoice.hasVat && vatAmount > 0 && (
             <View style={styles.summaryRow}>
               <Text style={styles.summaryLabel}>VAT ({vatRate}%)</Text>
               <Text style={styles.summaryValue}>{formatCurrency(vatAmount, currency)}</Text>
             </View>
           )}

           <View style={styles.totalRow}>
             <Text style={styles.totalLabel}>Total</Text>
             <Text style={styles.totalValue}>{formatCurrency(grandTotal, currency)}</Text>
           </View>
         </View>
      </Page>
    </Document>
  );
}

export async function downloadInvoiceAsPDF(invoice: InvoicePDFData, filename?: string) {
  try {
    const { pdf } = await import('@react-pdf/renderer');
    const blob = await pdf(generateInvoicePDF(invoice)).toBlob();
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `invoice-${invoice.invoiceNumber || invoice.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

export async function generateInvoicePDFBlob(invoice: InvoicePDFData): Promise<Blob> {
  try {
    const { pdf } = await import('@react-pdf/renderer');
    return await pdf(generateInvoicePDF(invoice)).toBlob();
  } catch (error) {
    console.error('Error generating PDF blob:', error);
    throw error;
  }
}
