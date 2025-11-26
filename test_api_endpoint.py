import requests
import sys

try:
    # Test the API endpoint which should work
    response = requests.get('http://localhost:8001/api/', timeout=5)
    print(f'API Status: {response.status_code}')
    print(f'API Response: {response.json()}')
except Exception as e:
    print(f'API test failed: {e}')

try:
    # Test the health endpoint
    response = requests.get('http://localhost:8001/api/health', timeout=5)
    print(f'Health Status: {response.status_code}')
    print(f'Health Response: {response.json()}')
except Exception as e:
    print(f'Health test failed: {e}')