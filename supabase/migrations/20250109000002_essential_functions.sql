-- Essential Functions and Triggers
-- This migration adds core functions needed for the application

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (profile_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_organization_updated_at
    BEFORE UPDATE ON organization
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receipts_updated_at
    BEFORE UPDATE ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedbacks_updated_at
    BEFORE UPDATE ON feedbacks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_paths_updated_at
    BEFORE UPDATE ON paths
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_walls_updated_at
    BEFORE UPDATE ON walls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banks_updated_at
    BEFORE UPDATE ON banks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_updated_at
    BEFORE UPDATE ON wallet
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliverables_updated_at
    BEFORE UPDATE ON deliverables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_terms_updated_at
    BEFORE UPDATE ON paymentTerms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to set feedback token for anonymous access
CREATE OR REPLACE FUNCTION set_feedback_token(token_param UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.feedback_token', token_param::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Basic search function (simplified version)
CREATE OR REPLACE FUNCTION smart_universal_search(search_term TEXT)
RETURNS TABLE(
  id TEXT,
  name TEXT,
  type TEXT,
  category TEXT,
  customerId TEXT,
  projectId TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id::TEXT as id,
    c.name::TEXT as name,
    'customer'::TEXT as type,
    'customers'::TEXT as category,
    c.id::TEXT as customerId,
    NULL::TEXT as projectId,
    ts_rank(c.fts, plainto_tsquery('english', search_term)) as rank
  FROM customers c
  WHERE c.fts @@ plainto_tsquery('english', search_term)
  AND c."organizationId" = get_user_organization_id()
  
  UNION ALL
  
  SELECT 
    p.id::TEXT as id,
    p.name::TEXT as name,
    'project'::TEXT as type,
    'projects'::TEXT as category,
    p."customerId"::TEXT as customerId,
    p.id::TEXT as projectId,
    ts_rank(p.fts, plainto_tsquery('english', search_term)) as rank
  FROM projects p
  WHERE p.fts @@ plainto_tsquery('english', search_term)
  AND p."organizationId" = get_user_organization_id()
  
  UNION ALL
  
  SELECT 
    i.id::TEXT as id,
    COALESCE(i."projectName", 'Invoice ' || i."invoiceNumber")::TEXT as name,
    'invoice'::TEXT as type,
    'invoices'::TEXT as category,
    i."customerId"::TEXT as customerId,
    i."projectId"::TEXT as projectId,
    ts_rank(i.fts, plainto_tsquery('english', search_term)) as rank
  FROM invoices i
  WHERE i.fts @@ plainto_tsquery('english', search_term)
  AND i."organizationId" = get_user_organization_id()
  
  ORDER BY rank DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent items
CREATE OR REPLACE FUNCTION get_recent_items()
RETURNS TABLE(
  id TEXT,
  name TEXT,
  type TEXT,
  category TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id::TEXT as id,
    c.name::TEXT as name,
    'customer'::TEXT as type,
    'customers'::TEXT as category,
    c.created_at
  FROM customers c
  WHERE c."organizationId" = get_user_organization_id()
  
  UNION ALL
  
  SELECT 
    p.id::TEXT as id,
    p.name::TEXT as name,
    'project'::TEXT as type,
    'projects'::TEXT as category,
    p.created_at
  FROM projects p
  WHERE p."organizationId" = get_user_organization_id()
  
  UNION ALL
  
  SELECT 
    i.id::TEXT as id,
    COALESCE(i."projectName", 'Invoice ' || i."invoiceNumber")::TEXT as name,
    'invoice'::TEXT as type,
    'invoices'::TEXT as category,
    i.created_at
  FROM invoices i
  WHERE i."organizationId" = get_user_organization_id()
  
  ORDER BY created_at DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION set_feedback_token(UUID) TO anon;
GRANT EXECUTE ON FUNCTION smart_universal_search(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_items() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_organization_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_creator(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION belongs_to_organization(UUID) TO authenticated;
