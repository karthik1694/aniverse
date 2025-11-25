#!/usr/bin/env python3
"""
Test script to verify the fixed MongoDB connection for Render deployment.
This script tests the new connection strategies to ensure they work properly.
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
    """Test the database connection with the new configuration."""
    
    # Check if MONGO_URL is set
    mongo_url = os.environ.get('MONGO_URL')
    if not mongo_url:
        logger.error("❌ MONGO_URL environment variable is not set")
        logger.info("Please set MONGO_URL to your MongoDB connection string")
        return False
    
    logger.info("🧪 Testing MongoDB connection with fixed configuration...")
    logger.info(f"🔗 Connection URL: {mongo_url[:50]}...")
    
    # Create database connection instance
    db_connection = DatabaseConnection()
    
    try:
        # Test connection
        logger.info("🚀 Attempting to connect to MongoDB...")
        client = await db_connection.connect()
        
        if client:
            logger.info("✅ Successfully connected to MongoDB!")
            
            # Test database operations
            db = await db_connection.get_database()
            
            # Test ping
            await db.admin.command('ping')
            logger.info("✅ Database ping successful!")
            
            # Test basic operations
            test_collection = db.connection_test
            
            # Insert test document
            test_doc = {
                "test_id": "render_connection_test",
                "timestamp": "2024-11-26T01:47:00Z",
                "status": "success"
            }
            
            await test_collection.insert_one(test_doc)
            logger.info("✅ Test document inserted successfully!")
            
            # Read test document
            found_doc = await test_collection.find_one({"test_id": "render_connection_test"})
            if found_doc:
                logger.info("✅ Test document retrieved successfully!")
            else:
                logger.warning("⚠️  Test document not found")
            
            # Clean up test document
            await test_collection.delete_one({"test_id": "render_connection_test"})
            logger.info("✅ Test document cleaned up!")
            
            # Close connection
            await db_connection.close()
            logger.info("✅ Connection closed successfully!")
            
            logger.info("🎉 All database tests passed! Connection is working properly.")
            return True
            
    except Exception as e:
        logger.error(f"❌ Database connection test failed: {e}")
        logger.error(f"❌ Error type: {type(e).__name__}")
        
        # Try to close connection if it exists
        try:
            await db_connection.close()
        except:
            pass
        
        return False

async def test_all_strategies():
    """Test all connection strategies individually."""
    logger.info("🧪 Testing all connection strategies individually...")
    
    db_connection = DatabaseConnection()
    strategies = [
        ("Render Minimal TLS", db_connection._connect_render_minimal_tls),
        ("Render Direct", db_connection._connect_render_direct),
        ("SSL Parameters", db_connection._connect_with_ssl_params),
        ("Simplified TLS", db_connection._connect_simplified_tls),
        ("Render Legacy", db_connection._connect_render_legacy),
    ]
    
    successful_strategies = []
    
    for strategy_name, strategy_func in strategies:
        try:
            logger.info(f"🔍 Testing {strategy_name} strategy...")
            client = await strategy_func()
            
            # Test the connection
            await client.admin.command('ping')
            logger.info(f"✅ {strategy_name} strategy successful!")
            successful_strategies.append(strategy_name)
            
            # Close the client
            client.close()
            
        except Exception as e:
            logger.warning(f"❌ {strategy_name} strategy failed: {e}")
    
    logger.info(f"📊 Summary: {len(successful_strategies)}/{len(strategies)} strategies successful")
    if successful_strategies:
        logger.info(f"✅ Working strategies: {', '.join(successful_strategies)}")
    else:
        logger.error("❌ No strategies worked!")
    
    return len(successful_strategies) > 0

def main():
    """Main test function."""
    logger.info("🚀 Starting MongoDB connection tests for Render deployment...")
    
    # Set Render environment variable for testing
    os.environ['RENDER'] = 'true'
    
    try:
        # Test main connection
        success = asyncio.run(test_connection())
        
        if success:
            logger.info("🎉 Main connection test passed!")
        else:
            logger.error("❌ Main connection test failed!")
            
            # Test individual strategies
            logger.info("🔍 Testing individual strategies...")
            strategy_success = asyncio.run(test_all_strategies())
            
            if not strategy_success:
                logger.error("❌ All connection strategies failed!")
                sys.exit(1)
        
        logger.info("✅ Database connection tests completed successfully!")
        
    except KeyboardInterrupt:
        logger.info("🛑 Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Unexpected error during testing: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()