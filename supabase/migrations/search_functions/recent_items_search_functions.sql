-- Function 1: Get recent items from all specified tables
CREATE OR REPLACE FUNCTION get_recent_items()
RETURNS TABLE(category TEXT, id TEXT, name TEXT, type TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql
AS $$
  (
    SELECT 'projects' AS category, p.id::text, p.name, p.status AS type, p."startDate" AS created_at
    FROM projects p ORDER BY p."startDate" DESC LIMIT 3
  ) UNION ALL (
    SELECT 'customers' AS category, c.id::text, c.name, 'Customer' AS type, c.created_at AS created_at
    FROM customers c ORDER BY c.created_at DESC LIMIT 3
  ) UNION ALL (
    SELECT 'invoices' AS category, i.id::text, i."invoiceNumber" AS name, i.status AS type, i.created_at AS created_at
    FROM invoices i ORDER BY i.created_at DESC LIMIT 3
  ) UNION ALL (
    SELECT 'feedbacks' AS category, f.id::text, (f.questions->>'title')::text AS name, f.state AS type, f.created_at AS created_at
    FROM feedbacks f ORDER BY f.created_at DESC LIMIT 3
  ) UNION ALL (
    SELECT 'receipts' AS category, r.id::text, r."receiptNumber" AS name, r.status AS type, r.created_at AS created_at
    FROM receipts r ORDER BY r.created_at DESC LIMIT 3
  )
$$;
























-- -- Function 1: Get recent items from all specified tables
-- CREATE OR REPLACE FUNCTION get_recent_items()
-- RETURNS TABLE(category TEXT, id TEXT, name TEXT, type TEXT, created_at TIMESTAMPTZ)
-- LANGUAGE sql
-- AS $$
--   (
--     SELECT 'projects' AS category, p.id::text, p.name, p.status AS type, p.startDate AS created_at
--     FROM projects p ORDER BY p.startDate DESC LIMIT 3
--   ) UNION ALL (
--     SELECT 'customers' AS category, c.id::text, c.name, 'Customer' AS type, c.created_at AS created_at
--     FROM customers c ORDER BY c.created_at DESC LIMIT 3
--   ) UNION ALL (
--     SELECT 'invoices' AS category, i.id::text, i.invoiceNumber AS name, i.status AS type, i.created_at AS created_at
--     FROM invoices i ORDER BY i.created_at DESC LIMIT 3
--   ) UNION ALL (
--     SELECT 'feedbacks' AS category, f.id::text, (f.questions->>'title')::text AS name, f.state AS type, f.created_at AS created_at
--     FROM feedbacks f ORDER BY f.created_at DESC LIMIT 3
--   ) UNION ALL (
--     SELECT 'receipts' AS category, r.id::text, r.receiptNumber AS name, r.status AS type, r.created_at AS created_at
--     FROM receipts r ORDER BY r.created_at DESC LIMIT 3
--   ) UNION ALL (
--     SELECT 'organization' AS category, o.id::text, o.name, o.baseCurrency AS type, o.created_at AS created_at
--     FROM organization o ORDER BY o.created_at DESC LIMIT 3
--   )
-- $$;