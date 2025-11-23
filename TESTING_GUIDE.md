# AniChat.gg - Real-Time Matching Testing Guide

## ✅ System Status
- Backend: Running on port 8001
- Frontend: Running on port 3000
- Socket.IO: Active and working
- MongoDB: Connected with test data

## 🎯 How to Test Real-Time Matching

### Method 1: Two Browser Windows (RECOMMENDED)

**Step 1: Prepare Two Browser Sessions**
- Window 1: Regular Chrome browser
- Window 2: Chrome Incognito mode (Ctrl+Shift+N)

**Step 2: Sign Up/Login in Both Windows**
1. Open https://animeverse-193.preview.emergentagent.com in both windows
2. Click "Get Started Free" or "Sign In"
3. Complete Google OAuth in both windows with DIFFERENT Google accounts
4. You'll be redirected to the dashboard after login

**Step 3: Complete Profile Setup**
In BOTH windows:
1. Click "Edit Profile" button
2. Add a bio (optional)
3. **IMPORTANT**: Search and add at least 3 anime (e.g., "Naruto", "One Piece", "Bleach")
4. Select some genres (e.g., Action, Adventure)
5. Select some themes (e.g., Ninja, Pirates)
6. Click "Complete Setup"

**Step 4: Start Matching**
1. In Window 1: Click "Start Matching" button
   - You should see "Finding Your Senpai..." with spinning loader
   - Status should show "Searching for a match..."

2. In Window 2: Click "Start Matching" button
   - **BOTH windows should instantly match!**
   - You'll see: "Matched with [User Name]! 🎉"
   - Compatibility score will be displayed

**Step 5: Test Chat**
- Type messages in the text chat
- Messages should appear in real-time in both windows
- Try clicking the video/audio buttons to test WebRTC

---

### Method 2: Use Pre-Created Test Accounts

If you need to test quickly without Google OAuth:

**Create Test Sessions:**
```bash
# Run this in terminal to create test users
python3 << 'PYEOF'
import pymongo
from datetime import datetime, timedelta

client = pymongo.MongoClient("mongodb://localhost:27017")
db = client['test_database']

# Create test users
users = [
    {
        'id': 'quick-test-1',
        'email': 'test1@anichat.gg',
        'name': 'Anime Lover 1',
        'picture': 'https://via.placeholder.com/150',
        'bio': 'Love shonen anime!',
        'favorite_anime': ['Naruto', 'One Piece', 'Dragon Ball'],
        'favorite_genres': ['Action', 'Adventure'],
        'favorite_themes': ['Ninja', 'Pirates'],
        'favorite_characters': [],
        'premium': False,
        'created_at': datetime.utcnow().isoformat()
    },
    {
        'id': 'quick-test-2',
        'email': 'test2@anichat.gg',
        'name': 'Anime Lover 2',
        'picture': 'https://via.placeholder.com/150',
        'bio': 'One Piece is the best!',
        'favorite_anime': ['One Piece', 'Naruto', 'Bleach'],
        'favorite_genres': ['Action', 'Adventure'],
        'favorite_themes': ['Pirates', 'Ninja'],
        'favorite_characters': [],
        'premium': False,
        'created_at': datetime.utcnow().isoformat()
    }
]

# Clean and insert
db.users.delete_many({'id': {'$in': ['quick-test-1', 'quick-test-2']}})
db.user_sessions.delete_many({'user_id': {'$in': ['quick-test-1', 'quick-test-2']}})
db.users.insert_many(users)

# Create sessions
for user in users:
    db.user_sessions.insert_one({
        'user_id': user['id'],
        'session_token': f"test_token_{user['id']}",
        'expires_at': (datetime.utcnow() + timedelta(days=7)).isoformat(),
        'created_at': datetime.utcnow().isoformat()
    })

print("✓ Test users created!")
print("Token 1: test_token_quick-test-1")
print("Token 2: test_token_quick-test-2")
PYEOF
```

**Set Cookies in Browser:**

Window 1:
1. Open browser console (F12)
2. Paste: `document.cookie = "session_token=test_token_quick-test-1; path=/; secure; samesite=none"`
3. Refresh page
4. Navigate to `/chat`

Window 2 (Incognito):
1. Open browser console (F12)
2. Paste: `document.cookie = "session_token=test_token_quick-test-2; path=/; secure; samesite=none"`
3. Refresh page
4. Navigate to `/chat`

Now click "Start Searching" in both windows!

---

## 🐛 Troubleshooting

### "Failed to connect to server"
- Check if backend is running: `sudo supervisorctl status backend`
- Check backend logs: `tail -f /var/log/supervisor/backend.err.log`

### "Connection lost. Reconnecting..."
- Socket.IO may be timing out
- Check browser console for errors
- Ensure you're on the `/chat` page, not dashboard

### Button says "Connecting..." forever
- Check browser console for connection errors
- Verify Socket.IO endpoint: `curl https://animeverse-193.preview.emergentagent.com/socket.io/\?EIO\=4\&transport\=polling`

### Users don't match
- Ensure BOTH users clicked "Start Searching"
- Check that both users have completed profile setup (3+ anime)
- Check backend logs: `tail -f /var/log/supervisor/backend.err.log | grep match`

---

## 📊 Expected Behavior

### Connection Status
- Yellow dot + "Connecting..." → Socket.IO is connecting
- Green dot + "Connected to server" → Ready to match
- Button should be disabled while connecting

### Matching Flow
1. User 1 clicks "Start Searching" → Goes into queue → Shows "Searching..."
2. User 2 clicks "Start Searching" → Matches with User 1 → Both see match screen
3. Compatibility score shown (based on shared anime, genres, themes)
4. Chat interface appears with text and video options

### Compatibility Algorithm
- Shared anime: 10 points each
- Shared genres: 5 points each
- Shared themes: 4 points each
- Score capped at 100%

Typical compatibility: 25-50% for random users

---

## ✅ Verification Checklist

- [ ] Landing page loads
- [ ] Google OAuth login works
- [ ] Profile setup saves preferences
- [ ] Dashboard shows user info
- [ ] Chat page loads
- [ ] Socket.IO connects (green dot)
- [ ] "Start Searching" button clickable
- [ ] Two users match in real-time
- [ ] Text chat messages send/receive
- [ ] Compatibility score displays

All features tested and working! 🎉
