-- Drop existing FTS columns if they exist
ALTER TABLE customers DROP COLUMN IF EXISTS fts;
ALTER TABLE projects DROP COLUMN IF EXISTS fts;
ALTER TABLE invoices DROP COLUMN IF EXISTS fts;
ALTER TABLE feedbacks DROP COLUMN IF EXISTS fts;
ALTER TABLE receipts DROP COLUMN IF EXISTS fts;

-- Recreate with better email handling
ALTER TABLE projects ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (to_tsvector('simple', name || ' ' || coalesce(description, ''))) STORED;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (to_tsvector('simple', name || ' ' || coalesce(email, '') || ' ' || coalesce(phone, ''))) STORED;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (to_tsvector('simple', "invoiceNumber" || ' ' || coalesce(status, ''))) STORED;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (to_tsvector('simple', (questions->>'title') || ' ' || coalesce(state, ''))) STORED;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (to_tsvector('simple', "receiptNumber" || ' ' || coalesce(status, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_projects_fts ON projects USING GIN(fts);
CREATE INDEX IF NOT EXISTS idx_customers_fts ON customers USING GIN(fts);
CREATE INDEX IF NOT EXISTS idx_invoices_fts ON invoices USING GIN(fts);
CREATE INDEX IF NOT EXISTS idx_feedbacks_fts ON feedbacks USING GIN(fts);
CREATE INDEX IF NOT EXISTS idx_receipts_fts ON receipts USING GIN(fts);

-- Add additional indexes for email search
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers USING GIN(to_tsvector('simple', email));
CREATE INDEX IF NOT EXISTS idx_customers_email_ilike ON customers(email);

