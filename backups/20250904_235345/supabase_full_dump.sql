

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."billing_cycle_enum" AS ENUM (
    'monthly',
    'yearly'
);


ALTER TYPE "public"."billing_cycle_enum" OWNER TO "postgres";


CREATE TYPE "public"."customer_activity_reference_enum" AS ENUM (
    'invoice',
    'receipt',
    'project',
    'agreement',
    'feedback'
);


ALTER TYPE "public"."customer_activity_reference_enum" OWNER TO "postgres";


CREATE TYPE "public"."customer_activity_type_enum" AS ENUM (
    'invoice_sent',
    'invoice_paid',
    'invoice_viewed',
    'invoice_overdue',
    'invoice_reminder',
    'invoice_updated',
    'invoice_link_clicked',
    'receipt_sent',
    'receipt_link_clicked',
    'receipt_viewed',
    'receipt_reminder',
    'receipt_updated',
    'project_started',
    'project_overdue',
    'project_completed',
    'project_updated',
    'project_reminder',
    'project_signed',
    'project_sent',
    'project_viewed',
    'project_link_clicked',
    'agreement_sent',
    'agreement_signed',
    'agreement_viewed',
    'agreement_link_clicked',
    'feedback_sent',
    'feedback_updated',
    'feedback_reminder',
    'feedback_received',
    'feedback_submitted',
    'feedback_overdue',
    'feedback_viewed',
    'feedback_link_clicked',
    'email_opened'
);


ALTER TYPE "public"."customer_activity_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."event_entity_enum" AS ENUM (
    'wall',
    'links_page',
    'link_item',
    'file'
);


ALTER TYPE "public"."event_entity_enum" OWNER TO "postgres";


CREATE TYPE "public"."event_type_enum" AS ENUM (
    'page_view',
    'click',
    'download',
    'share'
);


ALTER TYPE "public"."event_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."plan_type_enum" AS ENUM (
    'starter',
    'pro',
    'corporate'
);


ALTER TYPE "public"."plan_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."subscription_status_enum" AS ENUM (
    'trial',
    'pending',
    'active',
    'expired',
    'cancelled',
    'suspended'
);


ALTER TYPE "public"."subscription_status_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_log_customers_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."audit_log_customers_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_log_feedbacks_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."audit_log_feedbacks_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_log_invoices_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."audit_log_invoices_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_log_projects_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."audit_log_projects_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_log_receipts_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
                'state', jsonb_build_object('old_value', OLD."state", 'new_value', NEW."state"),
                'totalAmount', jsonb_build_object('old_value', OLD."totalAmount", 'new_value', NEW."totalAmount"),
                'issueDate', jsonb_build_object('old_value', OLD."issueDate", 'new_value', NEW."issueDate"),
                'paymentConfirmedAt', jsonb_build_object('old_value', OLD."paymentConfirmedAt", 'new_value', NEW."paymentConfirmedAt"),
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
$$;


ALTER FUNCTION "public"."audit_log_receipts_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_invoice_number"("org_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $_$
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
$_$;


ALTER FUNCTION "public"."generate_invoice_number"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_receipt_number"("org_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $_$
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
$_$;


ALTER FUNCTION "public"."generate_receipt_number"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_recent_items"() RETURNS TABLE("category" "text", "id" "text", "name" "text", "type" "text", "created_at" timestamp with time zone)
    LANGUAGE "sql"
    AS $$
  (
    SELECT 'projects' AS category, p.id::text, p.name, p.state AS type, p."startDate" AS created_at
    FROM projects p ORDER BY p."startDate" DESC LIMIT 3
  ) UNION ALL (
    SELECT 'customers' AS category, c.id::text, c.name, 'Customer' AS type, c.created_at AS created_at
    FROM customers c ORDER BY c.created_at DESC LIMIT 3
  ) UNION ALL (
    SELECT 'invoices' AS category, i.id::text, i."invoiceNumber" AS name, i.state AS type, i.created_at AS created_at
    FROM invoices i ORDER BY i.created_at DESC LIMIT 3
  ) UNION ALL (
    SELECT 'feedbacks' AS category, f.id::text, (f.questions->>'title')::text AS name, f.state AS type, f.created_at AS created_at
    FROM feedbacks f ORDER BY f.created_at DESC LIMIT 3
  ) UNION ALL (
    SELECT 'receipts' AS category, r.id::text, r."receiptNumber" AS name, r.state AS type, r.created_at AS created_at
    FROM receipts r ORDER BY r.created_at DESC LIMIT 3
  ) UNION ALL (
    SELECT 'walls' AS category, w.id::text, w.name, w.type AS type, w.created_at AS created_at
    FROM walls w ORDER BY w.created_at DESC LIMIT 3
  ) UNION ALL (
    SELECT 'paths' AS category, pa.id::text, pa.name, pa.type AS type, pa.created_at AS created_at
    FROM paths pa ORDER BY pa.created_at DESC LIMIT 3
  )
$$;


ALTER FUNCTION "public"."get_recent_items"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (profile_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."regenerate_invoice_numbers"("org_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."regenerate_invoice_numbers"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."regenerate_receipt_numbers"("org_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."regenerate_receipt_numbers"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_invoice_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."set_invoice_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_receipt_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."set_receipt_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."smart_universal_search"("search_term" "text") RETURNS TABLE("category" "text", "id" "text", "name" "text", "type" "text", "rank" real, "related_category" "text", "customerId" "text", "projectId" "text")
    LANGUAGE "sql"
    AS $$
WITH direct_matches AS (
  -- Direct customer hits (name, email, phone)
  SELECT
    'customers'                     AS category,
    c.id::text                      AS id,
    c.name                          AS name,
    'Customer'                      AS type,
    CASE 
      WHEN c.email ILIKE '%' || search_term || '%' THEN 1.0
      WHEN c.name ILIKE '%' || search_term || '%' THEN 0.9
      ELSE ts_rank(c.fts, websearch_to_tsquery('simple', search_term))
    END AS rank,
    NULL::text                      AS related_category,
    c.id::text                      AS customer_id,
    NULL::text                      AS project_id
  FROM customers c
  WHERE c.fts @@ websearch_to_tsquery('simple', search_term)
     OR c.email ILIKE '%' || search_term || '%'
     OR c.name ILIKE '%' || search_term || '%'
     OR c.phone ILIKE '%' || search_term || '%'

  UNION ALL
  -- Direct project hits
  SELECT
    'projects'                      AS category,
    p.id::text                      AS id,
    p.name                          AS name,
    p.state                        AS type,
    CASE 
      WHEN p.name ILIKE '%' || search_term || '%' THEN 0.9
      WHEN p."recepientName" ILIKE '%' || search_term || '%' THEN 0.8
      WHEN p."recepientEmail" ILIKE '%' || search_term || '%' THEN 0.8
      ELSE ts_rank(p.fts, websearch_to_tsquery('simple', search_term))
    END AS rank,
    NULL::text                      AS related_category,
    p."customerId"::text            AS customer_id,
    p.id::text                      AS project_id
  FROM projects p
  WHERE p.fts @@ websearch_to_tsquery('simple', search_term)
     OR p.name ILIKE '%' || search_term || '%'
     OR p."recepientName" ILIKE '%' || search_term || '%'
     OR p."recepientEmail" ILIKE '%' || search_term || '%'

  UNION ALL
  -- Direct invoice hits
  SELECT
    'invoices'                      AS category,
    i.id::text                      AS id,
    i."invoiceNumber"               AS name,
    i.state                        AS type,
    CASE 
      WHEN i."invoiceNumber" ILIKE '%' || search_term || '%' THEN 0.95
      WHEN i."recepientName" ILIKE '%' || search_term || '%' THEN 0.8
      WHEN i."recepientEmail" ILIKE '%' || search_term || '%' THEN 0.8
      ELSE ts_rank(i.fts, websearch_to_tsquery('simple', search_term))
    END AS rank,
    NULL::text                      AS related_category,
    i."customerId"::text            AS customer_id,
    i."projectId"::text             AS project_id
  FROM invoices i
  WHERE i.fts @@ websearch_to_tsquery('simple', search_term)
     OR i."invoiceNumber" ILIKE '%' || search_term || '%'
     OR i."recepientName" ILIKE '%' || search_term || '%'
     OR i."recepientEmail" ILIKE '%' || search_term || '%'

  UNION ALL
  -- Direct feedback hits
  SELECT
    'feedbacks'                     AS category,
    f.id::text                      AS id,
    (f.questions->>'title')::text   AS name,
    f.state                         AS type,
    CASE 
      WHEN (f.questions->>'title') ILIKE '%' || search_term || '%' THEN 0.9
      WHEN f."recepientName" ILIKE '%' || search_term || '%' THEN 0.8
      WHEN f."recepientEmail" ILIKE '%' || search_term || '%' THEN 0.8
      ELSE ts_rank(f.fts, websearch_to_tsquery('simple', search_term))
    END AS rank,
    NULL::text                      AS related_category,
    f."customerId"::text            AS customer_id,
    f."projectId"::text             AS project_id
  FROM feedbacks f
  WHERE f.fts @@ websearch_to_tsquery('simple', search_term)
     OR (f.questions->>'title') ILIKE '%' || search_term || '%'
     OR f."recepientName" ILIKE '%' || search_term || '%'
     OR f."recepientEmail" ILIKE '%' || search_term || '%'

  UNION ALL
  -- Direct receipt hits
  SELECT
    'receipts'                      AS category,
    r.id::text                      AS id,
    r."receiptNumber"               AS name,
    r.state                        AS type,
    CASE 
      WHEN r."receiptNumber" ILIKE '%' || search_term || '%' THEN 0.95
      WHEN r."recepientName" ILIKE '%' || search_term || '%' THEN 0.8
      WHEN r."recepientEmail" ILIKE '%' || search_term || '%' THEN 0.8
      ELSE ts_rank(r.fts, websearch_to_tsquery('simple', search_term))
    END AS rank,
    NULL::text                      AS related_category,
    r."customerId"::text            AS customer_id,
    r."projectId"::text             AS project_id
  FROM receipts r
  WHERE r.fts @@ websearch_to_tsquery('simple', search_term)
     OR r."receiptNumber" ILIKE '%' || search_term || '%'
     OR r."recepientName" ILIKE '%' || search_term || '%'
     OR r."recepientEmail" ILIKE '%' || search_term || '%'

  UNION ALL
  -- Direct walls hits
  SELECT
    'walls'                         AS category,
    w.id::text                      AS id,
    w.name                          AS name,
    w.type                          AS type,
    CASE 
      WHEN w.name ILIKE '%' || search_term || '%' THEN 0.9
      WHEN w."recepientName" ILIKE '%' || search_term || '%' THEN 0.8
      WHEN w."recepientEmail" ILIKE '%' || search_term || '%' THEN 0.8
      ELSE ts_rank(w.fts, websearch_to_tsquery('simple', search_term))
    END AS rank,
    NULL::text                      AS related_category,
    w."customerId"::text            AS customer_id,
    w."projectId"::text             AS project_id
  FROM walls w
  WHERE w.fts @@ websearch_to_tsquery('simple', search_term)
     OR w.name ILIKE '%' || search_term || '%'
     OR w."recepientName" ILIKE '%' || search_term || '%'
     OR w."recepientEmail" ILIKE '%' || search_term || '%'

  UNION ALL
  -- Direct paths hits
  SELECT
    'paths'                         AS category,
    pa.id::text                     AS id,
    pa.name                         AS name,
    pa.type                         AS type,
    CASE 
      WHEN pa.name ILIKE '%' || search_term || '%' THEN 0.9
      WHEN pa."recepientName" ILIKE '%' || search_term || '%' THEN 0.8
      WHEN pa."recepientEmail" ILIKE '%' || search_term || '%' THEN 0.8
      ELSE ts_rank(pa.fts, websearch_to_tsquery('simple', search_term))
    END AS rank,
    NULL::text                      AS related_category,
    pa."customerId"::text           AS customer_id,
    NULL::text                      AS project_id
  FROM paths pa
  WHERE pa.fts @@ websearch_to_tsquery('simple', search_term)
     OR pa.name ILIKE '%' || search_term || '%'
     OR pa."recepientName" ILIKE '%' || search_term || '%'
     OR pa."recepientEmail" ILIKE '%' || search_term || '%'
),
customer_matches AS (
  SELECT customer_id
  FROM direct_matches
  WHERE category = 'customers' AND customer_id IS NOT NULL
  UNION
  SELECT customer_id
  FROM direct_matches
  WHERE customer_id IS NOT NULL AND category IN ('projects','invoices','feedbacks','receipts','walls','paths')
),
project_matches AS (
  SELECT project_id
  FROM direct_matches
  WHERE category = 'projects' AND project_id IS NOT NULL
  UNION
  SELECT project_id
  FROM direct_matches
  WHERE project_id IS NOT NULL AND category IN ('invoices','receipts','feedbacks','walls')
),
related_matches AS (
  -- Projects related to found customers
  SELECT
    'projects'                      AS category,
    p.id::text                      AS id,
    p.name                          AS name,
    p.state                        AS type,
    0.7                             AS rank,
    'customers'                     AS related_category,
    p."customerId"::text            AS customer_id,
    p.id::text                      AS project_id
  FROM projects p
  JOIN customer_matches cm ON p."customerId"::text = cm.customer_id
  WHERE NOT EXISTS (
    SELECT 1 FROM direct_matches dm 
    WHERE dm.category = 'projects' AND dm.id = p.id::text
  )

  UNION ALL
  -- Invoices related to found customers
  SELECT
    'invoices'                      AS category,
    i.id::text                      AS id,
    i."invoiceNumber"               AS name,
    i.state                        AS type,
    0.6                             AS rank,
    'customers'                     AS related_category,
    i."customerId"::text            AS customer_id,
    i."projectId"::text             AS project_id
  FROM invoices i
  JOIN customer_matches cm ON i."customerId"::text = cm.customer_id
  WHERE NOT EXISTS (
    SELECT 1 FROM direct_matches dm 
    WHERE dm.category = 'invoices' AND dm.id = i.id::text
  )

  UNION ALL
  -- Receipts related to found customers
  SELECT
    'receipts'                      AS category,
    r.id::text                      AS id,
    r."receiptNumber"               AS name,
    r.state                        AS type,
    0.6                             AS rank,
    'customers'                     AS related_category,
    r."customerId"::text            AS customer_id,
    r."projectId"::text             AS project_id
  FROM receipts r
  JOIN customer_matches cm ON r."customerId"::text = cm.customer_id
  WHERE NOT EXISTS (
    SELECT 1 FROM direct_matches dm 
    WHERE dm.category = 'receipts' AND dm.id = r.id::text
  )

  UNION ALL
  -- Feedbacks related to found customers
  SELECT
    'feedbacks'                     AS category,
    f.id::text                      AS id,
    (f.questions->>'title')::text   AS name,
    f.state                         AS type,
    0.6                             AS rank,
    'customers'                     AS related_category,
    f."customerId"::text            AS customer_id,
    f."projectId"::text             AS project_id
  FROM feedbacks f
  JOIN customer_matches cm ON f."customerId"::text = cm.customer_id
  WHERE NOT EXISTS (
    SELECT 1 FROM direct_matches dm 
    WHERE dm.category = 'feedbacks' AND dm.id = f.id::text
  )

  UNION ALL
  -- Invoices related to found projects
  SELECT
    'invoices'                      AS category,
    i.id::text                      AS id,
    i."invoiceNumber"               AS name,
    i.state                        AS type,
    0.5                             AS rank,
    'projects'                      AS related_category,
    i."customerId"::text            AS customer_id,
    i."projectId"::text             AS project_id
  FROM invoices i
  JOIN project_matches pm ON i."projectId"::text = pm.project_id
  WHERE NOT EXISTS (
    SELECT 1 FROM direct_matches dm 
    WHERE dm.category = 'invoices' AND dm.id = i.id::text
  )

  UNION ALL
  -- Receipts related to found projects
  SELECT
    'receipts'                      AS category,
    r.id::text                      AS id,
    r."receiptNumber"               AS name,
    r.state                        AS type,
    0.5                             AS rank,
    'projects'                      AS related_category,
    r."customerId"::text            AS customer_id,
    r."projectId"::text             AS project_id
  FROM receipts r
  JOIN project_matches pm ON r."projectId"::text = pm.project_id
  WHERE NOT EXISTS (
    SELECT 1 FROM direct_matches dm 
    WHERE dm.category = 'receipts' AND dm.id = r.id::text
  )

  UNION ALL
  -- Feedbacks related to found projects
  SELECT
    'feedbacks'                     AS category,
    f.id::text                      AS id,
    (f.questions->>'title')::text   AS name,
    f.state                         AS type,
    0.5                             AS rank,
    'projects'                      AS related_category,
    f."customerId"::text            AS customer_id,
    f."projectId"::text             AS project_id
  FROM feedbacks f
  JOIN project_matches pm ON f."projectId"::text = pm.project_id
  WHERE NOT EXISTS (
    SELECT 1 FROM direct_matches dm 
    WHERE dm.category = 'feedbacks' AND dm.id = f.id::text
  )

  UNION ALL
  -- Walls related to found customers
  SELECT
    'walls'                         AS category,
    w.id::text                      AS id,
    w.name                          AS name,
    w.type                          AS type,
    0.6                             AS rank,
    'customers'                     AS related_category,
    w."customerId"::text            AS customer_id,
    w."projectId"::text             AS project_id
  FROM walls w
  JOIN customer_matches cm ON w."customerId"::text = cm.customer_id
  WHERE NOT EXISTS (
    SELECT 1 FROM direct_matches dm 
    WHERE dm.category = 'walls' AND dm.id = w.id::text
  )

  UNION ALL
  -- Walls related to found projects
  SELECT
    'walls'                         AS category,
    w.id::text                      AS id,
    w.name                          AS name,
    w.type                          AS type,
    0.5                             AS rank,
    'projects'                      AS related_category,
    w."customerId"::text            AS customer_id,
    w."projectId"::text             AS project_id
  FROM walls w
  JOIN project_matches pm ON w."projectId"::text = pm.project_id
  WHERE NOT EXISTS (
    SELECT 1 FROM direct_matches dm 
    WHERE dm.category = 'walls' AND dm.id = w.id::text
  )

  UNION ALL
  -- Paths related to found customers
  SELECT
    'paths'                         AS category,
    pa.id::text                     AS id,
    pa.name                         AS name,
    pa.type                         AS type,
    0.6                             AS rank,
    'customers'                     AS related_category,
    pa."customerId"::text           AS customer_id,
    NULL::text                      AS project_id
  FROM paths pa
  JOIN customer_matches cm ON pa."customerId"::text = cm.customer_id
  WHERE NOT EXISTS (
    SELECT 1 FROM direct_matches dm 
    WHERE dm.category = 'paths' AND dm.id = pa.id::text
  )
)

SELECT
  category,
  id,
  name,
  type,
  rank,
  related_category,
  customer_id AS "customerId",
  project_id  AS "projectId"
FROM direct_matches
WHERE rank > 0.001

UNION ALL

SELECT
  category,
  id,
  name,
  type,
  rank,
  related_category,
  customer_id AS "customerId",
  project_id  AS "projectId"
FROM related_matches

ORDER BY rank DESC, category, name
LIMIT 30;
$$;


ALTER FUNCTION "public"."smart_universal_search"("search_term" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."analytics_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "entity_id" "text" NOT NULL,
    "entity_type" "public"."event_entity_enum" NOT NULL,
    "event_type" "public"."event_type_enum" NOT NULL,
    "session_id" "text",
    "viewer_hash" "text",
    "url" "text",
    "referrer" "text",
    "user_agent" "text",
    "country" "text",
    "region" "text",
    "city" "text",
    "is_bot" boolean,
    "metadata" "jsonb",
    "day_key" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."analytics_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."analytics_events" IS 'Analytics and tracking data';



CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tableName" "text",
    "recordId" "text",
    "action" "text",
    "oldData" "jsonb",
    "newData" "jsonb",
    "changeSummary" "jsonb",
    "createdBy" "text",
    "organizationId" "uuid",
    "changedOn" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."audit_log" IS 'Audit trail for data changes';



CREATE TABLE IF NOT EXISTS "public"."banks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text",
    "bankName" "text",
    "accountName" "text",
    "accountNumber" "text",
    "routingNumber" "text",
    "swiftCode" "text",
    "iban" "text",
    "sortCode" "text",
    "transitNumber" "text",
    "institutionNumber" "text",
    "bankAddress" "text",
    "country" "text",
    "currency" "text",
    "type" "text",
    "description" "text",
    "isdefault" boolean DEFAULT false,
    "stripePaymentLink" "text",
    "paypalPaymentLink" "text",
    "crypto" "text",
    "cryptoNetwork" "text",
    "cryptoWalletAddress" "text",
    "organizationId" "uuid",
    "createdBy" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."banks" OWNER TO "postgres";


COMMENT ON TABLE "public"."banks" IS 'Bank account and payment information';



CREATE TABLE IF NOT EXISTS "public"."banks_duplicate" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text",
    "bankName" "text",
    "accountName" "text",
    "accountNumber" "text",
    "routingNumber" "text",
    "swiftCode" "text",
    "iban" "text",
    "sortCode" "text",
    "transitNumber" "text",
    "institutionNumber" "text",
    "bankAddress" "text",
    "country" "text",
    "currency" "text",
    "type" "text",
    "description" "text",
    "isdefault" boolean DEFAULT false,
    "stripePaymentLink" "text",
    "paypalPaymentLink" "text",
    "crypto" "text",
    "cryptoNetwork" "text",
    "cryptoWalletAddress" "text",
    "organizationId" "uuid",
    "createdBy" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."banks_duplicate" OWNER TO "postgres";


COMMENT ON TABLE "public"."banks_duplicate" IS 'This is a duplicate of banks';



CREATE TABLE IF NOT EXISTS "public"."cancellations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" "public"."citext",
    "reason" "text",
    "notes" "text",
    "stripeId" "text",
    "stripeData" "jsonb",
    "organizationId" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cancellations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_activities" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "type" "public"."customer_activity_type_enum",
    "referenceType" "public"."customer_activity_reference_enum",
    "label" "text",
    "amount" numeric(10,2),
    "details" "jsonb",
    "tagColor" "text",
    "referenceId" "text",
    "organizationId" "uuid",
    "customerId" "uuid",
    "createdBy" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."customer_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text",
    "email" "public"."citext",
    "phone" "text",
    "website" "text",
    "contactPerson" "text",
    "address" "text",
    "addressLine1" "text",
    "addressLine2" "text",
    "city" "text",
    "state" "text",
    "postalCode" "text",
    "country" "text",
    "unitNumber" "text",
    "taxId" "text",
    "notes" "text",
    "fullAddress" "text",
    "invoiceCount" integer DEFAULT 0,
    "receiptCount" integer DEFAULT 0,
    "projectCount" integer DEFAULT 0,
    "linkCount" integer DEFAULT 0,
    "feedbackCount" integer DEFAULT 0,
    "organizationId" "uuid",
    "createdBy" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "fts" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"simple"'::"regconfig", (((("name" || ' '::"text") || (COALESCE("email", ''::"public"."citext"))::"text") || ' '::"text") || COALESCE("phone", ''::"text")))) STORED
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


COMMENT ON TABLE "public"."customers" IS 'Customer/client information';



CREATE TABLE IF NOT EXISTS "public"."deliverables" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text",
    "description" "text",
    "status" "text",
    "position" integer,
    "dueDate" timestamp with time zone,
    "isPublished" boolean DEFAULT false,
    "lastSaved" timestamp with time zone,
    "projectId" "uuid",
    "createdBy" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."deliverables" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedback_templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text",
    "questions" "jsonb",
    "isDefault" boolean DEFAULT false,
    "organizationId" "uuid",
    "createdBy" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feedback_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedbacks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text",
    "message" "text",
    "questions" "jsonb",
    "answers" "jsonb",
    "state" "text",
    "dueDate" timestamp with time zone,
    "filledOn" timestamp with time zone,
    "sentAt" timestamp with time zone,
    "allowReminders" boolean DEFAULT true,
    "organizationId" "uuid",
    "customerId" "uuid",
    "projectId" "uuid",
    "templateId" "uuid",
    "createdBy" "uuid" DEFAULT "auth"."uid"(),
    "organizationName" "text",
    "organizationEmail" "public"."citext",
    "organizationLogo" "text",
    "recepientName" "text",
    "recepientEmail" "public"."citext",
    "token" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "fts" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"simple"'::"regconfig", ((((((("questions" ->> 'title'::"text") || ' '::"text") || COALESCE("state", ''::"text")) || ' '::"text") || COALESCE("recepientName", ''::"text")) || ' '::"text") || (COALESCE("recepientEmail", ''::"public"."citext"))::"text"))) STORED
);


ALTER TABLE "public"."feedbacks" OWNER TO "postgres";


COMMENT ON TABLE "public"."feedbacks" IS 'Customer feedback and surveys';



CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "invoiceNumber" "text",
    "issueDate" timestamp with time zone,
    "dueDate" timestamp with time zone,
    "currency" "text",
    "subTotalAmount" numeric(10,2),
    "discount" numeric(10,2),
    "taxRate" numeric(5,2),
    "vatRate" numeric(5,2),
    "totalAmount" numeric(10,2),
    "hasDiscount" boolean DEFAULT false,
    "hasTax" boolean DEFAULT false,
    "hasVat" boolean DEFAULT false,
    "status" "text",
    "state" "text",
    "paymentType" "text",
    "paymentLink" "text",
    "paymentInfo" "jsonb",
    "paymentDetails" "jsonb",
    "invoiceDetails" "jsonb",
    "notes" "text",
    "sentViaEmail" boolean DEFAULT false,
    "emailSentAt" timestamp with time zone,
    "paidOn" timestamp with time zone,
    "allowReminders" boolean DEFAULT true,
    "organizationId" "uuid",
    "customerId" "uuid",
    "projectId" "uuid",
    "createdBy" "uuid" DEFAULT "auth"."uid"(),
    "organizationName" "text",
    "organizationEmail" "public"."citext",
    "organizationLogo" "text",
    "projectName" "text",
    "recepientName" "text",
    "recepientEmail" "public"."citext",
    "token" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"(),
    "fts" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"simple"'::"regconfig", (((((("invoiceNumber" || ' '::"text") || COALESCE("state", ''::"text")) || ' '::"text") || COALESCE("recepientName", ''::"text")) || ' '::"text") || (COALESCE("recepientEmail", ''::"public"."citext"))::"text"))) STORED
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


COMMENT ON TABLE "public"."invoices" IS 'Invoice management and billing';



CREATE TABLE IF NOT EXISTS "public"."link_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "page_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "url" "text" NOT NULL,
    "icon" "text",
    "color" "text",
    "position" integer,
    "click_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."link_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" "public"."citext",
    "roles" "text",
    "paidSub" boolean DEFAULT false,
    "author" "text",
    "addedBy" "text",
    "organizationId" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "message" "text",
    "type" "text" NOT NULL,
    "state" "text",
    "isRead" boolean DEFAULT false,
    "actionUrl" "text",
    "expiresAt" timestamp with time zone,
    "metadata" "jsonb",
    "tableName" "text",
    "tableId" "text",
    "organizationId" "uuid",
    "createdBy" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'System notifications';



CREATE TABLE IF NOT EXISTS "public"."organization" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text",
    "email" "public"."citext",
    "phone" "text",
    "website" "text",
    "addressLine1" "text",
    "addressLine2" "text",
    "city" "text",
    "state" "text",
    "postal" "text",
    "country" "text",
    "taxId" "text",
    "logoUrl" "text",
    "baseCurrency" "text",
    "billingEmail" "public"."citext",
    "billingCycle" "public"."billing_cycle_enum",
    "planType" "public"."plan_type_enum",
    "subscriptionStatus" "text",
    "subscriptionstatus" "public"."subscription_status_enum",
    "subscriptionId" "text",
    "subscriptionStartDate" timestamp with time zone,
    "subscriptionEndDate" timestamp with time zone,
    "subscriptionMetadata" "jsonb",
    "stripeMetadata" "jsonb",
    "paymentMethodId" "text",
    "defaultBankId" "uuid",
    "bankName" "text",
    "accountNumber" "text",
    "trialEndsAt" timestamp with time zone,
    "setupStatus" "text",
    "setupCompletedAt" timestamp with time zone,
    "setupCompletedBy" "uuid",
    "setupData" "jsonb",
    "feedbackNotifications" boolean DEFAULT true,
    "invoiceNotifications" boolean DEFAULT true,
    "projectNotifications" boolean DEFAULT true,
    "fts" "tsvector",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "createdBy" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."organization" OWNER TO "postgres";


COMMENT ON TABLE "public"."organization" IS 'Organization/company information';



CREATE TABLE IF NOT EXISTS "public"."paths" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text",
    "description" "text",
    "type" "text",
    "state" "text",
    "private" boolean DEFAULT false,
    "content" "jsonb",
    "analytics" "jsonb",
    "organizationId" "uuid",
    "customerId" "uuid",
    "createdBy" "uuid",
    "organizationName" "text",
    "organizationEmail" "public"."citext",
    "organizationLogo" "text",
    "recepientName" "text",
    "recepientEmail" "public"."citext",
    "token" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"(),
    "fts" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"simple"'::"regconfig", (((((("name" || ' '::"text") || COALESCE("description", ''::"text")) || ' '::"text") || COALESCE("recepientName", ''::"text")) || ' '::"text") || (COALESCE("recepientEmail", ''::"public"."citext"))::"text"))) STORED
);


ALTER TABLE "public"."paths" OWNER TO "postgres";


COMMENT ON TABLE "public"."paths" IS 'Link pages and content management';



CREATE TABLE IF NOT EXISTS "public"."paymentTerms" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text",
    "description" "text",
    "type" "text",
    "status" "text",
    "amount" numeric(10,2),
    "percentage" numeric(5,2),
    "dueDate" timestamp with time zone,
    "hasPaymentTerms" boolean DEFAULT false,
    "projectId" "uuid",
    "deliverableId" "uuid",
    "organizationId" "uuid",
    "createdBy" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."paymentTerms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pricing" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "stripeProductId" "text" NOT NULL,
    "stripePriceId" "text" NOT NULL,
    "unitAmount" integer NOT NULL,
    "currency" "text" NOT NULL,
    "billingCycle" "text",
    "isActive" boolean DEFAULT true,
    "metadata" "jsonb",
    "productId" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pricing" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "stripeProductId" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "isActive" boolean DEFAULT true,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "profile_id" "uuid",
    "email" "public"."citext",
    "organizationId" "uuid",
    "organizationRole" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'User profiles and authentication data';



CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text",
    "description" "text",
    "projectTypeId" "uuid",
    "type" "text",
    "status" "text",
    "state" "text",
    "budget" numeric(10,2),
    "currency" "text",
    "currencyEnabled" boolean DEFAULT false,
    "startDate" timestamp with time zone,
    "endDate" timestamp with time zone,
    "effectiveDate" timestamp with time zone,
    "deliverablesEnabled" boolean DEFAULT false,
    "deliverables" "jsonb",
    "hasPaymentTerms" boolean DEFAULT false,
    "paymentStructure" "text",
    "paymentMilestones" "jsonb",
    "hasServiceAgreement" boolean DEFAULT false,
    "serviceAgreement" "jsonb",
    "agreementTemplate" "text",
    "hasAgreedToTerms" boolean DEFAULT false,
    "signatureType" "text",
    "signatureDetails" "jsonb",
    "signedStatus" "text",
    "signedOn" timestamp with time zone,
    "emailToCustomer" boolean DEFAULT true,
    "allowReminders" boolean DEFAULT true,
    "isPublished" boolean DEFAULT false,
    "isArchived" boolean DEFAULT false,
    "customFields" "jsonb",
    "documents" "jsonb",
    "notes" "text",
    "invoiceId" "uuid",
    "organizationId" "uuid",
    "customerId" "uuid",
    "createdBy" "uuid" DEFAULT "auth"."uid"(),
    "organizationName" "text",
    "organizationEmail" "public"."citext",
    "organizationLogo" "text",
    "recepientName" "text",
    "recepientEmail" "public"."citext",
    "token" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updatedOn" timestamp with time zone DEFAULT "now"(),
    "fts" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"simple"'::"regconfig", (("name" || ' '::"text") || COALESCE("description", ''::"text")))) STORED
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


COMMENT ON TABLE "public"."projects" IS 'Project management data';



CREATE TABLE IF NOT EXISTS "public"."receipts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "receiptNumber" "text",
    "issueDate" timestamp with time zone,
    "dueDate" timestamp with time zone,
    "currency" "text",
    "subTotalAmount" numeric(10,2),
    "discount" numeric(10,2),
    "taxRate" numeric(5,2),
    "vatRate" numeric(5,2),
    "taxAmount" numeric(10,2),
    "totalAmount" numeric(10,2),
    "hasDiscount" boolean DEFAULT false,
    "hasTax" boolean DEFAULT false,
    "hasVat" boolean DEFAULT false,
    "state" "text",
    "paymentType" "text",
    "paymentLink" "text",
    "paymentDetails" "jsonb",
    "paymentConfirmedAt" timestamp with time zone,
    "receiptDetails" "jsonb",
    "notes" "text",
    "sentViaEmail" boolean DEFAULT false,
    "emailSentAt" timestamp with time zone,
    "creationMethod" "text",
    "issuedBy" "text",
    "organizationId" "uuid",
    "customerId" "uuid",
    "projectId" "uuid",
    "invoiceId" "uuid",
    "createdBy" "uuid" DEFAULT "auth"."uid"(),
    "organizationName" "text",
    "organizationEmail" "public"."citext",
    "organizationLogo" "text",
    "recepientName" "text",
    "recepientEmail" "public"."citext",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"(),
    "fts" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"simple"'::"regconfig", (((((("receiptNumber" || ' '::"text") || COALESCE("state", ''::"text")) || ' '::"text") || COALESCE("recepientName", ''::"text")) || ' '::"text") || (COALESCE("recepientEmail", ''::"public"."citext"))::"text"))) STORED
);


ALTER TABLE "public"."receipts" OWNER TO "postgres";


COMMENT ON TABLE "public"."receipts" IS 'Receipt and payment confirmation';



CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" integer NOT NULL,
    "planType" "public"."plan_type_enum",
    "billingCycle" "public"."billing_cycle_enum",
    "subscriptionStatus" "public"."subscription_status_enum",
    "amount" numeric(10,2),
    "currency" "text",
    "startsAt" timestamp with time zone,
    "endsAt" timestamp with time zone,
    "stripeCustomerId" "text",
    "stripeSubscriptionId" "text",
    "stripeMetadata" "jsonb",
    "paymentMethod" "jsonb",
    "organizationId" "uuid",
    "createdBy" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


COMMENT ON TABLE "public"."subscriptions" IS 'Subscription and billing data';



CREATE SEQUENCE IF NOT EXISTS "public"."subscriptions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."subscriptions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."subscriptions_id_seq" OWNED BY "public"."subscriptions"."id";



CREATE TABLE IF NOT EXISTS "public"."vault" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "bucketurl" "text",
    "tabletpye" "text",
    "typeid" "text",
    "customerid" "uuid",
    "projectid" "uuid",
    "invoiceid" "uuid",
    "feedbackid" "uuid",
    "rceeiptid" "uuid",
    "lnikid" "uuid",
    "createdby" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vault" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallet" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "walletName" "text",
    "walletAddress" "text",
    "crypto" "text",
    "isDefault" boolean DEFAULT false,
    "organizationId" "uuid",
    "createdBy" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wallet" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."walls" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text",
    "description" "text",
    "type" "text",
    "state" "text",
    "private" boolean DEFAULT false,
    "content" "jsonb",
    "analytics" "jsonb",
    "notes" "text",
    "slug" "text",
    "issueDate" timestamp with time zone,
    "organizationId" "uuid",
    "customerId" "uuid",
    "projectId" "uuid",
    "createdBy" "uuid",
    "organizationName" "text",
    "organizationEmail" "public"."citext",
    "organizationLogo" "text",
    "recepientName" "text",
    "recepientEmail" "public"."citext",
    "token" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"(),
    "fts" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"simple"'::"regconfig", (((((("name" || ' '::"text") || COALESCE("description", ''::"text")) || ' '::"text") || COALESCE("recepientName", ''::"text")) || ' '::"text") || (COALESCE("recepientEmail", ''::"public"."citext"))::"text"))) STORED
);


ALTER TABLE "public"."walls" OWNER TO "postgres";


COMMENT ON TABLE "public"."walls" IS 'Wall content and analytics';



ALTER TABLE ONLY "public"."subscriptions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."subscriptions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."banks_duplicate"
    ADD CONSTRAINT "banks_duplicate_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."banks"
    ADD CONSTRAINT "banks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cancellations"
    ADD CONSTRAINT "cancellations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_activities"
    ADD CONSTRAINT "customer_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deliverables"
    ADD CONSTRAINT "deliverables_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback_templates"
    ADD CONSTRAINT "feedback_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."link_items"
    ADD CONSTRAINT "link_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization"
    ADD CONSTRAINT "organization_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."paths"
    ADD CONSTRAINT "paths_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."paymentTerms"
    ADD CONSTRAINT "paymentterms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pricing"
    ADD CONSTRAINT "pricing_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pricing"
    ADD CONSTRAINT "pricing_stripe_price_id_unique" UNIQUE ("stripePriceId");



ALTER TABLE ONLY "public"."pricing"
    ADD CONSTRAINT "pricing_stripe_product_id_unique" UNIQUE ("stripeProductId");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_stripe_product_id_unique" UNIQUE ("stripeProductId");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vault"
    ADD CONSTRAINT "vault_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wallet"
    ADD CONSTRAINT "wallet_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."walls"
    ADD CONSTRAINT "walls_pkey" PRIMARY KEY ("id");



CREATE INDEX "banks_duplicate_organizationid_idx" ON "public"."banks_duplicate" USING "btree" ("organizationId");



CREATE INDEX "idx_audit_log_changedon" ON "public"."audit_log" USING "btree" ("changedOn");



CREATE INDEX "idx_audit_log_changesummary" ON "public"."audit_log" USING "gin" ("changeSummary");



CREATE INDEX "idx_audit_log_createdby" ON "public"."audit_log" USING "btree" ("createdBy");



CREATE INDEX "idx_audit_log_organization_id" ON "public"."audit_log" USING "btree" ("organizationId");



CREATE INDEX "idx_audit_log_organizationid" ON "public"."audit_log" USING "btree" ("organizationId");



CREATE INDEX "idx_audit_log_recordid" ON "public"."audit_log" USING "btree" ("recordId");



CREATE INDEX "idx_audit_log_tablename" ON "public"."audit_log" USING "btree" ("tableName");



CREATE INDEX "idx_banks_organization_id" ON "public"."banks" USING "btree" ("organizationId");



CREATE INDEX "idx_customer_activities_customer_id" ON "public"."customer_activities" USING "btree" ("customerId");



CREATE INDEX "idx_customer_activities_organization_id" ON "public"."customer_activities" USING "btree" ("organizationId");



CREATE INDEX "idx_customers_email" ON "public"."customers" USING "gin" ("to_tsvector"('"simple"'::"regconfig", ("email")::"text"));



CREATE INDEX "idx_customers_email_ilike" ON "public"."customers" USING "btree" ("email");



CREATE INDEX "idx_customers_fts" ON "public"."customers" USING "gin" ("fts");



CREATE INDEX "idx_customers_organization_id" ON "public"."customers" USING "btree" ("organizationId");



CREATE INDEX "idx_feedbacks_customer_id" ON "public"."feedbacks" USING "btree" ("customerId");



CREATE INDEX "idx_feedbacks_fts" ON "public"."feedbacks" USING "gin" ("fts");



CREATE INDEX "idx_feedbacks_organization_id" ON "public"."feedbacks" USING "btree" ("organizationId");



CREATE INDEX "idx_feedbacks_project_id" ON "public"."feedbacks" USING "btree" ("projectId");



CREATE INDEX "idx_invoices_customer_id" ON "public"."invoices" USING "btree" ("customerId");



CREATE INDEX "idx_invoices_fts" ON "public"."invoices" USING "gin" ("fts");



CREATE INDEX "idx_invoices_org_invoice_number" ON "public"."invoices" USING "btree" ("organizationId", "invoiceNumber");



CREATE INDEX "idx_invoices_organization_id" ON "public"."invoices" USING "btree" ("organizationId");



CREATE INDEX "idx_invoices_project_id" ON "public"."invoices" USING "btree" ("projectId");



CREATE INDEX "idx_members_organization_id" ON "public"."members" USING "btree" ("organizationId");



CREATE INDEX "idx_notifications_organization_id" ON "public"."notifications" USING "btree" ("organizationId");



CREATE INDEX "idx_organization_fts" ON "public"."organization" USING "gin" ("fts");



CREATE INDEX "idx_organization_plantype" ON "public"."organization" USING "btree" ("planType");



CREATE INDEX "idx_organization_stripemetadata" ON "public"."organization" USING "gin" ("stripeMetadata");



CREATE INDEX "idx_organization_subscriptionenddate" ON "public"."organization" USING "btree" ("subscriptionEndDate");



CREATE INDEX "idx_organization_subscriptionstatus" ON "public"."organization" USING "btree" ("subscriptionStatus");



CREATE INDEX "idx_organization_trialendsat" ON "public"."organization" USING "btree" ("trialEndsAt");



CREATE INDEX "idx_paths_customer_id" ON "public"."paths" USING "btree" ("customerId");



CREATE INDEX "idx_paths_fts" ON "public"."paths" USING "gin" ("fts");



CREATE INDEX "idx_paths_organization_id" ON "public"."paths" USING "btree" ("organizationId");



CREATE INDEX "idx_pricing_active" ON "public"."pricing" USING "btree" ("isActive") WHERE ("isActive" = true);



CREATE INDEX "idx_pricing_product_id" ON "public"."pricing" USING "btree" ("productId");



CREATE INDEX "idx_pricing_stripe_id" ON "public"."pricing" USING "btree" ("stripePriceId");



CREATE INDEX "idx_products_stripe_id" ON "public"."products" USING "btree" ("stripeProductId");



CREATE INDEX "idx_profiles_organization_id" ON "public"."profiles" USING "btree" ("organizationId");



CREATE INDEX "idx_projects_customer_id" ON "public"."projects" USING "btree" ("customerId");



CREATE INDEX "idx_projects_fts" ON "public"."projects" USING "gin" ("fts");



CREATE INDEX "idx_projects_organization_id" ON "public"."projects" USING "btree" ("organizationId");



CREATE INDEX "idx_receipts_customer_id" ON "public"."receipts" USING "btree" ("customerId");



CREATE INDEX "idx_receipts_fts" ON "public"."receipts" USING "gin" ("fts");



CREATE INDEX "idx_receipts_org_receipt_number" ON "public"."receipts" USING "btree" ("organizationId", "receiptNumber");



CREATE INDEX "idx_receipts_organization_id" ON "public"."receipts" USING "btree" ("organizationId");



CREATE INDEX "idx_receipts_project_id" ON "public"."receipts" USING "btree" ("projectId");



CREATE INDEX "idx_subscriptions_organization_id" ON "public"."subscriptions" USING "btree" ("organizationId");



CREATE INDEX "idx_wallet_organization_id" ON "public"."wallet" USING "btree" ("organizationId");



CREATE INDEX "idx_walls_customer_id" ON "public"."walls" USING "btree" ("customerId");



CREATE INDEX "idx_walls_fts" ON "public"."walls" USING "gin" ("fts");



CREATE INDEX "idx_walls_organization_id" ON "public"."walls" USING "btree" ("organizationId");



CREATE INDEX "idx_walls_project_id" ON "public"."walls" USING "btree" ("projectId");



CREATE OR REPLACE TRIGGER "audit_log_customers_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_customers_trigger"();



CREATE OR REPLACE TRIGGER "audit_log_feedbacks_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."feedbacks" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_feedbacks_trigger"();



CREATE OR REPLACE TRIGGER "audit_log_invoices_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_invoices_trigger"();



CREATE OR REPLACE TRIGGER "audit_log_projects_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_projects_trigger"();



CREATE OR REPLACE TRIGGER "audit_log_receipts_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."receipts" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_receipts_trigger"();



CREATE OR REPLACE TRIGGER "trigger_set_invoice_number" BEFORE INSERT ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."set_invoice_number"();



CREATE OR REPLACE TRIGGER "trigger_set_receipt_number" BEFORE INSERT ON "public"."receipts" FOR EACH ROW EXECUTE FUNCTION "public"."set_receipt_number"();



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_organizationid_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id");



ALTER TABLE ONLY "public"."banks"
    ADD CONSTRAINT "banks_createdby_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."profiles"("profile_id");



ALTER TABLE ONLY "public"."banks_duplicate"
    ADD CONSTRAINT "banks_duplicate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."profiles"("profile_id");



ALTER TABLE ONLY "public"."banks_duplicate"
    ADD CONSTRAINT "banks_duplicate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id");



ALTER TABLE ONLY "public"."banks"
    ADD CONSTRAINT "banks_organizationid_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id");



ALTER TABLE ONLY "public"."cancellations"
    ADD CONSTRAINT "cancellations_organizationid_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id");



ALTER TABLE ONLY "public"."customer_activities"
    ADD CONSTRAINT "customer_activities_createdby_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."profiles"("profile_id");



ALTER TABLE ONLY "public"."customer_activities"
    ADD CONSTRAINT "customer_activities_customerid_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."customer_activities"
    ADD CONSTRAINT "customer_activities_organizationid_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_createdby_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."profiles"("profile_id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_organizationid_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id");



ALTER TABLE ONLY "public"."deliverables"
    ADD CONSTRAINT "deliverables_createdby_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."profiles"("profile_id");



ALTER TABLE ONLY "public"."deliverables"
    ADD CONSTRAINT "deliverables_projectid_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."feedback_templates"
    ADD CONSTRAINT "feedback_templates_createdby_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."profiles"("profile_id");



ALTER TABLE ONLY "public"."feedback_templates"
    ADD CONSTRAINT "feedback_templates_organizationid_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id");



ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_createdby_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."profiles"("profile_id");



ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_customerid_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_organizationid_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id");



ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_projectid_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_createdby_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."profiles"("profile_id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_customerid_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_organizationid_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_projectid_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."link_items"
    ADD CONSTRAINT "link_items_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "public"."paths"("id");



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_organizationid_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_createdby_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."profiles"("profile_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_organizationid_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id");



ALTER TABLE ONLY "public"."organization"
    ADD CONSTRAINT "organization_createdby_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."profiles"("profile_id");



ALTER TABLE ONLY "public"."paths"
    ADD CONSTRAINT "paths_createdby_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."profiles"("profile_id");



ALTER TABLE ONLY "public"."paths"
    ADD CONSTRAINT "paths_customerid_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."paths"
    ADD CONSTRAINT "paths_organizationid_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id");



ALTER TABLE ONLY "public"."paymentTerms"
    ADD CONSTRAINT "paymentterms_createdby_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."profiles"("profile_id");



ALTER TABLE ONLY "public"."paymentTerms"
    ADD CONSTRAINT "paymentterms_deliverableid_fkey" FOREIGN KEY ("deliverableId") REFERENCES "public"."deliverables"("id");



ALTER TABLE ONLY "public"."paymentTerms"
    ADD CONSTRAINT "paymentterms_organizationid_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id");



ALTER TABLE ONLY "public"."paymentTerms"
    ADD CONSTRAINT "paymentterms_projectid_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."pricing"
    ADD CONSTRAINT "pricing_productid_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_createdby_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."profiles"("profile_id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_customerid_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_organizationid_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id");



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_createdby_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."profiles"("profile_id");



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_customerid_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_invoiceid_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."invoices"("id");



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_organizationid_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id");



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_projectid_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_createdby_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."profiles"("profile_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_organizationid_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id");



ALTER TABLE ONLY "public"."vault"
    ADD CONSTRAINT "vault_createdby_fkey" FOREIGN KEY ("createdby") REFERENCES "public"."profiles"("profile_id");



ALTER TABLE ONLY "public"."vault"
    ADD CONSTRAINT "vault_customerid_fkey" FOREIGN KEY ("customerid") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."vault"
    ADD CONSTRAINT "vault_feedbackid_fkey" FOREIGN KEY ("feedbackid") REFERENCES "public"."feedbacks"("id");



ALTER TABLE ONLY "public"."vault"
    ADD CONSTRAINT "vault_invoiceid_fkey" FOREIGN KEY ("invoiceid") REFERENCES "public"."invoices"("id");



ALTER TABLE ONLY "public"."vault"
    ADD CONSTRAINT "vault_lnikid_fkey" FOREIGN KEY ("lnikid") REFERENCES "public"."paths"("id");



ALTER TABLE ONLY "public"."vault"
    ADD CONSTRAINT "vault_projectid_fkey" FOREIGN KEY ("projectid") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."vault"
    ADD CONSTRAINT "vault_rceeiptid_fkey" FOREIGN KEY ("rceeiptid") REFERENCES "public"."receipts"("id");



ALTER TABLE ONLY "public"."wallet"
    ADD CONSTRAINT "wallet_createdby_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."profiles"("profile_id");



ALTER TABLE ONLY "public"."wallet"
    ADD CONSTRAINT "wallet_organizationid_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id");



ALTER TABLE ONLY "public"."walls"
    ADD CONSTRAINT "walls_createdby_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."profiles"("profile_id");



ALTER TABLE ONLY "public"."walls"
    ADD CONSTRAINT "walls_customerid_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."walls"
    ADD CONSTRAINT "walls_organizationid_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id");



ALTER TABLE ONLY "public"."walls"
    ADD CONSTRAINT "walls_projectid_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id");



CREATE POLICY "Delete based on user id " ON "public"."receipts" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "createdBy"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."audit_log" FOR DELETE TO "authenticated" USING ((("auth"."uid"())::"text" = "createdBy"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."banks" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "createdBy"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."customers" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "createdBy"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."deliverables" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "createdBy"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."feedback_templates" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "createdBy"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."feedbacks" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "createdBy"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."invoices" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "createdBy"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."organization" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "createdBy"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."paths" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "createdBy"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."paymentTerms" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "createdBy"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."projects" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "createdBy"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."receipts" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "createdBy"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."subscriptions" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "createdBy"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."wallet" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "createdBy"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."walls" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "createdBy"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."audit_log" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."banks" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."cancellations" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."customer_activities" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."customers" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."deliverables" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."feedback_templates" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."feedbacks" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."invoices" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."link_items" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."members" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."notifications" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."organization" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."paths" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."paymentTerms" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."pricing" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."products" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."projects" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."receipts" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."subscriptions" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."wallet" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."walls" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."audit_log" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."banks" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."cancellations" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."customer_activities" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."customers" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."deliverables" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."feedback_templates" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."feedbacks" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."invoices" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."link_items" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."members" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."notifications" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."organization" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."paths" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."paymentTerms" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."pricing" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."products" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."projects" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."receipts" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."subscriptions" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."wallet" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."walls" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Policy with table joins" ON "public"."organization" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "createdBy"));



CREATE POLICY "Update based on user Id" ON "public"."customers" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "createdBy"));



CREATE POLICY "Update based on user id" ON "public"."banks" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "createdBy")) WITH CHECK (("auth"."uid"() = "createdBy"));



CREATE POLICY "Update based on user id" ON "public"."feedback_templates" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "createdBy"));



CREATE POLICY "Update based on user id" ON "public"."invoices" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "createdBy"));



CREATE POLICY "Update based on user id" ON "public"."subscriptions" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "createdBy"));



CREATE POLICY "Update based on user id " ON "public"."deliverables" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "createdBy"));



CREATE POLICY "Update based on user id " ON "public"."wallet" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "createdBy"));



CREATE POLICY "Update based on user id " ON "public"."walls" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "createdBy"));



CREATE POLICY "Update user based on id" ON "public"."audit_log" FOR UPDATE TO "authenticated", "anon" USING ((("auth"."uid"())::"text" = "createdBy"));



ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."banks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cancellations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deliverables" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedbacks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."link_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."paths" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."paymentTerms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pricing" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."receipts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update based on user id" ON "public"."feedbacks" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "createdBy"));



CREATE POLICY "update based on user id" ON "public"."paths" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "createdBy"));



CREATE POLICY "update based on user id" ON "public"."paymentTerms" FOR UPDATE USING (("auth"."uid"() = "createdBy"));



CREATE POLICY "updated based on user id" ON "public"."projects" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "createdBy"));



ALTER TABLE "public"."wallet" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."walls" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext"(character) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "anon";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext"("inet") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "anon";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "service_role";

















































































































































































GRANT ALL ON FUNCTION "public"."audit_log_customers_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_log_customers_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_log_customers_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_log_feedbacks_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_log_feedbacks_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_log_feedbacks_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_log_invoices_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_log_invoices_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_log_invoices_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_log_projects_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_log_projects_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_log_projects_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_log_receipts_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_log_receipts_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_log_receipts_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invoice_number"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invoice_number"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invoice_number"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_receipt_number"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_receipt_number"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_receipt_number"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_recent_items"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_recent_items"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recent_items"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."regenerate_invoice_numbers"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."regenerate_invoice_numbers"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regenerate_invoice_numbers"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."regenerate_receipt_numbers"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."regenerate_receipt_numbers"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regenerate_receipt_numbers"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_invoice_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_invoice_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_invoice_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_receipt_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_receipt_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_receipt_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."smart_universal_search"("search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."smart_universal_search"("search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."smart_universal_search"("search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "service_role";












GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "service_role";









GRANT ALL ON TABLE "public"."analytics_events" TO "anon";
GRANT ALL ON TABLE "public"."analytics_events" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_events" TO "service_role";



GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."banks" TO "anon";
GRANT ALL ON TABLE "public"."banks" TO "authenticated";
GRANT ALL ON TABLE "public"."banks" TO "service_role";



GRANT ALL ON TABLE "public"."banks_duplicate" TO "anon";
GRANT ALL ON TABLE "public"."banks_duplicate" TO "authenticated";
GRANT ALL ON TABLE "public"."banks_duplicate" TO "service_role";



GRANT ALL ON TABLE "public"."cancellations" TO "anon";
GRANT ALL ON TABLE "public"."cancellations" TO "authenticated";
GRANT ALL ON TABLE "public"."cancellations" TO "service_role";



GRANT ALL ON TABLE "public"."customer_activities" TO "anon";
GRANT ALL ON TABLE "public"."customer_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_activities" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."deliverables" TO "anon";
GRANT ALL ON TABLE "public"."deliverables" TO "authenticated";
GRANT ALL ON TABLE "public"."deliverables" TO "service_role";



GRANT ALL ON TABLE "public"."feedback_templates" TO "anon";
GRANT ALL ON TABLE "public"."feedback_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback_templates" TO "service_role";



GRANT ALL ON TABLE "public"."feedbacks" TO "anon";
GRANT ALL ON TABLE "public"."feedbacks" TO "authenticated";
GRANT ALL ON TABLE "public"."feedbacks" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."link_items" TO "anon";
GRANT ALL ON TABLE "public"."link_items" TO "authenticated";
GRANT ALL ON TABLE "public"."link_items" TO "service_role";



GRANT ALL ON TABLE "public"."members" TO "anon";
GRANT ALL ON TABLE "public"."members" TO "authenticated";
GRANT ALL ON TABLE "public"."members" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."organization" TO "anon";
GRANT ALL ON TABLE "public"."organization" TO "authenticated";
GRANT ALL ON TABLE "public"."organization" TO "service_role";



GRANT ALL ON TABLE "public"."paths" TO "anon";
GRANT ALL ON TABLE "public"."paths" TO "authenticated";
GRANT ALL ON TABLE "public"."paths" TO "service_role";



GRANT ALL ON TABLE "public"."paymentTerms" TO "anon";
GRANT ALL ON TABLE "public"."paymentTerms" TO "authenticated";
GRANT ALL ON TABLE "public"."paymentTerms" TO "service_role";



GRANT ALL ON TABLE "public"."pricing" TO "anon";
GRANT ALL ON TABLE "public"."pricing" TO "authenticated";
GRANT ALL ON TABLE "public"."pricing" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."receipts" TO "anon";
GRANT ALL ON TABLE "public"."receipts" TO "authenticated";
GRANT ALL ON TABLE "public"."receipts" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."subscriptions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."subscriptions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."subscriptions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."vault" TO "anon";
GRANT ALL ON TABLE "public"."vault" TO "authenticated";
GRANT ALL ON TABLE "public"."vault" TO "service_role";



GRANT ALL ON TABLE "public"."wallet" TO "anon";
GRANT ALL ON TABLE "public"."wallet" TO "authenticated";
GRANT ALL ON TABLE "public"."wallet" TO "service_role";



GRANT ALL ON TABLE "public"."walls" TO "anon";
GRANT ALL ON TABLE "public"."walls" TO "authenticated";
GRANT ALL ON TABLE "public"."walls" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
