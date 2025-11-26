import requests
import sys

try:
    # Test the local server if it's running
    response = requests.get('http://localhost:8001/', timeout=5)
    print(f'Status: {response.status_code}')
    print(f'Response: {response.json()}')
except Exception as e:
    print(f'Local test failed: {e}')
    print('This is expected if no local server is running on port 8001')