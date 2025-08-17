"use client"

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatDistanceToNow, isPast } from 'date-fns';
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, Calendar, Clock, AlertCircle, Download, FileText, DollarSign, Receipt, Copy, Ban, SquareDashedKanban, Ungroup, HardDriveDownload } from "lucide-react";
import { toast } from "sonner";
import { downloadInvoiceAsPDF, InvoicePDFData } from '@/utils/invoice-pdf';
import SubscriptionNotice from "@/app/(previews)/_components/SubscriptionNotice";

interface InvoiceDetail {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  state: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  subTotalAmount: number;
  totalAmount: number;
  hasVat: boolean;
  hasTax: boolean;
  hasDiscount: boolean;
  vatRate: number;
  taxRate: number;
  discount: number;
  customerName: string;
  invoiceDetails: InvoiceDetail[];
  paymentDetails: string;
  notes: string;
  organizationLogoUrl: string | null;
  organizationName: string;
  organizationEmail: string | null;
}

interface InvoicePreviewProps {
  invoiceId: string;
}

export default function InvoicePreview({ invoiceId }: InvoicePreviewProps) {
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoiceData();
  }, [invoiceId]);

  const fetchInvoiceData = async () => {
    try {
      const response = await axios.get(`/api/invoices/preview/${invoiceId}`);
      if (response.data.success) {
        setInvoiceData(response.data.data);
      }
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        setBlockedReason(error.response?.data?.reason || null);
        setError(null);
      } else {
        setError(error.response?.data?.error || "Failed to load invoice");
      }
    } finally {
      setLoading(false);
    }
  };



  const handleCopyPaymentDetails = async () => {
    if (!invoiceData?.paymentDetails) return;
    
    try {
      await navigator.clipboard.writeText(invoiceData.paymentDetails);
      toast.success("Payment details copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy payment details");
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const getStateColor = (state: string) => {
    switch (state?.toLowerCase()) {
      case 'draft':
        return 'bg-blue-100 text-blue-800'
      case 'sent':
        return 'bg-yellow-100 text-yellow-800'
      case 'settled':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'unassigned':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-stone-300 text-stone-800 line-through'
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'settled':
        return <Receipt className="w-4 h-4" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      case 'sent':
        return <FileText className="w-4 h-4" />;
      case 'cancelled':
        return <Ban className="w-4 h-4" />;
      case 'unassigned':
        return <Ungroup  className="w-4 h-4" />;
      case 'draft':
        return <SquareDashedKanban className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (blockedReason) {
    return <SubscriptionNotice reason={blockedReason} />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <AlertCircle className="md:h-12 md:w-12 h-8 w-8 text-red-500 mx-auto mb-4" />
          <h1 className="md:text-2xl text-lg font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 text-xs md:text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Invoice not found</h1>
        </div>
      </div>
    );
  }

  const isOverdue = invoiceData.dueDate && isPast(new Date(invoiceData.dueDate));
  const daysOverdue = invoiceData.dueDate ? formatDistanceToNow(new Date(invoiceData.dueDate)) : null;

  return (
    <div className="min-h-screen  md:p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl min-h-screen shadow-black/10 border-0 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-bexoni/60 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center md:gap-3 gap-1">
                {invoiceData.organizationLogoUrl ? (
                  <img
                    src={invoiceData.organizationLogoUrl}
                    alt={invoiceData.organizationName}
                    className="md:w-12 md:h-12 w-8 h-8 rounded-lg bg-white/20 p-2 object-contain"
                  />
                ) : (
                  <div className="md:w-12 md:h-12 w-8 h-8 rounded-none bg-white/20 p-2 flex items-center justify-center">
                    <Building2 className="w-8 h-8" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-xs md:text-base">{invoiceData.organizationName}</h3>
                  <p className="text-blue-100 text-xs md:text-sm">Invoice</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${getStateColor(invoiceData.state)} text-xs md:text-sm`}>
                  {getStateIcon(invoiceData.state)}
                  <span className="ml-1 capitalize">{invoiceData.state}</span>
                </Badge>
                {invoiceData.dueDate && (
                  <Badge variant="secondary" className={`${
                    isOverdue ? "bg-red-500/20 text-red-100 border-red-300" : "bg-white/20 text-white border-white/30"
                  } text-xs md:text-sm`}>
                    {isOverdue ? <AlertCircle className="w-4 h-4 mr-1" /> : <Calendar className="w-4 h-4 mr-1" />}
                    {isOverdue ? `Overdue by ${daysOverdue}` : `Due: ${new Date(invoiceData.dueDate).toLocaleDateString()}`}
                  </Badge>
                )}
              </div>
            </div>
            <h1 className="md:text-3xl text-xl font-bold">Invoice #{invoiceData.invoiceNumber}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Issue Date: {new Date(invoiceData.issueDate).toLocaleDateString()}</span>
              </div>
              {invoiceData.dueDate && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Due Date: {new Date(invoiceData.dueDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          <CardContent className="md:p-8 p-4 space-y-6">
            {/* From/To Section */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold  mb-2">From:</h3>
                <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-none border border-gray-200">
                  <p className="font-medium">{invoiceData.organizationName}</p>
                  {/* {invoiceData.organizationEmail && (
                    <p className="text-gray-600 text-sm">{invoiceData.organizationEmail}</p>
                  )} */}
                </div>
              </div>
              <div>
                <h3 className="font-semibold  mb-2">To:</h3>
                <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-none border border-gray-200">
                  <p className="font-medium">{invoiceData.customerName}</p>
                </div>
              </div>
            </div>

            {/* Invoice Items */}
            {invoiceData.invoiceDetails && invoiceData.invoiceDetails.length > 0 && (
              <div>
                <h3 className="font-semibold  mb-4">Invoice Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm text-primary md:text-base font-medium ">Description</th>
                        <th className="text-right py-3 px-4 text-sm text-primary md:text-base font-medium ">Quantity</th>
                        <th className="text-right py-3 px-4 text-sm text-primary md:text-base font-medium ">Price</th>
                        <th className="text-right py-3 px-4 text-sm text-primary md:text-base font-medium ">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                       {invoiceData.invoiceDetails.map((item, index) => (
                         <tr key={index} className="border-b border-gray-100">
                           <td className="py-3 text-sm md:text-base px-4">{item.description}</td>
                           <td className="py-3 text-sm md:text-base px-4 text-right">{item.quantity}</td>
                           <td className="py-3 text-sm md:text-base px-4 text-right">{formatCurrency(item.unitPrice, invoiceData.currency)}</td>
                           <td className="py-3 text-sm md:text-base px-4 text-right font-medium">{formatCurrency(item.total, invoiceData.currency)}</td>
                         </tr>
                       ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="flex justify-end">
              <div className="w-full md:w-80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm md:text-base font-semibold">Subtotal:</span>
                  <span className="text-sm md:text-base font-medium">{formatCurrency(invoiceData.subTotalAmount, invoiceData.currency)}</span>
                </div>
                
                {invoiceData.hasDiscount && invoiceData.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm md:text-base font-semibold">Discount ({invoiceData.discount}%):</span>
                    <span className="text-sm md:text-base font-medium text-green-600">-{formatCurrency((invoiceData.subTotalAmount * invoiceData.discount) / 100, invoiceData.currency)}</span>
                  </div>
                )}
                
                {invoiceData.hasVat && invoiceData.vatRate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm md:text-base font-semibold">VAT ({invoiceData.vatRate}%):</span>
                    <span className="text-sm md:text-base font-medium">{formatCurrency((invoiceData.subTotalAmount * invoiceData.vatRate) / 100, invoiceData.currency)}</span>
                  </div>
                )}
                
                {invoiceData.hasTax && invoiceData.taxRate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm md:text-base font-semibold">Tax ({invoiceData.taxRate}%):</span>
                    <span className="text-sm md:text-base font-medium">{formatCurrency((invoiceData.subTotalAmount * invoiceData.taxRate) / 100, invoiceData.currency)}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between">
                    <span className="text-sm md:text-base font-semibold">Total:</span>
                    <span className="text-sm md:text-base font-bold">{formatCurrency(invoiceData.totalAmount, invoiceData.currency)}</span>
                  </div>
                </div>
              </div>
            </div>

                        {/* Payment Details */}
            {invoiceData.paymentDetails && (
              <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-none relative">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Payment Details
                </h3>
                <pre className="whitespace-pre-wrap text-xs bg-background p-2 rounded-none border">
                  {invoiceData.paymentDetails}
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyPaymentDetails}
                  className="absolute bottom-2 right-2 h-8 w-8 p-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Notes */}
            {invoiceData.notes && (
              <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
                <h3 className="font-semibold  mb-2">Notes</h3>
                <pre className="whitespace-pre-wrap text-xs bg-background p-2 rounded-none border">{invoiceData.notes}</pre>
              </div>
            )}

            {/* Download Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={async () => {
                  if (!invoiceData) return;
                  
                  try {
                    console.log('Invoice data for PDF:', invoiceData);
                    console.log('Invoice details:', invoiceData.invoiceDetails);
                    
                    const pdfData: InvoicePDFData = {
                      id: invoiceData.id,
                      invoiceNumber: invoiceData.invoiceNumber,
                      recepientEmail: null,
                      recepientName: invoiceData.customerName,
                      created_at: null,
                      paidOn: null,
                      dueDate: invoiceData.dueDate,
                      issueDate: invoiceData.issueDate,
                      state: invoiceData.state,
                      status: null,
                      totalAmount: invoiceData.totalAmount,
                      subTotalAmount: invoiceData.subTotalAmount,
                      currency: invoiceData.currency,
                      taxRate: invoiceData.taxRate,
                      vatRate: invoiceData.vatRate,
                      discount: invoiceData.discount,
                      hasDiscount: invoiceData.hasDiscount,
                      hasTax: invoiceData.hasTax,
                      hasVat: invoiceData.hasVat,
                      notes: invoiceData.notes,
                      organizationName: invoiceData.organizationName,
                      organizationLogo: null,
                      organizationLogoUrl: invoiceData.organizationLogoUrl,
                      organizationNameFromOrg: null,
                      organizationEmailFromOrg: null,
                      organizationEmail: invoiceData.organizationEmail,
                      invoiceDetails: invoiceData.invoiceDetails.map((detail, index) => ({
                        position: index + 1,
                        description: detail.description,
                        quantity: detail.quantity,
                        unitPrice: detail.unitPrice,
                        total: detail.total
                      }))
                    };
                    
                    const filename = invoiceData.invoiceNumber 
                      ? `${invoiceData.invoiceNumber}.pdf`
                      : `invoice-${invoiceData.id}.pdf`;
                    
                    await downloadInvoiceAsPDF(pdfData, filename);
                    toast.success("Invoice PDF downloaded successfully!");
                  } catch (error) {
                    console.error('Error downloading invoice PDF:', error);
                    toast.error("Failed to download invoice PDF");
                  }
                }}
                title="Download Invoice PDF"
                className=" space-x-3 flex items-center "
              >
                <HardDriveDownload className="w-4 h-4" />
                Download Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
