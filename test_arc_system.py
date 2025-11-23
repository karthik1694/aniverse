#!/usr/bin/env python3
"""
Test script for the Enhanced Arc System
This script demonstrates the anime-style arc progression system
"""

import asyncio
import sys
import os
sys.path.append('backend')

# Mock the arc progression logic for testing
class MockArcSystem:
    def __init__(self):
        self.arcs = [
            {
                "phase": "prologue",
                "name": "✨ Prologue Arc: Joined AniConnect",
                "next_arc": "⚡ Connection Arc: First Match Found",
                "next_phase": "connection",
                "condition": "matches_completed >= 1",
                "milestone": "first_match"
            },
            {
                "phase": "connection", 
                "name": "⚡ Connection Arc: First Match Found",
                "next_arc": "🔥 Rising Bond Arc: 100 Messages Shared",
                "next_phase": "rising_bond",
                "condition": "messages_sent >= 100",
                "milestone": "chatty_character"
            },
            {
                "phase": "rising_bond",
                "name": "🔥 Rising Bond Arc: 100 Messages Shared", 
                "next_arc": "🌟 Adventure Arc: Episode Rooms Explorer",
                "next_phase": "adventure",
                "condition": "episode_rooms_joined >= 5",
                "milestone": "room_explorer"
            },
            {
                "phase": "adventure",
                "name": "🌟 Adventure Arc: Episode Rooms Explorer",
                "next_arc": "👑 Power Arc: Social Butterfly", 
                "next_phase": "power",
                "condition": "friends_count >= 3 and messages_sent >= 250",
                "milestone": "social_butterfly"
            },
            {
                "phase": "power",
                "name": "👑 Power Arc: Social Butterfly",
                "next_arc": "🌙 Eclipse Arc: Master Connector",
                "next_phase": "eclipse", 
                "condition": "friends_count >= 10 and episode_rooms_joined >= 20",
                "milestone": "master_connector"
            }
        ]
        
    def check_progression(self, current_phase, stats):
        """Check if user should progress to next arc"""
        for arc in self.arcs:
            if arc["phase"] == current_phase:
                # Evaluate condition
                condition = arc["condition"]
                
                # Replace variables with actual stats
                condition = condition.replace("matches_completed", str(stats.get("matches_completed", 0)))
                condition = condition.replace("messages_sent", str(stats.get("messages_sent", 0)))
                condition = condition.replace("episode_rooms_joined", str(stats.get("episode_rooms_joined", 0)))
                condition = condition.replace("friends_count", str(stats.get("friends_count", 0)))
                
                try:
                    if eval(condition):
                        return {
                            "should_progress": True,
                            "next_arc": arc["next_arc"],
                            "next_phase": arc["next_phase"],
                            "milestone": arc["milestone"]
                        }
                except:
                    pass
                    
                break
                
        return {"should_progress": False}

def test_arc_progression():
    """Test the arc progression system with different user scenarios"""
    arc_system = MockArcSystem()
    
    print("🎌 ANIME ARC SYSTEM TEST 🎌")
    print("=" * 50)
    
    # Test scenarios
    test_cases = [
        {
            "name": "New User (Prologue)",
            "current_phase": "prologue",
            "stats": {"matches_completed": 0, "messages_sent": 0, "episode_rooms_joined": 0, "friends_count": 0}
        },
        {
            "name": "First Match (Connection Arc Unlock)",
            "current_phase": "prologue", 
            "stats": {"matches_completed": 1, "messages_sent": 0, "episode_rooms_joined": 0, "friends_count": 0}
        },
        {
            "name": "Chatty User (Rising Bond Arc Unlock)",
            "current_phase": "connection",
            "stats": {"matches_completed": 1, "messages_sent": 100, "episode_rooms_joined": 0, "friends_count": 1}
        },
        {
            "name": "Room Explorer (Adventure Arc Unlock)",
            "current_phase": "rising_bond",
            "stats": {"matches_completed": 2, "messages_sent": 150, "episode_rooms_joined": 5, "friends_count": 2}
        },
        {
            "name": "Social Butterfly (Power Arc Unlock)",
            "current_phase": "adventure",
            "stats": {"matches_completed": 5, "messages_sent": 250, "episode_rooms_joined": 8, "friends_count": 3}
        },
        {
            "name": "Master Connector (Eclipse Arc Unlock)",
            "current_phase": "power",
            "stats": {"matches_completed": 10, "messages_sent": 500, "episode_rooms_joined": 20, "friends_count": 10}
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. Testing: {test_case['name']}")
        print(f"   Current Phase: {test_case['current_phase']}")
        print(f"   Stats: {test_case['stats']}")
        
        result = arc_system.check_progression(test_case['current_phase'], test_case['stats'])
        
        if result["should_progress"]:
            print(f"   ✅ ARC PROGRESSION TRIGGERED!")
            print(f"   🎊 New Arc: {result['next_arc']}")
            print(f"   📈 Next Phase: {result['next_phase']}")
            print(f"   🏆 Milestone: {result['milestone']}")
        else:
            print(f"   ⏳ No progression yet - keep building connections!")
    
    print("\n" + "=" * 50)
    print("🌟 Arc System Features:")
    print("✨ Prologue Arc → Connection Arc (First match)")
    print("⚡ Connection Arc → Rising Bond Arc (100 messages)")  
    print("🔥 Rising Bond Arc → Adventure Arc (5 episode rooms)")
    print("🌟 Adventure Arc → Power Arc (3 friends + 250 messages)")
    print("👑 Power Arc → Eclipse Arc (10 friends + 20 rooms)")
    print("🌅 Special: Redemption Arc (return after 7+ days)")
    print("\n🎮 This creates PURE anime psychology:")
    print("• Users feel like the main character")
    print("• Creates emotional attachment to the app") 
    print("• Feels unique — no app uses anime-story psychology")
    print("• Encourages returning to 'complete your arc'")

if __name__ == "__main__":
    test_arc_progression()