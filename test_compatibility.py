#!/usr/bin/env python3
"""
Test the compatibility calculation directly
"""

# Simple compatibility calculation (copied from server.py)
def calculate_compatibility(user1_data, user2_data):
    score = 0
    
    # Shared favorite anime (High weight - 40 points)
    shared_anime = set(user1_data.get('favorite_anime', [])) & set(user2_data.get('favorite_anime', []))
    score += len(shared_anime) * 10
    
    # Genre alignment (Medium weight - 30 points)
    shared_genres = set(user1_data.get('favorite_genres', [])) & set(user2_data.get('favorite_genres', []))
    score += len(shared_genres) * 5
    
    # Theme alignment (Medium weight - 20 points)
    shared_themes = set(user1_data.get('favorite_themes', [])) & set(user2_data.get('favorite_themes', []))
    score += len(shared_themes) * 4
    
    # Character affinity (Low-Medium weight - 10 points)
    shared_characters = set(user1_data.get('favorite_characters', [])) & set(user2_data.get('favorite_characters', []))
    score += len(shared_characters) * 2
    
    return min(score, 100)  # Cap at 100

# Test users
user1 = {
    "favorite_anime": ["Attack on Titan", "Death Note", "Fullmetal Alchemist: Brotherhood"],
    "favorite_genres": ["Action", "Thriller", "Drama"],
    "favorite_themes": ["Military", "Detective", "Alchemy"],
    "favorite_characters": ["Levi", "Light", "Edward Elric"]
}

user2 = {
    "favorite_anime": ["Attack on Titan", "Death Note", "Steins;Gate"],
    "favorite_genres": ["Action", "Thriller", "Sci-Fi"],
    "favorite_themes": ["Military", "Detective", "Time Travel"],
    "favorite_characters": ["Levi", "Light", "Okabe"]
}

print("=== Compatibility Test ===")
print(f"User1 anime: {user1['favorite_anime']}")
print(f"User2 anime: {user2['favorite_anime']}")
print()

shared_anime = set(user1['favorite_anime']) & set(user2['favorite_anime'])
shared_genres = set(user1['favorite_genres']) & set(user2['favorite_genres'])
shared_themes = set(user1['favorite_themes']) & set(user2['favorite_themes'])
shared_characters = set(user1['favorite_characters']) & set(user2['favorite_characters'])

print(f"Shared anime: {shared_anime} (count: {len(shared_anime)}, points: {len(shared_anime) * 10})")
print(f"Shared genres: {shared_genres} (count: {len(shared_genres)}, points: {len(shared_genres) * 5})")
print(f"Shared themes: {shared_themes} (count: {len(shared_themes)}, points: {len(shared_themes) * 4})")
print(f"Shared characters: {shared_characters} (count: {len(shared_characters)}, points: {len(shared_characters) * 2})")
print()

score = calculate_compatibility(user1, user2)
print(f"Total compatibility score: {score}")
print(f"Should be interest-based match: {score > 15}")