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

export interface ReceiptPDFData {
  id: string;
  receiptNumber?: string | null;
  recepientEmail?: string | null;
  recepientName?: string | null;
  created_at?: string | null;
  paymentConfirmedAt?: string | null;
  dueDate?: string | null;
  issueDate?: string | null;
  state?: string | null;
  creationMethod?: string | null;
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
  receiptDetails?: Array<{
    position: number;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }> | null;
}

export function generateReceiptPDF(receipt: ReceiptPDFData) {
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

  const currency = receipt.currency || 'USD';
  const taxRate = receipt.taxRate || 0;
  const vatRate = receipt.vatRate || 0;
  const discountRate = receipt.discount || 0;
  
  // Get line items from invoiceDetails
  console.log('Receipt details for PDF generation:', receipt.receiptDetails);
  
  const lineItems = (receipt.receiptDetails && Array.isArray(receipt.receiptDetails) && receipt.receiptDetails.length > 0) 
    ? receipt.receiptDetails 
    : [{
        position: 1,
        description: 'Receipt Item',
        quantity: 1,
        unitPrice: receipt.totalAmount || 0,
        total: receipt.totalAmount || 0,
      }];

  console.log('Processed line items:', lineItems);

  // Determine the logo URL to use with proper fallback logic
  // Priority: organizationLogoUrl (from organization table), then organizationLogo (from invoice table)
  const logoUrl = receipt.organizationLogoUrl || receipt.organizationLogo || null;
  console.log('Logo URL for PDF:', logoUrl);

  // Determine organization details with proper fallback logic
  // Priority: organization table data, then invoice table data (saved when invoice was created), then defaults
  const orgName = receipt.organizationNameFromOrg || receipt.organizationName || 'Your Company';
  const orgEmail = receipt.organizationEmailFromOrg || receipt.organizationEmail || 'contact@company.com';

  // Calculate amounts properly
  const subtotal = receipt.subTotalAmount || lineItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = receipt.hasDiscount ? (subtotal * discountRate) / 100 : 0;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxAmount = receipt.hasTax ? (subtotalAfterDiscount * taxRate) / 100 : 0;
  const vatAmount = receipt.hasVat ? (subtotalAfterDiscount * vatRate) / 100 : 0;
  const grandTotal = receipt.totalAmount || (subtotalAfterDiscount + taxAmount + vatAmount);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.invoiceTitle}>Receipt</Text>
            <Text style={styles.invoiceNumber}>Receipt No: {receipt.receiptNumber || receipt.id}</Text>
            <Text style={styles.invoiceDate}>Issue Date: {formatDate(receipt.issueDate)}</Text>
            <Text style={styles.dueDate}>Payment Date: {formatDate(receipt.paymentConfirmedAt)}</Text>
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
           <Text style={styles.fromEmail}>{orgName}</Text>
         </View>

        {/* To Section */}
        <View style={styles.toSection}>
          <Text style={styles.toLabel}>To</Text>
          <Text style={styles.toEmail}>{receipt.recepientName || 'N/A'}</Text>
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
           
           {receipt.hasDiscount && discountAmount > 0 && (
             <View style={styles.summaryRow}>
               <Text style={styles.summaryLabel}>Discount ({discountRate}%)</Text>
               <Text style={styles.summaryValue}>-{formatCurrency(discountAmount, currency)}</Text>
             </View>
           )}
           
           {receipt.hasTax && taxAmount > 0 && (
             <View style={styles.summaryRow}>
               <Text style={styles.summaryLabel}>Tax ({taxRate}%)</Text>
               <Text style={styles.summaryValue}>{formatCurrency(taxAmount, currency)}</Text>
             </View>
           )}
           
           {receipt.hasVat && vatAmount > 0 && (
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

export async function downloadReceiptAsPDF(receipt: ReceiptPDFData, filename?: string) {
  try {
    const { pdf } = await import('@react-pdf/renderer');
    const blob = await pdf(generateReceiptPDF(receipt)).toBlob();
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `receipt-${receipt.receiptNumber || receipt.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

export async function generateReceiptPDFBlob(receipt: ReceiptPDFData): Promise<Blob> {
  try {
    const { pdf } = await import('@react-pdf/renderer');
    return await pdf(generateReceiptPDF(receipt)).toBlob();
  } catch (error) {
    console.error('Error generating PDF blob:', error);
    throw error;
  }
}
