#!/usr/bin/env python3
"""
Test Hugging Face API connectivity
"""

import os
import requests
import json

def test_hugging_face_api():
    """Test Hugging Face API with different models"""
    
    token = os.getenv("HF_API_TOKEN")
    if not token:
        print("❌ No HF_API_TOKEN found. Set it first:")
        print("   $env:HF_API_TOKEN='your_token_here'")
        return False
    
    print(f"🔑 Testing with token: {token[:10]}...")
    
    # Test different models
    models_to_test = [
        "runwayml/stable-diffusion-v1-5",
        "stabilityai/stable-diffusion-2-1", 
        "CompVis/stable-diffusion-v1-4"
    ]
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    for model in models_to_test:
        print(f"\n🧪 Testing model: {model}")
        url = f"https://api-inference.huggingface.co/models/{model}"
        
        # Simple test payload
        payload = {
            "inputs": "a simple geometric triangle",
            "parameters": {
                "num_inference_steps": 1,  # Quick test
                "guidance_scale": 7.5
            }
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                print(f"   ✅ {model} - WORKING!")
                return True
            elif response.status_code == 401:
                print(f"   ❌ {model} - Authentication failed")
            elif response.status_code == 404:
                print(f"   ❌ {model} - Model not found")
            elif response.status_code == 503:
                print(f"   ⏳ {model} - Model loading (try again in a few minutes)")
            else:
                print(f"   ❌ {model} - Error: {response.text[:100]}")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ {model} - Request failed: {e}")
    
    print("\n❌ No working models found")
    return False

def test_alternative_models():
    """Test alternative image generation models"""
    print("\n🔄 Testing alternative models...")
    
    # Test with a different approach - text-to-image models
    alternative_models = [
        "microsoft/DialoGPT-medium",  # Text model (for testing API connectivity)
        "distilbert-base-uncased"     # Text model (for testing API connectivity)
    ]
    
    token = os.getenv("HF_API_TOKEN")
    if not token:
        return False
        
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    for model in alternative_models:
        print(f"\n🧪 Testing text model: {model}")
        url = f"https://api-inference.huggingface.co/models/{model}"
        
        payload = {"inputs": "Hello world"}
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=10)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                print(f"   ✅ API is working! The issue is with image generation models.")
                return True
            else:
                print(f"   ❌ Error: {response.text[:100]}")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Request failed: {e}")
    
    return False

def main():
    """Main test function"""
    print("🧪 Hugging Face API Test")
    print("=" * 30)
    
    # Test image generation models
    if test_hugging_face_api():
        print("\n🎉 Found a working image generation model!")
        return 0
    
    # Test alternative models
    if test_alternative_models():
        print("\n⚠️  API is working but image models may be unavailable")
        print("   Try again later or use a different model")
        return 1
    
    print("\n❌ API test failed completely")
    print("\nTroubleshooting steps:")
    print("1. Check your API token at: https://huggingface.co/settings/tokens")
    print("2. Make sure the token has 'Read' permissions")
    print("3. Try generating a new token")
    print("4. Check if you have API credits available")
    
    return 1

if __name__ == "__main__":
    import sys
    sys.exit(main())
