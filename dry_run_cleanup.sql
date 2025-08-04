-- DRY RUN: Check what will be deleted before running the actual cleanup
-- Run these SELECT queries first to see what data will be removed
--
-- This shows you exactly what will be deleted when you run cleanup_database.sql

-- 1. CRITICAL: Show restaurants that will be DELETED (everything except 9L5LYSOX and OV4X9M7P)
SELECT 'RESTAURANTS_TO_DELETE' as action, restaurant_code, name, id
FROM restaurants 
WHERE restaurant_code NOT IN ('9L5LYSOX', 'OV4X9M7P')
ORDER BY restaurant_code;

-- 2. VERIFICATION: Show restaurants that will be KEPT
SELECT 'RESTAURANTS_TO_KEEP' as action, restaurant_code, name, id
FROM restaurants 
WHERE restaurant_code IN ('9L5LYSOX', 'OV4X9M7P')
ORDER BY restaurant_code;

-- 3. SUMMARY COUNTS - What will be deleted:
SELECT 
    'DELETE_SUMMARY' as action,
    'RESTAURANTS' as table_name,
    COUNT(*) as records_to_delete
FROM restaurants 
WHERE restaurant_code NOT IN ('9L5LYSOX', 'OV4X9M7P')

UNION ALL

SELECT 
    'DELETE_SUMMARY' as action,
    'TASKS' as table_name,
    COUNT(*) as records_to_delete
FROM tasks 
WHERE restaurant_id IN (
    SELECT id FROM restaurants 
    WHERE restaurant_code NOT IN ('9L5LYSOX', 'OV4X9M7P')
)

UNION ALL

SELECT 
    'DELETE_SUMMARY' as action,
    'USERS' as table_name,
    COUNT(*) as records_to_delete
FROM users 
WHERE restaurant_id IN (
    SELECT id FROM restaurants 
    WHERE restaurant_code NOT IN ('9L5LYSOX', 'OV4X9M7P')
)

UNION ALL

SELECT 
    'DELETE_SUMMARY' as action,
    'LOCATIONS' as table_name,
    COUNT(*) as records_to_delete
FROM locations 
WHERE restaurant_id IN (
    SELECT id FROM restaurants 
    WHERE restaurant_code NOT IN ('9L5LYSOX', 'OV4X9M7P')
)

UNION ALL

SELECT 
    'DELETE_SUMMARY' as action,
    'MEDIA_FILES' as table_name,
    COUNT(*) as records_to_delete
FROM media_files 
WHERE task_id IN (
    SELECT t.id FROM tasks t 
    JOIN restaurants r ON t.restaurant_id = r.id 
    WHERE r.restaurant_code NOT IN ('9L5LYSOX', 'OV4X9M7P')
)

UNION ALL

SELECT 
    'DELETE_SUMMARY' as action,
    'CLEANING_LOGS' as table_name,
    COUNT(*) as records_to_delete
FROM cleaning_logs 
WHERE restaurant_id IN (
    SELECT id FROM restaurants 
    WHERE restaurant_code NOT IN ('9L5LYSOX', 'OV4X9M7P')
);

-- 4. WHAT WILL REMAIN - Final counts after cleanup:
SELECT 
    'WILL_REMAIN' as action,
    'RESTAURANTS' as table_name,
    COUNT(*) as records_remaining
FROM restaurants 
WHERE restaurant_code IN ('9L5LYSOX', 'OV4X9M7P')

UNION ALL

SELECT 
    'WILL_REMAIN' as action,
    'TASKS' as table_name,
    COUNT(*) as records_remaining
FROM tasks t
JOIN restaurants r ON t.restaurant_id = r.id
WHERE r.restaurant_code IN ('9L5LYSOX', 'OV4X9M7P')

UNION ALL

SELECT 
    'WILL_REMAIN' as action,
    'USERS' as table_name,
    COUNT(*) as records_remaining
FROM users u
JOIN restaurants r ON u.restaurant_id = r.id
WHERE r.restaurant_code IN ('9L5LYSOX', 'OV4X9M7P')

UNION ALL

SELECT 
    'WILL_REMAIN' as action,
    'LOCATIONS' as table_name,
    COUNT(*) as records_remaining
FROM locations l
JOIN restaurants r ON l.restaurant_id = r.id
WHERE r.restaurant_code IN ('9L5LYSOX', 'OV4X9M7P')

UNION ALL

SELECT 
    'WILL_REMAIN' as action,
    'MEDIA_FILES' as table_name,
    COUNT(*) as records_remaining
FROM media_files mf
JOIN tasks t ON mf.task_id = t.id
JOIN restaurants r ON t.restaurant_id = r.id
WHERE r.restaurant_code IN ('9L5LYSOX', 'OV4X9M7P')

UNION ALL

SELECT 
    'WILL_REMAIN' as action,
    'CLEANING_LOGS' as table_name,
    COUNT(*) as records_remaining
FROM cleaning_logs cl
JOIN restaurants r ON cl.restaurant_id = r.id
WHERE r.restaurant_code IN ('9L5LYSOX', 'OV4X9M7P');
