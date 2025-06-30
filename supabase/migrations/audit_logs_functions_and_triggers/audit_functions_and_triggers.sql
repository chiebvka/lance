-- CREATE OR REPLACE FUNCTION get_organization_id(row record) RETURNS UUID AS $$
-- BEGIN
--     IF row."organizationId" IS NOT NULL THEN
--         RETURN row."organizationId";
--     ELSE
--         RETURN NULL;
--     END IF;
-- END;
-- $$ LANGUAGE plpgsql;



-- CREATE OR REPLACE FUNCTION audit_log_trigger() RETURNS TRIGGER AS $$
-- BEGIN
--     IF TG_OP = 'INSERT' THEN
--         INSERT INTO audit_log (
--             "tableName", "recordId", "createdBy", "organizationId", "action", "oldData", "newData", "changeSummary", "changedOn"
--         )
--         VALUES (
--             TG_TABLE_NAME, NEW.id, NEW."createdBy", get_organization_id(NEW), 'insert', NULL, row_to_json(NEW), NULL, NOW()
--         );
--     ELSIF TG_OP = 'UPDATE' THEN
--         INSERT INTO audit_log (
--             "tableName", "recordId", "createdBy", "organizationId", "action", "oldData", "newData", "changeSummary", "changedOn"
--         )
--         VALUES (
--             TG_TABLE_NAME, NEW.id, NEW."createdBy", get_organization_id(NEW), 'update', row_to_json(OLD), row_to_json(NEW),
--             CASE TG_TABLE_NAME
--                 WHEN 'invoices' THEN jsonb_build_object(
--                     'status', jsonb_build_object('old_value', OLD."status", 'new_value', NEW."status"),
--                     'totalAmount', jsonb_build_object('old_value', OLD."totalAmount", 'new_value', NEW."totalAmount"),
--                     'dueDate', jsonb_build_object('old_value', OLD."dueDate", 'new_value', NEW."dueDate")
--                 )
--                 WHEN 'receipts' THEN jsonb_build_object(
--                     'status', jsonb_build_object('old_value', OLD."status", 'new_value', NEW."status"),
--                     'totalamount', jsonb_build_object('old_value', OLD."totalamount", 'new_value', NEW."totalamount"),
--                     'issueDate', jsonb_build_object('old_value', OLD."issueDate", 'new_value', NEW."issueDate")
--                 )
--                 WHEN 'feedbacks' THEN jsonb_build_object(
--                     'state', jsonb_build_object('old_value', OLD."state", 'new_value', NEW."state")
--                 )
--                 WHEN 'projects' THEN jsonb_build_object(
--                     'startDate', jsonb_build_object('old_value', OLD."startDate", 'new_value', NEW."startDate"),
--                     'endDate', jsonb_build_object('old_value', OLD."endDate", 'new_value', NEW."endDate")
--                 )
--                 WHEN 'customers' THEN jsonb_build_object(
--                     'name', jsonb_build_object('old_value', OLD."name", 'new_value', NEW."name"),
--                     'email', jsonb_build_object('old_value', OLD."email", 'new_value', NEW."email")
--                 )
--                 ELSE NULL
--             END,
--             NOW()
--         );
--     ELSIF TG_OP = 'DELETE' THEN
--         INSERT INTO audit_log (
--             "tableName", "recordId", "createdBy", "organizationId", "action", "oldData", "newData", "changeSummary", "changedOn"
--         )
--         VALUES (
--             TG_TABLE_NAME, OLD.id, OLD."createdBy", get_organization_id(OLD), 'delete', row_to_json(OLD), NULL, NULL, NOW()
--         );
--     END IF;
--     RETURN NULL;
-- END;
-- $$ LANGUAGE plpgsql;



-- Ranking number 1
CREATE OR REPLACE FUNCTION audit_log_trigger() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (
            "tableName", "recordId", "createdBy", "action", "oldData", "newData", "changeSummary", "changedOn"
        )
        VALUES (
            TG_TABLE_NAME, NEW.id, NEW."createdBy", 'insert', NULL, row_to_json(NEW), NULL, NOW()
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (
            "tableName", "recordId", "createdBy", "action", "oldData", "newData", "changeSummary", "changedOn"
        )
        VALUES (
            TG_TABLE_NAME, NEW.id, NEW."createdBy", 'update', row_to_json(OLD), row_to_json(NEW),
            CASE TG_TABLE_NAME
                WHEN 'invoices' THEN jsonb_build_object(
                    'status', jsonb_build_object('old_value', OLD."status", 'new_value', NEW."status"),
                    'totalAmount', jsonb_build_object('old_value', OLD."totalAmount", 'new_value', NEW."totalAmount"),
                    'dueDate', jsonb_build_object('old_value', OLD."dueDate", 'new_value', NEW."dueDate")
                )
                WHEN 'receipts' THEN jsonb_build_object(
                    'status', jsonb_build_object('old_value', OLD."status", 'new_value', NEW."status"),
                    'totalamount', jsonb_build_object('old_value', OLD."totalamount", 'new_value', NEW."totalamount"),
                    'issueDate', jsonb_build_object('old_value', OLD."issueDate", 'new_value', NEW."issueDate")
                )
                WHEN 'feedbacks' THEN jsonb_build_object(
                    'state', jsonb_build_object('old_value', OLD."state", 'new_value', NEW."state")
                )
                WHEN 'projects' THEN jsonb_build_object(
                    'startDate', jsonb_build_object('old_value', OLD."startDate", 'new_value', NEW."startDate"),
                    'endDate', jsonb_build_object('old_value', OLD."endDate", 'new_value', NEW."endDate")
                )
                WHEN 'customers' THEN jsonb_build_object(
                    'name', jsonb_build_object('old_value', OLD."name", 'new_value', NEW."name"),
                    'email', jsonb_build_object('old_value', OLD."email", 'new_value', NEW."email")
                )
                ELSE NULL
            END,
            NOW()
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (
            "tableName", "recordId", "createdBy", "action", "oldData", "newData", "changeSummary", "changedOn"
        )
        VALUES (
            TG_TABLE_NAME, OLD.id, OLD."createdBy", 'delete', row_to_json(OLD), NULL, NULL, NOW()
        );
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Ranking number 3
-- CREATE OR REPLACE FUNCTION audit_log_trigger() RETURNS TRIGGER AS $$
-- BEGIN
--     IF TG_OP = 'INSERT' THEN
--         INSERT INTO audit_log (
--             "tableName", "recordId", "createdBy", "action", "oldData", "newData", "changeSummary", "changedOn"
--         )
--         VALUES (
--             TG_TABLE_NAME, NEW.id, COALESCE(NEW."createdBy", NULL), 'insert', NULL, row_to_json(NEW), NULL, NOW()
--         );
--     ELSIF TG_OP = 'UPDATE' THEN
--         INSERT INTO audit_log (
--             "tableName", "recordId", "createdBy", "action", "oldData", "newData", "changeSummary", "changedOn"
--         )
--         VALUES (
--             TG_TABLE_NAME, NEW.id, COALESCE(NEW."createdBy", NULL), 'update', row_to_json(OLD), row_to_json(NEW),
--             CASE TG_TABLE_NAME
--                 WHEN 'invoices' THEN jsonb_build_object(
--                     'status', jsonb_build_object('old_value', OLD."status", 'new_value', NEW."status"),
--                     'totalAmount', jsonb_build_object('old_value', OLD."totalAmount", 'new_value', NEW."totalAmount"),
--                     'dueDate', jsonb_build_object('old_value', OLD."dueDate", 'new_value', NEW."dueDate")
--                 )
--                 WHEN 'receipts' THEN jsonb_build_object(
--                     'status', jsonb_build_object('old_value', OLD."status", 'new_value', NEW."status"),
--                     'totalamount', jsonb_build_object('old_value', OLD."totalamount", 'new_value', NEW."totalamount"),
--                     'issueDate', jsonb_build_object('old_value', OLD."issueDate", 'new_value', NEW."issueDate")
--                 )
--                 WHEN 'feedbacks' THEN jsonb_build_object(
--                     'state', jsonb_build_object('old_value', OLD."state", 'new_value', NEW."state")
--                 )
--                 WHEN 'projects' THEN jsonb_build_object(
--                     'startDate', jsonb_build_object('old_value', OLD."startDate", 'new_value', NEW."startDate"),
--                     'endDate', jsonb_build_object('old_value', OLD."endDate", 'new_value', NEW."endDate")
--                 )
--                 WHEN 'customers' THEN jsonb_build_object(
--                     'name', jsonb_build_object('old_value', OLD."name", 'new_value', NEW."name"),
--                     'email', jsonb_build_object('old_value', OLD."email", 'new_value', NEW."email"),
--                     'phone', jsonb_build_object('old_value', OLD."phone", 'new_value', NEW."phone"),
--                     'website', jsonb_build_object('old_value', OLD."website", 'new_value', NEW."website"),
--                     'contactPerson', jsonb_build_object('old_value', OLD."contactPerson", 'new_value', NEW."contactPerson"),
--                     'addressLine1', jsonb_build_object('old_value', OLD."addressLine1", 'new_value', NEW."addressLine1"),
--                     'unitNumber', jsonb_build_object('old_value', OLD."unitNumber", 'new_value', NEW."unitNumber"),
--                     'city', jsonb_build_object('old_value', OLD."city", 'new_value', NEW."city"),
--                     'state', jsonb_build_object('old_value', OLD."state", 'new_value', NEW."state"),
--                     'postalCode', jsonb_build_object('old_value', OLD."postalCode", 'new_value', NEW."postalCode"),
--                     'country', jsonb_build_object('old_value', OLD."country", 'new_value', NEW."country"),
--                     'taxId', jsonb_build_object('old_value', OLD."taxId", 'new_value', NEW."taxId"),
--                     'notes', jsonb_build_object('old_value', OLD."notes", 'new_value', NEW."notes")
--                 )
--                 ELSE NULL
--             END,
--             NOW()
--         );
--     ELSIF TG_OP = 'DELETE' THEN
--         INSERT INTO audit_log (
--             "tableName", "recordId", "createdBy", "action", "oldData", "newData", "changeSummary", "changedOn"
--         )
--         VALUES (
--             TG_TABLE_NAME, OLD.id, COALESCE(OLD."createdBy", NULL), 'delete', row_to_json(OLD), NULL, NULL, NOW()
--         );
--     END IF;
--     RETURN NULL;
-- END;
-- $$ LANGUAGE plpgsql;


-- Ranking number 2
-- CREATE OR REPLACE FUNCTION audit_log_trigger() RETURNS TRIGGER AS $$
-- BEGIN
--     IF TG_OP = 'INSERT' THEN
--         INSERT INTO audit_log (
--             "tableName", "recordId", "createdBy", "action", "oldData", "newData", "changeSummary", "changedOn"
--         )
--         VALUES (
--             TG_TABLE_NAME, NEW.id, COALESCE(NEW."createdBy", NULL), 'insert', NULL, row_to_json(NEW), NULL, NOW()
--         );
--     ELSIF TG_OP = 'UPDATE' THEN
--         INSERT INTO audit_log (
--             "tableName", "recordId", "createdBy", "action", "oldData", "newData", "changeSummary", "changedOn"
--         )
--         VALUES (
--             TG_TABLE_NAME, NEW.id, COALESCE(NEW."createdBy", NULL), 'update', row_to_json(OLD), row_to_json(NEW),
--             CASE TG_TABLE_NAME
--                 WHEN 'invoices' THEN jsonb_build_object(
--                     'status', jsonb_build_object('old_value', OLD."status", 'new_value', NEW."status"),
--                     'totalAmount', jsonb_build_object('old_value', OLD."totalAmount", 'new_value', NEW."totalAmount"),
--                     'dueDate', jsonb_build_object('old_value', OLD."dueDate", 'new_value', NEW."dueDate")
--                 )
--                 WHEN 'receipts' THEN jsonb_build_object(
--                     'status', jsonb_build_object('old_value', OLD."status", 'new_value', NEW."status"),
--                     'totalamount', jsonb_build_object('old_value', OLD."totalamount", 'new_value', NEW."totalamount"),
--                     'issueDate', jsonb_build_object('old_value', OLD."issueDate", 'new_value', NEW."issueDate")
--                 )
--                 WHEN 'feedbacks' THEN jsonb_build_object(
--                     'state', jsonb_build_object('old_value', OLD."state", 'new_value', NEW."state")
--                 )
--                 WHEN 'projects' THEN jsonb_build_object(
--                     'startDate', jsonb_build_object('old_value', OLD."startDate", 'new_value', NEW."startDate"),
--                     'endDate', jsonb_build_object('old_value', OLD."endDate", 'new_value', NEW."endDate")
--                 )
--                 WHEN 'customers' THEN jsonb_build_object(
--                     'name', jsonb_build_object('old_value', OLD."name", 'new_value', NEW."name"),
--                     'email', jsonb_build_object('old_value', OLD."email", 'new_value', NEW."email"),
--                     'phone', jsonb_build_object('old_value', OLD."phone", 'new_value', NEW."phone"),
--                     'website', jsonb_build_object('old_value', OLD."website", 'new_value', NEW."website"),
--                     'contactPerson', jsonb_build_object('old_value', OLD."contactPerson", 'new_value', NEW."contactPerson"),
--                     'addressLine1', jsonb_build_object('old_value', OLD."addressLine1", 'new_value', NEW."addressLine1"),
--                     'unitNumber', jsonb_build_object('old_value', OLD."unitNumber", 'new_value', NEW."unitNumber"),
--                     'city', jsonb_build_object('old_value', OLD."city", 'new_value', NEW."city"),
--                     'state', jsonb_build_object('old_value', OLD."state", 'new_value', NEW."state"),
--                     'postalCode', jsonb_build_object('old_value', OLD."postalCode", 'new_value', NEW."postalCode"),
--                     'country', jsonb_build_object('old_value', OLD."country", 'new_value', NEW."country"),
--                     'taxId', jsonb_build_object('old_value', OLD."taxId", 'new_value', NEW."taxId"),
--                     'notes', jsonb_build_object('old_value', OLD."notes", 'new_value', NEW."notes")
--                 )
--                 ELSE NULL
--             END,
--             NOW()
--         );
--     ELSIF TG_OP = 'DELETE' THEN
--         INSERT INTO audit_log (
--             "tableName", "recordId", "createdBy", "action", "oldData", "newData", "changeSummary", "changedOn"
--         )
--         VALUES (
--             TG_TABLE_NAME, OLD.id, COALESCE(OLD."createdBy", NULL), 'delete', row_to_json(OLD), NULL, NULL, NOW()
--         );
--     END IF;
--     RETURN NULL;
-- END;
-- $$ LANGUAGE plpgsql;


CREATE TRIGGER audit_log_invoices_trigger
AFTER INSERT OR UPDATE OR DELETE ON invoices
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();


CREATE TRIGGER audit_log_receipts_trigger
AFTER INSERT OR UPDATE OR DELETE ON receipts
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();


CREATE TRIGGER audit_log_feedbacks_trigger
AFTER INSERT OR UPDATE OR DELETE ON feedbacks
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();


CREATE TRIGGER audit_log_projects_trigger
AFTER INSERT OR UPDATE OR DELETE ON projects
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();


CREATE TRIGGER audit_log_customers_trigger
AFTER INSERT OR UPDATE OR DELETE ON customers
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();



-- Dropping triggers
DROP TRIGGER IF EXISTS audit_log_customers_trigger ON customers;
DROP TRIGGER IF EXISTS audit_log_invoices_trigger ON invoices;
DROP TRIGGER IF EXISTS audit_log_receipts_trigger ON receipts;
DROP TRIGGER IF EXISTS audit_log_feedbacks_trigger ON feedbacks;
DROP TRIGGER IF EXISTS audit_log_projects_trigger ON projects;



-- dropping functions 
DROP FUNCTION IF EXISTS audit_log_trigger();
DROP FUNCTION IF EXISTS audit_log_generic_trigger();
DROP FUNCTION IF EXISTS audit_log_customers_trigger();

