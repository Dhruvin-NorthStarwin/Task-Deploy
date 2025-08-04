#!/usr/bin/env python3
"""
Test script to verify production database connection and data
"""
import sys
import os
sys.path.append('backend')

from backend.app.database import get_db
from sqlalchemy import text

def test_production_database():
    """Test connection to production PostgreSQL database"""
    
    print("🔍 Testing Production Database Connection")
    print("=" * 50)
    
    try:
        db = next(get_db())
        
        # Test basic connection
        result = db.execute(text('SELECT version()')).fetchone()
        print(f"✅ Database connected: {result[0][:50]}...")
        
        # Check existing restaurants
        result = db.execute(text('SELECT COUNT(*) FROM restaurants')).fetchone()
        print(f"✅ Total restaurants: {result[0]}")
        
        # Check restaurant codes (first 5)
        result = db.execute(text('SELECT restaurant_code, name FROM restaurants LIMIT 5')).fetchall()
        print(f"✅ Sample restaurants:")
        for row in result:
            print(f"   - {row[0]}: {row[1]}")
        
        # Check cleaning logs structure
        result = db.execute(text('''
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'cleaning_logs'
            ORDER BY ordinal_position
        ''')).fetchall()
        print(f"\n✅ Cleaning logs table structure:")
        for row in result:
            print(f"   - {row[0]} ({row[1]}) - nullable: {row[2]}")
        
        # Check current cleaning logs count
        result = db.execute(text('SELECT COUNT(*) FROM cleaning_logs')).fetchone()
        print(f"\n✅ Total cleaning logs: {result[0]}")
        
        # Check recent cleaning logs (if any)
        result = db.execute(text('''
            SELECT asset_id, restaurant_id, completed_at, notes 
            FROM cleaning_logs 
            ORDER BY completed_at DESC 
            LIMIT 5
        ''')).fetchall()
        if result:
            print(f"✅ Recent cleaning logs:")
            for row in result:
                print(f"   - {row[0]} (Restaurant {row[1]}) at {row[2]} - {row[3][:30]}...")
        else:
            print("ℹ️  No cleaning logs found")
            
        print(f"\n✅ Production database test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

if __name__ == "__main__":
    test_production_database()
