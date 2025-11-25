#!/usr/bin/env python3
"""
Simple script to start the backend server
Run this from the backend directory
"""

import subprocess
import sys
import os

def main():
    print("Starting AniConnect Backend Server...")
    print("Server will be available at: http://localhost:8000")
    print("API endpoints will be at: http://localhost:8000/api")
    print("Socket.IO will be at: http://localhost:8000/api/socket.io")
    print("\nPress Ctrl+C to stop the server\n")
    
    try:
        # Start the server using the main.py entry point
        subprocess.run([
            sys.executable, "main.py"
        ], check=True)
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"Error starting server: {e}")
        print("\nMake sure you have installed the requirements:")
        print("pip install -r requirements.txt")
    except FileNotFoundError:
        print("Error: Python not found. Please check your Python installation.")

if __name__ == "__main__":
    main()