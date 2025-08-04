-- Find the actual restaurant codes in your database
-- Run this first to identify the correct restaurant codes to keep

SELECT 
    'CURRENT_RESTAURANTS' as info,
    restaurant_code, 
    name, 
    id,
    created_at
FROM restaurants 
ORDER BY restaurant_code;

-- Count all restaurants
SELECT 'TOTAL_COUNT' as info, COUNT(*) as total_restaurants FROM restaurants;
