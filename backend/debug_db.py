from app.database import engine, Base
from app import models
import sqlite3

print("Creating tables...")
Base.metadata.create_all(bind=engine)
print("Tables created successfully!")

# Now check the database
conn = sqlite3.connect('restro_manage.db')
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

print("Tables in database:", tables)
conn.close()

print("Engine URL:", engine.url)
