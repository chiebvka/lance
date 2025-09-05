-- RLS Policies and Security Setup
-- This migration sets up Row Level Security for all tables

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE walls ENABLE ROW LEVEL SECURITY;
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE paymentTerms ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_items ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organization ID
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT "organizationId" 
    FROM profiles 
    WHERE profile_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is creator
CREATE OR REPLACE FUNCTION is_creator(creator_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN creator_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user belongs to organization
CREATE OR REPLACE FUNCTION belongs_to_organization(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN org_id = get_user_organization_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES TABLE POLICIES
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (profile_id = auth.uid());

-- ORGANIZATION TABLE POLICIES
CREATE POLICY "organization_select_member" ON organization
  FOR SELECT USING (belongs_to_organization(id));

CREATE POLICY "organization_update_member" ON organization
  FOR UPDATE USING (belongs_to_organization(id));

CREATE POLICY "organization_insert_member" ON organization
  FOR INSERT WITH CHECK (belongs_to_organization(id));

-- CUSTOMERS TABLE POLICIES
CREATE POLICY "customers_select_org" ON customers
  FOR SELECT USING (belongs_to_organization("organizationId"));

CREATE POLICY "customers_insert_org" ON customers
  FOR INSERT WITH CHECK (belongs_to_organization("organizationId"));

CREATE POLICY "customers_update_org" ON customers
  FOR UPDATE USING (belongs_to_organization("organizationId"));

CREATE POLICY "customers_delete_org" ON customers
  FOR DELETE USING (belongs_to_organization("organizationId"));

-- PROJECTS TABLE POLICIES
CREATE POLICY "projects_select_org" ON projects
  FOR SELECT USING (belongs_to_organization("organizationId"));

CREATE POLICY "projects_insert_org" ON projects
  FOR INSERT WITH CHECK (belongs_to_organization("organizationId"));

CREATE POLICY "projects_update_org" ON projects
  FOR UPDATE USING (belongs_to_organization("organizationId"));

CREATE POLICY "projects_delete_org" ON projects
  FOR DELETE USING (belongs_to_organization("organizationId"));

-- INVOICES TABLE POLICIES
CREATE POLICY "invoices_select_org" ON invoices
  FOR SELECT USING (belongs_to_organization("organizationId"));

CREATE POLICY "invoices_insert_org" ON invoices
  FOR INSERT WITH CHECK (belongs_to_organization("organizationId"));

CREATE POLICY "invoices_update_org" ON invoices
  FOR UPDATE USING (belongs_to_organization("organizationId"));

CREATE POLICY "invoices_delete_org" ON invoices
  FOR DELETE USING (belongs_to_organization("organizationId"));

-- RECEIPTS TABLE POLICIES
CREATE POLICY "receipts_select_org" ON receipts
  FOR SELECT USING (belongs_to_organization("organizationId"));

CREATE POLICY "receipts_insert_org" ON receipts
  FOR INSERT WITH CHECK (belongs_to_organization("organizationId"));

CREATE POLICY "receipts_update_org" ON receipts
  FOR UPDATE USING (belongs_to_organization("organizationId"));

CREATE POLICY "receipts_delete_org" ON receipts
  FOR DELETE USING (belongs_to_organization("organizationId"));

-- FEEDBACKS TABLE POLICIES (with anonymous access)
CREATE POLICY "feedbacks_select_org_or_anon" ON feedbacks
  FOR SELECT USING (
    belongs_to_organization("organizationId") 
    OR (auth.role() = 'anon' AND token IS NOT NULL)
  );

CREATE POLICY "feedbacks_insert_org_or_anon" ON feedbacks
  FOR INSERT WITH CHECK (
    belongs_to_organization("organizationId") 
    OR (auth.role() = 'anon' AND token IS NOT NULL)
  );

CREATE POLICY "feedbacks_update_org_or_anon" ON feedbacks
  FOR UPDATE USING (
    belongs_to_organization("organizationId") 
    OR (auth.role() = 'anon' AND token IS NOT NULL)
  );

CREATE POLICY "feedbacks_delete_org" ON feedbacks
  FOR DELETE USING (belongs_to_organization("organizationId"));

-- FEEDBACK_TEMPLATES TABLE POLICIES
CREATE POLICY "feedback_templates_select_org" ON feedback_templates
  FOR SELECT USING (belongs_to_organization("organizationId"));

CREATE POLICY "feedback_templates_insert_org" ON feedback_templates
  FOR INSERT WITH CHECK (belongs_to_organization("organizationId"));

CREATE POLICY "feedback_templates_update_org" ON feedback_templates
  FOR UPDATE USING (belongs_to_organization("organizationId"));

CREATE POLICY "feedback_templates_delete_org" ON feedback_templates
  FOR DELETE USING (belongs_to_organization("organizationId"));

-- CUSTOMER_ACTIVITIES TABLE POLICIES
CREATE POLICY "customer_activities_select_org" ON customer_activities
  FOR SELECT USING (belongs_to_organization("organizationId"));

CREATE POLICY "customer_activities_insert_org" ON customer_activities
  FOR INSERT WITH CHECK (belongs_to_organization("organizationId"));

CREATE POLICY "customer_activities_update_org" ON customer_activities
  FOR UPDATE USING (belongs_to_organization("organizationId"));

CREATE POLICY "customer_activities_delete_org" ON customer_activities
  FOR DELETE USING (belongs_to_organization("organizationId"));

-- PATHS TABLE POLICIES (with anonymous access)
CREATE POLICY "paths_select_org_or_anon" ON paths
  FOR SELECT USING (
    belongs_to_organization("organizationId") 
    OR (auth.role() = 'anon' AND token IS NOT NULL)
  );

CREATE POLICY "paths_insert_org" ON paths
  FOR INSERT WITH CHECK (belongs_to_organization("organizationId"));

CREATE POLICY "paths_update_org" ON paths
  FOR UPDATE USING (belongs_to_organization("organizationId"));

CREATE POLICY "paths_delete_org" ON paths
  FOR DELETE USING (belongs_to_organization("organizationId"));

-- WALLS TABLE POLICIES (with anonymous access)
CREATE POLICY "walls_select_org_or_anon" ON walls
  FOR SELECT USING (
    belongs_to_organization("organizationId") 
    OR (auth.role() = 'anon' AND token IS NOT NULL)
  );

CREATE POLICY "walls_insert_org" ON walls
  FOR INSERT WITH CHECK (belongs_to_organization("organizationId"));

CREATE POLICY "walls_update_org" ON walls
  FOR UPDATE USING (belongs_to_organization("organizationId"));

CREATE POLICY "walls_delete_org" ON walls
  FOR DELETE USING (belongs_to_organization("organizationId"));

-- BANKS TABLE POLICIES
CREATE POLICY "banks_select_org" ON banks
  FOR SELECT USING (belongs_to_organization("organizationId"));

CREATE POLICY "banks_insert_org" ON banks
  FOR INSERT WITH CHECK (belongs_to_organization("organizationId"));

CREATE POLICY "banks_update_org" ON banks
  FOR UPDATE USING (belongs_to_organization("organizationId"));

CREATE POLICY "banks_delete_org" ON banks
  FOR DELETE USING (belongs_to_organization("organizationId"));

-- MEMBERS TABLE POLICIES
CREATE POLICY "members_select_org" ON members
  FOR SELECT USING (belongs_to_organization("organizationId"));

CREATE POLICY "members_insert_org" ON members
  FOR INSERT WITH CHECK (belongs_to_organization("organizationId"));

CREATE POLICY "members_update_org" ON members
  FOR UPDATE USING (belongs_to_organization("organizationId"));

CREATE POLICY "members_delete_org" ON members
  FOR DELETE USING (belongs_to_organization("organizationId"));

-- SUBSCRIPTIONS TABLE POLICIES
CREATE POLICY "subscriptions_select_org" ON subscriptions
  FOR SELECT USING (belongs_to_organization("organizationId"));

CREATE POLICY "subscriptions_insert_org" ON subscriptions
  FOR INSERT WITH CHECK (belongs_to_organization("organizationId"));

CREATE POLICY "subscriptions_update_org" ON subscriptions
  FOR UPDATE USING (belongs_to_organization("organizationId"));

CREATE POLICY "subscriptions_delete_org" ON subscriptions
  FOR DELETE USING (belongs_to_organization("organizationId"));

-- PRICING TABLE POLICIES (public read access)
CREATE POLICY "pricing_select_public" ON pricing
  FOR SELECT USING (true);

CREATE POLICY "pricing_insert_service" ON pricing
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "pricing_update_service" ON pricing
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "pricing_delete_service" ON pricing
  FOR DELETE USING (auth.role() = 'service_role');

-- PRODUCTS TABLE POLICIES (public read access)
CREATE POLICY "products_select_public" ON products
  FOR SELECT USING (true);

CREATE POLICY "products_insert_service" ON products
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "products_update_service" ON products
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "products_delete_service" ON products
  FOR DELETE USING (auth.role() = 'service_role');

-- NOTIFICATIONS TABLE POLICIES
CREATE POLICY "notifications_select_org_or_user" ON notifications
  FOR SELECT USING (
    belongs_to_organization("organizationId") 
    OR "createdBy" = auth.uid()
  );

CREATE POLICY "notifications_insert_org" ON notifications
  FOR INSERT WITH CHECK (
    belongs_to_organization("organizationId") 
    OR auth.role() = 'service_role'
  );

CREATE POLICY "notifications_update_org_or_user" ON notifications
  FOR UPDATE USING (
    belongs_to_organization("organizationId") 
    OR "createdBy" = auth.uid()
  );

CREATE POLICY "notifications_delete_org_or_user" ON notifications
  FOR DELETE USING (
    belongs_to_organization("organizationId") 
    OR "createdBy" = auth.uid()
    OR auth.role() = 'service_role'
  );

-- CANCELLATIONS TABLE POLICIES
CREATE POLICY "cancellations_select_org" ON cancellations
  FOR SELECT USING (belongs_to_organization("organizationId"));

CREATE POLICY "cancellations_insert_org" ON cancellations
  FOR INSERT WITH CHECK (belongs_to_organization("organizationId"));

CREATE POLICY "cancellations_update_org" ON cancellations
  FOR UPDATE USING (belongs_to_organization("organizationId"));

CREATE POLICY "cancellations_delete_org" ON cancellations
  FOR DELETE USING (belongs_to_organization("organizationId"));

-- AUDIT_LOG TABLE POLICIES (read-only for org members)
CREATE POLICY "audit_log_select_org" ON audit_log
  FOR SELECT USING (belongs_to_organization("organizationId"));

CREATE POLICY "audit_log_insert_service" ON audit_log
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ANALYTICS_EVENTS TABLE POLICIES (service role only)
CREATE POLICY "analytics_events_select_service" ON analytics_events
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "analytics_events_insert_service" ON analytics_events
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- VAULT TABLE POLICIES
CREATE POLICY "vault_select_org" ON vault
  FOR SELECT USING (belongs_to_organization("organizationId"));

CREATE POLICY "vault_insert_org" ON vault
  FOR INSERT WITH CHECK (belongs_to_organization("organizationId"));

CREATE POLICY "vault_update_org" ON vault
  FOR UPDATE USING (belongs_to_organization("organizationId"));

CREATE POLICY "vault_delete_org" ON vault
  FOR DELETE USING (belongs_to_organization("organizationId"));

-- WALLET TABLE POLICIES
CREATE POLICY "wallet_select_org" ON wallet
  FOR SELECT USING (belongs_to_organization("organizationId"));

CREATE POLICY "wallet_insert_org" ON wallet
  FOR INSERT WITH CHECK (belongs_to_organization("organizationId"));

CREATE POLICY "wallet_update_org" ON wallet
  FOR UPDATE USING (belongs_to_organization("organizationId"));

CREATE POLICY "wallet_delete_org" ON wallet
  FOR DELETE USING (belongs_to_organization("organizationId"));

-- DELIVERABLES TABLE POLICIES
CREATE POLICY "deliverables_select_org" ON deliverables
  FOR SELECT USING (
    "projectId" IN (
      SELECT id FROM projects 
      WHERE belongs_to_organization("organizationId")
    )
  );

CREATE POLICY "deliverables_insert_org" ON deliverables
  FOR INSERT WITH CHECK (
    "projectId" IN (
      SELECT id FROM projects 
      WHERE belongs_to_organization("organizationId")
    )
  );

CREATE POLICY "deliverables_update_org" ON deliverables
  FOR UPDATE USING (
    "projectId" IN (
      SELECT id FROM projects 
      WHERE belongs_to_organization("organizationId")
    )
  );

CREATE POLICY "deliverables_delete_org" ON deliverables
  FOR DELETE USING (
    "projectId" IN (
      SELECT id FROM projects 
      WHERE belongs_to_organization("organizationId")
    )
  );

-- PAYMENT_TERMS TABLE POLICIES
CREATE POLICY "payment_terms_select_org" ON paymentTerms
  FOR SELECT USING (belongs_to_organization("organizationId"));

CREATE POLICY "payment_terms_insert_org" ON paymentTerms
  FOR INSERT WITH CHECK (belongs_to_organization("organizationId"));

CREATE POLICY "payment_terms_update_org" ON paymentTerms
  FOR UPDATE USING (belongs_to_organization("organizationId"));

CREATE POLICY "payment_terms_delete_org" ON paymentTerms
  FOR DELETE USING (belongs_to_organization("organizationId"));

-- LINK_ITEMS TABLE POLICIES
CREATE POLICY "link_items_select_org" ON link_items
  FOR SELECT USING (
    "page_id" IN (
      SELECT id FROM paths 
      WHERE belongs_to_organization("organizationId")
    )
  );

CREATE POLICY "link_items_insert_org" ON link_items
  FOR INSERT WITH CHECK (
    "page_id" IN (
      SELECT id FROM paths 
      WHERE belongs_to_organization("organizationId")
    )
  );

CREATE POLICY "link_items_update_org" ON link_items
  FOR UPDATE USING (
    "page_id" IN (
      SELECT id FROM paths 
      WHERE belongs_to_organization("organizationId")
    )
  );

CREATE POLICY "link_items_delete_org" ON link_items
  FOR DELETE USING (
    "page_id" IN (
      SELECT id FROM paths 
      WHERE belongs_to_organization("organizationId")
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- Grant service role permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
