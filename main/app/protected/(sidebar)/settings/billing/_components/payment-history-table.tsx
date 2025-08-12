"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Receipt, Loader2 } from "lucide-react";
import Pagination from "@/components/pagination";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  description: string;
  type: "payment_intent" | "invoice";
  invoice_pdf?: string | null;
  plan_name?: string;
}

interface PaymentHistoryResponse {
  payments: Payment[];
  has_more: boolean;
}

export default function PaymentHistoryTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, error } = useQuery<PaymentHistoryResponse>({
    queryKey: ["payment-history", currentPage, pageSize],
    queryFn: async () => {
      const response = await axios.get("/api/billing/payment-history", {
        params: {
          limit: pageSize,
          // For pagination, we'd need to implement cursor-based pagination with Stripe
        },
      });
      return response.data;
    },
  });

  const payments = data?.payments || [];

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      succeeded: "bg-green-500",
      paid: "bg-green-500",
      processing: "bg-yellow-500",
      requires_payment_method: "bg-red-500",
      requires_confirmation: "bg-yellow-500",
      requires_action: "bg-yellow-500",
      canceled: "bg-gray-500",
      failed: "bg-red-500",
    };

    return (
      <Badge className={`${statusColors[status as keyof typeof statusColors] || "bg-gray-500"} text-white`}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const totalPages = Math.ceil(payments.length / pageSize);
  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return payments.slice(startIndex, startIndex + pageSize);
  }, [payments, currentPage, pageSize]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">Loading payment history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load payment history</p>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-12">
        <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No payment history</h3>
        <p className="text-gray-600">Your payment history will appear here once you make your first payment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-none border">
        <Table>
          <TableHeader className="bg-bexoni/10 hover:bg-bexoni/10">
            <TableRow>
              <TableHead className="text-primary">Date</TableHead>
              <TableHead className="text-primary">Description</TableHead>
              <TableHead className="text-primary">Amount</TableHead>
              <TableHead className="text-primary">Status</TableHead>
              <TableHead className="text-primary">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  {format(new Date(payment.created * 1000), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{payment.description}</div>
                    {payment.plan_name && (
                      <div className="text-sm text-gray-500">{payment.plan_name}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {formatAmount(payment.amount, payment.currency)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(payment.status)}
                </TableCell>
                <TableCell>
                  {payment.type === "invoice" && payment.invoice_pdf && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(payment.invoice_pdf!, "_blank")}
                      className="h-8 px-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">View invoice</span>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={payments.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        itemName="payments"
      />
    </div>
  );
}
