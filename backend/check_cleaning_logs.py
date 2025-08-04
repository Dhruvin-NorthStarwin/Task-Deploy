#!/usr/bin/env python3
"""
Check cleaning logs in the database
"""
from app.database import get_db
from sqlalchemy import text
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def main():
    db = next(get_db())
    
    # Check cleaning logs table structure
    result = db.execute(text("""
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'cleaning_logs'
        ORDER BY ordinal_position
    """)).fetchall()
    print('Cleaning logs table structure:')
    for row in result:
        print(f'  {row[0]} - {row[1]} (nullable: {row[2]})')
    
    print('\nSample cleaning logs:')
    result = db.execute(text('SELECT * FROM cleaning_logs ORDER BY completed_at DESC LIMIT 10')).fetchall()
    for row in result:
        print(f'  {row}')
    
    total = db.execute(text("SELECT COUNT(*) FROM cleaning_logs")).fetchone()[0]
    print(f'\nTotal cleaning logs: {total}')
    
    # Check asset distribution
    print('\nAsset distribution:')
    result = db.execute(text('SELECT asset_id, COUNT(*) as count FROM cleaning_logs GROUP BY asset_id')).fetchall()
    for row in result:
        print(f'  {row[0]}: {row[1]} logs')

if __name__ == "__main__":
    main()
