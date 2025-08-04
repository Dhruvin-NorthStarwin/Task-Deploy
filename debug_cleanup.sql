-- Diagnostic script to understand why cleanup didn't work
-- Run this to check the current state after cleanup attempt

-- 1. Show which restaurants should be DELETED (everything except our targets)
SELECT 
    'SHOULD_BE_DELETED' as status,
    restaurant_code, 
    name, 
    id
FROM restaurants 
WHERE restaurant_code NOT IN ('9L5LYSOX', 'OV4X9M7P')
ORDER BY restaurant_code;

-- 2. Show which restaurants should be KEPT (our targets)
SELECT 
    'SHOULD_BE_KEPT' as status,
    restaurant_code, 
    name, 
    id
FROM restaurants 
WHERE restaurant_code IN ('9L5LYSOX', 'OV4X9M7P')
ORDER BY restaurant_code;

-- 3. Count what we have vs what we should have
SELECT 
    'CURRENT_COUNT' as info,
    COUNT(*) as total_restaurants,
    COUNT(CASE WHEN restaurant_code IN ('9L5LYSOX', 'OV4X9M7P') THEN 1 END) as target_restaurants,
    COUNT(CASE WHEN restaurant_code NOT IN ('9L5LYSOX', 'OV4X9M7P') THEN 1 END) as should_be_deleted
FROM restaurants;

-- 4. Test the DELETE condition (this shows what WOULD be deleted)
SELECT 
    'WOULD_BE_DELETED' as test,
    restaurant_code,
    name
FROM restaurants 
WHERE restaurant_code NOT IN ('9L5LYSOX', 'OV4X9M7P');
