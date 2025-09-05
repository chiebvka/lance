-- Migration to recreate all tables based on database.types.ts
-- This migration creates all tables with proper camelCase naming convention

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Create custom types/enums first
DO $$ BEGIN
    CREATE TYPE billing_cycle_enum AS ENUM ('monthly', 'yearly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE plan_type_enum AS ENUM ('starter', 'pro', 'corporate');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status_enum AS ENUM ('trial', 'pending', 'active', 'expired', 'cancelled', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE customer_activity_reference_enum AS ENUM ('invoice', 'receipt', 'project', 'agreement', 'feedback');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE customer_activity_type_enum AS ENUM (
        'invoice_sent', 'invoice_paid', 'invoice_viewed', 'invoice_overdue', 'invoice_reminder', 'invoice_updated', 'invoice_link_clicked',
        'receipt_sent', 'receipt_link_clicked', 'receipt_viewed', 'receipt_reminder', 'receipt_updated',
        'project_started', 'project_overdue', 'project_completed', 'project_updated', 'project_reminder', 'project_signed', 'project_sent', 'project_viewed', 'project_link_clicked',
        'agreement_sent', 'agreement_signed', 'agreement_viewed', 'agreement_link_clicked',
        'feedback_sent', 'feedback_updated', 'feedback_reminder', 'feedback_received', 'feedback_submitted', 'feedback_overdue', 'feedback_viewed', 'feedback_link_clicked',
        'email_opened'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_entity_enum AS ENUM ('wall', 'links_page', 'link_item', 'file');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_type_enum AS ENUM ('page_view', 'click', 'download', 'share');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID UNIQUE,
    email CITEXT,
    organizationId UUID,
    organizationRole TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create organization table
CREATE TABLE IF NOT EXISTS organization (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    email CITEXT,
    phone TEXT,
    website TEXT,
    addressLine1 TEXT,
    addressLine2 TEXT,
    city TEXT,
    state TEXT,
    postal TEXT,
    country TEXT,
    taxId TEXT,
    logoUrl TEXT,
    baseCurrency TEXT,
    billingEmail CITEXT,
    billingCycle billing_cycle_enum,
    planType plan_type_enum,
    subscriptionStatus TEXT,
    subscriptionStatusEnum subscription_status_enum,
    subscriptionId TEXT,
    subscriptionStartDate TIMESTAMPTZ,
    subscriptionEndDate TIMESTAMPTZ,
    subscriptionMetadata JSONB,
    stripeMetadata JSONB,
    paymentMethodId TEXT,
    defaultBankId UUID,
    bankName TEXT,
    accountNumber TEXT,
    trialEndsAt TIMESTAMPTZ,
    setupStatus TEXT,
    setupCompletedAt TIMESTAMPTZ,
    setupCompletedBy UUID,
    setupData JSONB,
    feedbackNotifications BOOLEAN DEFAULT true,
    invoiceNotifications BOOLEAN DEFAULT true,
    projectNotifications BOOLEAN DEFAULT true,
    fts TSVECTOR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    createdBy UUID REFERENCES profiles(profile_id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    email CITEXT,
    phone TEXT,
    website TEXT,
    contactPerson TEXT,
    address TEXT,
    addressLine1 TEXT,
    addressLine2 TEXT,
    city TEXT,
    state TEXT,
    postalCode TEXT,
    country TEXT,
    unitNumber TEXT,
    taxId TEXT,
    notes TEXT,
    fullAddress TEXT,
    fts TSVECTOR,
    invoiceCount INTEGER DEFAULT 0,
    receiptCount INTEGER DEFAULT 0,
    projectCount INTEGER DEFAULT 0,
    linkCount INTEGER DEFAULT 0,
    feedbackCount INTEGER DEFAULT 0,
    organizationId UUID REFERENCES organization(id),
    createdBy UUID REFERENCES profiles(profile_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create banks table
CREATE TABLE IF NOT EXISTS banks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    bankName TEXT,
    accountName TEXT,
    accountNumber TEXT,
    routingNumber TEXT,
    swiftCode TEXT,
    iban TEXT,
    sortCode TEXT,
    transitNumber TEXT,
    institutionNumber TEXT,
    bankAddress TEXT,
    country TEXT,
    currency TEXT,
    type TEXT,
    description TEXT,
    isDefault BOOLEAN DEFAULT false,
    stripePaymentLink TEXT,
    paypalPaymentLink TEXT,
    crypto TEXT,
    cryptoNetwork TEXT,
    cryptoWalletAddress TEXT,
    organizationId UUID REFERENCES organization(id),
    createdBy UUID REFERENCES profiles(profile_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Create banks_duplicate table (keeping for compatibility)
CREATE TABLE IF NOT EXISTS banks_duplicate (
    id SERIAL PRIMARY KEY,
    name TEXT,
    bankName TEXT,
    accountName TEXT,
    accountNumber TEXT,
    routingNumber TEXT,
    swiftCode TEXT,
    iban TEXT,
    sortCode TEXT,
    transitNumber TEXT,
    institutionNumber TEXT,
    country TEXT,
    currency TEXT,
    isDefault BOOLEAN DEFAULT false,
    stripePaymentLink TEXT,
    paypalPaymentLink TEXT,
    organizationId UUID REFERENCES organization(id),
    createdBy UUID REFERENCES profiles(profile_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    description TEXT,
    projectTypeId UUID,
    type TEXT,
    status TEXT,
    state TEXT,
    budget DECIMAL(10,2),
    currency TEXT,
    currencyEnabled BOOLEAN DEFAULT false,
    startDate TIMESTAMPTZ,
    endDate TIMESTAMPTZ,
    effectiveDate TIMESTAMPTZ,
    deliverablesEnabled BOOLEAN DEFAULT false,
    deliverables JSONB,
    hasPaymentTerms BOOLEAN DEFAULT false,
    paymentStructure TEXT,
    paymentMilestones JSONB,
    hasServiceAgreement BOOLEAN DEFAULT false,
    serviceAgreement JSONB,
    agreementTemplate TEXT,
    hasAgreedToTerms BOOLEAN DEFAULT false,
    signatureType TEXT,
    signatureDetails JSONB,
    signedStatus TEXT,
    signedOn TIMESTAMPTZ,
    emailToCustomer BOOLEAN DEFAULT true,
    allowReminders BOOLEAN DEFAULT true,
    isPublished BOOLEAN DEFAULT false,
    isArchived BOOLEAN DEFAULT false,
    customFields JSONB,
    documents JSONB,
    notes TEXT,
    invoiceId UUID,
    fts TSVECTOR,
    organizationId UUID REFERENCES organization(id),
    customerId UUID REFERENCES customers(id),
    createdBy UUID REFERENCES profiles(profile_id),
    organizationName TEXT,
    organizationEmail CITEXT,
    organizationLogo TEXT,
    recepientName TEXT,
    recepientEmail CITEXT,
    token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updatedOn TIMESTAMPTZ DEFAULT NOW()
);

-- Create deliverables table
CREATE TABLE IF NOT EXISTS deliverables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    description TEXT,
    status TEXT,
    position INTEGER,
    dueDate TIMESTAMPTZ,
    isPublished BOOLEAN DEFAULT false,
    lastSaved TIMESTAMPTZ,
    projectId UUID REFERENCES projects(id),
    createdBy UUID REFERENCES profiles(profile_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Create paymentTerms table
CREATE TABLE IF NOT EXISTS paymentTerms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    description TEXT,
    type TEXT,
    status TEXT,
    amount DECIMAL(10,2),
    percentage DECIMAL(5,2),
    dueDate TIMESTAMPTZ,
    hasPaymentTerms BOOLEAN DEFAULT false,
    projectId UUID REFERENCES projects(id),
    deliverableId UUID REFERENCES deliverables(id),
    organizationId UUID REFERENCES organization(id),
    createdBy UUID REFERENCES profiles(profile_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoiceNumber TEXT,
    issueDate TIMESTAMPTZ,
    dueDate TIMESTAMPTZ,
    currency TEXT,
    subTotalAmount DECIMAL(10,2),
    discount DECIMAL(10,2),
    taxRate DECIMAL(5,2),
    vatRate DECIMAL(5,2),
    totalAmount DECIMAL(10,2),
    hasDiscount BOOLEAN DEFAULT false,
    hasTax BOOLEAN DEFAULT false,
    hasVat BOOLEAN DEFAULT false,
    status TEXT,
    state TEXT,
    paymentType TEXT,
    paymentLink TEXT,
    paymentInfo JSONB,
    paymentDetails JSONB,
    invoiceDetails JSONB,
    notes TEXT,
    sentViaEmail BOOLEAN DEFAULT false,
    emailSentAt TIMESTAMPTZ,
    paidOn TIMESTAMPTZ,
    allowReminders BOOLEAN DEFAULT true,
    fts TSVECTOR,
    organizationId UUID REFERENCES organization(id),
    customerId UUID REFERENCES customers(id),
    projectId UUID REFERENCES projects(id),
    createdBy UUID REFERENCES profiles(profile_id),
    organizationName TEXT,
    organizationEmail CITEXT,
    organizationLogo TEXT,
    projectName TEXT,
    recepientName TEXT,
    recepientEmail CITEXT,
    token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Create receipts table
CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receiptNumber TEXT,
    issueDate TIMESTAMPTZ,
    dueDate TIMESTAMPTZ,
    currency TEXT,
    subTotalAmount DECIMAL(10,2),
    discount DECIMAL(10,2),
    taxRate DECIMAL(5,2),
    vatRate DECIMAL(5,2),
    taxAmount DECIMAL(10,2),
    totalAmount DECIMAL(10,2),
    hasDiscount BOOLEAN DEFAULT false,
    hasTax BOOLEAN DEFAULT false,
    hasVat BOOLEAN DEFAULT false,
    state TEXT,
    paymentType TEXT,
    paymentLink TEXT,
    paymentDetails JSONB,
    paymentConfirmedAt TIMESTAMPTZ,
    receiptDetails JSONB,
    notes TEXT,
    sentViaEmail BOOLEAN DEFAULT false,
    emailSentAt TIMESTAMPTZ,
    creationMethod TEXT,
    issuedBy TEXT,
    fts TSVECTOR,
    organizationId UUID REFERENCES organization(id),
    customerId UUID REFERENCES customers(id),
    projectId UUID REFERENCES projects(id),
    invoiceId UUID REFERENCES invoices(id),
    createdBy UUID REFERENCES profiles(profile_id),
    organizationName TEXT,
    organizationEmail CITEXT,
    organizationLogo TEXT,
    recepientName TEXT,
    recepientEmail CITEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Create feedbacks table
CREATE TABLE IF NOT EXISTS feedbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    message TEXT,
    questions JSONB,
    answers JSONB,
    state TEXT,
    dueDate TIMESTAMPTZ,
    filledOn TIMESTAMPTZ,
    sentAt TIMESTAMPTZ,
    allowReminders BOOLEAN DEFAULT true,
    fts TSVECTOR,
    organizationId UUID REFERENCES organization(id),
    customerId UUID REFERENCES customers(id),
    projectId UUID REFERENCES projects(id),
    templateId UUID,
    createdBy UUID REFERENCES profiles(profile_id),
    organizationName TEXT,
    organizationEmail CITEXT,
    organizationLogo TEXT,
    recepientName TEXT,
    recepientEmail CITEXT,
    token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create feedback_templates table
CREATE TABLE IF NOT EXISTS feedback_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    questions JSONB,
    isDefault BOOLEAN DEFAULT false,
    organizationId UUID REFERENCES organization(id),
    createdBy UUID REFERENCES profiles(profile_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customer_activities table
CREATE TABLE IF NOT EXISTS customer_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type customer_activity_type_enum,
    referenceType customer_activity_reference_enum,
    label TEXT,
    amount DECIMAL(10,2),
    details JSONB,
    tagColor TEXT,
    referenceId TEXT,
    organizationId UUID REFERENCES organization(id),
    customerId UUID REFERENCES customers(id),
    createdBy UUID REFERENCES profiles(profile_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create paths table
CREATE TABLE IF NOT EXISTS paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    description TEXT,
    type TEXT,
    state TEXT,
    private BOOLEAN DEFAULT false,
    content JSONB,
    analytics JSONB,
    fts TSVECTOR,
    organizationId UUID REFERENCES organization(id),
    customerId UUID REFERENCES customers(id),
    createdBy UUID REFERENCES profiles(profile_id),
    organizationName TEXT,
    organizationEmail CITEXT,
    organizationLogo TEXT,
    recepientName TEXT,
    recepientEmail CITEXT,
    token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Create link_items table
CREATE TABLE IF NOT EXISTS link_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES paths(id),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    position INTEGER,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create walls table
CREATE TABLE IF NOT EXISTS walls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    description TEXT,
    type TEXT,
    state TEXT,
    private BOOLEAN DEFAULT false,
    content JSONB,
    analytics JSONB,
    notes TEXT,
    slug TEXT,
    issueDate TIMESTAMPTZ,
    fts TSVECTOR,
    organizationId UUID REFERENCES organization(id),
    customerId UUID REFERENCES customers(id),
    projectId UUID REFERENCES projects(id),
    createdBy UUID REFERENCES profiles(profile_id),
    organizationName TEXT,
    organizationEmail CITEXT,
    organizationLogo TEXT,
    recepientName TEXT,
    recepientEmail CITEXT,
    token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Create members table
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email CITEXT,
    roles TEXT,
    paidSub BOOLEAN DEFAULT false,
    author TEXT,
    addedBy TEXT,
    organizationId UUID REFERENCES organization(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    planType plan_type_enum,
    billingCycle billing_cycle_enum,
    subscriptionStatus subscription_status_enum,
    amount DECIMAL(10,2),
    currency TEXT,
    startsAt TIMESTAMPTZ,
    endsAt TIMESTAMPTZ,
    stripeCustomerId TEXT,
    stripeSubscriptionId TEXT,
    stripeMetadata JSONB,
    paymentMethod JSONB,
    organizationId UUID REFERENCES organization(id),
    createdBy UUID REFERENCES profiles(profile_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Create pricing table
CREATE TABLE IF NOT EXISTS pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripeProductId TEXT NOT NULL,
    stripePriceId TEXT NOT NULL,
    unitAmount INTEGER NOT NULL,
    currency TEXT NOT NULL,
    billingCycle TEXT,
    isActive BOOLEAN DEFAULT true,
    metadata JSONB,
    productId UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripeProductId TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    isActive BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT,
    type TEXT NOT NULL,
    state TEXT,
    isRead BOOLEAN DEFAULT false,
    actionUrl TEXT,
    expiresAt TIMESTAMPTZ,
    metadata JSONB,
    tableName TEXT,
    tableId TEXT,
    organizationId UUID REFERENCES organization(id),
    createdBy UUID REFERENCES profiles(profile_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cancellations table
CREATE TABLE IF NOT EXISTS cancellations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email CITEXT,
    reason TEXT,
    notes TEXT,
    stripeId TEXT,
    stripeData JSONB,
    organizationId UUID REFERENCES organization(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tableName TEXT,
    recordId TEXT,
    action TEXT,
    oldData JSONB,
    newData JSONB,
    changeSummary JSONB,
    createdBy TEXT,
    organizationId UUID REFERENCES organization(id),
    changedOn TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id TEXT NOT NULL,
    entity_type event_entity_enum NOT NULL,
    event_type event_type_enum NOT NULL,
    session_id TEXT,
    viewer_hash TEXT,
    url TEXT,
    referrer TEXT,
    user_agent TEXT,
    country TEXT,
    region TEXT,
    city TEXT,
    is_bot BOOLEAN,
    metadata JSONB,
    day_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vault table
CREATE TABLE IF NOT EXISTS vault (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bucketUrl TEXT,
    tableTpye TEXT,
    typeId TEXT,
    customerId UUID REFERENCES customers(id),
    projectId UUID REFERENCES projects(id),
    invoiceId UUID REFERENCES invoices(id),
    feedbackId UUID REFERENCES feedbacks(id),
    rceeiptId UUID REFERENCES receipts(id),
    lnikId UUID REFERENCES paths(id),
    createdBy UUID REFERENCES profiles(profile_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create wallet table
CREATE TABLE IF NOT EXISTS wallet (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    walletName TEXT,
    walletAddress TEXT,
    crypto TEXT,
    isDefault BOOLEAN DEFAULT false,
    organizationId UUID REFERENCES organization(id),
    createdBy UUID REFERENCES profiles(profile_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints for pricing table
ALTER TABLE pricing ADD CONSTRAINT pricing_productid_fkey FOREIGN KEY (productId) REFERENCES products(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organizationId);
CREATE INDEX IF NOT EXISTS idx_customers_organization_id ON customers(organizationId);
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organizationId);
CREATE INDEX IF NOT EXISTS idx_projects_customer_id ON projects(customerId);
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON invoices(organizationId);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customerId);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(projectId);
CREATE INDEX IF NOT EXISTS idx_receipts_organization_id ON receipts(organizationId);
CREATE INDEX IF NOT EXISTS idx_receipts_customer_id ON receipts(customerId);
CREATE INDEX IF NOT EXISTS idx_receipts_project_id ON receipts(projectId);
CREATE INDEX IF NOT EXISTS idx_feedbacks_organization_id ON feedbacks(organizationId);
CREATE INDEX IF NOT EXISTS idx_feedbacks_customer_id ON feedbacks(customerId);
CREATE INDEX IF NOT EXISTS idx_feedbacks_project_id ON feedbacks(projectId);
CREATE INDEX IF NOT EXISTS idx_paths_organization_id ON paths(organizationId);
CREATE INDEX IF NOT EXISTS idx_paths_customer_id ON paths(customerId);
CREATE INDEX IF NOT EXISTS idx_walls_organization_id ON walls(organizationId);
CREATE INDEX IF NOT EXISTS idx_walls_customer_id ON walls(customerId);
CREATE INDEX IF NOT EXISTS idx_walls_project_id ON walls(projectId);
CREATE INDEX IF NOT EXISTS idx_customer_activities_organization_id ON customer_activities(organizationId);
CREATE INDEX IF NOT EXISTS idx_customer_activities_customer_id ON customer_activities(customerId);
CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON notifications(organizationId);
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON subscriptions(organizationId);
CREATE INDEX IF NOT EXISTS idx_members_organization_id ON members(organizationId);
CREATE INDEX IF NOT EXISTS idx_banks_organization_id ON banks(organizationId);
CREATE INDEX IF NOT EXISTS idx_wallet_organization_id ON wallet(organizationId);
CREATE INDEX IF NOT EXISTS idx_audit_log_organization_id ON audit_log(organizationId);

-- Create FTS indexes for search functionality
CREATE INDEX IF NOT EXISTS idx_customers_fts ON customers USING gin(fts);
CREATE INDEX IF NOT EXISTS idx_projects_fts ON projects USING gin(fts);
CREATE INDEX IF NOT EXISTS idx_invoices_fts ON invoices USING gin(fts);
CREATE INDEX IF NOT EXISTS idx_receipts_fts ON receipts USING gin(fts);
CREATE INDEX IF NOT EXISTS idx_feedbacks_fts ON feedbacks USING gin(fts);
CREATE INDEX IF NOT EXISTS idx_paths_fts ON paths USING gin(fts);
CREATE INDEX IF NOT EXISTS idx_walls_fts ON walls USING gin(fts);
CREATE INDEX IF NOT EXISTS idx_organization_fts ON organization USING gin(fts);

-- Add comments to tables for documentation
COMMENT ON TABLE profiles IS 'User profiles and authentication data';
COMMENT ON TABLE organization IS 'Organization/company information';
COMMENT ON TABLE customers IS 'Customer/client information';
COMMENT ON TABLE projects IS 'Project management data';
COMMENT ON TABLE invoices IS 'Invoice management and billing';
COMMENT ON TABLE receipts IS 'Receipt and payment confirmation';
COMMENT ON TABLE feedbacks IS 'Customer feedback and surveys';
COMMENT ON TABLE paths IS 'Link pages and content management';
COMMENT ON TABLE walls IS 'Wall content and analytics';
COMMENT ON TABLE banks IS 'Bank account and payment information';
COMMENT ON TABLE subscriptions IS 'Subscription and billing data';
COMMENT ON TABLE notifications IS 'System notifications';
COMMENT ON TABLE audit_log IS 'Audit trail for data changes';
COMMENT ON TABLE analytics_events IS 'Analytics and tracking data';
