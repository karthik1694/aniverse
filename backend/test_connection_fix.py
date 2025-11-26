#!/usr/bin/env python3
"""
MongoDB Connection Test and Fix Script
Tests various connection strategies to identify the working configuration.
"""

import os
import sys
import asyncio
import logging
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import certifi
import ssl
import socket

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ConnectionTester:
    def __init__(self):
        self.mongo_url = os.environ.get('MONGO_URL')
        self.db_name = os.environ.get('DB_NAME', 'chatapp')
        
        if not self.mongo_url:
            raise ValueError("MONGO_URL environment variable is required")
            
        logger.info(f"Testing connection to: {self.mongo_url[:50]}...")
        logger.info(f"Database name: {self.db_name}")
    
    async def test_dns_resolution(self):
        """Test DNS resolution for MongoDB Atlas hosts."""
        logger.info("🔍 Testing DNS resolution...")
        
        try:
            # Extract hostname from MongoDB URL
            if "mongodb+srv://" in self.mongo_url:
                # For SRV records, extract the main hostname
                url_parts = self.mongo_url.split("@")[1].split("/")[0].split("?")[0]
                hostname = url_parts
            else:
                # For regular mongodb:// URLs
                url_parts = self.mongo_url.split("@")[1].split("/")[0]
                hostname = url_parts.split(":")[0]
            
            logger.info(f"Resolving hostname: {hostname}")
            
            # Test DNS resolution
            result = socket.getaddrinfo(hostname, 27017, socket.AF_UNSPEC, socket.SOCK_STREAM)
            logger.info(f"✅ DNS resolution successful: {len(result)} addresses found")
            
            for i, (family, type, proto, canonname, sockaddr) in enumerate(result[:3]):
                logger.info(f"  Address {i+1}: {sockaddr[0]}")
                
            return True
            
        except socket.gaierror as e:
            logger.error(f"❌ DNS resolution failed: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ DNS test error: {e}")
            return False
    
    async def test_connection_strategy(self, strategy_name: str, client_factory):
        """Test a specific connection strategy."""
        logger.info(f"🧪 Testing strategy: {strategy_name}")
        
        try:
            client = client_factory()
            
            # Test connection with timeout
            await asyncio.wait_for(client.admin.command('ping'), timeout=30.0)
            
            # Test database access
            db = client[self.db_name]
            await asyncio.wait_for(db.command('ping'), timeout=10.0)
            
            logger.info(f"✅ Strategy '{strategy_name}' successful!")
            client.close()
            return True
            
        except asyncio.TimeoutError:
            logger.error(f"❌ Strategy '{strategy_name}' timed out")
            return False
        except Exception as e:
            logger.error(f"❌ Strategy '{strategy_name}' failed: {e}")
            return False
        finally:
            try:
                client.close()
            except:
                pass
    
    def create_modern_tls_client(self):
        """Modern TLS configuration with certifi."""
        return AsyncIOMotorClient(
            self.mongo_url,
            tls=True,
            tlsCAFile=certifi.where(),
            tlsAllowInvalidCertificates=False,
            tlsAllowInvalidHostnames=False,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
            maxPoolSize=5,
            retryWrites=True
        )
    
    def create_minimal_tls_client(self):
        """Minimal TLS configuration."""
        return AsyncIOMotorClient(
            self.mongo_url,
            tls=True,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
            maxPoolSize=3,
            retryWrites=True
        )
    
    def create_direct_client(self):
        """Direct connection using MongoDB Atlas defaults."""
        return AsyncIOMotorClient(
            self.mongo_url,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
            maxPoolSize=5,
            retryWrites=True
        )
    
    def create_legacy_ssl_client(self):
        """Legacy SSL configuration."""
        return AsyncIOMotorClient(
            self.mongo_url,
            tls=True,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=45000,
            connectTimeoutMS=45000,
            socketTimeoutMS=45000,
            maxPoolSize=3,
            retryWrites=True
        )
    
    def create_no_ssl_client(self):
        """No SSL verification (emergency fallback)."""
        return AsyncIOMotorClient(
            self.mongo_url,
            tls=False,
            serverSelectionTimeoutMS=60000,
            connectTimeoutMS=60000,
            socketTimeoutMS=60000,
            maxPoolSize=3,
            retryWrites=True
        )
    
    async def run_all_tests(self):
        """Run all connection tests."""
        logger.info("🚀 Starting MongoDB connection tests...")
        
        # Test DNS resolution first
        dns_ok = await self.test_dns_resolution()
        if not dns_ok:
            logger.error("❌ DNS resolution failed - this is likely the root cause")
            logger.info("💡 Possible solutions:")
            logger.info("   1. Check your internet connection")
            logger.info("   2. Try using a different DNS server (8.8.8.8, 1.1.1.1)")
            logger.info("   3. Check if your firewall is blocking MongoDB Atlas")
            logger.info("   4. Try connecting from a different network")
            return False
        
        # Test different connection strategies
        strategies = [
            ("Direct Connection (Atlas Default)", self.create_direct_client),
            ("Modern TLS with Certifi", self.create_modern_tls_client),
            ("Minimal TLS", self.create_minimal_tls_client),
            ("Legacy SSL", self.create_legacy_ssl_client),
            ("No SSL Verification", self.create_no_ssl_client),
        ]
        
        successful_strategies = []
        
        for strategy_name, client_factory in strategies:
            success = await self.test_connection_strategy(strategy_name, client_factory)
            if success:
                successful_strategies.append(strategy_name)
        
        logger.info("\n" + "="*60)
        if successful_strategies:
            logger.info("✅ CONNECTION TEST RESULTS:")
            logger.info(f"✅ {len(successful_strategies)} strategy(ies) successful:")
            for strategy in successful_strategies:
                logger.info(f"   ✅ {strategy}")
            logger.info("\n💡 Recommendation: Use the first successful strategy in your application")
        else:
            logger.error("❌ All connection strategies failed!")
            logger.error("❌ This indicates a fundamental connectivity issue")
            logger.info("\n🔧 Troubleshooting steps:")
            logger.info("   1. Verify your MongoDB Atlas cluster is running")
            logger.info("   2. Check your IP address is whitelisted in Atlas")
            logger.info("   3. Verify the connection string is correct")
            logger.info("   4. Test from a different network/location")
        
        logger.info("="*60)
        return len(successful_strategies) > 0

async def main():
    """Main test function."""
    try:
        tester = ConnectionTester()
        success = await tester.run_all_tests()
        
        if success:
            logger.info("🎉 Connection test completed successfully!")
            return 0
        else:
            logger.error("💥 Connection test failed!")
            return 1
            
    except Exception as e:
        logger.error(f"💥 Test script error: {e}")
        import traceback
        logger.error(f"Full traceback:\n{traceback.format_exc()}")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)