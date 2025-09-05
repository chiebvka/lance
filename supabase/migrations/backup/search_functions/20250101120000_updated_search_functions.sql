-- Updated search functions with walls and paths support
-- This migration updates the existing search functions to include walls and paths

-- First, update FTS columns for all tables including walls and paths
-- Drop existing FTS columns if they exist
ALTER TABLE customers DROP COLUMN IF EXISTS fts;
ALTER TABLE projects DROP COLUMN IF EXISTS fts;
ALTER TABLE invoices DROP COLUMN IF EXISTS fts;
ALTER TABLE feedbacks DROP COLUMN IF EXISTS fts;
ALTER TABLE receipts DROP COLUMN IF EXISTS fts;
ALTER TABLE walls DROP COLUMN IF EXISTS fts;
ALTER TABLE paths DROP COLUMN IF EXISTS fts;

-- Recreate with better email handling and include walls and paths
ALTER TABLE projects ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (to_tsvector('simple', name || ' ' || coalesce(description, ''))) STORED;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (to_tsvector('simple', name || ' ' || coalesce(email, '') || ' ' || coalesce(phone, ''))) STORED;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (to_tsvector('simple', "invoiceNumber" || ' ' || coalesce(status, '') || ' ' || coalesce("recepientName", '') || ' ' || coalesce("recepientEmail", ''))) STORED;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (to_tsvector('simple', (questions->>'title') || ' ' || coalesce(state, '') || ' ' || coalesce("recepientName", '') || ' ' || coalesce("recepientEmail", ''))) STORED;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (to_tsvector('simple', "receiptNumber" || ' ' || coalesce(status, '') || ' ' || coalesce("recepientName", '') || ' ' || coalesce("recepientEmail", ''))) STORED;
ALTER TABLE walls ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (to_tsvector('simple', name || ' ' || coalesce(description, '') || ' ' || coalesce("recepientName", '') || ' ' || coalesce("recepientEmail", ''))) STORED;
ALTER TABLE paths ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (to_tsvector('simple', name || ' ' || coalesce(description, '') || ' ' || coalesce("recepientName", '') || ' ' || coalesce("recepientEmail", ''))) STORED;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_fts ON projects USING GIN(fts);
CREATE INDEX IF NOT EXISTS idx_customers_fts ON customers USING GIN(fts);
CREATE INDEX IF NOT EXISTS idx_invoices_fts ON invoices USING GIN(fts);
CREATE INDEX IF NOT EXISTS idx_feedbacks_fts ON feedbacks USING GIN(fts);
CREATE INDEX IF NOT EXISTS idx_receipts_fts ON receipts USING GIN(fts);
CREATE INDEX IF NOT EXISTS idx_walls_fts ON walls USING GIN(fts);
CREATE INDEX IF NOT EXISTS idx_paths_fts ON paths USING GIN(fts);

-- Add additional indexes for email search
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers USING GIN(to_tsvector('simple', email));
CREATE INDEX IF NOT EXISTS idx_customers_email_ilike ON customers(email);

-- Updated get_recent_items function with walls and paths
CREATE OR REPLACE FUNCTION get_recent_items()
RETURNS TABLE(category TEXT, id TEXT, name TEXT, type TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql
AS $$
  (
    SELECT 'projects' AS category, p.id::text, p.name, p.status AS type, p."startDate" AS created_at
    FROM projects p ORDER BY p."startDate" DESC LIMIT 2
  ) UNION ALL (
    SELECT 'customers' AS category, c.id::text, c.name, 'Customer' AS type, c.created_at AS created_at
    FROM customers c ORDER BY c.created_at DESC LIMIT 2
  ) UNION ALL (
    SELECT 'invoices' AS category, i.id::text, i."invoiceNumber" AS name, i.status AS type, i.created_at AS created_at
    FROM invoices i ORDER BY i.created_at DESC LIMIT 2
  ) UNION ALL (
    SELECT 'feedbacks' AS category, f.id::text, (f.questions->>'title')::text AS name, f.state AS type, f.created_at AS created_at
    FROM feedbacks f ORDER BY f.created_at DESC LIMIT 2
  ) UNION ALL (
    SELECT 'receipts' AS category, r.id::text, r."receiptNumber" AS name, r.status AS type, r.created_at AS created_at
    FROM receipts r ORDER BY r.created_at DESC LIMIT 2
  ) UNION ALL (
    SELECT 'walls' AS category, w.id::text, w.name, w.type AS type, w.created_at AS created_at
    FROM walls w ORDER BY w.created_at DESC LIMIT 2
  ) UNION ALL (
    SELECT 'paths' AS category, pa.id::text, pa.name, pa.type AS type, pa.created_at AS created_at
    FROM paths pa ORDER BY pa.created_at DESC LIMIT 2
  )
$$;
