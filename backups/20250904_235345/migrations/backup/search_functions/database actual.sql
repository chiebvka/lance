
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
    ts_rank(p.fts, websearch_to_tsquery('simple', search_term)) AS rank,
    NULL::text                      AS related_category,
    p."customerId"::text            AS customer_id,
    p.id::text                      AS project_id
  FROM projects p
  WHERE p.fts @@ websearch_to_tsquery('simple', search_term)
     OR p.name ILIKE '%' || search_term || '%'

  UNION ALL
  -- Direct invoice hits
  SELECT
    'invoices'                      AS category,
    i.id::text                      AS id,
    i."invoiceNumber"               AS name,
    i.status                        AS type,
    ts_rank(i.fts, websearch_to_tsquery('simple', search_term)) AS rank,
    NULL::text                      AS related_category,
    i."customerId"::text            AS customer_id,
    i."projectId"::text             AS project_id
  FROM invoices i
  WHERE i.fts @@ websearch_to_tsquery('simple', search_term)
     OR i."invoiceNumber" ILIKE '%' || search_term || '%'

  UNION ALL
  -- Direct feedback hits
  SELECT
    'feedbacks'                     AS category,
    f.id::text                      AS id,
    (f.questions->>'title')::text   AS name,
    f.state                         AS type,
    ts_rank(f.fts, websearch_to_tsquery('simple', search_term)) AS rank,
    NULL::text                      AS related_category,
    f."customerId"::text            AS customer_id,
    f."projectId"::text             AS project_id
  FROM feedbacks f
  WHERE f.fts @@ websearch_to_tsquery('simple', search_term)
     OR (f.questions->>'title') ILIKE '%' || search_term || '%'

  UNION ALL
  -- Direct receipt hits
  SELECT
    'receipts'                      AS category,
    r.id::text                      AS id,
    r."receiptNumber"               AS name,
    r.status                        AS type,
    ts_rank(r.fts, websearch_to_tsquery('simple', search_term)) AS rank,
    NULL::text                      AS related_category,
    r."customerId"::text            AS customer_id,
    r."projectId"::text             AS project_id
  FROM receipts r
  WHERE r.fts @@ websearch_to_tsquery('simple', search_term)
     OR r."receiptNumber" ILIKE '%' || search_term || '%'
),
customer_matches AS (
  SELECT customer_id
  FROM direct_matches
  WHERE category = 'customers' AND customer_id IS NOT NULL
  UNION
  SELECT customer_id
  FROM direct_matches
  WHERE customer_id IS NOT NULL AND category IN ('projects','invoices','feedbacks','receipts')
),
project_matches AS (
  SELECT project_id
  FROM direct_matches
  WHERE category = 'projects' AND project_id IS NOT NULL
  UNION
  SELECT project_id
  FROM direct_matches
  WHERE project_id IS NOT NULL AND category IN ('invoices','receipts','feedbacks')
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
