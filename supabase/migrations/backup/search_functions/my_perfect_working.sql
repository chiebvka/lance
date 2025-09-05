-- Manual Search Function Updates
-- Copy and paste this entire script into your Supabase Studio SQL editor

-- Step 1: Update FTS columns for all tables including walls and paths
-- Drop existing FTS columns if they exist (this won't delete your data, just the search columns)
ALTER TABLE customers DROP COLUMN IF EXISTS fts;
ALTER TABLE projects DROP COLUMN IF EXISTS fts;
ALTER TABLE invoices DROP COLUMN IF EXISTS fts;
ALTER TABLE feedbacks DROP COLUMN IF EXISTS fts;
ALTER TABLE receipts DROP COLUMN IF EXISTS fts;
ALTER TABLE walls DROP COLUMN IF EXISTS fts;
ALTER TABLE paths DROP COLUMN IF EXISTS fts;

-- Step 2: Recreate FTS columns with better search capabilities
ALTER TABLE projects ADD COLUMN fts tsvector GENERATED ALWAYS AS (to_tsvector('simple', name || ' ' || coalesce(description, ''))) STORED;
ALTER TABLE customers ADD COLUMN fts tsvector GENERATED ALWAYS AS (to_tsvector('simple', name || ' ' || coalesce(email, '') || ' ' || coalesce(phone, ''))) STORED;
ALTER TABLE invoices ADD COLUMN fts tsvector GENERATED ALWAYS AS (to_tsvector('simple', "invoiceNumber" || ' ' || coalesce(state, '') || ' ' || coalesce("recepientName", '') || ' ' || coalesce("recepientEmail", ''))) STORED;
ALTER TABLE feedbacks ADD COLUMN fts tsvector GENERATED ALWAYS AS (to_tsvector('simple', (questions->>'title') || ' ' || coalesce(state, '') || ' ' || coalesce("recepientName", '') || ' ' || coalesce("recepientEmail", ''))) STORED;
ALTER TABLE receipts ADD COLUMN fts tsvector GENERATED ALWAYS AS (to_tsvector('simple', "receiptNumber" || ' ' || coalesce(state, '') || ' ' || coalesce("recepientName", '') || ' ' || coalesce("recepientEmail", ''))) STORED;
ALTER TABLE walls ADD COLUMN fts tsvector GENERATED ALWAYS AS (to_tsvector('simple', name || ' ' || coalesce(description, '') || ' ' || coalesce("recepientName", '') || ' ' || coalesce("recepientEmail", ''))) STORED;
ALTER TABLE paths ADD COLUMN fts tsvector GENERATED ALWAYS AS (to_tsvector('simple', name || ' ' || coalesce(description, '') || ' ' || coalesce("recepientName", '') || ' ' || coalesce("recepientEmail", ''))) STORED;

-- Step 3: Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_projects_fts ON projects USING GIN(fts);
CREATE INDEX IF NOT EXISTS idx_customers_fts ON customers USING GIN(fts);
CREATE INDEX IF NOT EXISTS idx_invoices_fts ON invoices USING GIN(fts);
CREATE INDEX IF NOT EXISTS idx_feedbacks_fts ON feedbacks USING GIN(fts);
CREATE INDEX IF NOT EXISTS idx_receipts_fts ON receipts USING GIN(fts);
CREATE INDEX IF NOT EXISTS idx_walls_fts ON walls USING GIN(fts);
CREATE INDEX IF NOT EXISTS idx_paths_fts ON paths USING GIN(fts);

-- Step 4: Add additional indexes for email search
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers USING GIN(to_tsvector('simple', email));
CREATE INDEX IF NOT EXISTS idx_customers_email_ilike ON customers(email);

-- Step 5: Update the get_recent_items function to include walls and paths
CREATE OR REPLACE FUNCTION get_recent_items()
RETURNS TABLE(category TEXT, id TEXT, name TEXT, type TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql
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

-- Step 6: Update the smart_universal_search function with walls and paths support
CREATE OR REPLACE FUNCTION smart_universal_search(search_term TEXT)
RETURNS TABLE(
  category        TEXT,
  id              TEXT,
  name            TEXT,
  type            TEXT,
  rank            REAL,
  related_category TEXT,
  "customerId"    TEXT,
  "projectId"     TEXT
)
LANGUAGE sql
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
