import requests
import sys
import json
from datetime import datetime
import time

class AniChatAPITester:
    def __init__(self, base_url="https://animeverse-193.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def test_root_endpoint(self):
        """Test root API endpoint"""
        try:
            response = requests.get(f"{self.api_url}/")
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Response: {response.json() if success else response.text}"
            self.log_test("Root API Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Root API Endpoint", False, str(e))
            return False

    def test_anime_endpoint_without_auth(self):
        """Test anime endpoint without authentication (should fail)"""
        try:
            response = requests.get(f"{self.api_url}/anime")
            success = response.status_code == 401  # Should be unauthorized
            details = f"Status: {response.status_code} (Expected 401)"
            self.log_test("Anime Endpoint (No Auth)", success, details)
            return success
        except Exception as e:
            self.log_test("Anime Endpoint (No Auth)", False, str(e))
            return False

    def test_auth_me_without_token(self):
        """Test /auth/me without token (should fail)"""
        try:
            response = requests.get(f"{self.api_url}/auth/me")
            success = response.status_code == 401
            details = f"Status: {response.status_code} (Expected 401)"
            self.log_test("Auth Me (No Token)", success, details)
            return success
        except Exception as e:
            self.log_test("Auth Me (No Token)", False, str(e))
            return False

    def test_session_creation_invalid(self):
        """Test session creation with invalid session_id"""
        try:
            response = requests.post(f"{self.api_url}/auth/session", params={"session_id": "invalid_session_123"})
            success = response.status_code == 401  # Should fail with invalid session
            details = f"Status: {response.status_code} (Expected 401)"
            self.log_test("Session Creation (Invalid)", success, details)
            return success
        except Exception as e:
            self.log_test("Session Creation (Invalid)", False, str(e))
            return False

    def test_anime_endpoint_with_mock_auth(self):
        """Test anime endpoint with mock authentication"""
        try:
            # Create a mock session for testing (this won't work with real auth but tests the endpoint structure)
            headers = {'Authorization': 'Bearer mock_token_for_testing'}
            response = requests.get(f"{self.api_url}/anime", headers=headers)
            
            # We expect 401 since it's a mock token, but this tests the endpoint exists
            success = response.status_code in [401, 200]  # Either unauthorized or success
            details = f"Status: {response.status_code}, Endpoint accessible"
            self.log_test("Anime Endpoint Structure", success, details)
            return success
        except Exception as e:
            self.log_test("Anime Endpoint Structure", False, str(e))
            return False

    def test_profile_update_without_auth(self):
        """Test profile update without authentication"""
        try:
            profile_data = {
                "bio": "Test bio",
                "favorite_anime": ["Naruto", "One Piece"],
                "favorite_genres": ["Action", "Adventure"]
            }
            response = requests.put(f"{self.api_url}/profile", json=profile_data)
            success = response.status_code == 401
            details = f"Status: {response.status_code} (Expected 401)"
            self.log_test("Profile Update (No Auth)", success, details)
            return success
        except Exception as e:
            self.log_test("Profile Update (No Auth)", False, str(e))
            return False

    def test_friends_endpoint_without_auth(self):
        """Test friends endpoint without authentication"""
        try:
            response = requests.get(f"{self.api_url}/friends")
            success = response.status_code == 401
            details = f"Status: {response.status_code} (Expected 401)"
            self.log_test("Friends Endpoint (No Auth)", success, details)
            return success
        except Exception as e:
            self.log_test("Friends Endpoint (No Auth)", False, str(e))
            return False

    def test_friend_requests_without_auth(self):
        """Test friend requests endpoint without authentication"""
        try:
            response = requests.get(f"{self.api_url}/friend-requests")
            success = response.status_code == 401
            details = f"Status: {response.status_code} (Expected 401)"
            self.log_test("Friend Requests (No Auth)", success, details)
            return success
        except Exception as e:
            self.log_test("Friend Requests (No Auth)", False, str(e))
            return False

    def test_logout_without_auth(self):
        """Test logout without authentication"""
        try:
            response = requests.post(f"{self.api_url}/auth/logout")
            success = response.status_code == 200  # Logout should work even without auth
            details = f"Status: {response.status_code}"
            self.log_test("Logout (No Auth)", success, details)
            return success
        except Exception as e:
            self.log_test("Logout (No Auth)", False, str(e))
            return False

    def test_socket_io_endpoint(self):
        """Test Socket.IO endpoint accessibility"""
        try:
            # Test if Socket.IO endpoint is accessible
            response = requests.get(f"{self.base_url}/socket.io/")
            # Socket.IO typically returns 400 for GET requests, which means it's accessible
            success = response.status_code in [400, 200]
            details = f"Status: {response.status_code}, Socket.IO endpoint accessible"
            self.log_test("Socket.IO Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Socket.IO Endpoint", False, str(e))
            return False

    def test_cors_headers(self):
        """Test CORS headers"""
        try:
            response = requests.options(f"{self.api_url}/")
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            }
            success = bool(cors_headers['Access-Control-Allow-Origin'])
            details = f"CORS Headers: {cors_headers}"
            self.log_test("CORS Configuration", success, details)
            return success
        except Exception as e:
            self.log_test("CORS Configuration", False, str(e))
            return False

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting AniChat.gg Backend API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)

        # Test basic connectivity and endpoints
        self.test_root_endpoint()
        self.test_socket_io_endpoint()
        self.test_cors_headers()
        
        # Test authentication endpoints
        self.test_auth_me_without_token()
        self.test_session_creation_invalid()
        self.test_logout_without_auth()
        
        # Test protected endpoints without auth (should all return 401)
        self.test_anime_endpoint_without_auth()
        self.test_anime_endpoint_with_mock_auth()
        self.test_profile_update_without_auth()
        self.test_friends_endpoint_without_auth()
        self.test_friend_requests_without_auth()

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All backend API structure tests passed!")
            print("✅ Backend is properly configured and endpoints are accessible")
            print("⚠️  Note: Authentication tests require valid Emergent OAuth session")
        else:
            print("⚠️  Some tests failed - check the details above")
            
        return self.tests_passed, self.tests_run, self.test_results

def main():
    tester = AniChatAPITester()
    passed, total, results = tester.run_all_tests()
    
    # Save results to file
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'passed': passed,
                'total': total,
                'success_rate': f"{(passed/total)*100:.1f}%"
            },
            'results': results,
            'timestamp': datetime.now().isoformat()
        }, f, indent=2)
    
    return 0 if passed == total else 1

if __name__ == "__main__":
    sys.exit(main())