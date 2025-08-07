-- Auto-numbering functions and triggers for invoices and receipts
-- This migration adds functions to automatically generate sequential numbers
-- for invoices (INV-0001, INV-0002, etc.) and receipts (RCP-0001, RCP-0002, etc.)
-- based on the organization's existing count

-- Function to generate the next invoice number for an organization
CREATE OR REPLACE FUNCTION generate_invoice_number(org_id UUID)
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    invoice_number TEXT;
BEGIN
    -- Get the count of existing invoices for this organization
    SELECT COALESCE(COUNT(*), 0) + 1
    INTO next_number
    FROM invoices
    WHERE "organizationId" = org_id;
    
    -- Format the number with leading zeros (4 digits)
    invoice_number := 'INV-' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate the next receipt number for an organization
CREATE OR REPLACE FUNCTION generate_receipt_number(org_id UUID)
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    receipt_number TEXT;
BEGIN
    -- Get the count of existing receipts for this organization
    SELECT COALESCE(COUNT(*), 0) + 1
    INTO next_number
    FROM receipts
    WHERE "organizationId" = org_id;
    
    -- Format the number with leading zeros (4 digits)
    receipt_number := 'RCP-' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN receipt_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for invoices
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set invoice number if it's not already provided and organizationId is present
    IF NEW."invoiceNumber" IS NULL AND NEW."organizationId" IS NOT NULL THEN
        NEW."invoiceNumber" := generate_invoice_number(NEW."organizationId");
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for receipts
CREATE OR REPLACE FUNCTION set_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set receipt number if it's not already provided and organizationId is present
    IF NEW."receiptNumber" IS NULL AND NEW."organizationId" IS NOT NULL THEN
        NEW."receiptNumber" := generate_receipt_number(NEW."organizationId");
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for invoices
DROP TRIGGER IF EXISTS trigger_set_invoice_number ON invoices;
CREATE TRIGGER trigger_set_invoice_number
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_invoice_number();

-- Create triggers for receipts
DROP TRIGGER IF EXISTS trigger_set_receipt_number ON receipts;
CREATE TRIGGER trigger_set_receipt_number
    BEFORE INSERT ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION set_receipt_number();

-- Add indexes to improve performance for counting
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON invoices("organizationId");
CREATE INDEX IF NOT EXISTS idx_receipts_organization_id ON receipts("organizationId"); 