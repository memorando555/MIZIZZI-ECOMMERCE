#!/usr/bin/env python3
"""
Migration: Add last_verification_email_sent column to users table
This prevents duplicate verification emails from being sent within 60 seconds
"""

import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app import create_app, db
from sqlalchemy import text

def migrate():
    """Add last_verification_email_sent column to users table"""
    app = create_app()
    
    with app.app_context():
        try:
            # Check if column already exists
            result = db.session.execute(
                text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' 
                AND column_name='last_verification_email_sent'
                """)
            )
            
            if result.fetchone():
                print("✓ Column 'last_verification_email_sent' already exists in users table")
                return True
            
            # Add the column
            print("Adding 'last_verification_email_sent' column to users table...")
            db.session.execute(
                text("""
                ALTER TABLE users 
                ADD COLUMN last_verification_email_sent TIMESTAMP NULL DEFAULT NULL
                """)
            )
            db.session.commit()
            print("✓ Successfully added 'last_verification_email_sent' column")
            return True
            
        except Exception as e:
            print(f"✗ Error adding column: {str(e)}")
            db.session.rollback()
            return False

if __name__ == '__main__':
    success = migrate()
    sys.exit(0 if success else 1)
