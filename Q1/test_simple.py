#!/usr/bin/env python3
"""
Simple token test
"""

import os
import requests

def test_simple():
    token = os.getenv("HF_API_TOKEN")
    print(f"Token: {token[:10]}...")
    
    # Test with a very simple request
    url = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium"
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"inputs": "Hello"}
    
    print("Testing simple request...")
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        
        if response.status_code == 200:
            print("✅ Token works!")
            return True
        else:
            print("❌ Token doesn't work")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_simple()
