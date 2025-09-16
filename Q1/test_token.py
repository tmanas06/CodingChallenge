#!/usr/bin/env python3
"""
Test if your Hugging Face API token is working
"""

import os
import requests

def test_token():
    token = os.getenv("HF_API_TOKEN")
    
    if not token:
        print("❌ No HF_API_TOKEN found")
        return False
    
    print(f"🔑 Testing token: {token[:10]}...")
    
    if token == "hf_test_token" or token.startswith("test"):
        print("❌ You're using a test token!")
        print("   Get a real token from: https://huggingface.co/settings/tokens")
        return False
    
    if not token.startswith("hf_"):
        print("❌ Token doesn't start with 'hf_'")
        print("   Make sure you copied the full token")
        return False
    
    # Test with a simple model
    url = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium"
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"inputs": "Hello"}
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        print(f"📡 API Response: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Token is working!")
            return True
        elif response.status_code == 401:
            print("❌ Token is invalid or expired")
            return False
        elif response.status_code == 403:
            print("❌ Token doesn't have required permissions")
            return False
        else:
            print(f"❌ API error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False

if __name__ == "__main__":
    test_token()
