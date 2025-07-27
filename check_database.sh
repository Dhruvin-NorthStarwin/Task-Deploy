#!/bin/bash

# Database Check Script
# This script helps you check your database tables

echo "=== DATABASE TABLE CHECKER ==="
echo ""

# Function to check PostgreSQL
check_postgresql() {
    echo "Checking PostgreSQL database..."
    echo "Please ensure you have the correct connection details."
    echo ""
    echo "Run this command to check tables:"
    echo "psql -d your_database_name -f check_tables.sql"
    echo ""
    echo "Or connect to psql and run:"
    echo "psql -d your_database_name"
    echo "Then run: \\i check_tables.sql"
}

# Function to check SQLite
check_sqlite() {
    echo "Checking SQLite database..."
    echo ""
    echo "If your database file is 'restro_manage.db', run:"
    echo "sqlite3 backend/restro_manage.db < check_tables_sqlite.sql"
    echo ""
    echo "Or connect to sqlite3 and run:"
    echo "sqlite3 backend/restro_manage.db"
    echo "Then run: .read check_tables_sqlite.sql"
}

# Ask user which database type
echo "Which database are you using?"
echo "1) PostgreSQL"
echo "2) SQLite"
read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        check_postgresql
        ;;
    2)
        check_sqlite
        ;;
    *)
        echo "Invalid choice. Please run the script again."
        ;;
esac

echo ""
echo "=== QUICK MANUAL CHECKS ==="
echo ""
echo "For PostgreSQL, you can also run these commands individually:"
echo "1. List all tables: \\dt"
echo "2. Describe a table: \\d table_name"
echo "3. List all databases: \\l"
echo ""
echo "For SQLite, you can also run:"
echo "1. List all tables: .tables"
echo "2. Show table schema: .schema table_name"
echo "3. Show all schemas: .schema"
