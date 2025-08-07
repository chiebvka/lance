# Auto-Numbering System for Invoices and Receipts

This system automatically generates sequential invoice and receipt numbers for each organization in your application.

## Overview

The auto-numbering system provides:
- **Invoice numbers**: `INV-0001`, `INV-0002`, `INV-0003`, etc.
- **Receipt numbers**: `RCP-0001`, `RCP-0002`, `RCP-0003`, etc.

Each organization gets its own sequential numbering, so Organization A might have `INV-0001` while Organization B also starts with `INV-0001`.

## How It Works

### Automatic Numbering
When you insert a new invoice or receipt with a `organizationId` but no `invoiceNumber` or `receiptNumber`, the system automatically generates the next sequential number for that organization.

### Database Functions

#### `generate_invoice_number(org_id UUID)`
- Generates the next invoice number for a specific organization
- Uses pattern matching to find the highest existing number
- Falls back to count-based approach if needed
- Returns format: `INV-XXXX` (where XXXX is a 4-digit number)

#### `generate_receipt_number(org_id UUID)`
- Generates the next receipt number for a specific organization
- Uses pattern matching to find the highest existing number
- Falls back to count-based approach if needed
- Returns format: `RCP-XXXX` (where XXXX is a 4-digit number)

### Database Triggers

#### Invoice Trigger
- **Table**: `invoices`
- **Trigger**: `trigger_set_invoice_number`
- **When**: `BEFORE INSERT`
- **Action**: Automatically sets `invoiceNumber` if it's NULL and `organizationId` is provided

#### Receipt Trigger
- **Table**: `receipts`
- **Trigger**: `trigger_set_receipt_number`
- **When**: `BEFORE INSERT`
- **Action**: Automatically sets `receiptNumber` if it's NULL and `organizationId` is provided

## Usage Examples

### Creating an Invoice
```sql
-- The invoiceNumber will be automatically generated
INSERT INTO invoices (
    "organizationId",
    "customerId",
    "currency",
    "totalAmount",
    "status"
) VALUES (
    'your-org-id',
    'customer-id',
    'USD',
    100.00,
    'draft'
);
-- Result: invoiceNumber = 'INV-0001' (or next available number)
```

### Creating a Receipt
```sql
-- The receiptNumber will be automatically generated
INSERT INTO receipts (
    "organizationId",
    "customerId",
    "currency",
    "totalamount",
    "status"
) VALUES (
    'your-org-id',
    'customer-id',
    'USD',
    100.00,
    'paid'
);
-- Result: receiptNumber = 'RCP-0001' (or next available number)
```

### Manual Number Generation
If you need to generate a number manually (e.g., in your application code):

```sql
-- Generate next invoice number for an organization
SELECT generate_invoice_number('your-org-id');

-- Generate next receipt number for an organization
SELECT generate_receipt_number('your-org-id');
```

## Manual Regeneration

If you need to regenerate numbers for existing records (e.g., after data cleanup):

### Regenerate Invoice Numbers
```sql
-- Regenerate all invoice numbers for an organization
SELECT regenerate_invoice_numbers('your-org-id');
```

### Regenerate Receipt Numbers
```sql
-- Regenerate all receipt numbers for an organization
SELECT regenerate_receipt_numbers('your-org-id');
```

## Error Handling

The system includes robust error handling:
- **Missing organizationId**: Raises an exception
- **Invalid number format**: Falls back to count-based approach
- **Database errors**: Logs warnings but doesn't fail the insert
- **Concurrent inserts**: Uses database-level locking to prevent duplicates

## Performance Considerations

### Indexes
The system includes optimized indexes:
- `idx_invoices_organization_id` on `invoices("organizationId")`
- `idx_receipts_organization_id` on `receipts("organizationId")`
- `idx_invoices_org_invoice_number` on `invoices("organizationId", "invoiceNumber")`
- `idx_receipts_org_receipt_number` on `receipts("organizationId", "receiptNumber")`

### Number Generation Strategy
1. **Primary**: Pattern matching to find the highest existing number
2. **Fallback**: Count-based approach if pattern matching fails
3. **Error handling**: Graceful degradation with warnings

## Migration Files

The system is implemented through two migration files:
1. `20250101000000_auto_numbering_functions.sql` - Basic implementation
2. `20250101000001_improved_auto_numbering.sql` - Improved version with better error handling

## Testing

Use the test script `scripts/test_auto_numbering.sql` to verify the system works correctly:

```bash
# Run the test script
psql -d your_database -f scripts/test_auto_numbering.sql
```

## Integration with Application

### Next.js/TypeScript Integration
When creating invoices or receipts in your application, simply omit the `invoiceNumber` or `receiptNumber` fields:

```typescript
// Create invoice without specifying invoiceNumber
const newInvoice = await supabase
  .from('invoices')
  .insert({
    organizationId: 'your-org-id',
    customerId: 'customer-id',
    currency: 'USD',
    totalAmount: 100.00,
    status: 'draft'
    // invoiceNumber will be auto-generated
  });

// Create receipt without specifying receiptNumber
const newReceipt = await supabase
  .from('receipts')
  .insert({
    organizationId: 'your-org-id',
    customerId: 'customer-id',
    currency: 'USD',
    totalamount: 100.00,
    status: 'paid'
    // receiptNumber will be auto-generated
  });
```

## Troubleshooting

### Common Issues

1. **Numbers not generating**: Ensure `organizationId` is provided
2. **Duplicate numbers**: Check for concurrent inserts or data corruption
3. **Performance issues**: Verify indexes are created properly
4. **Invalid format**: Use regeneration functions to fix existing data

### Debugging

Enable PostgreSQL logging to see trigger execution:
```sql
-- Enable trigger logging
SET log_statement = 'all';
SET log_min_messages = 'notice';
```

## Security Considerations

- The system respects Row Level Security (RLS) policies
- Only users with appropriate permissions can insert records
- Number generation is isolated per organization
- No cross-organization data leakage

## Future Enhancements

Potential improvements:
- Custom number prefixes per organization
- Year-based numbering (e.g., `INV-2024-0001`)
- Configurable number formats
- Audit logging for number generation
- Bulk number generation for imports 