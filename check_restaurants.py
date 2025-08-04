#!/usr/bin/env python3
"""
Check restaurant details and passwords
"""
import sys
import os
sys.path.append('backend')

from backend.app.database import get_db
from sqlalchemy import text

def check_restaurants():
    """Check restaurant details including passwords"""
    
    print("🔍 Checking Restaurant Details")
    print("=" * 50)
    
    try:
        db = next(get_db())
        
        # Check restaurants with passwords
        result = db.execute(text('''
            SELECT restaurant_code, name, password_hash 
            FROM restaurants 
            LIMIT 10
        ''')).fetchall()
        
        print("✅ Restaurants in database:")
        for row in result:
            has_password = "Yes" if row[2] else "No"
            print(f"   - {row[0]}: {row[1]} (Password set: {has_password})")
        
        print(f"\n✅ Check completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Database check failed: {e}")
        return False

if __name__ == "__main__":
    check_restaurants()
