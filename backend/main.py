import uvicorn
import os
import logging
from server import socket_app

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    # Use environment variables for Render deployment
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    
    logger.info(f"🚀 Starting server on {host}:{port}")
    logger.info(f"🌐 Environment: {'Render' if os.getenv('RENDER') else 'Local'}")
    
    # Render-specific configuration
    uvicorn_config = {
        "host": host,
        "port": port,
        "log_level": "info",
        "access_log": True,
        "use_colors": False,  # Better for cloud logs
        "server_header": False,  # Reduce overhead
        "date_header": False,  # Reduce overhead
    }
    
    # Add Render-specific optimizations
    if os.getenv("RENDER"):
        uvicorn_config.update({
            "workers": 1,  # Single worker for Render's resource constraints
            "timeout_keep_alive": 30,  # Keep connections alive longer
            "timeout_graceful_shutdown": 30,  # Graceful shutdown timeout
            "limit_concurrency": 100,  # Limit concurrent connections
            "limit_max_requests": 1000,  # Restart worker after N requests
            "backlog": 2048,  # Socket backlog size
        })
    
    try:
        uvicorn.run(socket_app, **uvicorn_config)
    except Exception as e:
        logger.error(f"❌ Failed to start server: {e}")
        raise