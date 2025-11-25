#!/usr/bin/env python3
"""
Test script to verify MongoDB connection works with Render-optimized configuration.
Run this script to test the database connection before deploying to Render.
"""

import os
import sys
import asyncio
import logging
from pathlib import Path

# Add the backend directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

from database_connection import DatabaseConnection

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_connection():
    """Test the database connection with all strategies."""
    
    # Check if MONGO_URL is set
    mongo_url = os.environ.get('MONGO_URL')
    if not mongo_url:
        logger.error("❌ MONGO_URL environment variable is not set")
        logger.info("Please set MONGO_URL to your MongoDB connection string:")
        logger.info("export MONGO_URL='mongodb+srv://username:password@cluster.mongodb.net/'")
        return False
    
    logger.info("🧪 Testing MongoDB connection with Render-optimized configuration...")
    logger.info(f"🔗 Connection URL: {mongo_url[:50]}...")
    
    # Create database connection instance
    db_conn = DatabaseConnection()
    
    # Simulate Render environment
    os.environ['RENDER'] = 'true'
    
    try:
        # Test connection
        logger.info("🚀 Attempting to connect to MongoDB...")
        client = await db_conn.connect()
        
        # Test database operations
        logger.info("🔍 Testing database operations...")
        db = await db_conn.get_database()
        
        # Test ping
        await db.admin.command('ping')
        logger.info("✅ Database ping successful")
        
        # Test collection access
        test_collection = db.test_connection
        await test_collection.insert_one({"test": "connection", "timestamp": "2024-01-01"})
        logger.info("✅ Database write test successful")
        
        # Clean up test document
        await test_collection.delete_one({"test": "connection"})
        logger.info("✅ Database cleanup successful")
        
        # Close connection
        await db_conn.close()
        logger.info("✅ Connection closed successfully")
        
        logger.info("🎉 All database connection tests passed!")
        logger.info("🚀 Your application should deploy successfully to Render")
        return True
        
    except Exception as e:
        logger.error(f"❌ Database connection test failed: {e}")
        logger.error(f"❌ Error type: {type(e).__name__}")
        
        # Provide troubleshooting tips
        logger.info("\n🔧 Troubleshooting tips:")
        logger.info("1. Verify your MongoDB Atlas connection string is correct")
        logger.info("2. Check that your MongoDB Atlas cluster allows connections from 0.0.0.0/0")
        logger.info("3. Ensure your MongoDB Atlas user has proper permissions")
        logger.info("4. Verify your network connection")
        
        return False

def main():
    """Main function to run the connection test."""
    logger.info("🧪 MongoDB Connection Test for Render Deployment")
    logger.info("=" * 60)
    
    # Run the async test
    success = asyncio.run(test_connection())
    
    if success:
        logger.info("\n✅ SUCCESS: Database connection test passed")
        logger.info("Your application is ready for Render deployment!")
        sys.exit(0)
    else:
        logger.error("\n❌ FAILURE: Database connection test failed")
        logger.error("Please fix the issues above before deploying to Render")
        sys.exit(1)

if __name__ == "__main__":
    main()