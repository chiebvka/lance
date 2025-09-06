# Production Deployment Guide: CASCADE DELETE Migration

## Overview
This guide will help you deploy the CASCADE DELETE changes to your production Supabase database. These changes ensure that when an organization is deleted, all related data is automatically cleaned up.

## Pre-Deployment Checklist

### 1. Backup Production Database
```bash
# First, link to your production project
supabase link --project-ref YOUR_PROJECT_REF

# Create a full backup of your production database
supabase db dump --linked --data-only > production_backup_$(date +%Y%m%d_%H%M%S).sql
supabase db dump --linked --schema-only > production_schema_backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Test Migration Locally
```bash
# Test the migration on your local development environment first
psql -h localhost -p 54322 -U postgres -d postgres -f production_cascade_migration.sql
```

### 3. Verify Local Changes
```sql
-- Run this query to verify all constraints are properly set
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name IN (
        'audit_log', 'banks', 'customer_activities', 'customers', 
        'deliverables', 'feedback_templates', 'feedbacks', 'invoices',
        'link_items', 'members', 'notifications', 'paths', 
        'paymentTerms', 'projects', 'receipts', 'wallet', 'walls'
    )
    AND (rc.constraint_name LIKE '%organizationId%' OR rc.constraint_name LIKE '%projectId%')
ORDER BY tc.table_name;
```

## Deployment Options

### Option 1: Supabase CLI (Recommended)
```bash
# 1. Connect to your production project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# 2. Run the migration using SQL Editor or direct connection
# Option A: Copy/paste the migration script in Supabase Dashboard > SQL Editor
# Option B: Use direct connection
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres" -f production_cascade_migration.sql
```

### Option 2: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `production_cascade_migration.sql`
4. Execute the script

### Option 3: Direct PostgreSQL Connection
```bash
# Connect directly to your production database
psql -h YOUR_DB_HOST -p 5432 -U postgres -d postgres -f production_cascade_migration.sql
```

## Post-Deployment Verification

### 1. Verify Constraints
```sql
-- Check that all constraints are properly set
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name IN (
        'audit_log', 'banks', 'customer_activities', 'customers', 
        'deliverables', 'feedback_templates', 'feedbacks', 'invoices',
        'link_items', 'members', 'notifications', 'paths', 
        'paymentTerms', 'projects', 'receipts', 'wallet', 'walls'
    )
    AND (rc.constraint_name LIKE '%organizationId%' OR rc.constraint_name LIKE '%projectId%')
ORDER BY tc.table_name;
```

### 2. Test Organization Deletion
```sql
-- Create a test organization with some data
INSERT INTO organization (name, email) VALUES ('Test Org', 'test@example.com');
-- Get the organization ID
SELECT id FROM organization WHERE name = 'Test Org';

-- Create some related data
INSERT INTO customers (name, email, "organizationId") 
VALUES ('Test Customer', 'customer@example.com', 'ORGANIZATION_ID_HERE');

-- Test deletion (this should now work without errors)
DELETE FROM organization WHERE name = 'Test Org';

-- Verify all related data was deleted
SELECT COUNT(*) FROM customers WHERE "organizationId" = 'ORGANIZATION_ID_HERE';
-- Should return 0
```

### 3. Verify Application Functionality
- Test organization creation
- Test organization deletion through your application
- Verify that all related data is properly cleaned up
- Test wall media uploads (should now work with the R2 fix)

## Rollback Plan

If something goes wrong, you can rollback using your backup:

```bash
# Restore from backup
psql -h YOUR_DB_HOST -p 5432 -U postgres -d postgres -f production_backup_YYYYMMDD_HHMMSS.sql
```

## Important Notes

1. **Maintenance Window**: Run this migration during a maintenance window as it will temporarily lock tables
2. **Backup First**: Always create a full backup before making changes
3. **Test Locally**: Test the migration on your local environment first
4. **Monitor Performance**: Watch for any performance issues after deployment
5. **Verify Data Integrity**: Ensure all existing data remains intact

## Troubleshooting

### If Migration Fails
1. Check the error message
2. Verify you have the necessary permissions
3. Ensure no other processes are using the tables
4. Check for any existing data that might violate constraints

### If Organization Deletion Still Fails
1. Verify all constraints were applied correctly
2. Check for any remaining foreign key constraints without CASCADE
3. Look for any triggers that might be preventing deletion

## Support

If you encounter any issues during deployment, refer to:
- Supabase documentation: https://supabase.com/docs
- PostgreSQL documentation: https://www.postgresql.org/docs/
- Your local backup files for reference

## Files Included
- `production_cascade_migration.sql` - The migration script
- `backup_after_cascade_changes.sql` - Your local backup for reference
- `PRODUCTION_DEPLOYMENT_GUIDE.md` - This guide
