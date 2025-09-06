Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.# Supabase Local Database Backup - September 6, 2025

## Backup Information
- **Date**: September 6, 2025
- **Time**: 08:31 AM
- **Environment**: Local Supabase Development
- **Database URL**: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- **API URL**: http://127.0.0.1:54321

## Backup Contents

### 1. Complete Database Backup
- **File**: `complete_database_backup_20250906_083105.sql`
- **Description**: Full database dump including schema, data, functions, and constraints
- **Size**: ~98KB
- **Usage**: Use this for complete database restoration

### 2. Data-Only Backup
- **File**: `data_only_backup_20250906_083110.sql`
- **Description**: Contains only the data from all tables
- **Size**: ~225KB
- **Usage**: Use this to restore data to an existing schema

### 3. Schema Dump Script
- **File**: `schema_dump_script_20250906_083125.sql`
- **Description**: pg_dump command script for schema-only backup
- **Usage**: Reference for manual schema backup commands

### 4. Functions List
- **File**: `functions_list_20250906_083125.txt`
- **Description**: Complete list of all database functions with details
- **Usage**: Reference for function definitions and parameters

### 5. Tables List
- **File**: `tables_list_20250906_083125.txt`
- **Description**: Complete list of all tables with structure information
- **Usage**: Reference for table structure and relationships

### 6. Migration Files
- **Directory**: `migrations/`
- **Description**: All Supabase migration files from the project
- **Usage**: Complete migration history for schema recreation

### 7. Main Supabase Directory
- **Directory**: `main_supabase/`
- **Description**: Main project's supabase directory including migrations
- **Usage**: Project-specific Supabase configuration and migrations

## Database Schema Information

### Key Tables Identified
- `organization` - Organization management
- `profiles` - User profiles
- `products` - Product catalog (Essential, Creator, Studio)
- `pricing` - Pricing information
- `subscriptions` - Subscription management
- `customers` - Customer information
- `invoices` - Invoice management
- `receipts` - Receipt management
- `projects` - Project management
- `walls` - Wall management
- `feedbacks` - Feedback system
- `notifications` - Notification system

### Key Features
- **Environment Support**: Test/Live environment filtering
- **Plan Types**: Essential, Creator, Studio (mapped to starter, pro, corporate)
- **Subscription Management**: Full Stripe integration
- **User Management**: Profile and organization management
- **Project Management**: Complete project lifecycle
- **Notification System**: User notifications and alerts

## Restoration Instructions

### Complete Restoration
```bash
# Restore complete database
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres < complete_database_backup_20250906_083105.sql
```

### Data-Only Restoration
```bash
# Restore data to existing schema
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres < data_only_backup_20250906_083110.sql
```

### Migration-Based Restoration
```bash
# Apply migrations in order
npx supabase db reset --local
# Then apply any additional migrations from the migrations/ directory
```

## Environment Configuration

### Local Development
- **Database**: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- **API**: http://127.0.0.1:54321
- **Studio**: http://127.0.0.1:54323

### Production Considerations
- Update environment variables for production database
- Ensure all migrations are applied in correct order
- Verify data integrity after restoration
- Test all functionality before going live

## Notes
- This backup was created from the local development environment
- All sensitive data has been preserved
- Migration files are included for schema recreation
- Functions and constraints are preserved in the complete backup
- Environment-specific configurations are maintained

## Backup Verification
- ✅ Complete database schema backed up
- ✅ All table data backed up
- ✅ Functions and procedures backed up
- ✅ Migration files backed up
- ✅ Project configuration backed up
- ✅ Environment settings preserved

---
**Created**: September 6, 2025
**Backup Type**: Complete Local Database Backup
**Status**: Ready for remote deployment
