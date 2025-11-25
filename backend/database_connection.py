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
        self.is_render_deployment = self._detect_render_environment()
        self.is_cloud_deployment = self._detect_cloud_environment()
        
    def _detect_render_environment(self) -> bool:
        """Detect if running on Render platform."""
        render_indicators = [
            'RENDER',
            'RENDER_SERVICE_ID',
            'RENDER_SERVICE_NAME',
            'RENDER_EXTERNAL_URL'
        ]
        return any(os.environ.get(indicator) for indicator in render_indicators)
    
    def _detect_cloud_environment(self) -> bool:
        """Detect if running in any cloud environment."""
        cloud_indicators = [
            'DYNO',  # Heroku
            'RENDER',  # Render
            'VERCEL',  # Vercel
            'NETLIFY',  # Netlify
            'AWS_LAMBDA_FUNCTION_NAME',  # AWS Lambda
            'GOOGLE_CLOUD_PROJECT',  # Google Cloud
            'AZURE_FUNCTIONS_ENVIRONMENT'  # Azure
        ]
        return any(os.environ.get(indicator) for indicator in cloud_indicators)
        
    async def connect(self) -> AsyncIOMotorClient:
        """
        Establish MongoDB connection with multiple fallback strategies for SSL/TLS issues.
        Prioritizes strategies based on deployment environment.
        """
        if not self.mongo_url:
            raise ValueError("MONGO_URL environment variable is required")
        
        logger.info(f"🌐 Environment detection: Render={self.is_render_deployment}, Cloud={self.is_cloud_deployment}")
        
        # For Render deployment, start with more aggressive strategies
        if self.is_render_deployment:
            return await self._connect_render_optimized()
        elif self.is_cloud_deployment:
            return await self._connect_cloud_optimized()
        else:
            return await self._connect_local_optimized()
    
    async def _connect_render_optimized(self) -> AsyncIOMotorClient:
        """Optimized connection strategy for Render deployment."""
        logger.info("🚀 Using Render-optimized connection strategy")
        
        # Strategy 1: Render-specific SSL configuration (most compatible)
        try:
            logger.info("Attempting MongoDB connection with Render-specific SSL configuration...")
            self.client = await self._connect_render_ssl()
            await self._test_connection()
            logger.info("✅ Successfully connected to MongoDB with Render SSL")
            return self.client
        except Exception as e:
            logger.warning(f"Render SSL connection failed: {e}")
            
        # Strategy 2: Connection string with SSL parameters
        try:
            logger.info("Attempting MongoDB connection with SSL parameters in connection string...")
            self.client = await self._connect_with_ssl_params()
            await self._test_connection()
            logger.info("✅ Successfully connected to MongoDB with SSL parameters")
            return self.client
        except Exception as e:
            logger.warning(f"SSL parameters connection failed: {e}")
            
        # Strategy 3: Simplified TLS configuration
        try:
            logger.info("Attempting MongoDB connection with simplified TLS configuration...")
            self.client = await self._connect_simplified_tls()
            await self._test_connection()
            logger.info("✅ Successfully connected to MongoDB with simplified TLS")
            return self.client
        except Exception as e:
            logger.warning(f"Simplified TLS connection failed: {e}")
            
        # Strategy 4: Direct connection (fallback)
        try:
            logger.info("Attempting MongoDB connection with direct connection string approach...")
            self.client = await self._connect_direct()
            await self._test_connection()
            logger.info("✅ Successfully connected to MongoDB with direct approach")
            return self.client
        except Exception as e:
            logger.warning(f"Direct connection failed: {e}")
            
        # Strategy 5: Emergency fallback with no SSL verification
        try:
            logger.info("Attempting MongoDB connection with no SSL verification (emergency fallback)...")
            self.client = await self._connect_with_no_ssl_verification()
            await self._test_connection()
            logger.info("✅ Successfully connected to MongoDB with no SSL verification")
            return self.client
        except Exception as e:
            logger.error(f"All Render connection strategies failed. Last error: {e}")
            raise ConnectionFailure("Failed to establish MongoDB connection with all Render strategies")
    
    async def _connect_cloud_optimized(self) -> AsyncIOMotorClient:
        """Optimized connection strategy for general cloud deployment."""
        logger.info("☁️ Using cloud-optimized connection strategy")
        
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
            
        # Strategy 3: Minimal SSL configuration
        try:
            logger.info("Attempting MongoDB connection with minimal SSL configuration...")
            self.client = await self._connect_with_minimal_ssl()
            await self._test_connection()
            logger.info("✅ Successfully connected to MongoDB with minimal SSL")
            return self.client
        except Exception as e:
            logger.warning(f"Minimal SSL connection failed: {e}")
            
        # Strategy 4: Direct connection approach
        try:
            logger.info("Attempting MongoDB connection with direct connection string approach...")
            self.client = await self._connect_direct()
            await self._test_connection()
            logger.info("✅ Successfully connected to MongoDB with direct approach")
            return self.client
        except Exception as e:
            logger.error(f"All cloud connection strategies failed. Last error: {e}")
            raise ConnectionFailure("Failed to establish MongoDB connection with all cloud strategies")
    
    async def _connect_local_optimized(self) -> AsyncIOMotorClient:
        """Optimized connection strategy for local development."""
        logger.info("🏠 Using local development connection strategy")
        
        # Strategy 1: Modern TLS with certifi (recommended for most environments)
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
            
        # Strategy 3: Minimal SSL configuration
        try:
            logger.info("Attempting MongoDB connection with minimal SSL configuration...")
            self.client = await self._connect_with_minimal_ssl()
            await self._test_connection()
            logger.info("✅ Successfully connected to MongoDB with minimal SSL")
            return self.client
        except Exception as e:
            logger.warning(f"Minimal SSL connection failed: {e}")
            
        # Strategy 4: Direct connection approach
        try:
            logger.info("Attempting MongoDB connection with direct connection string approach...")
            self.client = await self._connect_direct()
            await self._test_connection()
            logger.info("✅ Successfully connected to MongoDB with direct approach")
            return self.client
        except Exception as e:
            logger.error(f"All local connection strategies failed. Last error: {e}")
            raise ConnectionFailure("Failed to establish MongoDB connection with all local strategies")
            
        # Strategy 3: Minimal SSL configuration (last resort)
        try:
            logger.info("Attempting MongoDB connection with minimal SSL configuration...")
            self.client = await self._connect_with_minimal_ssl()
            await self._test_connection()
            logger.info("✅ Successfully connected to MongoDB with minimal SSL")
            return self.client
        except Exception as e:
            logger.warning(f"Minimal SSL connection failed: {e}")
            
        # Strategy 4: No SSL verification (emergency fallback for cloud deployment issues)
        try:
            logger.info("Attempting MongoDB connection with no SSL verification (emergency fallback)...")
            self.client = await self._connect_with_no_ssl_verification()
            await self._test_connection()
            logger.info("✅ Successfully connected to MongoDB with no SSL verification")
            return self.client
        except Exception as e:
            logger.warning(f"No SSL verification connection failed: {e}")
            
        # Strategy 5: Direct connection string approach
        try:
            logger.info("Attempting MongoDB connection with direct connection string approach...")
            self.client = await self._connect_direct()
            await self._test_connection()
            logger.info("✅ Successfully connected to MongoDB with direct approach")
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
    
    async def _connect_with_no_ssl_verification(self) -> AsyncIOMotorClient:
        """Emergency fallback with no SSL verification for cloud deployment issues."""
        logger.warning("⚠️  Using connection with no SSL verification - only for emergency deployment fixes")
        return AsyncIOMotorClient(
            self.mongo_url,
            # Disable SSL verification entirely
            tls=False,
            
            # Extended timeouts for cloud environments
            serverSelectionTimeoutMS=90000,
            connectTimeoutMS=90000,
            socketTimeoutMS=90000,
            
            # Basic connection settings
            maxPoolSize=3,
            retryWrites=True,
            
            # Force IPv4 to avoid IPv6 issues in some cloud environments
            directConnection=False
        )
    
    async def _connect_render_ssl(self) -> AsyncIOMotorClient:
        """Render-specific SSL configuration optimized for cloud deployment."""
        return AsyncIOMotorClient(
            self.mongo_url,
            # Render-optimized SSL settings
            tls=True,
            tlsCAFile=certifi.where(),
            tlsAllowInvalidCertificates=False,
            tlsAllowInvalidHostnames=False,
            tlsInsecure=False,
            
            # Render-optimized timeouts (shorter for faster failover)
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
            heartbeatFrequencyMS=10000,
            
            # Connection pool optimized for Render
            maxPoolSize=5,
            minPoolSize=1,
            maxIdleTimeMS=20000,
            
            # Write concern
            retryWrites=True,
            w='majority',
            
            # Additional Render optimizations
            compressors='zlib',
            readPreference='primaryPreferred',
            directConnection=False,
            
            # Force IPv4 to avoid IPv6 issues on Render
            family=0  # 0 = AF_UNSPEC (both IPv4 and IPv6), but prioritizes IPv4
        )
    
    async def _connect_with_ssl_params(self) -> AsyncIOMotorClient:
        """Connection with SSL parameters added to connection string."""
        # Add SSL parameters to the connection string if not present
        ssl_params = "ssl=true&ssl_cert_reqs=CERT_REQUIRED&ssl_ca_certs=" + certifi.where().replace("\\", "/")
        
        if "?" in self.mongo_url:
            connection_url = f"{self.mongo_url}&{ssl_params}"
        else:
            connection_url = f"{self.mongo_url}?{ssl_params}"
            
        return AsyncIOMotorClient(
            connection_url,
            serverSelectionTimeoutMS=45000,
            connectTimeoutMS=45000,
            socketTimeoutMS=45000,
            maxPoolSize=5,
            retryWrites=True
        )
    
    async def _connect_simplified_tls(self) -> AsyncIOMotorClient:
        """Simplified TLS configuration for problematic environments."""
        return AsyncIOMotorClient(
            self.mongo_url,
            # Simplified TLS settings
            tls=True,
            tlsCAFile=certifi.where(),
            
            # Relaxed timeouts
            serverSelectionTimeoutMS=60000,
            connectTimeoutMS=60000,
            socketTimeoutMS=60000,
            
            # Minimal pool settings
            maxPoolSize=3,
            minPoolSize=1,
            
            # Basic retry settings
            retryWrites=True,
            
            # Disable compression to reduce complexity
            compressors=None
        )
    
    async def _connect_direct(self) -> AsyncIOMotorClient:
        """Direct connection using the connection string as-is with minimal overrides."""
        logger.info("Using direct connection string approach with minimal configuration")
        
        # Parse the connection string to check if it already has SSL parameters
        if 'ssl=true' in self.mongo_url.lower() or 'tls=true' in self.mongo_url.lower():
            # Connection string already has SSL configured, use it directly
            return AsyncIOMotorClient(
                self.mongo_url,
                serverSelectionTimeoutMS=90000,
                connectTimeoutMS=90000,
                socketTimeoutMS=90000
            )
        else:
            # Add minimal SSL configuration
            return AsyncIOMotorClient(
                self.mongo_url,
                tls=True,
                serverSelectionTimeoutMS=90000,
                connectTimeoutMS=90000,
                socketTimeoutMS=90000
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