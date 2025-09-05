import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Define styles
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
    marginBottom: 40,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 5,
  },
  invoiceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  invoiceInfoLeft: {
    flex: 1,
  },
  invoiceInfoRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 12,
    color: '#1f2937',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1f2937',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 5,
  },
  table: {
    // display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: '#e5e7eb',
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#e5e7eb',
  },
  tableCellHeader: {
    margin: 'auto',
    marginTop: 5,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  tableCell: {
    margin: 'auto',
    marginTop: 5,
    fontSize: 12,
    color: '#1f2937',
  },
  totals: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    width: 300,
  },
  totalLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: 'bold',
  },
  grandTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 10,
  },
});

type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

type Invoice = {
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
  currency?: string | null;
  taxRate?: number | null;
  vatRate?: number | null;
  notes?: string | null;
  organizationName?: string | null;
  organizationLogo?: string | null;
  organizationEmail?: string | null;
  invoiceDetails?: InvoiceItem[] | null;
  subTotalAmount?: number | null;
  discount?: number | null;
};

const InvoicePDF = ({ invoice }: { invoice: Invoice }) => {
  const issueDate = invoice.issueDate ? format(new Date(invoice.issueDate), 'd MMMM yyyy') : 'N/A';
  const dueDate = invoice.dueDate ? format(new Date(invoice.dueDate), 'd MMMM yyyy') : 'N/A';
  const currency = invoice.currency || 'USD';
  const totalAmount = invoice.totalAmount || 0;
  const subTotalAmount = invoice.subTotalAmount || totalAmount;
  const taxRate = invoice.taxRate || 0;
  const vatRate = invoice.vatRate || 0;
  const discount = invoice.discount || 0;
  
  const taxAmount = (subTotalAmount * taxRate) / 100;
  const vatAmount = (subTotalAmount * vatRate) / 100;
  const discountAmount = (subTotalAmount * discount) / 100;
  
  const invoiceItems = invoice.invoiceDetails || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.subtitle}>
              {invoice.organizationName || 'Your Company'}
            </Text>
            {invoice.organizationEmail && (
              <Text style={styles.subtitle}>{invoice.organizationEmail}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            {invoice.organizationLogo && (
              <Image src={invoice.organizationLogo} style={styles.logo} />
            )}
          </View>
        </View>

        {/* Invoice Information */}
        <View style={styles.invoiceInfo}>
          <View style={styles.invoiceInfoLeft}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bill To:</Text>
              <Text style={styles.infoValue}>{invoice.recepientName || 'N/A'}</Text>
            </View>
            {invoice.recepientEmail && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{invoice.recepientEmail}</Text>
              </View>
            )}
          </View>
          <View style={styles.invoiceInfoRight}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Invoice #:</Text>
              <Text style={styles.infoValue}>{invoice.invoiceNumber || invoice.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Issue Date:</Text>
              <Text style={styles.infoValue}>{issueDate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Due Date:</Text>
              <Text style={styles.infoValue}>{dueDate}</Text>
            </View>
          </View>
        </View>

        {/* Invoice Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Details</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Description</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Quantity</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Unit Price</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Amount</Text>
              </View>
            </View>
            {invoiceItems.length > 0 ? (
              invoiceItems.map((item, index) => (
                <View style={styles.tableRow} key={index}>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{item.description}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{item.quantity}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{formatCurrency(item.unitPrice)}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{formatCurrency(item.amount)}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.tableRow}>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>No items specified</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>-</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>-</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>-</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(subTotalAmount)}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount ({discount}%):</Text>
              <Text style={styles.totalValue}>-{formatCurrency(discountAmount)}</Text>
            </View>
          )}
          {taxRate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({taxRate}%):</Text>
              <Text style={styles.totalValue}>{formatCurrency(taxAmount)}</Text>
            </View>
          )}
          {vatRate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>VAT ({vatRate}%):</Text>
              <Text style={styles.totalValue}>{formatCurrency(vatAmount)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={[styles.totalValue, styles.grandTotal]}>{formatCurrency(totalAmount)}</Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.infoValue}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Thank you for your business!
        </Text>
      </Page>
    </Document>
  );
};

export const generateInvoicePDF = async (invoice: Invoice): Promise<Blob> => {
  const { pdf } = await import('@react-pdf/renderer');
  const blob = await pdf(<InvoicePDF invoice={invoice} />).toBlob();
  return blob;
};

export const downloadInvoicePDF = async (invoice: Invoice, filename?: string) => {
  try {
    const blob = await generateInvoicePDF(invoice);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${invoice.invoiceNumber || invoice.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
