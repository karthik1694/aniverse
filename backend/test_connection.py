"""
MongoDB connection test script for debugging deployment issues.
Tests various connection strategies and provides detailed diagnostics.
"""

import asyncio
import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

# Add the backend directory to the path
sys.path.append(str(Path(__file__).parent))

from database_connection import DatabaseConnection

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_database_connection():
    """Test database connection with detailed diagnostics."""
    
    # Load environment variables
    load_dotenv()
    
    # Check required environment variables
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME', 'chatapp')
    
    if not mongo_url:
        logger.error("❌ MONGO_URL environment variable is not set")
        return False
    
    logger.info(f"🔍 Testing connection to database: {db_name}")
    logger.info(f"🔍 MongoDB URL (masked): {mongo_url[:20]}...{mongo_url[-10:]}")
    
    # Test connection
    db_conn = DatabaseConnection()
    
    try:
        # Attempt connection
        logger.info("🚀 Starting connection test...")
        client = await db_conn.connect()
        
        # Get database
        db = await db_conn.get_database()
        
        # Test basic operations
        logger.info("🧪 Testing basic database operations...")
        
        # Test collection access
        test_collection = db.connection_test
        
        # Insert test document
        test_doc = {"test": True, "timestamp": "2024-01-01"}
        result = await test_collection.insert_one(test_doc)
        logger.info(f"✅ Test document inserted with ID: {result.inserted_id}")
        
        # Read test document
        found_doc = await test_collection.find_one({"_id": result.inserted_id})
        if found_doc:
            logger.info("✅ Test document retrieved successfully")
        
        # Count documents
        count = await test_collection.count_documents({})
        logger.info(f"✅ Collection contains {count} documents")
        
        # Clean up test document
        await test_collection.delete_one({"_id": result.inserted_id})
        logger.info("✅ Test document cleaned up")
        
        # Test anime_data collection (the one causing issues)
        anime_collection = db.anime_data
        anime_count = await anime_collection.count_documents({})
        logger.info(f"✅ anime_data collection contains {anime_count} documents")
        
        logger.info("🎉 All database tests passed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Database connection test failed: {e}")
        logger.error(f"❌ Error type: {type(e).__name__}")
        import traceback
        logger.error(f"❌ Full traceback:\n{traceback.format_exc()}")
        return False
        
    finally:
        # Clean up connection
        await db_conn.close()
        logger.info("🔌 Database connection closed")

async def test_connection_strategies():
    """Test individual connection strategies for debugging."""
    
    load_dotenv()
    db_conn = DatabaseConnection()
    
    strategies = [
        ("Modern TLS", db_conn._connect_with_modern_tls),
        ("Legacy SSL", db_conn._connect_with_legacy_ssl),
        ("Minimal SSL", db_conn._connect_with_minimal_ssl)
    ]
    
    for strategy_name, strategy_func in strategies:
        logger.info(f"\n🧪 Testing {strategy_name} strategy...")
        try:
            client = await strategy_func()
            await client.admin.command('ping')
            logger.info(f"✅ {strategy_name} strategy successful")
            client.close()
        except Exception as e:
            logger.error(f"❌ {strategy_name} strategy failed: {e}")

if __name__ == "__main__":
    print("🔍 MongoDB Connection Test")
    print("=" * 50)
    
    # Test main connection
    success = asyncio.run(test_database_connection())
    
    if not success:
        print("\n🔧 Testing individual connection strategies...")
        asyncio.run(test_connection_strategies())
    
    print("\n" + "=" * 50)
    print("✅ Test completed" if success else "❌ Test failed")