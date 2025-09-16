#!/usr/bin/env python3
"""
Quick Start Script for Shape Analogy Generator
Helps users set up the environment and get started quickly
"""

import os
import sys
import subprocess
from pathlib import Path

def print_banner():
    """Print welcome banner"""
    print("🎯 Shape Analogy Generator - Quick Start")
    print("=" * 50)

def check_python_version():
    """Check Python version"""
    print("\n🐍 Checking Python version...")
    if sys.version_info < (3, 7):
        print("❌ Python 3.7+ required. Current:", sys.version.split()[0])
        return False
    print(f"✅ Python {sys.version.split()[0]} - OK")
    return True

def check_dependencies():
    """Check if required packages are installed"""
    print("\n📦 Checking dependencies...")
    required_packages = ['requests', 'jsonschema', 'python-dotenv']
    missing = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✅ {package} - OK")
        except ImportError:
            print(f"❌ {package} - Missing")
            missing.append(package)
    
    if missing:
        print(f"\nInstalling missing packages: {', '.join(missing)}")
        try:
            subprocess.run([sys.executable, "-m", "pip", "install"] + missing, 
                          check=True, capture_output=True)
            print("✅ Dependencies installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install dependencies: {e}")
            return False
    
    return True

def setup_env_file():
    """Set up .env file"""
    print("\n🔑 Setting up environment file...")
    
    env_file = Path(".env")
    env_example = Path("env.example")
    
    if env_file.exists():
        print("✅ .env file already exists")
        return True
    
    if not env_example.exists():
        print("❌ env.example file not found")
        return False
    
    # Copy example to .env
    try:
        with open(env_example, 'r') as src, open(env_file, 'w') as dst:
            dst.write(src.read())
        print("✅ Created .env file from template")
        print("⚠️  Please edit .env file and add your Hugging Face API token")
        return True
    except Exception as e:
        print(f"❌ Failed to create .env file: {e}")
        return False

def get_api_token():
    """Guide user to get API token"""
    print("\n🔑 Hugging Face API Token Setup")
    print("-" * 30)
    print("To get your API token:")
    print("1. Go to: https://huggingface.co/settings/tokens")
    print("2. Sign up/Login (free account)")
    print("3. Click 'New token'")
    print("4. Name: 'Shape Analogy Generator'")
    print("5. Type: 'Read' (sufficient)")
    print("6. Copy the token")
    print("7. Edit .env file and replace 'your_hugging_face_token_here'")
    
    token = input("\nEnter your API token (or press Enter to skip): ").strip()
    
    if token and token.startswith('hf_'):
        # Update .env file with the token
        try:
            env_file = Path(".env")
            if env_file.exists():
                content = env_file.read_text()
                content = content.replace('your_hugging_face_token_here', token)
                env_file.write_text(content)
                print("✅ API token saved to .env file")
                return True
        except Exception as e:
            print(f"❌ Failed to save token: {e}")
    
    print("⚠️  You can add your token later by editing .env file")
    return True

def create_directories():
    """Create necessary directories"""
    print("\n📁 Creating directories...")
    directories = ["output", "output/images", "cache", "tests"]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"✅ Created: {directory}/")
    
    return True

def test_setup():
    """Test the setup"""
    print("\n🧪 Testing setup...")
    
    # Test import
    try:
        from shape_analogy_generator import ShapeAnalogyGenerator
        print("✅ Module import - OK")
    except Exception as e:
        print(f"❌ Module import failed: {e}")
        return False
    
    # Test API token
    token = os.getenv("HF_API_TOKEN")
    if token and token != "your_hugging_face_token_here":
        print("✅ API token found")
    else:
        print("⚠️  API token not set (edit .env file)")
    
    return True

def show_next_steps():
    """Show next steps"""
    print("\n🎉 Setup Complete!")
    print("=" * 20)
    print("\nNext steps:")
    print("1. Edit .env file and add your Hugging Face API token")
    print("2. Run the demo: python demo.py")
    print("3. Generate analogies: python shape_analogy_generator.py --help")
    print("4. Read the full guide: SETUP_GUIDE.md")
    
    print("\nQuick commands:")
    print("  python shape_analogy_generator.py --n 1 --complexity beginner")
    print("  python demo.py")
    print("  python run_tests.py")

def main():
    """Main setup function"""
    print_banner()
    
    success = True
    
    # Check Python version
    if not check_python_version():
        success = False
    
    # Check and install dependencies
    if success and not check_dependencies():
        success = False
    
    # Set up .env file
    if success and not setup_env_file():
        success = False
    
    # Create directories
    if success and not create_directories():
        success = False
    
    # Get API token
    if success:
        get_api_token()
    
    # Test setup
    if success and not test_setup():
        success = False
    
    # Show next steps
    if success:
        show_next_steps()
    else:
        print("\n❌ Setup failed. Please check the errors above.")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
