#!/usr/bin/env python3
"""
Simple script to start the backend server
Run this from the project root directory
"""

import subprocess
import sys
import os

def main():
    # Change to backend directory
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    
    print("Starting AniConnect Backend Server...")
    print(f"Backend directory: {backend_dir}")
    print("Server will be available at: http://localhost:8000")
    print("API endpoints will be at: http://localhost:8000/api")
    print("Socket.IO will be at: http://localhost:8000/api/socket.io")
    print("\nPress Ctrl+C to stop the server\n")
    
    try:
        # Start the server using uvicorn
        subprocess.run([
            sys.executable, "-m", "uvicorn",
            "server:socket_app_export",
            "--host", "0.0.0.0",
            "--port", "8000",
            "--reload",
            "--log-level", "info"
        ], cwd=backend_dir, check=True)
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"Error starting server: {e}")
        print("\nMake sure you have installed the requirements:")
        print("pip install -r backend/requirements.txt")
    except FileNotFoundError:
        print("Error: uvicorn not found. Please install the requirements:")
        print("pip install -r backend/requirements.txt")

if __name__ == "__main__":
    main()