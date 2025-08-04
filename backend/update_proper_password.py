#!/usr/bin/env python3
"""
Update password for restaurant 9WW5HHYW with proper hash
"""
from app.database import get_db
from sqlalchemy import text
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def main():
    db = next(get_db())
    
    # Password hash for "test123" - generated using get_password_hash
    password_hash = "$2b$12$8aYlNVW/al1pg/w2x0oEtesmIQrE67kjAkM.h7DfgjC08JzOchogm"
    
    result = db.execute(text("""
        UPDATE restaurants 
        SET password_hash = :password_hash 
        WHERE restaurant_code = '9WW5HHYW'
    """), {"password_hash": password_hash})
    
    db.commit()
    
    print(f'Updated {result.rowcount} restaurant(s)')
    print('Restaurant 9WW5HHYW password is now: test123')

if __name__ == "__main__":
    main()
