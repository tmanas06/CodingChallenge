#!/usr/bin/env python3
"""
Setup script for Shape Analogy Generator
Handles installation and initial setup
"""

import os
import sys
import subprocess
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 7):
        print("❌ Python 3.7 or higher is required")
        print(f"Current version: {sys.version}")
        return False
    print(f"✅ Python version: {sys.version.split()[0]}")
    return True

def install_requirements():
    """Install required packages"""
    print("\n📦 Installing requirements...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                      check=True, capture_output=True, text=True)
        print("✅ Requirements installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install requirements: {e.stderr}")
        return False

def create_directories():
    """Create necessary directories"""
    print("\n📁 Creating directories...")
    directories = ["output", "output/images", "cache", "tests"]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"✅ Created: {directory}/")
    
    return True

def check_api_token():
    """Check if API token is set"""
    print("\n🔑 Checking API token...")
    token = os.getenv("HF_API_TOKEN")
    if token:
        print("✅ HF_API_TOKEN is set")
        return True
    else:
        print("⚠️  HF_API_TOKEN not set")
        print("Please set your Hugging Face API token:")
        print("  export HF_API_TOKEN='your_token_here'")
        return False

def run_tests():
    """Run basic tests"""
    print("\n🧪 Running tests...")
    try:
        result = subprocess.run([sys.executable, "run_tests.py"], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ All tests passed")
            return True
        else:
            print(f"❌ Tests failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Failed to run tests: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 Shape Analogy Generator - Setup")
    print("=" * 40)
    
    success = True
    
    # Check Python version
    if not check_python_version():
        success = False
    
    # Install requirements
    if success and not install_requirements():
        success = False
    
    # Create directories
    if success and not create_directories():
        success = False
    
    # Check API token
    if success:
        check_api_token()  # Not critical for setup
    
    # Run tests
    if success and not run_tests():
        success = False
    
    print("\n" + "=" * 40)
    if success:
        print("🎉 Setup completed successfully!")
        print("\nNext steps:")
        print("1. Set your HF_API_TOKEN: export HF_API_TOKEN='your_token_here'")
        print("2. Run the generator: python shape_analogy_generator.py --help")
        print("3. Try the demo: python demo.py")
    else:
        print("❌ Setup failed. Please check the errors above.")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
