#!/usr/bin/env python3
"""
Database Connection Checker
This script connects to the PostgreSQL database and checks table structure
"""

import psycopg2
import sys
from psycopg2 import sql

# Database connection URL
DATABASE_URL = "postgresql://postgres:hXtqctJOiUofFjeCdncyRVqjrdSNuGNB@trolley.proxy.rlwy.net:38780/railway"

def check_database_connection():
    """Check if we can connect to the database"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        print("✅ Successfully connected to the database!")
        return conn
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        return None

def check_tables(conn):
    """Check if all required tables exist"""
    required_tables = ['restaurants', 'locations', 'users', 'tasks', 'media_files']
    
    try:
        cursor = conn.cursor()
        
        # Check which tables exist
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        
        existing_tables = [row[0] for row in cursor.fetchall()]
        
        print("\n📋 TABLE STATUS:")
        print("=" * 50)
        
        for table in required_tables:
            if table in existing_tables:
                print(f"✅ {table} - EXISTS")
            else:
                print(f"❌ {table} - MISSING")
        
        print(f"\nFound {len(existing_tables)} total tables:")
        for table in existing_tables:
            status = "REQUIRED" if table in required_tables else "OTHER"
            print(f"  - {table} ({status})")
        
        return existing_tables
        
    except Exception as e:
        print(f"❌ Error checking tables: {e}")
        return []

def check_table_structure(conn, table_name):
    """Check the structure of a specific table"""
    try:
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = %s AND table_schema = 'public'
            ORDER BY ordinal_position;
        """, (table_name,))
        
        columns = cursor.fetchall()
        
        if columns:
            print(f"\n📋 {table_name.upper()} TABLE STRUCTURE:")
            print("-" * 60)
            print(f"{'Column':<20} {'Type':<15} {'Nullable':<10} {'Default':<15}")
            print("-" * 60)
            
            for col in columns:
                column_name, data_type, is_nullable, column_default = col
                default_str = str(column_default)[:14] if column_default else "None"
                print(f"{column_name:<20} {data_type:<15} {is_nullable:<10} {default_str:<15}")
        else:
            print(f"❌ Table {table_name} not found or has no columns")
            
    except Exception as e:
        print(f"❌ Error checking table structure for {table_name}: {e}")

def check_indexes(conn):
    """Check indexes in the database"""
    try:
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT schemaname, tablename, indexname, indexdef
            FROM pg_indexes 
            WHERE schemaname = 'public'
            ORDER BY tablename, indexname;
        """)
        
        indexes = cursor.fetchall()
        
        if indexes:
            print(f"\n📋 INDEXES ({len(indexes)} found):")
            print("-" * 80)
            
            current_table = None
            for idx in indexes:
                schema, table, index_name, index_def = idx
                if table != current_table:
                    print(f"\n{table}:")
                    current_table = table
                print(f"  - {index_name}")
        else:
            print("\n❌ No indexes found")
            
    except Exception as e:
        print(f"❌ Error checking indexes: {e}")

def check_views(conn):
    """Check views in the database"""
    try:
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        
        views = cursor.fetchall()
        
        if views:
            print(f"\n📋 VIEWS ({len(views)} found):")
            print("-" * 40)
            for view in views:
                print(f"  - {view[0]}")
        else:
            print("\n❌ No views found")
            
    except Exception as e:
        print(f"❌ Error checking views: {e}")

def main():
    print("🔍 CHECKING DATABASE CONNECTION AND STRUCTURE")
    print("=" * 60)
    
    # Connect to database
    conn = check_database_connection()
    if not conn:
        sys.exit(1)
    
    try:
        # Check tables
        existing_tables = check_tables(conn)
        
        # Check structure of each required table
        required_tables = ['restaurants', 'locations', 'users', 'tasks', 'media_files']
        for table in required_tables:
            if table in existing_tables:
                check_table_structure(conn, table)
        
        # Check indexes
        check_indexes(conn)
        
        # Check views
        check_views(conn)
        
        print("\n" + "=" * 60)
        print("✅ Database check completed!")
        
    except Exception as e:
        print(f"❌ An error occurred: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    main()
