import os
os.environ['DATABASE_URL'] = "postgresql://postgres:hXtqctJOiUofFjeCdncyRVqjrdSNuGNB@trolley.proxy.rlwy.net:38780/railway"
os.environ['ENVIRONMENT'] = "development"

from app.database import engine
from sqlalchemy import text

try:
    conn = engine.connect()
    result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
    tables = result.fetchall()
    print('Tables in PostgreSQL database:', tables)
    
    # Check if restaurants table exists and has data
    if ('restaurants',) in tables:
        result = conn.execute(text("SELECT COUNT(*) FROM restaurants"))
        count = result.fetchone()[0]
        print(f'Number of restaurants: {count}')
        
        if count > 0:
            result = conn.execute(text("SELECT restaurant_code, name FROM restaurants LIMIT 3"))
            restaurants = result.fetchall()
            print('Sample restaurants:', restaurants)
    
    conn.close()
    print('✅ Database connection successful!')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
