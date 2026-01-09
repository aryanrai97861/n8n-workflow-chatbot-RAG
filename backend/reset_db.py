"""
Database Reset Script
Run this to drop all tables and recreate them with the new schema.
"""
import sys
sys.path.insert(0, '.')

from sqlalchemy import text
from database import engine, Base, init_db

def reset_database():
    print("🗑️  Dropping all existing tables...")
    
    # Drop all tables in correct order (respecting foreign keys)
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS chat_logs CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS execution_logs CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS documents CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS workflows CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
        conn.commit()
    
    print("✅ Tables dropped successfully!")
    print("")
    print("🔨 Recreating tables with new schema...")
    
    # Recreate all tables
    init_db()
    
    print("✅ Database reset complete!")
    print("")
    print("📝 Next steps:")
    print("   1. Restart the backend server")
    print("   2. Register a new account")
    print("   3. Start creating workflows!")

if __name__ == "__main__":
    confirm = input("⚠️  This will DELETE ALL DATA. Type 'yes' to confirm: ")
    if confirm.lower() == 'yes':
        reset_database()
    else:
        print("Cancelled.")
