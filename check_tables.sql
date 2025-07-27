-- Check Tables Script
-- This script checks if all required tables exist in the database

-- For PostgreSQL - Check if tables exist
SELECT 
    table_name,
    table_type,
    CASE 
        WHEN table_name IN ('restaurants', 'locations', 'users', 'tasks', 'media_files') 
        THEN 'Required Table' 
        ELSE 'Other Table' 
    END as table_status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY 
    CASE table_name
        WHEN 'restaurants' THEN 1
        WHEN 'locations' THEN 2
        WHEN 'users' THEN 3
        WHEN 'tasks' THEN 4
        WHEN 'media_files' THEN 5
        ELSE 6
    END;

-- Check table structure for each required table
\echo '\n--- RESTAURANTS TABLE STRUCTURE ---'
\d restaurants

\echo '\n--- LOCATIONS TABLE STRUCTURE ---'
\d locations

\echo '\n--- USERS TABLE STRUCTURE ---'
\d users

\echo '\n--- TASKS TABLE STRUCTURE ---'
\d tasks

\echo '\n--- MEDIA_FILES TABLE STRUCTURE ---'
\d media_files

-- Check indexes
\echo '\n--- INDEXES ---'
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check views
\echo '\n--- VIEWS ---'
SELECT 
    table_name as view_name,
    view_definition
FROM information_schema.views 
WHERE table_schema = 'public';

-- Check functions
\echo '\n--- FUNCTIONS ---'
SELECT 
    routine_name as function_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public';

-- Check triggers
\echo '\n--- TRIGGERS ---'
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    trigger_schema
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
