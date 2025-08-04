#!/usr/bin/env python3
"""
Add test restaurant to database
"""
from app.database import get_db
from sqlalchemy import text

def add_test_restaurant():
    db = next(get_db())
    try:
        db.execute(text("""
        INSERT INTO restaurants (restaurant_code, name, cuisine_type, contact_email, contact_phone, password_hash)
        VALUES ('TEST001', 'Test Restaurant', 'International', 'test@example.com', '+1234567890', '$2b$12$9yZceRmqqjU.liBagwXed.rOCsF7RHmHlXyWEs3RaisJuQikQt7ZG');
        """))
        db.commit()
        print('✅ Test restaurant created!')
    except Exception as e:
        print(f'❌ Error: {e}')
        db.rollback()

if __name__ == "__main__":
    add_test_restaurant()
