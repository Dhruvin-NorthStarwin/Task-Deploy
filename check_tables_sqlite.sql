-- SQLite Check Tables Script
-- Use this script if you're working with SQLite database

-- Check if all required tables exist
.echo on
.headers on
.mode column

.print "=== CHECKING SQLITE TABLES ==="

-- List all tables
.print "\n--- ALL TABLES ---"
.tables

-- Check table structure for each required table
.print "\n--- RESTAURANTS TABLE STRUCTURE ---"
.schema restaurants

.print "\n--- LOCATIONS TABLE STRUCTURE ---"
.schema locations

.print "\n--- USERS TABLE STRUCTURE ---"
.schema users

.print "\n--- TASKS TABLE STRUCTURE ---"
.schema tasks

.print "\n--- MEDIA_FILES TABLE STRUCTURE ---"
.schema media_files

-- Check indexes
.print "\n--- INDEXES ---"
.schema --indent

-- Check views
.print "\n--- VIEWS ---"
SELECT name, sql FROM sqlite_master WHERE type = 'view';

-- Check triggers
.print "\n--- TRIGGERS ---"
SELECT name, sql FROM sqlite_master WHERE type = 'trigger';

-- Quick validation query
.print "\n--- TABLE VALIDATION ---"
SELECT 
    name as table_name,
    type,
    CASE 
        WHEN name IN ('restaurants', 'locations', 'users', 'tasks', 'media_files') 
        THEN 'Required Table Found' 
        ELSE 'Other Object' 
    END as status
FROM sqlite_master 
WHERE type = 'table'
ORDER BY 
    CASE name
        WHEN 'restaurants' THEN 1
        WHEN 'locations' THEN 2
        WHEN 'users' THEN 3
        WHEN 'tasks' THEN 4
        WHEN 'media_files' THEN 5
        ELSE 6
    END;
