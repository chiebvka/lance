"use client"

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatDistanceToNow, isPast } from 'date-fns';
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, Calendar, Clock, AlertCircle, HardDriveDownload, FileText, DollarSign, Receipt, Copy, Ban, SquareDashedKanban, Ungroup } from "lucide-react";
import { toast } from "sonner";
import { downloadReceiptAsPDF, ReceiptPDFData } from '@/utils/receipt-pdf';
import SubscriptionNotice from "@/app/(previews)/_components/SubscriptionNotice";

interface ReceiptDetail {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ReceiptData {
  id: string;
  receiptNumber: string;
  state: string;
  issueDate: string;
  paymentConfirmedAt: string;
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
  receiptDetails: ReceiptDetail[];
//   paymentDetails: string;
  notes: string;
  organizationLogoUrl: string | null;
  organizationName: string;
  organizationEmail: string | null;
}

interface ReceiptPreviewProps {
  receiptId: string;
}

export default function ReceiptPreview({ receiptId }: ReceiptPreviewProps) {
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);


  useEffect(() => {
    fetchReceiptData();
  }, [receiptId]);

  const fetchReceiptData = async () => {
    try {
      const response = await axios.get(`/api/receipts/preview/${receiptId}`);
      if (response.data.success) {
        setReceiptData(response.data.data);
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
      setIsLoading(false);
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

  if (isLoading) {
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

  if (!receiptData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Invoice not found</h1>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen  md:p-6">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-xl min-h-screen shadow-black/10 border-0 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-bexoni/60 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center md:gap-3 gap-1">
                {receiptData.organizationLogoUrl ? (
                  <img
                    src={receiptData.organizationLogoUrl}
                    alt={receiptData.organizationName}
                    className="md:w-12 md:h-12 w-8 h-8 rounded-lg bg-white/20 p-2 object-contain"
                  />
                ) : (
                  <div className="md:w-12 md:h-12 w-8 h-8 rounded-none bg-white/20 p-2 flex items-center justify-center">
                    <Building2 className="w-8 h-8" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-xs md:text-base">{receiptData.organizationName}</h3>
                  <p className="text-blue-100 text-xs md:text-sm">Receipt</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${getStateColor(receiptData.state)} text-xs md:text-sm`}>
                  {getStateIcon(receiptData.state)}
                  <span className="ml-1 capitalize">{receiptData.state}</span>
                </Badge>
                {receiptData.paymentConfirmedAt && (
                  <Badge variant="secondary" className={`bg-white/20 text-white border-white/30 text-xs md:text-sm`}>
                     <Calendar className="w-4 h-4 mr-1" />
                    Paid on: {new Date(receiptData.paymentConfirmedAt).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </div>
            <h1 className="md:text-3xl text-xl font-bold">Receipt #{receiptData.receiptNumber}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Issue Date: {new Date(receiptData.issueDate).toLocaleDateString()}</span>
              </div>
              {receiptData.paymentConfirmedAt && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Payment Date: {new Date(receiptData.paymentConfirmedAt).toLocaleDateString()}</span>
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
                  <p className="font-medium">{receiptData.organizationName}</p>
                  {/* {invoiceData.organizationEmail && (
                    <p className="text-gray-600 text-sm">{invoiceData.organizationEmail}</p>
                  )} */}
                </div>
              </div>
              <div>
                <h3 className="font-semibold  mb-2">To:</h3>
                <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-none border border-gray-200">
                  <p className="font-medium">{receiptData.customerName}</p>
                </div>
              </div>
            </div>

            {/* Invoice Items */}
            {receiptData.receiptDetails && receiptData.receiptDetails.length > 0 && (
              <div>
                <h3 className="font-semibold  mb-4">Invoice Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium ">Description</th>
                        <th className="text-right py-3 px-4 font-medium ">Quantity</th>
                        <th className="text-right py-3 px-4 font-medium ">Price</th>
                        <th className="text-right py-3 px-4 font-medium ">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                       {receiptData.receiptDetails.map((item, index) => (
                         <tr key={index} className="border-b border-gray-100">
                           <td className="py-3 px-4">{item.description}</td>
                           <td className="py-3 px-4 text-right">{item.quantity}</td>
                           <td className="py-3 px-4 text-right">{formatCurrency(item.unitPrice, receiptData.currency)}</td>
                           <td className="py-3 px-4 text-right font-medium">{formatCurrency(item.total, receiptData.currency)}</td>
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
                  <span className="">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(receiptData.subTotalAmount, receiptData.currency)}</span>
                </div>
                
                {receiptData.hasDiscount && receiptData.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="">Discount ({receiptData.discount}%):</span>
                    <span className="font-medium text-green-600">-{formatCurrency((receiptData.subTotalAmount * receiptData.discount) / 100, receiptData.currency)}</span>
                  </div>
                )}
                
                {receiptData.hasVat && receiptData.vatRate > 0 && (
                  <div className="flex justify-between">
                    <span className="">VAT ({receiptData.vatRate}%):</span>
                    <span className="font-medium">{formatCurrency((receiptData.subTotalAmount * receiptData.vatRate) / 100, receiptData.currency)}</span>
                  </div>
                )}
                
                {receiptData.hasTax && receiptData.taxRate > 0 && (
                  <div className="flex justify-between">
                    <span className="">Tax ({receiptData.taxRate}%):</span>
                    <span className="font-medium">{formatCurrency((receiptData.subTotalAmount * receiptData.taxRate) / 100, receiptData.currency)}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-lg font-bold">{formatCurrency(receiptData.totalAmount, receiptData.currency)}</span>
                  </div>
                </div>
              </div>
            </div>



            {/* Notes */}
            {receiptData.notes && (
              <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
                <h3 className="font-semibold  mb-2">Notes</h3>
                <pre className="whitespace-pre-wrap text-xs bg-background p-2 rounded-none border">{receiptData.notes}</pre>
              </div>
            )}

            {/* Download Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={async () => {
                  if (!receiptData) return;
                  
                  try {
                    console.log('Receipt data for PDF:', receiptData);
                    console.log('Receipt details:', receiptData.receiptDetails);
                    
                    const pdfData: ReceiptPDFData = {
                      id: receiptData.id,
                      receiptNumber: receiptData.receiptNumber,
                      recepientEmail: null,
                      recepientName: receiptData.customerName,
                      created_at: null,
                      paymentConfirmedAt: receiptData.paymentConfirmedAt,
                      issueDate: receiptData.issueDate,
                      state: receiptData.state,
        
                      totalAmount: receiptData.totalAmount,
                      subTotalAmount: receiptData.subTotalAmount,
                      currency: receiptData.currency,
                      taxRate: receiptData.taxRate,
                      vatRate: receiptData.vatRate,
                      discount: receiptData.discount,
                      hasDiscount: receiptData.hasDiscount,
                      hasTax: receiptData.hasTax,
                      hasVat: receiptData.hasVat,
                      notes: receiptData.notes,
                      organizationName: receiptData.organizationName,
                      organizationLogo: null,
                      organizationLogoUrl: receiptData.organizationLogoUrl,
                      organizationNameFromOrg: null,
                      organizationEmailFromOrg: null,
                      organizationEmail: receiptData.organizationEmail,
                      receiptDetails: receiptData.receiptDetails.map((detail, index) => ({
                        position: index + 1,
                        description: detail.description,
                        quantity: detail.quantity,
                        unitPrice: detail.unitPrice,
                        total: detail.total
                      }))
                    };
                    
                    const filename = receiptData.receiptNumber 
                      ? `${receiptData.receiptNumber}.pdf`
                      : `receipt-${receiptData.id}.pdf`;
                    
                    await downloadReceiptAsPDF(pdfData, filename);
                    toast.success("Receipt PDF downloaded successfully!");
                  } catch (error) {
                    console.error('Error downloading receipt PDF:', error);
                    toast.error("Failed to download receipt PDF");
                  }
                }}
                title="Download Receipt PDF"
                className=" space-x-3 flex items-center "
              >
                <HardDriveDownload className="w-4 h-4" />
                Download Receipt
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}