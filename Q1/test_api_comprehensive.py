#!/usr/bin/env python3
"""
Comprehensive API test to find working models
"""

import os
import requests
import json

def test_comprehensive():
    token = os.getenv("HF_API_TOKEN")
    
    if not token:
        print("❌ No HF_API_TOKEN found")
        return False
    
    print(f"🔑 Testing token: {token[:10]}...")
    
    # Test different models and endpoints
    test_cases = [
        {
            "name": "Text Generation (DialoGPT)",
            "url": "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
            "payload": {"inputs": "Hello world"}
        },
        {
            "name": "Text Classification (BERT)",
            "url": "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english",
            "payload": {"inputs": "I love this movie"}
        },
        {
            "name": "Image Generation (Stable Diffusion v1.5)",
            "url": "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
            "payload": {"inputs": "a simple geometric triangle"}
        },
        {
            "name": "Image Generation (Stable Diffusion v2.1)",
            "url": "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1",
            "payload": {"inputs": "a simple geometric triangle"}
        }
    ]
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    working_models = []
    
    for test in test_cases:
        print(f"\n🧪 Testing: {test['name']}")
        print(f"   URL: {test['url']}")
        
        try:
            response = requests.post(
                test['url'], 
                headers=headers, 
                json=test['payload'], 
                timeout=30
            )
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                print(f"   ✅ {test['name']} - WORKING!")
                working_models.append(test['name'])
            elif response.status_code == 401:
                print(f"   ❌ Authentication failed")
            elif response.status_code == 403:
                print(f"   ❌ Access forbidden")
            elif response.status_code == 404:
                print(f"   ❌ Model not found")
            elif response.status_code == 503:
                print(f"   ⏳ Model loading (try again in a few minutes)")
            else:
                print(f"   ❌ Error: {response.text[:100]}")
                
        except requests.exceptions.Timeout:
            print(f"   ⏰ Request timed out")
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Request failed: {e}")
    
    print(f"\n📊 Results:")
    if working_models:
        print(f"   ✅ Working models: {', '.join(working_models)}")
        return True
    else:
        print(f"   ❌ No working models found")
        return False

def test_api_status():
    """Test if Hugging Face API is accessible at all"""
    print("\n🌐 Testing Hugging Face API Status...")
    
    try:
        # Test basic connectivity
        response = requests.get("https://api-inference.huggingface.co/", timeout=10)
        print(f"   API Status: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ Hugging Face API is accessible")
            return True
        else:
            print("   ❌ Hugging Face API is not accessible")
            return False
            
    except Exception as e:
        print(f"   ❌ Cannot reach Hugging Face API: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Comprehensive Hugging Face API Test")
    print("=" * 50)
    
    # Test API connectivity
    if not test_api_status():
        print("\n❌ Cannot reach Hugging Face API. Check your internet connection.")
        exit(1)
    
    # Test with different models
    if test_comprehensive():
        print("\n🎉 Found working models! You can use the script.")
    else:
        print("\n❌ No working models found. Possible issues:")
        print("   1. API token is invalid")
        print("   2. API token doesn't have required permissions")
        print("   3. Hugging Face API is experiencing issues")
        print("   4. Rate limiting or quota exceeded")
        print("\n💡 Try using the offline mode instead:")
        print("   python shape_analogy_generator_offline.py --n 1 --complexity intermediate")
