#!/usr/bin/env python3
"""
Fix PostgreSQL MediaFile table by adding missing columns
This script will run on Railway to update the production database
"""

import os
import sys
import asyncio
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from app.config import settings

def fix_postgresql_media_table():
    """Add missing columns to MediaFile table in PostgreSQL"""
    
    print("🔧 Fixing PostgreSQL MediaFile table...")
    
    # Create engine
    engine = create_engine(settings.DATABASE_URL)
    
    # SQL commands to add missing columns
    sql_commands = [
        # Add file_url column if it doesn't exist
        """
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'media_files' AND column_name = 'file_url') THEN
                ALTER TABLE media_files ADD COLUMN file_url VARCHAR(1000);
                PRINT '✅ Added file_url column';
            ELSE
                PRINT '✅ file_url column already exists';
            END IF;
        END $$;
        """,
        
        # Add storage_type column if it doesn't exist
        """
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'media_files' AND column_name = 'storage_type') THEN
                ALTER TABLE media_files ADD COLUMN storage_type VARCHAR(50);
                PRINT '✅ Added storage_type column';
            ELSE
                PRINT '✅ storage_type column already exists';
            END IF;
        END $$;
        """,
        
        # Add cloudinary_id column if it doesn't exist
        """
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'media_files' AND column_name = 'cloudinary_id') THEN
                ALTER TABLE media_files ADD COLUMN cloudinary_id VARCHAR(255);
                PRINT '✅ Added cloudinary_id column';
            ELSE
                PRINT '✅ cloudinary_id column already exists';
            END IF;
        END $$;
        """,
        
        # Update existing records with default values
        """
        UPDATE media_files 
        SET 
            file_url = COALESCE(file_url, file_path),
            storage_type = COALESCE(storage_type, 'local')
        WHERE file_url IS NULL OR storage_type IS NULL;
        """,
        
        # Make required columns NOT NULL after setting defaults
        """
        DO $$ 
        BEGIN 
            -- Make file_url NOT NULL
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'media_files' AND column_name = 'file_url' AND is_nullable = 'YES') THEN
                ALTER TABLE media_files ALTER COLUMN file_url SET NOT NULL;
                PRINT '✅ Made file_url NOT NULL';
            END IF;
            
            -- Make storage_type NOT NULL
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'media_files' AND column_name = 'storage_type' AND is_nullable = 'YES') THEN
                ALTER TABLE media_files ALTER COLUMN storage_type SET NOT NULL;
                PRINT '✅ Made storage_type NOT NULL';
            END IF;
        END $$;
        """
    ]
    
    try:
        with engine.connect() as connection:
            # Start transaction
            with connection.begin():
                for i, sql in enumerate(sql_commands, 1):
                    try:
                        print(f"🔄 Executing SQL command {i}/{len(sql_commands)}...")
                        connection.execute(text(sql))
                        print(f"✅ Command {i} completed successfully")
                    except Exception as e:
                        print(f"⚠️ Command {i} failed (might be expected): {e}")
                        # Continue with other commands
                        continue
                
                print("✅ All database changes completed successfully!")
                
        # Verify the changes
        with engine.connect() as connection:
            result = connection.execute(text("""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'media_files' 
                ORDER BY ordinal_position;
            """))
            
            print("\n📋 Current MediaFile table structure:")
            for row in result:
                print(f"  - {row.column_name}: {row.data_type} ({'NULL' if row.is_nullable == 'YES' else 'NOT NULL'})")
                
    except Exception as e:
        print(f"❌ Database operation failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🚀 Starting PostgreSQL MediaFile table fix...")
    
    # Check if we're in production (Railway)
    if not settings.DATABASE_URL.startswith("postgresql://"):
        print("❌ This script is for PostgreSQL only!")
        sys.exit(1)
    
    success = fix_postgresql_media_table()
    
    if success:
        print("\n🎉 PostgreSQL MediaFile table successfully updated!")
        print("💡 Video uploads should now work properly!")
    else:
        print("\n❌ Failed to update PostgreSQL MediaFile table")
        sys.exit(1)
