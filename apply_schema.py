#!/usr/bin/env python3
"""
Database Schema Applier
This script applies the PostgreSQL schema to the Railway database
"""

import psycopg2
import sys
import os

# Database connection URL
DATABASE_URL = "postgresql://postgres:hXtqctJOiUofFjeCdncyRVqjrdSNuGNB@trolley.proxy.rlwy.net:38780/railway"

def connect_to_database():
    """Connect to the PostgreSQL database"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        print("✅ Successfully connected to the database!")
        return conn
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        return None

def apply_schema(conn, schema_file_path):
    """Apply the schema from the SQL file"""
    try:
        # Read the schema file
        with open(schema_file_path, 'r', encoding='utf-8') as file:
            schema_sql = file.read()
        
        print(f"📖 Reading schema from: {schema_file_path}")
        
        # Execute the schema
        cursor = conn.cursor()
        print("🔄 Applying schema to database...")
        
        cursor.execute(schema_sql)
        conn.commit()
        
        print("✅ Schema applied successfully!")
        
    except FileNotFoundError:
        print(f"❌ Schema file not found: {schema_file_path}")
    except Exception as e:
        print(f"❌ Error applying schema: {e}")
        conn.rollback()

def main():
    print("🚀 APPLYING DATABASE SCHEMA")
    print("=" * 50)
    
    # Schema file path
    schema_file = "schema-only.sql"
    
    if not os.path.exists(schema_file):
        print(f"❌ Schema file '{schema_file}' not found in current directory")
        print("Please make sure you're running this from the project root directory")
        sys.exit(1)
    
    # Connect to database
    conn = connect_to_database()
    if not conn:
        sys.exit(1)
    
    try:
        # Apply schema
        apply_schema(conn, schema_file)
        
        print("\n" + "=" * 50)
        print("✅ Schema application completed!")
        print("You can now run 'python check_db_connection.py' to verify the tables")
        
    except Exception as e:
        print(f"❌ An error occurred: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    main()
