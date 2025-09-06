#!/bin/bash

# Supabase Local Database Backup Verification Script
# Created: September 6, 2025

echo "🔍 Verifying Supabase Local Database Backup..."
echo "=============================================="

# Check if backup files exist
echo "📁 Checking backup files..."

if [ -f "complete_database_backup_20250906_083105.sql" ]; then
    echo "✅ Complete database backup found"
    echo "   Size: $(ls -lh complete_database_backup_20250906_083105.sql | awk '{print $5}')"
else
    echo "❌ Complete database backup missing"
fi

if [ -f "data_only_backup_20250906_083110.sql" ]; then
    echo "✅ Data-only backup found"
    echo "   Size: $(ls -lh data_only_backup_20250906_083110.sql | awk '{print $5}')"
else
    echo "❌ Data-only backup missing"
fi

if [ -f "functions_list_20250906_083142.txt" ]; then
    echo "✅ Functions list found"
    echo "   Size: $(ls -lh functions_list_20250906_083142.txt | awk '{print $5}')"
else
    echo "❌ Functions list missing"
fi

if [ -f "tables_list_20250906_083148.txt" ]; then
    echo "✅ Tables list found"
    echo "   Size: $(ls -lh tables_list_20250906_083148.txt | awk '{print $5}')"
else
    echo "❌ Tables list missing"
fi

if [ -d "migrations" ]; then
    echo "✅ Migration files found"
    echo "   Count: $(find migrations -name "*.sql" | wc -l) migration files"
else
    echo "❌ Migration files missing"
fi

if [ -d "main_supabase" ]; then
    echo "✅ Main Supabase directory found"
    echo "   Count: $(find main_supabase -name "*.sql" | wc -l) SQL files"
else
    echo "❌ Main Supabase directory missing"
fi

echo ""
echo "📊 Backup Summary:"
echo "=================="
echo "Total files: $(ls -1 | wc -l)"
echo "Total size: $(du -sh . | awk '{print $1}')"
echo ""
echo "🔍 Checking backup content..."

# Check if complete backup contains expected content
if grep -q "CREATE TABLE" complete_database_backup_20250906_083105.sql 2>/dev/null; then
    echo "✅ Complete backup contains table definitions"
else
    echo "❌ Complete backup missing table definitions"
fi

if grep -q "INSERT INTO" data_only_backup_20250906_083110.sql 2>/dev/null; then
    echo "✅ Data backup contains insert statements"
else
    echo "❌ Data backup missing insert statements"
fi

if grep -q "organization" complete_database_backup_20250906_083105.sql 2>/dev/null; then
    echo "✅ Key tables found in backup"
else
    echo "❌ Key tables missing from backup"
fi

echo ""
echo "✅ Backup verification complete!"
echo "📝 See backup_summary.md for detailed information"
