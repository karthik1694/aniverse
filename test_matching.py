#!/usr/bin/env python3
"""
Simple test script to verify the matching system works
"""

import asyncio
import socketio
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

# Test users
test_users = [
    {
        "id": "test_user_1",
        "name": "Alice",
        "email": "alice@test.com",
        "favorite_anime": ["Attack on Titan", "Death Note"],
        "favorite_genres": ["Action", "Thriller"],
        "favorite_themes": ["Military", "Detective"],
        "favorite_characters": ["Levi", "Light"],
        "premium": False
    },
    {
        "id": "test_user_2", 
        "name": "Bob",
        "email": "bob@test.com",
        "favorite_anime": ["Naruto", "One Piece"],
        "favorite_genres": ["Action", "Adventure"],
        "favorite_themes": ["Ninja", "Pirates"],
        "favorite_characters": ["Naruto", "Luffy"],
        "premium": False
    }
]

class TestClient:
    def __init__(self, user_data, client_id):
        self.user_data = user_data
        self.client_id = client_id
        self.sio = socketio.AsyncClient()
        self.connected = False
        self.matched = False
        
    async def setup_events(self):
        @self.sio.event
        async def connect():
            print(f"[{self.client_id}] Connected to server")
            self.connected = True
            
        @self.sio.event
        async def connected(data):
            print(f"[{self.client_id}] Server confirmed connection: {data}")
            
        @self.sio.event
        async def match_found(data):
            print(f"[{self.client_id}] MATCH FOUND!")
            print(f"[{self.client_id}] Partner: {data['partner']['name']}")
            print(f"[{self.client_id}] Compatibility: {data['compatibility']}")
            print(f"[{self.client_id}] Match type: {data['shared_universe'].get('match_type', 'unknown')}")
            self.matched = True
            
        @self.sio.event
        async def searching():
            print(f"[{self.client_id}] Searching for match...")
            
        @self.sio.event
        async def error(data):
            print(f"[{self.client_id}] ERROR: {data}")
            
        @self.sio.event
        async def disconnect():
            print(f"[{self.client_id}] Disconnected from server")
            self.connected = False
    
    async def connect_to_server(self):
        await self.setup_events()
        try:
            await self.sio.connect('http://localhost:8000', socketio_path='/api/socket.io')
            return True
        except Exception as e:
            print(f"[{self.client_id}] Failed to connect: {e}")
            return False
    
    async def start_matching(self):
        if not self.connected:
            print(f"[{self.client_id}] Not connected to server")
            return
            
        print(f"[{self.client_id}] Starting matching process...")
        await self.sio.emit('join_matching', {
            'user_id': self.user_data['id'],
            'user_data': self.user_data
        })
    
    async def disconnect(self):
        if self.connected:
            await self.sio.disconnect()

async def test_matching():
    print("=== Testing Matching System ===")
    
    # Create test clients
    client1 = TestClient(test_users[0], "Client1")
    client2 = TestClient(test_users[1], "Client2")
    
    try:
        # Connect both clients
        print("\n1. Connecting clients...")
        success1 = await client1.connect_to_server()
        success2 = await client2.connect_to_server()
        
        if not (success1 and success2):
            print("Failed to connect clients")
            return
        
        # Wait a moment for connections to stabilize
        await asyncio.sleep(1)
        
        # Start matching for first client
        print("\n2. Client1 starts matching...")
        await client1.start_matching()
        
        # Wait a moment
        await asyncio.sleep(2)
        
        # Start matching for second client (should match with first)
        print("\n3. Client2 starts matching...")
        await client2.start_matching()
        
        # Wait for matching to complete
        print("\n4. Waiting for match...")
        for i in range(10):  # Wait up to 10 seconds
            await asyncio.sleep(1)
            if client1.matched and client2.matched:
                print("\n✅ SUCCESS: Both clients matched!")
                break
            print(f"   Waiting... ({i+1}/10)")
        else:
            print("\n❌ FAILED: Clients did not match within 10 seconds")
            print(f"   Client1 matched: {client1.matched}")
            print(f"   Client2 matched: {client2.matched}")
        
    except Exception as e:
        print(f"Test failed with error: {e}")
    finally:
        # Cleanup
        print("\n5. Disconnecting clients...")
        await client1.disconnect()
        await client2.disconnect()

if __name__ == "__main__":
    asyncio.run(test_matching())