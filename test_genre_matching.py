#!/usr/bin/env python3
"""
Test genre-based matching (like what users set in Dashboard)
"""

# Simple compatibility calculation matching the updated server.py logic
def calculate_compatibility(user1_data, user2_data):
    score = 0
    
    # Check what data is available
    has_anime = bool(user1_data.get('favorite_anime') and user2_data.get('favorite_anime'))
    has_genres = bool(user1_data.get('favorite_genres') and user2_data.get('favorite_genres'))
    has_themes = bool(user1_data.get('favorite_themes') and user2_data.get('favorite_themes'))
    has_characters = bool(user1_data.get('favorite_characters') and user2_data.get('favorite_characters'))
    
    # Shared favorite anime (High weight - 40 points)
    shared_anime = set(user1_data.get('favorite_anime', [])) & set(user2_data.get('favorite_anime', []))
    score += len(shared_anime) * 10
    
    # Genre alignment - BOOSTED weight when it's the primary data available
    shared_genres = set(user1_data.get('favorite_genres', [])) & set(user2_data.get('favorite_genres', []))
    if has_genres:
        # If users primarily use genres (no anime/themes/characters), give genres much more weight
        if not (has_anime or has_themes or has_characters):
            # Genres are the ONLY data - make them worth much more (up to 100 points)
            score += len(shared_genres) * 20
        else:
            # Standard weight when other data exists
            score += len(shared_genres) * 5
    
    # Theme alignment (Medium weight - 20 points)
    shared_themes = set(user1_data.get('favorite_themes', [])) & set(user2_data.get('favorite_themes', []))
    score += len(shared_themes) * 4
    
    # Character affinity (Low-Medium weight - 10 points)
    shared_characters = set(user1_data.get('favorite_characters', [])) & set(user2_data.get('favorite_characters', []))
    score += len(shared_characters) * 2
    
    return min(score, 100)  # Cap at 100

print("="*60)
print("Testing Genre-Based Matching (Dashboard UI)")
print("="*60)

# Test Case 1: Users with ONLY genres (like from Dashboard)
print("\nTest 1: Users with only genre interests (Dashboard scenario)")
user1 = {
    "name": "Alice",
    "favorite_genres": ["Action", "Thriller", "Drama"],
    "favorite_anime": [],
    "favorite_themes": [],
    "favorite_characters": []
}

user2 = {
    "name": "Bob", 
    "favorite_genres": ["Action", "Thriller", "Comedy"],
    "favorite_anime": [],
    "favorite_themes": [],
    "favorite_characters": []
}

shared = set(user1['favorite_genres']) & set(user2['favorite_genres'])
print(f"Alice interests: {user1['favorite_genres']}")
print(f"Bob interests: {user2['favorite_genres']}")
print(f"Shared genres: {list(shared)}")
score = calculate_compatibility(user1, user2)
print(f"Compatibility score: {score}%")
print(f"Match type: {'Interest-based' if score >= 15 else 'Random'}")

# Test Case 2: One shared genre
print("\nTest 2: Users with 1 shared genre")
user3 = {
    "name": "Charlie",
    "favorite_genres": ["Romance"],
    "favorite_anime": [],
    "favorite_themes": [],
    "favorite_characters": []
}

user4 = {
    "name": "Diana",
    "favorite_genres": ["Romance", "Slice of Life"],
    "favorite_anime": [],
    "favorite_themes": [],
    "favorite_characters": []
}

shared = set(user3['favorite_genres']) & set(user4['favorite_genres'])
print(f"Charlie interests: {user3['favorite_genres']}")
print(f"Diana interests: {user4['favorite_genres']}")
print(f"Shared genres: {list(shared)}")
score = calculate_compatibility(user3, user4)
print(f"Compatibility score: {score}%")
print(f"Match type: {'Interest-based' if score >= 15 else 'Random'}")

# Test Case 3: No shared genres
print("\nTest 3: Users with NO shared genres (should be random)")
user5 = {
    "name": "Eve",
    "favorite_genres": ["Horror", "Mystery"],
    "favorite_anime": [],
    "favorite_themes": [],
    "favorite_characters": []
}

user6 = {
    "name": "Frank",
    "favorite_genres": ["Sports", "Comedy"],
    "favorite_anime": [],
    "favorite_themes": [],
    "favorite_characters": []
}

shared = set(user5['favorite_genres']) & set(user6['favorite_genres'])
print(f"Eve interests: {user5['favorite_genres']}")
print(f"Frank interests: {user6['favorite_genres']}")
print(f"Shared genres: {list(shared)}")
score = calculate_compatibility(user5, user6)
print(f"Compatibility score: {score}%")
print(f"Match type: {'Interest-based' if score >= 15 else 'Random'}")

# Test Case 4: Users from the screenshot
print("\nTest 4: Real scenario from UI (user with 'one piece' genre)")
user7 = {
    "name": "User from Screenshot",
    "favorite_genres": ["one piece"],  # As shown in the image
    "favorite_anime": [],
    "favorite_themes": [],
    "favorite_characters": []
}

user8 = {
    "name": "Another User",
    "favorite_genres": ["one piece", "Action"],
    "favorite_anime": [],
    "favorite_themes": [],
    "favorite_characters": []
}

shared = set(user7['favorite_genres']) & set(user8['favorite_genres'])
print(f"User 1 interests: {user7['favorite_genres']}")
print(f"User 2 interests: {user8['favorite_genres']}")
print(f"Shared genres: {list(shared)}")
score = calculate_compatibility(user7, user8)
print(f"Compatibility score: {score}%")
print(f"Match type: {'Interest-based' if score >= 15 else 'Random'}")

print("\n" + "="*60)
print("Summary:")
print("- 1 shared genre = 20% compatibility (interest-based match)")
print("- 2 shared genres = 40% compatibility (good match)")
print("- 3 shared genres = 60% compatibility (great match)")
print("- 0 shared genres = 0% compatibility (random match)")
print("="*60)
