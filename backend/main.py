import uvicorn
import os
from server import socket_app

if __name__ == "__main__":
    # Use environment variables for Render deployment
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(socket_app, host=host, port=port, log_level="info")