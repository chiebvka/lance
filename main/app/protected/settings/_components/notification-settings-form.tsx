"use client"
import SettingsSwitch from '@/components/settings/settings-switch';
import { useState } from 'react';

export default function NotificationSettingsForm() {
  const [invoiceOverdue, setInvoiceOverdue] = useState(true);
  const [invoicePaid, setInvoicePaid] = useState(true);
  const [transactions, setTransactions] = useState(true);
  const [savingInvoiceOverdue, setSavingInvoiceOverdue] = useState(false);
  const [savingInvoicePaid, setSavingInvoicePaid] = useState(false);
  const [savingTransactions, setSavingTransactions] = useState(false);

  const handleSaveInvoiceOverdue = async () => {
    setSavingInvoiceOverdue(true);
    // TODO: Implement save logic
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSavingInvoiceOverdue(false);
  };

  const handleSaveInvoicePaid = async () => {
    setSavingInvoicePaid(true);
    // TODO: Implement save logic
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSavingInvoicePaid(false);
  };

  const handleSaveTransactions = async () => {
    setSavingTransactions(true);
    // TODO: Implement save logic
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSavingTransactions(false);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Email Notifications</h2>
          <p className="text-sm text-gray-600">Manage your personal notification settings for this team.</p>
        </div>
        
        <div className="space-y-0">
          <SettingsSwitch
            label="Invoice Overdue"
            description="Receive notifications about overdue invoices."
            value={invoiceOverdue}
            onChange={setInvoiceOverdue}
            onSave={handleSaveInvoiceOverdue}
            loading={savingInvoiceOverdue}
          />
          
          <SettingsSwitch
            label="Invoice Paid"
            description="Receive notifications about paid invoices."
            value={invoicePaid}
            onChange={setInvoicePaid}
            onSave={handleSaveInvoicePaid}
            loading={savingInvoicePaid}
          />
          
          <SettingsSwitch
            label="Transactions"
            description="Receive notifications about new transactions."
            value={transactions}
            onChange={setTransactions}
            onSave={handleSaveTransactions}
            loading={savingTransactions}
          />
        </div>
      </div>
    </div>
  );
} 