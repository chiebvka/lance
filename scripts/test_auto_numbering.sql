-- Test script for auto-numbering functions
-- This script demonstrates how the invoice and receipt numbering system works

-- Test data setup (assuming you have test organizations)
-- Replace these UUIDs with actual organization IDs from your database

-- Test 1: Insert invoices for organization 1
INSERT INTO invoices (
    "organizationId",
    "customerId",
    "currency",
    "totalAmount",
    "status"
) VALUES 
    ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'USD', 100.00, 'draft'),
    ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'USD', 200.00, 'draft'),
    ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'USD', 300.00, 'draft');

-- Test 2: Insert invoices for organization 2
INSERT INTO invoices (
    "organizationId",
    "customerId",
    "currency",
    "totalAmount",
    "status"
) VALUES 
    ('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'EUR', 150.00, 'draft'),
    ('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'EUR', 250.00, 'draft');

-- Test 3: Insert receipts for organization 1
INSERT INTO receipts (
    "organizationId",
    "customerId",
    "currency",
    "totalamount",
    "status"
) VALUES 
    ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'USD', 100.00, 'paid'),
    ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'USD', 200.00, 'paid');

-- Test 4: Insert receipts for organization 2
INSERT INTO receipts (
    "organizationId",
    "customerId",
    "currency",
    "totalamount",
    "status"
) VALUES 
    ('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'EUR', 150.00, 'paid');

-- View the results
SELECT 
    'Invoice' as type,
    "invoiceNumber" as number,
    "organizationId",
    "totalAmount",
    "status"
FROM invoices 
WHERE "organizationId" IN ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333')
ORDER BY "organizationId", "invoiceNumber";

SELECT 
    'Receipt' as type,
    "receiptNumber" as number,
    "organizationId",
    "totalamount",
    "status"
FROM receipts 
WHERE "organizationId" IN ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333')
ORDER BY "organizationId", "receiptNumber";

-- Test the manual regeneration functions
-- SELECT regenerate_invoice_numbers('11111111-1111-1111-1111-111111111111');
-- SELECT regenerate_receipt_numbers('11111111-1111-1111-1111-111111111111'); 