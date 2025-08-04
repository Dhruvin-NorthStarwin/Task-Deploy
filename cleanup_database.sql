-- PostgreSQL Query to Keep Only Restaurants 9L5LYSOX and OV4X9M7P
-- This will delete ALL OTHER restaurants and their associated data
-- 
-- ⚠️  WARNING: This will permanently delete data! Make sure to backup first!
-- ⚠️  Run this in a transaction so you can rollback if needed
--
-- Usage:
-- BEGIN;
-- [Run all queries below]
-- COMMIT; -- or ROLLBACK; if something goes wrong

-- Step 1: Delete media_files for tasks that belong to restaurants we want to remove
DELETE FROM media_files 
WHERE task_id IN (
    SELECT t.id 
    FROM tasks t 
    JOIN restaurants r ON t.restaurant_id = r.id 
    WHERE r.restaurant_code NOT IN ('9L5LYSOX', 'OV4X9M7P')
);

-- Step 2: Delete cleaning_logs for restaurants we want to remove
DELETE FROM cleaning_logs 
WHERE restaurant_id IN (
    SELECT id 
    FROM restaurants 
    WHERE restaurant_code NOT IN ('9L5LYSOX', 'OV4X9M7P')
);

-- Step 3: Delete tasks for restaurants we want to remove
DELETE FROM tasks 
WHERE restaurant_id IN (
    SELECT id 
    FROM restaurants 
    WHERE restaurant_code NOT IN ('9L5LYSOX', 'OV4X9M7P')
);

-- Step 4: Delete users for restaurants we want to remove
DELETE FROM users 
WHERE restaurant_id IN (
    SELECT id 
    FROM restaurants 
    WHERE restaurant_code NOT IN ('9L5LYSOX', 'OV4X9M7P')
);

-- Step 5: Delete locations for restaurants we want to remove
DELETE FROM locations 
WHERE restaurant_id IN (
    SELECT id 
    FROM restaurants 
    WHERE restaurant_code NOT IN ('9L5LYSOX', 'OV4X9M7P')
);

-- Step 6: Finally, delete the restaurants themselves
DELETE FROM restaurants 
WHERE restaurant_code NOT IN ('9L5LYSOX', 'OV4X9M7P');

-- Verification queries (run these to check what remains):
-- SELECT restaurant_code, name FROM restaurants;
-- SELECT COUNT(*) as remaining_restaurants FROM restaurants;
-- SELECT COUNT(*) as remaining_tasks FROM tasks;
-- SELECT COUNT(*) as remaining_users FROM users;
-- SELECT COUNT(*) as remaining_locations FROM locations;
-- SELECT COUNT(*) as remaining_media_files FROM media_files;
-- SELECT COUNT(*) as remaining_cleaning_logs FROM cleaning_logs;
