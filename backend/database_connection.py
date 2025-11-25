"""
Enhanced MongoDB connection module with robust SSL/TLS configuration for cloud deployment.
Handles various deployment environments including Render, Heroku, and local development.
"""

import os
import ssl
import certifi
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ServerSelectionTimeoutError, ConnectionFailure
import asyncio
from typing import Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseConnection:
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
        self.mongo_url = os.environ.get('MONGO_URL')
        self.db_name = os.environ.get('DB_NAME', 'chatapp')
        
    async def connect(self) -> AsyncIOMotorClient:
        """
        Establish MongoDB connection with multiple fallback strategies for SSL/TLS issues.
        """
        if not self.mongo_url:
            raise ValueError("MONGO_URL environment variable is required")
            
        # Strategy 1: Modern TLS with certifi (recommended for most cloud platforms)
        try:
            logger.info("Attempting MongoDB connection with modern TLS configuration...")
            self.client = await self._connect_with_modern_tls()
            await self._test_connection()
            logger.info("✅ Successfully connected to MongoDB with modern TLS")
            return self.client
        except Exception as e:
            logger.warning(f"Modern TLS connection failed: {e}")
            
        # Strategy 2: Legacy SSL configuration for compatibility
        try:
            logger.info("Attempting MongoDB connection with legacy SSL configuration...")
            self.client = await self._connect_with_legacy_ssl()
            await self._test_connection()
            logger.info("✅ Successfully connected to MongoDB with legacy SSL")
            return self.client
        except Exception as e:
            logger.warning(f"Legacy SSL connection failed: {e}")
            
        # Strategy 3: Minimal SSL configuration (last resort)
        try:
            logger.info("Attempting MongoDB connection with minimal SSL configuration...")
            self.client = await self._connect_with_minimal_ssl()
            await self._test_connection()
            logger.info("✅ Successfully connected to MongoDB with minimal SSL")
            return self.client
        except Exception as e:
            logger.error(f"All connection strategies failed. Last error: {e}")
            raise ConnectionFailure("Failed to establish MongoDB connection with all strategies")
    
    async def _connect_with_modern_tls(self) -> AsyncIOMotorClient:
        """Modern TLS configuration using certifi and recommended settings."""
        return AsyncIOMotorClient(
            self.mongo_url,
            # TLS Configuration
            tls=True,
            tlsCAFile=certifi.where(),
            tlsAllowInvalidCertificates=False,
            tlsAllowInvalidHostnames=False,
            
            # Connection Timeouts
            serverSelectionTimeoutMS=45000,  # Increased timeout for cloud environments
            connectTimeoutMS=45000,
            socketTimeoutMS=45000,
            heartbeatFrequencyMS=30000,
            
            # Connection Pool Settings
            maxPoolSize=10,
            minPoolSize=1,
            maxIdleTimeMS=30000,
            
            # Write Concern
            retryWrites=True,
            w='majority',
            
            # Additional Settings
            compressors='zlib',  # Removed snappy as it's not available
            readPreference='primaryPreferred'
        )
    
    async def _connect_with_legacy_ssl(self) -> AsyncIOMotorClient:
        """Legacy SSL configuration for older environments or compatibility issues."""
        return AsyncIOMotorClient(
            self.mongo_url,
            # Legacy SSL Configuration (using modern parameter names)
            tls=True,
            tlsCAFile=certifi.where(),
            
            # Connection Timeouts
            serverSelectionTimeoutMS=45000,
            connectTimeoutMS=45000,
            socketTimeoutMS=45000,
            
            # Connection Pool Settings
            maxPoolSize=10,
            minPoolSize=1,
            
            # Write Concern
            retryWrites=True,
            w='majority'
        )
    
    async def _connect_with_minimal_ssl(self) -> AsyncIOMotorClient:
        """Minimal SSL configuration as last resort."""
        return AsyncIOMotorClient(
            self.mongo_url,
            # Minimal SSL - use with caution
            tls=True,
            tlsAllowInvalidCertificates=True,  # Only for last resort
            tlsAllowInvalidHostnames=True,     # Only for last resort
            
            # Extended timeouts for problematic connections
            serverSelectionTimeoutMS=60000,
            connectTimeoutMS=60000,
            socketTimeoutMS=60000,
            
            # Basic settings
            maxPoolSize=5,
            retryWrites=True
        )
    
    async def _test_connection(self):
        """Test the database connection."""
        if self.client is None:
            raise ConnectionFailure("No client available for testing")
            
        # Test with a simple ping
        await self.client.admin.command('ping')
        
        # Set database reference
        self.db = self.client[self.db_name]
        
        # Test database access
        await self.db.command('ping')
    
    async def get_database(self):
        """Get database instance, connecting if necessary."""
        if self.client is None or self.db is None:
            await self.connect()
        return self.db
    
    async def close(self):
        """Close the database connection."""
        if self.client is not None:
            self.client.close()
            self.client = None
            self.db = None
            logger.info("Database connection closed")

# Global database connection instance
db_connection = DatabaseConnection()

async def get_database():
    """Get the database instance."""
    return await db_connection.get_database()

async def close_database():
    """Close the database connection."""
    await db_connection.close()