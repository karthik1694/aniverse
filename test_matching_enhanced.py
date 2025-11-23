#!/usr/bin/env python3
"""
Enhanced test script to verify the interest-based matching system works
"""

import asyncio
import socketio
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

# Test users with overlapping interests for better matching
test_users = [
    {
        "id": "test_user_1",
        "name": "Alice",
        "email": "alice@test.com",
        "favorite_anime": ["Attack on Titan", "Death Note", "Fullmetal Alchemist: Brotherhood"],
        "favorite_genres": ["Action", "Thriller", "Drama"],
        "favorite_themes": ["Military", "Detective", "Alchemy"],
        "favorite_characters": ["Levi", "Light", "Edward Elric"],
        "premium": False
    },
    {
        "id": "test_user_2", 
        "name": "Bob",
        "email": "bob@test.com",
        "favorite_anime": ["Attack on Titan", "Death Note", "Steins;Gate"],  # 2 shared anime
        "favorite_genres": ["Action", "Thriller", "Sci-Fi"],  # 2 shared genres
        "favorite_themes": ["Military", "Detective", "Time Travel"],  # 2 shared themes
        "favorite_characters": ["Levi", "Light", "Okabe"],  # 2 shared characters
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
        self.match_data = None
        
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
            print(f"[{self.client_id}] Match message: {data['shared_universe'].get('match_message', 'N/A')}")
            if data['shared_universe'].get('shared_anime'):
                print(f"[{self.client_id}] Shared anime: {data['shared_universe']['shared_anime']}")
            if data['shared_universe'].get('shared_genres'):
                print(f"[{self.client_id}] Shared genres: {data['shared_universe']['shared_genres']}")
            self.matched = True
            self.match_data = data
            
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

async def test_enhanced_matching():
    print("=== Testing Enhanced Interest-Based Matching System ===")
    print(f"Alice likes: {test_users[0]['favorite_anime']}")
    print(f"Bob likes: {test_users[1]['favorite_anime']}")
    print(f"Expected shared anime: {set(test_users[0]['favorite_anime']) & set(test_users[1]['favorite_anime'])}")
    print()
    
    # Create test clients
    client1 = TestClient(test_users[0], "Alice")
    client2 = TestClient(test_users[1], "Bob")
    
    try:
        # Connect both clients
        print("1. Connecting clients...")
        success1 = await client1.connect_to_server()
        success2 = await client2.connect_to_server()
        
        if not (success1 and success2):
            print("Failed to connect clients")
            return
        
        # Wait a moment for connections to stabilize
        await asyncio.sleep(1)
        
        # Start matching for first client
        print("\n2. Alice starts matching...")
        await client1.start_matching()
        
        # Wait a moment
        await asyncio.sleep(2)
        
        # Start matching for second client (should match with first)
        print("\n3. Bob starts matching...")
        await client2.start_matching()
        
        # Wait for matching to complete
        print("\n4. Waiting for match...")
        for i in range(10):  # Wait up to 10 seconds
            await asyncio.sleep(1)
            if client1.matched and client2.matched:
                print("\n✅ SUCCESS: Both clients matched!")
                
                # Analyze the match quality
                if client1.match_data:
                    match_type = client1.match_data['shared_universe'].get('match_type', 'unknown')
                    compatibility = client1.match_data.get('compatibility', 0)
                    shared_anime = client1.match_data['shared_universe'].get('shared_anime', [])
                    
                    print(f"\n📊 Match Analysis:")
                    print(f"   Match Type: {match_type}")
                    print(f"   Compatibility Score: {compatibility}")
                    print(f"   Shared Anime: {shared_anime}")
                    
                    if match_type == 'interest_based' and compatibility > 15:
                        print("   🎯 EXCELLENT: Interest-based matching is working correctly!")
                    elif match_type == 'random':
                        print("   ⚠️  NOTICE: Fell back to random matching")
                    else:
                        print("   ❓ UNKNOWN: Unexpected match type")
                
                break
            print(f"   Waiting... ({i+1}/10)")
        else:
            print("\n❌ FAILED: Clients did not match within 10 seconds")
            print(f"   Alice matched: {client1.matched}")
            print(f"   Bob matched: {client2.matched}")
        
    except Exception as e:
        print(f"Test failed with error: {e}")
    finally:
        # Cleanup
        print("\n5. Disconnecting clients...")
        await client1.disconnect()
        await client2.disconnect()

if __name__ == "__main__":
    asyncio.run(test_enhanced_matching())