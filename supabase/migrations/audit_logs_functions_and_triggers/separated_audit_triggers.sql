-- =================================================================
-- SEPARATED AUDIT TRIGGERS FOR BETTER MAINTAINABILITY
-- =================================================================
-- This file contains individual trigger functions for each table
-- to avoid field validation conflicts and improve maintainability
-- =================================================================

-- =================================================================
-- CUSTOMERS AUDIT TRIGGER
-- =================================================================
CREATE OR REPLACE FUNCTION audit_log_customers_trigger() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (
            "tableName", "recordId", "createdBy", "action", "oldData", "newData", "changeSummary", "changedOn"
        )
        VALUES (
            'customers', NEW.id, NEW."createdBy", 'insert', NULL, row_to_json(NEW), NULL, NOW()
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (
            "tableName", "recordId", "createdBy", "action", "oldData", "newData", "changeSummary", "changedOn"
        )
        VALUES (
            'customers', NEW.id, NEW."createdBy", 'update', row_to_json(OLD), row_to_json(NEW),
            jsonb_build_object(
                'name', jsonb_build_object('old_value', OLD."name", 'new_value', NEW."name"),
                'email', jsonb_build_object('old_value', OLD."email", 'new_value', NEW."email"),
                'phone', jsonb_build_object('old_value', OLD."phone", 'new_value', NEW."phone"),
                'website', jsonb_build_object('old_value', OLD."website", 'new_value', NEW."website"),
                'contactPerson', jsonb_build_object('old_value', OLD."contactPerson", 'new_value', NEW."contactPerson"),
                'addressLine1', jsonb_build_object('old_value', OLD."addressLine1", 'new_value', NEW."addressLine1"),
                'unitNumber', jsonb_build_object('old_value', OLD."unitNumber", 'new_value', NEW."unitNumber"),
                'city', jsonb_build_object('old_value', OLD."city", 'new_value', NEW."city"),
                'state', jsonb_build_object('old_value', OLD."state", 'new_value', NEW."state"),
                'postalCode', jsonb_build_object('old_value', OLD."postalCode", 'new_value', NEW."postalCode"),
                'country', jsonb_build_object('old_value', OLD."country", 'new_value', NEW."country"),
                'taxId', jsonb_build_object('old_value', OLD."taxId", 'new_value', NEW."taxId"),
                'notes', jsonb_build_object('old_value', OLD."notes", 'new_value', NEW."notes")
            ),
            NOW()
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (
            "tableName", "recordId", "createdBy", "action", "oldData", "newData", "changeSummary", "changedOn"
        )
        VALUES (
            'customers', OLD.id, OLD."createdBy", 'delete', row_to_json(OLD), NULL, NULL, NOW()
        );
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- INVOICES AUDIT TRIGGER
-- =================================================================
CREATE OR REPLACE FUNCTION audit_log_invoices_trigger() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (
            "tableName", "recordId", "createdBy", "action", "oldData", "newData", "changeSummary", "changedOn"
        )
        VALUES (
            'invoices', NEW.id, NEW."createdBy", 'insert', NULL, row_to_json(NEW), NULL, NOW()
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (
            "tableName", "recordId", "createdBy", "action", "oldData", "newData", "changeSummary", "changedOn"
        )
        VALUES (
            'invoices', NEW.id, NEW."createdBy", 'update', row_to_json(OLD), row_to_json(NEW),
            jsonb_build_object(
                'status', jsonb_build_object('old_value', OLD."status", 'new_value', NEW."status"),
                'totalAmount', jsonb_build_object('old_value', OLD."totalAmount", 'new_value', NEW."totalAmount"),
                'dueDate', jsonb_build_object('old_value', OLD."dueDate", 'new_value', NEW."dueDate"),
                'paidOn', jsonb_build_object('old_value', OLD."paidOn", 'new_value', NEW."paidOn"),
                'invoiceNumber', jsonb_build_object('old_value', OLD."invoiceNumber", 'new_value', NEW."invoiceNumber"),
                'customerId', jsonb_build_object('old_value', OLD."customerId", 'new_value', NEW."customerId")
            ),
            NOW()
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (
            "tableName", "recordId", "createdBy", "action", "oldData", "newData", "changeSummary", "changedOn"
        )
        VALUES (
            'invoices', OLD.id, OLD."createdBy", 'delete', row_to_json(OLD), NULL, NULL, NOW()
        );
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- RECEIPTS AUDIT TRIGGER
-- =================================================================
CREATE OR REPLACE FUNCTION audit_log_receipts_trigger() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (
            "tableName", "recordId", "createdBy", "action", "oldData", "newData", "changeSummary", "changedOn"
        )
        VALUES (
            'receipts', NEW.id, NEW."createdBy", 'insert', NULL, row_to_json(NEW), NULL, NOW()
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (
            "tableName", "recordId", "createdBy", "action", "oldData", "newData", "changeSummary", "changedOn"
        )
        VALUES (
            'receipts', NEW.id, NEW."createdBy", 'update', row_to_json(OLD), row_to_json(NEW),
            jsonb_build_object(
                'status', jsonb_build_object('old_value', OLD."status", 'new_value', NEW."status"),
                'totalamount', jsonb_build_object('old_value', OLD."totalamount", 'new_value', NEW."totalamount"),
                'issueDate', jsonb_build_object('old_value', OLD."issueDate", 'new_value', NEW."issueDate"),
                'receiptNumber', jsonb_build_object('old_value', OLD."receiptNumber", 'new_value', NEW."receiptNumber"),
                'customerId', jsonb_build_object('old_value', OLD."customerId", 'new_value', NEW."customerId"),
                'invoiceId', jsonb_build_object('old_value', OLD."invoiceId", 'new_value', NEW."invoiceId")
            ),
            NOW()
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (
            "tableName", "recordId", "createdBy", "action", "oldData", "newData", "changeSummary", "changedOn"
        )
        VALUES (
            'receipts', OLD.id, OLD."createdBy", 'delete', row_to_json(OLD), NULL, NULL, NOW()
        );
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- PROJECTS AUDIT TRIGGER
-- =================================================================
CREATE OR REPLACE FUNCTION audit_log_projects_trigger() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (
            "tableName", "recordId", "createdBy", "action", "oldData", "newData", "changeSummary", "changedOn"
        )
        VALUES (
            'projects', NEW.id, NEW."createdBy", 'insert', NULL, row_to_json(NEW), NULL, NOW()
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (
            "tableName", "recordId", "createdBy", "action", "oldData", "newData", "changeSummary", "changedOn"
        )
        VALUES (
            'projects', NEW.id, NEW."createdBy", 'update', row_to_json(OLD), row_to_json(NEW),
            jsonb_build_object(
                'name', jsonb_build_object('old_value', OLD."name", 'new_value', NEW."name"),
                'status', jsonb_build_object('old_value', OLD."status", 'new_value', NEW."status"),
                'startDate', jsonb_build_object('old_value', OLD."startDate", 'new_value', NEW."startDate"),
                'endDate', jsonb_build_object('old_value', OLD."endDate", 'new_value', NEW."endDate"),
                'budget', jsonb_build_object('old_value', OLD."budget", 'new_value', NEW."budget"),
                'customerId', jsonb_build_object('old_value', OLD."customerId", 'new_value', NEW."customerId"),
                'isPublished', jsonb_build_object('old_value', OLD."isPublished", 'new_value', NEW."isPublished")
            ),
            NOW()
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (
            "tableName", "recordId", "createdBy", "action", "oldData", "newData", "changeSummary", "changedOn"
        )
        VALUES (
            'projects', OLD.id, OLD."createdBy", 'delete', row_to_json(OLD), NULL, NULL, NOW()
        );
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- FEEDBACKS AUDIT TRIGGER
-- =================================================================
CREATE OR REPLACE FUNCTION audit_log_feedbacks_trigger() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (
            "tableName", "recordId", "createdBy", "action", "oldData", "newData", "changeSummary", "changedOn"
        )
        VALUES (
            'feedbacks', NEW.id::text, NEW."createdBy", 'insert', NULL, row_to_json(NEW), NULL, NOW()
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (
            "tableName", "recordId", "createdBy", "action", "oldData", "newData", "changeSummary", "changedOn"
        )
        VALUES (
            'feedbacks', NEW.id::text, NEW."createdBy", 'update', row_to_json(OLD), row_to_json(NEW),
            jsonb_build_object(
                'state', jsonb_build_object('old_value', OLD."state", 'new_value', NEW."state"),
                'answers', jsonb_build_object('old_value', OLD."answers", 'new_value', NEW."answers"),
                'filledOn', jsonb_build_object('old_value', OLD."filledOn", 'new_value', NEW."filledOn"),
                'customerId', jsonb_build_object('old_value', OLD."customerId", 'new_value', NEW."customerId"),
                'projectId', jsonb_build_object('old_value', OLD."projectId", 'new_value', NEW."projectId")
            ),
            NOW()
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (
            "tableName", "recordId", "createdBy", "action", "oldData", "newData", "changeSummary", "changedOn"
        )
        VALUES (
            'feedbacks', OLD.id::text, OLD."createdBy", 'delete', row_to_json(OLD), NULL, NULL, NOW()
        );
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- DROP EXISTING TRIGGERS TO AVOID CONFLICTS
-- =================================================================
DROP TRIGGER IF EXISTS audit_log_customers_trigger ON customers;
DROP TRIGGER IF EXISTS audit_log_invoices_trigger ON invoices;
DROP TRIGGER IF EXISTS audit_log_receipts_trigger ON receipts;
DROP TRIGGER IF EXISTS audit_log_projects_trigger ON projects;
DROP TRIGGER IF EXISTS audit_log_feedbacks_trigger ON feedbacks;

-- =================================================================
-- CREATE NEW SEPARATED TRIGGERS
-- =================================================================
CREATE TRIGGER audit_log_customers_trigger
    AFTER INSERT OR UPDATE OR DELETE ON customers
    FOR EACH ROW EXECUTE FUNCTION audit_log_customers_trigger();

CREATE TRIGGER audit_log_invoices_trigger
    AFTER INSERT OR UPDATE OR DELETE ON invoices
    FOR EACH ROW EXECUTE FUNCTION audit_log_invoices_trigger();

CREATE TRIGGER audit_log_receipts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON receipts
    FOR EACH ROW EXECUTE FUNCTION audit_log_receipts_trigger();

CREATE TRIGGER audit_log_projects_trigger
    AFTER INSERT OR UPDATE OR DELETE ON projects
    FOR EACH ROW EXECUTE FUNCTION audit_log_projects_trigger();

CREATE TRIGGER audit_log_feedbacks_trigger
    AFTER INSERT OR UPDATE OR DELETE ON feedbacks
    FOR EACH ROW EXECUTE FUNCTION audit_log_feedbacks_trigger();

-- =================================================================
-- VERIFICATION QUERIES (OPTIONAL - FOR TESTING)
-- =================================================================
-- You can run these queries to verify the triggers are working:

-- Test customer update (replace with actual customer ID):
-- UPDATE customers SET name = 'Test Update' WHERE id = 'your-customer-id';

-- Check audit log:
-- SELECT * FROM audit_log WHERE "tableName" = 'customers' ORDER BY "changedOn" DESC LIMIT 5; 