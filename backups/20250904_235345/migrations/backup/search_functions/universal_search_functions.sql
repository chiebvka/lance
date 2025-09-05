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
    p.status                        AS type,
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
    i.status                        AS type,
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
    r.status                        AS type,
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
    p.status                        AS type,
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
    i.status                        AS type,
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
    r.status                        AS type,
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
    i.status                        AS type,
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
    r.status                        AS type,
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









































-- -- Function 2: Smart universal search with customerId and projectId relationships
-- CREATE OR REPLACE FUNCTION smart_universal_search(search_term TEXT)
-- RETURNS TABLE(category TEXT, id TEXT, name TEXT, type TEXT, rank REAL, related_category TEXT, customerId TEXT, projectId TEXT)
-- LANGUAGE sql
-- AS $$
-- WITH direct_matches AS (
--   SELECT 'customers' AS category, c.id::text, c.name, 'Customer' AS type, ts_rank(c.fts, websearch_to_tsquery('english', search_term)) AS rank, NULL::TEXT AS related_category, NULL::TEXT AS customerId, NULL::TEXT AS projectId
--   FROM customers c
--   WHERE c.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'projects' AS category, p.id::text, p.name, p.status AS type, ts_rank(p.fts, websearch_to_tsquery('english', search_term)) AS rank, NULL::TEXT AS related_category, p.customerid::text AS customerId, NULL::TEXT AS projectId
--   FROM projects p
--   WHERE p.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'invoices' AS category, i.id::text, i.invoicenumber AS name, i.status AS type, ts_rank(i.fts, websearch_to_tsquery('english', search_term)) AS rank, NULL::TEXT AS related_category, i.customerid::text AS customerId, i.projectid::text AS projectId
--   FROM invoices i
--   WHERE i.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'feedbacks' AS category, f.id::text, (f.questions->>'title')::text AS name, f.state AS type, ts_rank(f.fts, websearch_to_tsquery('english', search_term)) AS rank, NULL::TEXT AS related_category, f.customerid::text AS customerId, f.projectid::text AS projectId
--   FROM feedbacks f
--   WHERE f.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'receipts' AS category, r.id::text, r.receiptnumber AS name, r.status AS type, ts_rank(r.fts, websearch_to_tsquery('english', search_term)) AS rank, NULL::TEXT AS related_category, r.customerid::text AS customerId, r.projectid::text AS projectId
--   FROM receipts r
--   WHERE r.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'organization' AS category, o.id::text, o.name, o.basecurrency AS type, ts_rank(o.fts, websearch_to_tsquery('english', search_term)) AS rank, NULL::TEXT AS related_category, NULL::TEXT AS customerId, NULL::TEXT AS projectId
--   FROM organization o
--   WHERE o.fts @@ websearch_to_tsquery('english', search_term)
-- ),
-- customer_ids AS (
--   SELECT id::text AS customer_id
--   FROM direct_matches
--   WHERE category = 'customers'
--   AND rank > 0.1
--   UNION
--   SELECT customerid AS customer_id
--   FROM direct_matches
--   WHERE customerid IS NOT NULL
--   AND category IN ('projects', 'invoices', 'feedbacks', 'receipts')
-- ),
-- project_ids AS (
--   SELECT id::text AS project_id
--   FROM direct_matches
--   WHERE category = 'projects'
--   AND rank > 0.1
--   UNION
--   SELECT projectid AS project_id
--   FROM direct_matches
--   WHERE projectid IS NOT NULL
--   AND category IN ('invoices', 'receipts', 'feedbacks')
-- ),
-- related_matches AS (
--   -- Customer-related matches
--   SELECT 'projects' AS category, p.id::text, p.name, p.status AS type, ts_rank(p.fts, websearch_to_tsquery('english', search_term)) AS rank, 'customers' AS related_category, p.customerid::text AS customerId, NULL::TEXT AS projectId
--   FROM projects p
--   JOIN customer_ids ci ON p.customerid::text = ci.customer_id
--   WHERE p.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'invoices' AS category, i.id::text, i.invoicenumber AS name, i.status AS type, ts_rank(i.fts, websearch_to_tsquery('english', search_term)) AS rank, 'customers' AS related_category, i.customerid::text AS customerId, i.projectid::text AS projectId
--   FROM invoices i
--   JOIN customer_ids ci ON i.customerid::text = ci.customer_id
--   WHERE i.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'feedbacks' AS category, f.id::text, (f.questions->>'title')::text AS name, f.state AS type, ts_rank(f.fts, websearch_to_tsquery('english', search_term)) AS rank, 'customers' AS related_category, f.customerid::text AS customerId, f.projectid::text AS projectId
--   FROM feedbacks f
--   JOIN customer_ids ci ON f.customerid::text = ci.customer_id
--   WHERE f.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'receipts' AS category, r.id::text, r.receiptnumber AS name, r.status AS type, ts_rank(r.fts, websearch_to_tsquery('english', search_term)) AS rank, 'customers' AS related_category, r.customerid::text AS customerId, r.projectid::text AS projectId
--   FROM receipts r
--   JOIN customer_ids ci ON r.customerid::text = ci.customer_id
--   WHERE r.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   -- Project-related matches
--   SELECT 'invoices' AS category, i.id::text, i.invoicenumber AS name, i.status AS type, ts_rank(i.fts, websearch_to_tsquery('english', search_term)) AS rank, 'projects' AS related_category, i.customerid::text AS customerId, i.projectid::text AS projectId
--   FROM invoices i
--   JOIN project_ids pi ON i.projectid::text = pi.project_id
--   WHERE i.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'feedbacks' AS category, f.id::text, (f.questions->>'title')::text AS name, f.state AS type, ts_rank(f.fts, websearch_to_tsquery('english', search_term)) AS rank, 'projects' AS related_category, f.customerid::text AS customerId, f.projectid::text AS projectId
--   FROM feedbacks f
--   JOIN project_ids pi ON f.projectid::text = pi.project_id
--   WHERE f.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'receipts' AS category, r.id::text, r.receiptnumber AS name, r.status AS type, ts_rank(r.fts, websearch_to_tsquery('english', search_term)) AS rank, 'projects' AS related_category, r.customerid::text AS customerId, r.projectid::text AS projectId
--   FROM receipts r
--   JOIN project_ids pi ON r.projectid::text = pi.project_id
--   WHERE r.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   -- Reverse customer match from other tables
--   SELECT 'customers' AS category, c.id::text, c.name, 'Customer' AS type, ts_rank(c.fts, websearch_to_tsquery('english', search_term)) AS rank,
--          (CASE WHEN dm.category IS NOT NULL THEN dm.category ELSE NULL END) AS related_category, c.id::text AS customerId, NULL::TEXT AS projectId
--   FROM customers c
--   JOIN (
--     SELECT customerid, category
--     FROM direct_matches
--     WHERE customerid IS NOT NULL
--     AND category IN ('projects','invoices','feedbacks','receipts')
--   ) dm ON c.id::text = dm.customerid
--   WHERE c.fts @@ websearch_to_tsquery('english', search_term)
-- )
-- SELECT category, id, name, type, rank, related_category, customerId, projectId
-- FROM direct_matches
-- WHERE rank > 0.1
-- UNION ALL
-- SELECT category, id, name, type, rank, related_category, customerId, projectId
-- FROM related_matches
-- ORDER BY rank DESC
-- LIMIT 30
-- $$;






















-- -- Function 2: Smart universal search with customerId and projectId relationships
-- CREATE OR REPLACE FUNCTION smart_universal_search(search_term TEXT)
-- RETURNS TABLE(category TEXT, id TEXT, name TEXT, type TEXT, rank REAL, related_category TEXT, customerId TEXT, projectId TEXT)
-- LANGUAGE sql
-- AS $$
-- WITH direct_matches AS (
--   SELECT 'customers' AS category, c.id::text, c.name, 'Customer' AS type, ts_rank(c.fts, websearch_to_tsquery('english', search_term)) AS rank, NULL::TEXT AS related_category, NULL::TEXT AS customerId, NULL::TEXT AS projectId
--   FROM customers c
--   WHERE c.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'projects' AS category, p.id::text, p.name, p.status AS type, ts_rank(p.fts, websearch_to_tsquery('english', search_term)) AS rank, NULL::TEXT AS related_category, p."customerId" AS customerId, NULL::TEXT AS projectId
--   FROM projects p
--   WHERE p.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'invoices' AS category, i.id::text, i."invoiceNumber" AS name, i.status AS type, ts_rank(i.fts, websearch_to_tsquery('english', search_term)) AS rank, NULL::TEXT AS related_category, i."customerId" AS customerId, i."projectId" AS projectId
--   FROM invoices i
--   WHERE i.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'feedbacks' AS category, f.id::text, (f.questions->>'title')::text AS name, f.state AS type, ts_rank(f.fts, websearch_to_tsquery('english', search_term)) AS rank, NULL::TEXT AS related_category, f."customerId" AS customerId, f."projectId" AS projectId
--   FROM feedbacks f
--   WHERE f.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'receipts' AS category, r.id::text, r."receiptNumber" AS name, r.status AS type, ts_rank(r.fts, websearch_to_tsquery('english', search_term)) AS rank, NULL::TEXT AS related_category, r."customerId" AS customerId, r."projectId" AS projectId
--   FROM receipts r
--   WHERE r.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'organization' AS category, o.id::text, o.name, o."baseCurrency" AS type, ts_rank(o.fts, websearch_to_tsquery('english', search_term)) AS rank, NULL::TEXT AS related_category, NULL::TEXT AS customerId, NULL::TEXT AS projectId
--   FROM organization o
--   WHERE o.fts @@ websearch_to_tsquery('english', search_term)
-- ),
-- customer_ids AS (
--   SELECT id::text AS customer_id
--   FROM direct_matches
--   WHERE category = 'customers'
--   AND rank > 0.1
--   UNION
--   SELECT "customerId" AS customer_id
--   FROM direct_matches
--   WHERE "customerId" IS NOT NULL
--   AND category IN ('projects', 'invoices', 'feedbacks', 'receipts')
-- ),
-- project_ids AS (
--   SELECT id::text AS project_id
--   FROM direct_matches
--   WHERE category = 'projects'
--   AND rank > 0.1
--   UNION
--   SELECT "projectId" AS project_id
--   FROM direct_matches
--   WHERE "projectId" IS NOT NULL
--   AND category IN ('invoices', 'receipts', 'feedbacks')
-- ),
-- related_matches AS (
--   -- Customer-related matches
--   SELECT 'projects' AS category, p.id::text, p.name, p.status AS type, ts_rank(p.fts, websearch_to_tsquery('english', search_term)) AS rank, 'customers' AS related_category, p."customerId" AS customerId, p."projectId" AS projectId
--   FROM projects p
--   JOIN customer_ids ci ON p."customerId" = ci.customer_id
--   WHERE p.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'invoices' AS category, i.id::text, i."invoiceNumber" AS name, i.status AS type, ts_rank(i.fts, websearch_to_tsquery('english', search_term)) AS rank, 'customers' AS related_category, i."customerId" AS customerId, i."projectId" AS projectId
--   FROM invoices i
--   JOIN customer_ids ci ON i."customerId" = ci.customer_id
--   WHERE i.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'feedbacks' AS category, f.id::text, (f.questions->>'title')::text AS name, f.state AS type, ts_rank(f.fts, websearch_to_tsquery('english', search_term)) AS rank, 'customers' AS related_category, f."customerId" AS customerId, f."projectId" AS projectId
--   FROM feedbacks f
--   JOIN customer_ids ci ON f."customerId" = ci.customer_id
--   WHERE f.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'receipts' AS category, r.id::text, r."receiptNumber" AS name, r.status AS type, ts_rank(r.fts, websearch_to_tsquery('english', search_term)) AS rank, 'customers' AS related_category, r."customerId" AS customerId, r."projectId" AS projectId
--   FROM receipts r
--   JOIN customer_ids ci ON r."customerId" = ci.customer_id
--   WHERE r.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   -- Project-related matches
--   SELECT 'invoices' AS category, i.id::text, i."invoiceNumber" AS name, i.status AS type, ts_rank(i.fts, websearch_to_tsquery('english', search_term)) AS rank, 'projects' AS related_category, i."customerId" AS customerId, i."projectId" AS projectId
--   FROM invoices i
--   JOIN project_ids pi ON i."projectId" = pi.project_id
--   WHERE i.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'feedbacks' AS category, f.id::text, (f.questions->>'title')::text AS name, f.state AS type, ts_rank(f.fts, websearch_to_tsquery('english', search_term)) AS rank, 'projects' AS related_category, f."customerId" AS customerId, f."projectId" AS projectId
--   FROM feedbacks f
--   JOIN project_ids pi ON f."projectId" = pi.project_id
--   WHERE f.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'receipts' AS category, r.id::text, r."receiptNumber" AS name, r.status AS type, ts_rank(r.fts, websearch_to_tsquery('english', search_term)) AS rank, 'projects' AS related_category, r."customerId" AS customerId, r."projectId" AS projectId
--   FROM receipts r
--   JOIN project_ids pi ON r."projectId" = pi.project_id
--   WHERE r.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   -- Reverse customer match from other tables
--   SELECT 'customers' AS category, c.id::text, c.name, 'Customer' AS type, ts_rank(c.fts, websearch_to_tsquery('english', search_term)) AS rank,
--          (CASE WHEN dm.category IS NOT NULL THEN dm.category ELSE NULL END) AS related_category, c.id::text AS customerId, NULL::TEXT AS projectId
--   FROM customers c
--   JOIN (
--     SELECT "customerId", category
--     FROM direct_matches
--     WHERE "customerId" IS NOT NULL
--     AND category IN ('projects', 'invoices', 'feedbacks', 'receipts')
--   ) dm ON c.id = dm."customerId"
--   WHERE c.fts @@ websearch_to_tsquery('english', search_term)
-- )
-- SELECT category, id, name, type, rank, related_category, customerId, projectId
-- FROM direct_matches
-- WHERE rank > 0.1
-- UNION ALL
-- SELECT category, id, name, type, rank, related_category, customerId, projectId
-- FROM related_matches
-- ORDER BY rank DESC
-- LIMIT 30
-- $$;






















-- -- Function 2: Smart universal search with customerId and projectId relationships
-- CREATE OR REPLACE FUNCTION smart_universal_search(search_term TEXT)
-- RETURNS TABLE(category TEXT, id TEXT, name TEXT, type TEXT, rank REAL, related_category TEXT)
-- LANGUAGE sql
-- AS $$
-- WITH direct_matches AS (
--   SELECT 'customers' AS category, c.id::text, c.name, 'Customer' AS type, ts_rank(c.fts, websearch_to_tsquery('english', search_term)) AS rank, NULL::TEXT AS related_category
--   FROM customers c
--   WHERE c.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'projects' AS category, p.id::text, p.name, p.status AS type, ts_rank(p.fts, websearch_to_tsquery('english', search_term)) AS rank, NULL::TEXT AS related_category
--   FROM projects p
--   WHERE p.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'invoices' AS category, i.id::text, i."invoiceNumber" AS name, i.status AS type, ts_rank(i.fts, websearch_to_tsquery('english', search_term)) AS rank, NULL::TEXT AS related_category
--   FROM invoices i
--   WHERE i.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'feedbacks' AS category, f.id::text, (f.questions->>'title')::text AS name, f.state AS type, ts_rank(f.fts, websearch_to_tsquery('english', search_term)) AS rank, NULL::TEXT AS related_category
--   FROM feedbacks f
--   WHERE f.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'receipts' AS category, r.id::text, r."receiptNumber" AS name, r.status AS type, ts_rank(r.fts, websearch_to_tsquery('english', search_term)) AS rank, NULL::TEXT AS related_category
--   FROM receipts r
--   WHERE r.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'organization' AS category, o.id::text, o.name, o."baseCurrency" AS type, ts_rank(o.fts, websearch_to_tsquery('english', search_term)) AS rank, NULL::TEXT AS related_category
--   FROM organization o
--   WHERE o.fts @@ websearch_to_tsquery('english', search_term)
-- ),
-- customer_ids AS (
--   SELECT id::text AS customer_id
--   FROM direct_matches
--   WHERE category = 'customers'
--   AND rank > 0.1
--   UNION
--   SELECT "customerId" AS customer_id
--   FROM direct_matches
--   WHERE "customerId" IS NOT NULL
--   AND category IN ('projects', 'invoices', 'feedbacks', 'receipts')
-- ),
-- project_ids AS (
--   SELECT id::text AS project_id
--   FROM direct_matches
--   WHERE category = 'projects'
--   AND rank > 0.1
--   UNION
--   SELECT "projectId" AS project_id
--   FROM direct_matches
--   WHERE "projectId" IS NOT NULL
--   AND category IN ('invoices', 'receipts', 'feedbacks')
-- ),
-- related_matches AS (
--   -- Customer-related matches
--   SELECT 'projects' AS category, p.id::text, p.name, p.status AS type, ts_rank(p.fts, websearch_to_tsquery('english', search_term)) AS rank, 'customers' AS related_category
--   FROM projects p
--   JOIN customer_ids ci ON p."customerId" = ci.customer_id
--   WHERE p.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'invoices' AS category, i.id::text, i."invoiceNumber" AS name, i.status AS type, ts_rank(i.fts, websearch_to_tsquery('english', search_term)) AS rank, 'customers' AS related_category
--   FROM invoices i
--   JOIN customer_ids ci ON i."customerId" = ci.customer_id
--   WHERE i.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'feedbacks' AS category, f.id::text, (f.questions->>'title')::text AS name, f.state AS type, ts_rank(f.fts, websearch_to_tsquery('english', search_term)) AS rank, 'customers' AS related_category
--   FROM feedbacks f
--   JOIN customer_ids ci ON f."customerId" = ci.customer_id
--   WHERE f.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'receipts' AS category, r.id::text, r."receiptNumber" AS name, r.status AS type, ts_rank(r.fts, websearch_to_tsquery('english', search_term)) AS rank, 'customers' AS related_category
--   FROM receipts r
--   JOIN customer_ids ci ON r."customerId" = ci.customer_id
--   WHERE r.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   -- Project-related matches
--   SELECT 'invoices' AS category, i.id::text, i."invoiceNumber" AS name, i.status AS type, ts_rank(i.fts, websearch_to_tsquery('english', search_term)) AS rank, 'projects' AS related_category
--   FROM invoices i
--   JOIN project_ids pi ON i."projectId" = pi.project_id
--   WHERE i.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'feedbacks' AS category, f.id::text, (f.questions->>'title')::text AS name, f.state AS type, ts_rank(f.fts, websearch_to_tsquery('english', search_term)) AS rank, 'projects' AS related_category
--   FROM feedbacks f
--   JOIN project_ids pi ON f."projectId" = pi.project_id
--   WHERE f.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'receipts' AS category, r.id::text, r."receiptNumber" AS name, r.status AS type, ts_rank(r.fts, websearch_to_tsquery('english', search_term)) AS rank, 'projects' AS related_category
--   FROM receipts r
--   JOIN project_ids pi ON r."projectId" = pi.project_id
--   WHERE r.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   -- Reverse customer match from other tables
--   SELECT 'customers' AS category, c.id::text, c.name, 'Customer' AS type, ts_rank(c.fts, websearch_to_tsquery('english', search_term)) AS rank,
--          (CASE WHEN dm.category IS NOT NULL THEN dm.category ELSE NULL END) AS related_category
--   FROM customers c
--   JOIN (
--     SELECT "customerId", category
--     FROM direct_matches
--     WHERE "customerId" IS NOT NULL
--     AND category IN ('projects', 'invoices', 'feedbacks', 'receipts')
--   ) dm ON c.id = dm."customerId"
--   WHERE c.fts @@ websearch_to_tsquery('english', search_term)
-- )
-- SELECT category, id, name, type, rank, related_category
-- FROM direct_matches
-- WHERE rank > 0.1
-- UNION ALL
-- SELECT category, id, name, type, rank, related_category
-- FROM related_matches
-- ORDER BY rank DESC
-- LIMIT 30
-- $$;



















-- -- Function 2: Smart universal search with customerId and projectId relationships
-- CREATE OR REPLACE FUNCTION smart_universal_search(search_term TEXT)
-- RETURNS TABLE(category TEXT, id TEXT, name TEXT, type TEXT, rank REAL, related_category TEXT)
-- LANGUAGE sql
-- AS $$
-- WITH direct_matches AS (
--   SELECT 'customers' AS category, c.id::text, c.name, 'Customer' AS type, ts_rank(c.fts, websearch_to_tsquery('english', search_term)) AS rank, NULL::TEXT AS related_category
--   FROM customers c
--   WHERE c.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'projects' AS category, p.id::text, p.name, p.status AS type, ts_rank(p.fts, websearch_to_tsquery('english', search_term)) AS rank, NULL::TEXT AS related_category
--   FROM projects p
--   WHERE p.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'invoices' AS category, i.id::text, i.invoiceNumber AS name, i.status AS type, ts_rank(i.fts, websearch_to_tsquery('english', search_term)) AS rank, NULL::TEXT AS related_category
--   FROM invoices i
--   WHERE i.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'feedbacks' AS category, f.id::text, (f.questions->>'title')::text AS name, f.state AS type, ts_rank(f.fts, websearch_to_tsquery('english', search_term)) AS rank, NULL::TEXT AS related_category
--   FROM feedbacks f
--   WHERE f.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'receipts' AS category, r.id::text, r.receiptNumber AS name, r.status AS type, ts_rank(r.fts, websearch_to_tsquery('english', search_term)) AS rank, NULL::TEXT AS related_category
--   FROM receipts r
--   WHERE r.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'organization' AS category, o.id::text, o.name, o.baseCurrency AS type, ts_rank(o.fts, websearch_to_tsquery('english', search_term)) AS rank, NULL::TEXT AS related_category
--   FROM organization o
--   WHERE o.fts @@ websearch_to_tsquery('english', search_term)
-- ),
-- customer_ids AS (
--   SELECT id::text AS customer_id
--   FROM direct_matches
--   WHERE category = 'customers'
--   AND rank > 0.1
--   UNION
--   SELECT customerId AS customer_id
--   FROM direct_matches
--   WHERE customerId IS NOT NULL
--   AND category IN ('projects', 'invoices', 'feedbacks', 'receipts')
-- ),
-- project_ids AS (
--   SELECT id::text AS project_id
--   FROM direct_matches
--   WHERE category = 'projects'
--   AND rank > 0.1
--   UNION
--   SELECT projectId AS project_id
--   FROM direct_matches
--   WHERE projectId IS NOT NULL
--   AND category IN ('invoices', 'receipts', 'feedbacks')
-- ),
-- related_matches AS (
--   -- Customer-related matches
--   SELECT 'projects' AS category, p.id::text, p.name, p.status AS type, ts_rank(p.fts, websearch_to_tsquery('english', search_term)) AS rank, 'customers' AS related_category
--   FROM projects p
--   JOIN customer_ids ci ON p.customerId = ci.customer_id
--   WHERE p.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'invoices' AS category, i.id::text, i.invoiceNumber AS name, i.status AS type, ts_rank(i.fts, websearch_to_tsquery('english', search_term)) AS rank, 'customers' AS related_category
--   FROM invoices i
--   JOIN customer_ids ci ON i.customerId = ci.customer_id
--   WHERE i.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'feedbacks' AS category, f.id::text, (f.questions->>'title')::text AS name, f.state AS type, ts_rank(f.fts, websearch_to_tsquery('english', search_term)) AS rank, 'customers' AS related_category
--   FROM feedbacks f
--   JOIN customer_ids ci ON f.customerId = ci.customer_id
--   WHERE f.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'receipts' AS category, r.id::text, r.receiptNumber AS name, r.status AS type, ts_rank(r.fts, websearch_to_tsquery('english', search_term)) AS rank, 'customers' AS related_category
--   FROM receipts r
--   JOIN customer_ids ci ON r.customerId = ci.customer_id
--   WHERE r.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   -- Project-related matches
--   SELECT 'invoices' AS category, i.id::text, i.invoiceNumber AS name, i.status AS type, ts_rank(i.fts, websearch_to_tsquery('english', search_term)) AS rank, 'projects' AS related_category
--   FROM invoices i
--   JOIN project_ids pi ON i.projectId = pi.project_id
--   WHERE i.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'feedbacks' AS category, f.id::text, (f.questions->>'title')::text AS name, f.state AS type, ts_rank(f.fts, websearch_to_tsquery('english', search_term)) AS rank, 'projects' AS related_category
--   FROM feedbacks f
--   JOIN project_ids pi ON f.projectId = pi.project_id
--   WHERE f.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   SELECT 'receipts' AS category, r.id::text, r.receiptNumber AS name, r.status AS type, ts_rank(r.fts, websearch_to_tsquery('english', search_term)) AS rank, 'projects' AS related_category
--   FROM receipts r
--   JOIN project_ids pi ON r.projectId = pi.project_id
--   WHERE r.fts @@ websearch_to_tsquery('english', search_term)
--   UNION ALL
--   -- Reverse customer match from other tables
--   SELECT 'customers' AS category, c.id::text, c.name, 'Customer' AS type, ts_rank(c.fts, websearch_to_tsquery('english', search_term)) AS rank,
--          (CASE WHEN dm.category IS NOT NULL THEN dm.category ELSE NULL END) AS related_category
--   FROM customers c
--   JOIN (
--     SELECT customerId, category
--     FROM direct_matches
--     WHERE customerId IS NOT NULL
--     AND category IN ('projects', 'invoices', 'feedbacks', 'receipts')
--   ) dm ON c.id = dm.customerId
--   WHERE c.fts @@ websearch_to_tsquery('english', search_term)
-- )
-- SELECT category, id, name, type, rank, related_category
-- FROM direct_matches
-- WHERE rank > 0.1
-- UNION ALL
-- SELECT category, id, name, type, rank, related_category
-- FROM related_matches
-- ORDER BY rank DESC
-- LIMIT 30;
