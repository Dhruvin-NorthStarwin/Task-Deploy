# Database Check Script for Windows PowerShell
# This script helps you check your database tables

Write-Host "=== DATABASE TABLE CHECKER ===" -ForegroundColor Green
Write-Host ""

function Check-PostgreSQL {
    Write-Host "Checking PostgreSQL database..." -ForegroundColor Yellow
    Write-Host "Please ensure you have the correct connection details." -ForegroundColor White
    Write-Host ""
    Write-Host "Run this command to check tables:" -ForegroundColor Cyan
    Write-Host "psql -d your_database_name -f check_tables.sql" -ForegroundColor White
    Write-Host ""
    Write-Host "Or connect to psql and run:" -ForegroundColor Cyan
    Write-Host "psql -d your_database_name" -ForegroundColor White
    Write-Host "Then run: \i check_tables.sql" -ForegroundColor White
}

function Check-SQLite {
    Write-Host "Checking SQLite database..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "If your database file is 'restro_manage.db', run:" -ForegroundColor Cyan
    Write-Host "sqlite3 backend/restro_manage.db < check_tables_sqlite.sql" -ForegroundColor White
    Write-Host ""
    Write-Host "Or connect to sqlite3 and run:" -ForegroundColor Cyan
    Write-Host "sqlite3 backend/restro_manage.db" -ForegroundColor White
    Write-Host "Then run: .read check_tables_sqlite.sql" -ForegroundColor White
}

# Ask user which database type
Write-Host "Which database are you using?" -ForegroundColor Yellow
Write-Host "1) PostgreSQL" -ForegroundColor White
Write-Host "2) SQLite" -ForegroundColor White
$choice = Read-Host "Enter your choice (1 or 2)"

switch ($choice) {
    "1" {
        Check-PostgreSQL
    }
    "2" {
        Check-SQLite
    }
    default {
        Write-Host "Invalid choice. Please run the script again." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== QUICK MANUAL CHECKS ===" -ForegroundColor Green
Write-Host ""
Write-Host "For PostgreSQL, you can also run these commands individually:" -ForegroundColor Yellow
Write-Host "1. List all tables: \dt" -ForegroundColor White
Write-Host "2. Describe a table: \d table_name" -ForegroundColor White
Write-Host "3. List all databases: \l" -ForegroundColor White
Write-Host ""
Write-Host "For SQLite, you can also run:" -ForegroundColor Yellow
Write-Host "1. List all tables: .tables" -ForegroundColor White
Write-Host "2. Show table schema: .schema table_name" -ForegroundColor White
Write-Host "3. Show all schemas: .schema" -ForegroundColor White
