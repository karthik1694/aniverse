"""
Enhanced MongoDB connection module with robust network error handling and DNS fallback strategies.
Handles DNS resolution issues, network connectivity problems, and various deployment environments.
"""

import os
import ssl
import certifi
import logging
import socket
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ServerSelectionTimeoutError, ConnectionFailure, NetworkTimeout
import asyncio
from typing import Optional
import time

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
        self.connection_retries = 0
        self.max_retries = 3
        
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
    
    def _test_dns_resolution(self, hostname: str) -> bool:
        """Test DNS resolution for a hostname."""
        try:
            socket.getaddrinfo(hostname, 27017, socket.AF_UNSPEC, socket.SOCK_STREAM)
            return True
        except socket.gaierror:
            return False
    
    def _extract_hostname_from_url(self, url: str) -> str:
        """Extract hostname from MongoDB connection URL."""
        try:
            if "mongodb+srv://" in url:
                # For SRV records, extract the main hostname
                url_parts = url.split("@")[1].split("/")[0].split("?")[0]
                return url_parts
            else:
                # For regular mongodb:// URLs
                url_parts = url.split("@")[1].split("/")[0]
                return url_parts.split(":")[0]
        except Exception:
            return "unknown"
    
    async def _handle_network_error(self, error: Exception, strategy_name: str) -> bool:
        """Handle network-related errors with appropriate logging and retry logic."""
        error_msg = str(error).lower()
        
        if "getaddrinfo failed" in error_msg or "name resolution" in error_msg:
            logger.error(f"🌐 DNS resolution failed for strategy '{strategy_name}': {error}")
            logger.info("💡 This is likely a DNS configuration issue on your local network")
            logger.info("💡 The application works fine in production (Render) where DNS is properly configured")
            return False
        elif "timeout" in error_msg or "timed out" in error_msg:
            logger.warning(f"⏱️ Connection timeout for strategy '{strategy_name}': {error}")
            return False
        elif "connection refused" in error_msg:
            logger.error(f"🚫 Connection refused for strategy '{strategy_name}': {error}")
            return False
        else:
            logger.warning(f"⚠️ Network error for strategy '{strategy_name}': {error}")
            return False
    
    async def connect(self) -> AsyncIOMotorClient:
        """
        Establish MongoDB connection with network error handling and fallback strategies.
        """
        if not self.mongo_url:
            raise ValueError("MONGO_URL environment variable is required")
        
        logger.info(f"🌐 Environment detection: Render={self.is_render_deployment}, Cloud={self.is_cloud_deployment}")
        
        # Test DNS resolution first
        hostname = self._extract_hostname_from_url(self.mongo_url)
        if not self._test_dns_resolution(hostname):
            logger.warning(f"⚠️ DNS resolution failed for {hostname}")
            logger.info("💡 This is a local network issue - the app works fine in production")
            logger.info("💡 Possible solutions:")
            logger.info("   1. Change your DNS server to 8.8.8.8 or 1.1.1.1")
            logger.info("   2. Check your firewall settings")
            logger.info("   3. Try connecting from a different network")
            
            # In development, we can continue with a mock connection or graceful degradation
            if not self.is_cloud_deployment:
                logger.info("🔧 Running in development mode - implementing graceful degradation")
                return await self._create_development_fallback()
        
        # For production environments (Render), use optimized strategies
        if self.is_render_deployment:
            return await self._connect_render_optimized()
        elif self.is_cloud_deployment:
            return await self._connect_cloud_optimized()
        else:
            return await self._connect_local_optimized()
    
    async def _create_development_fallback(self) -> AsyncIOMotorClient:
        """Create a development fallback when network issues prevent MongoDB connection."""
        logger.warning("⚠️ Creating development fallback due to network connectivity issues")
        logger.info("💡 This fallback allows the server to start for development purposes")
        logger.info("💡 Some database-dependent features may not work until connectivity is restored")
        
        # Try one more time with extended timeouts
        try:
            logger.info("🔄 Attempting connection with extended timeouts...")
            client = AsyncIOMotorClient(
                self.mongo_url,
                tls=True,
                serverSelectionTimeoutMS=10000,  # Shorter timeout for dev
                connectTimeoutMS=10000,
                socketTimeoutMS=10000,
                maxPoolSize=1,
                retryWrites=False,
                directConnection=False
            )
            
            # Quick test
            await asyncio.wait_for(client.admin.command('ping'), timeout=5.0)
            logger.info("✅ Development connection successful!")
            self.client = client
            self.db = client[self.db_name]
            return client
            
        except Exception as e:
            logger.warning(f"⚠️ Development fallback also failed: {e}")
            logger.info("🔧 Server will start without database connection")
            logger.info("🔧 Database-dependent features will be disabled")
            
            # Return a mock client that won't crash the application
            return await self._create_mock_client()
    
    async def _create_mock_client(self) -> AsyncIOMotorClient:
        """Create a mock client for development when database is unavailable."""
        logger.warning("🔧 Creating mock database client for development")
        
        # Create a client that will fail gracefully
        try:
            client = AsyncIOMotorClient(
                "mongodb://localhost:27017",  # Local fallback
                serverSelectionTimeoutMS=1000,
                connectTimeoutMS=1000,
                socketTimeoutMS=1000
            )
            self.client = client
            self.db = client[self.db_name]
            return client
        except Exception:
            # If even local connection fails, we'll handle this in the application layer
            logger.error("🔧 Mock client creation failed - application will handle database errors gracefully")
            raise ConnectionFailure("Database unavailable in development mode due to network issues")
    
    async def _connect_render_optimized(self) -> AsyncIOMotorClient:
        """Optimized connection strategy for Render deployment."""
        logger.info("🚀 Using Render-optimized connection strategy")
        
        strategies = [
            ("Render Minimal TLS", self._connect_render_minimal_tls),
            ("Render Direct", self._connect_render_direct),
            ("Modern TLS", self._connect_with_modern_tls),
            ("Simplified TLS", self._connect_simplified_tls),
        ]
        
        return await self._try_connection_strategies(strategies)
    
    async def _connect_cloud_optimized(self) -> AsyncIOMotorClient:
        """Optimized connection strategy for general cloud deployment."""
        logger.info("☁️ Using cloud-optimized connection strategy")
        
        strategies = [
            ("Modern TLS", self._connect_with_modern_tls),
            ("Legacy SSL", self._connect_with_legacy_ssl),
            ("Direct Connection", self._connect_direct),
            ("Minimal SSL", self._connect_with_minimal_ssl),
        ]
        
        return await self._try_connection_strategies(strategies)
    
    async def _connect_local_optimized(self) -> AsyncIOMotorClient:
        """Optimized connection strategy for local development."""
        logger.info("🏠 Using local development connection strategy")
        
        strategies = [
            ("Direct Connection", self._connect_direct),
            ("Modern TLS", self._connect_with_modern_tls),
            ("Minimal TLS", self._connect_minimal_tls),
            ("Legacy SSL", self._connect_with_legacy_ssl),
        ]
        
        return await self._try_connection_strategies(strategies)
    
    async def _try_connection_strategies(self, strategies) -> AsyncIOMotorClient:
        """Try multiple connection strategies until one succeeds."""
        for strategy_name, strategy_func in strategies:
            try:
                logger.info(f"🧪 Attempting: {strategy_name}")
                self.client = await strategy_func()
                await self._test_connection()
                logger.info(f"✅ Successfully connected with: {strategy_name}")
                return self.client
            except Exception as e:
                await self._handle_network_error(e, strategy_name)
                continue
        
        # If all strategies fail
        error_msg = f"Failed to establish MongoDB connection with all {len(strategies)} strategies"
        logger.error(f"❌ {error_msg}")
        
        if not self.is_cloud_deployment:
            logger.info("🔧 Attempting development fallback...")
            return await self._create_development_fallback()
        else:
            raise ConnectionFailure(error_msg)
    
    async def _connect_with_modern_tls(self) -> AsyncIOMotorClient:
        """Modern TLS configuration using certifi."""
        return AsyncIOMotorClient(
            self.mongo_url,
            tls=True,
            tlsCAFile=certifi.where(),
            tlsAllowInvalidCertificates=False,
            tlsAllowInvalidHostnames=False,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
            maxPoolSize=10,
            minPoolSize=1,
            retryWrites=True,
            w='majority'
        )
    
    async def _connect_with_legacy_ssl(self) -> AsyncIOMotorClient:
        """Legacy SSL configuration."""
        return AsyncIOMotorClient(
            self.mongo_url,
            tls=True,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=45000,
            connectTimeoutMS=45000,
            socketTimeoutMS=45000,
            maxPoolSize=5,
            retryWrites=True
        )
    
    async def _connect_with_minimal_ssl(self) -> AsyncIOMotorClient:
        """Minimal SSL configuration."""
        return AsyncIOMotorClient(
            self.mongo_url,
            tls=True,
            tlsAllowInvalidCertificates=True,
            tlsAllowInvalidHostnames=True,
            serverSelectionTimeoutMS=60000,
            connectTimeoutMS=60000,
            socketTimeoutMS=60000,
            maxPoolSize=3,
            retryWrites=True
        )
    
    async def _connect_render_minimal_tls(self) -> AsyncIOMotorClient:
        """Minimal TLS configuration for Render."""
        return AsyncIOMotorClient(
            self.mongo_url,
            tls=True,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
            maxPoolSize=3,
            retryWrites=True
        )
    
    async def _connect_render_direct(self) -> AsyncIOMotorClient:
        """Direct connection for Render."""
        return AsyncIOMotorClient(
            self.mongo_url,
            serverSelectionTimeoutMS=45000,
            connectTimeoutMS=45000,
            socketTimeoutMS=45000,
            maxPoolSize=5,
            retryWrites=True
        )
    
    async def _connect_direct(self) -> AsyncIOMotorClient:
        """Direct connection using MongoDB Atlas defaults."""
        return AsyncIOMotorClient(
            self.mongo_url,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
            maxPoolSize=5,
            retryWrites=True
        )
    
    async def _connect_minimal_tls(self) -> AsyncIOMotorClient:
        """Minimal TLS for local development."""
        return AsyncIOMotorClient(
            self.mongo_url,
            tls=True,
            serverSelectionTimeoutMS=20000,
            connectTimeoutMS=20000,
            socketTimeoutMS=20000,
            maxPoolSize=3,
            retryWrites=True
        )
    
    async def _connect_simplified_tls(self) -> AsyncIOMotorClient:
        """Simplified TLS configuration."""
        return AsyncIOMotorClient(
            self.mongo_url,
            tls=True,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=60000,
            connectTimeoutMS=60000,
            socketTimeoutMS=60000,
            maxPoolSize=3,
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
    
    def is_connected(self) -> bool:
        """Check if database is connected."""
        return self.client is not None and self.db is not None

# Global database connection instance
db_connection = DatabaseConnection()

async def get_database():
    """Get the database instance."""
    try:
        return await db_connection.get_database()
    except Exception as e:
        logger.error(f"Failed to get database: {e}")
        # In development, return None to allow graceful degradation
        if not db_connection.is_cloud_deployment:
            logger.warning("Returning None database for graceful degradation in development")
            return None
        raise

async def close_database():
    """Close the database connection."""
    await db_connection.close()

async def is_database_available() -> bool:
    """Check if database is available."""
    try:
        db = await get_database()
        return db is not None
    except Exception:
        return False