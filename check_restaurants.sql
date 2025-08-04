-- VERIFICATION: Check what restaurants actually exist in the database
-- Run this to see all restaurants before proceeding with cleanup

-- Show ALL restaurants in the database
SELECT 
    'ALL_RESTAURANTS' as status,
    restaurant_code, 
    name, 
    id,
    created_at
FROM restaurants 
ORDER BY restaurant_code;

-- Check if our target restaurants exist
SELECT 
    'TARGET_CHECK' as status,
    restaurant_code,
    name,
    id,
    CASE 
        WHEN restaurant_code IN ('9L5LYSOX', 'OV4X9M7P') THEN 'EXISTS - WILL BE KEPT'
        ELSE 'OTHER RESTAURANT - WILL BE DELETED'
    END as fate
FROM restaurants
ORDER BY restaurant_code;

-- Count total restaurants
SELECT 
    'TOTAL_COUNT' as info,
    COUNT(*) as total_restaurants,
    COUNT(CASE WHEN restaurant_code IN ('9L5LYSOX', 'OV4X9M7P') THEN 1 END) as target_restaurants_found,
    COUNT(CASE WHEN restaurant_code NOT IN ('9L5LYSOX', 'OV4X9M7P') THEN 1 END) as other_restaurants_to_delete
FROM restaurants;
