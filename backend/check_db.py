import sqlite3

# Connect to the database
conn = sqlite3.connect('restro_manage.db')
cursor = conn.cursor()

# Check what tables exist
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

print("Tables in database:", tables)

# If restaurants table exists, check if there are any records
if ('restaurants',) in tables:
    cursor.execute("SELECT COUNT(*) FROM restaurants;")
    count = cursor.fetchone()[0]
    print(f"Number of restaurants: {count}")
    
    if count > 0:
        cursor.execute("SELECT restaurant_code, name FROM restaurants LIMIT 5;")
        restaurants = cursor.fetchall()
        print("Sample restaurants:", restaurants)

conn.close()
