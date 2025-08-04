#!/usr/bin/env python3
"""
Update test restaurant password
"""
import sys
import os
sys.path.append('backend')

from backend.app.database import get_db
from sqlalchemy import text
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def update_test_password():
    """Update test restaurant password"""
    
    print("🔍 Updating Test Restaurant Password")
    print("=" * 50)
    
    try:
        db = next(get_db())
        
        # Hash the password
        password = "test123"
        password_hash = pwd_context.hash(password)
        
        # Update the restaurant
        result = db.execute(text('''
            UPDATE restaurants 
            SET password_hash = :password_hash 
            WHERE restaurant_code = 'TEST001'
        '''), {"password_hash": password_hash})
        
        db.commit()
        
        print(f"✅ Updated password for TEST001 restaurant")
        print(f"✅ Password: {password}")
        print(f"✅ Rows affected: {result.rowcount}")
        
        return True
        
    except Exception as e:
        print(f"❌ Password update failed: {e}")
        return False

if __name__ == "__main__":
    update_test_password()
