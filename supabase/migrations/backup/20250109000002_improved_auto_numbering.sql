-- Improved auto-numbering functions with better error handling and performance
-- This migration improves the previous auto-numbering system

-- Drop the previous functions and triggers
DROP TRIGGER IF EXISTS trigger_set_invoice_number ON invoices;
DROP TRIGGER IF EXISTS trigger_set_receipt_number ON receipts;
DROP FUNCTION IF EXISTS set_invoice_number();
DROP FUNCTION IF EXISTS set_receipt_number();
DROP FUNCTION IF EXISTS generate_invoice_number(UUID);
DROP FUNCTION IF EXISTS generate_receipt_number(UUID);

-- Improved function to generate the next invoice number for an organization
CREATE OR REPLACE FUNCTION generate_invoice_number(org_id UUID)
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    invoice_number TEXT;
    max_number INTEGER;
BEGIN
    -- Check if organizationId is provided
    IF org_id IS NULL THEN
        RAISE EXCEPTION 'organizationId is required to generate invoice number';
    END IF;
    
    -- Get the maximum invoice number for this organization
    SELECT COALESCE(MAX(
        CASE 
            WHEN "invoiceNumber" ~ '^INV-[0-9]+$' 
            THEN CAST(SUBSTRING("invoiceNumber" FROM 5) AS INTEGER)
            ELSE 0
        END
    ), 0)
    INTO max_number
    FROM invoices
    WHERE "organizationId" = org_id;
    
    -- Calculate next number
    next_number := max_number + 1;
    
    -- Format the number with leading zeros (4 digits)
    invoice_number := 'INV-' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN invoice_number;
EXCEPTION
    WHEN OTHERS THEN
        -- Fallback: use count-based approach
        SELECT COALESCE(COUNT(*), 0) + 1
        INTO next_number
        FROM invoices
        WHERE "organizationId" = org_id;
        
        invoice_number := 'INV-' || LPAD(next_number::TEXT, 4, '0');
        RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Improved function to generate the next receipt number for an organization
CREATE OR REPLACE FUNCTION generate_receipt_number(org_id UUID)
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    receipt_number TEXT;
    max_number INTEGER;
BEGIN
    -- Check if organizationId is provided
    IF org_id IS NULL THEN
        RAISE EXCEPTION 'organizationId is required to generate receipt number';
    END IF;
    
    -- Get the maximum receipt number for this organization
    SELECT COALESCE(MAX(
        CASE 
            WHEN "receiptNumber" ~ '^RCP-[0-9]+$' 
            THEN CAST(SUBSTRING("receiptNumber" FROM 5) AS INTEGER)
            ELSE 0
        END
    ), 0)
    INTO max_number
    FROM receipts
    WHERE "organizationId" = org_id;
    
    -- Calculate next number
    next_number := max_number + 1;
    
    -- Format the number with leading zeros (4 digits)
    receipt_number := 'RCP-' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN receipt_number;
EXCEPTION
    WHEN OTHERS THEN
        -- Fallback: use count-based approach
        SELECT COALESCE(COUNT(*), 0) + 1
        INTO next_number
        FROM receipts
        WHERE "organizationId" = org_id;
        
        receipt_number := 'RCP-' || LPAD(next_number::TEXT, 4, '0');
        RETURN receipt_number;
END;
$$ LANGUAGE plpgsql;

-- Improved trigger function for invoices
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set invoice number if it's not already provided and organizationId is present
    IF NEW."invoiceNumber" IS NULL AND NEW."organizationId" IS NOT NULL THEN
        NEW."invoiceNumber" := generate_invoice_number(NEW."organizationId");
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the insert
        RAISE WARNING 'Failed to generate invoice number: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Improved trigger function for receipts
CREATE OR REPLACE FUNCTION set_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set receipt number if it's not already provided and organizationId is present
    IF NEW."receiptNumber" IS NULL AND NEW."organizationId" IS NOT NULL THEN
        NEW."receiptNumber" := generate_receipt_number(NEW."organizationId");
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the insert
        RAISE WARNING 'Failed to generate receipt number: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for invoices
CREATE TRIGGER trigger_set_invoice_number
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_invoice_number();

-- Create triggers for receipts
CREATE TRIGGER trigger_set_receipt_number
    BEFORE INSERT ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION set_receipt_number();

-- Add additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_org_invoice_number ON invoices("organizationId", "invoiceNumber");
CREATE INDEX IF NOT EXISTS idx_receipts_org_receipt_number ON receipts("organizationId", "receiptNumber");

-- Create a function to manually regenerate numbers for existing records
CREATE OR REPLACE FUNCTION regenerate_invoice_numbers(org_id UUID)
RETURNS VOID AS $$
DECLARE
    invoice_record RECORD;
    new_number TEXT;
    counter INTEGER := 1;
BEGIN
    -- Update existing invoices for the organization
    FOR invoice_record IN 
        SELECT id, "invoiceNumber"
        FROM invoices 
        WHERE "organizationId" = org_id 
        ORDER BY created_at ASC
    LOOP
        new_number := 'INV-' || LPAD(counter::TEXT, 4, '0');
        
        UPDATE invoices 
        SET "invoiceNumber" = new_number
        WHERE id = invoice_record.id;
        
        counter := counter + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a function to manually regenerate receipt numbers for existing records
CREATE OR REPLACE FUNCTION regenerate_receipt_numbers(org_id UUID)
RETURNS VOID AS $$
DECLARE
    receipt_record RECORD;
    new_number TEXT;
    counter INTEGER := 1;
BEGIN
    -- Update existing receipts for the organization
    FOR receipt_record IN 
        SELECT id, "receiptNumber"
        FROM receipts 
        WHERE "organizationId" = org_id 
        ORDER BY created_at ASC
    LOOP
        new_number := 'RCP-' || LPAD(counter::TEXT, 4, '0');
        
        UPDATE receipts 
        SET "receiptNumber" = new_number
        WHERE id = receipt_record.id;
        
        counter := counter + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql; 