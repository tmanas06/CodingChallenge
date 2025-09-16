#!/usr/bin/env python3
"""
Test runner for Educational Animation Generator
Provides an easy way to run all tests and validation
"""

import os
import sys
import subprocess
from pathlib import Path

def run_command(command, description):
    """Run a command and return success status"""
    print(f"\n{'='*50}")
    print(f"Running: {description}")
    print(f"Command: {command}")
    print(f"{'='*50}")
    
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print("[SUCCESS] Test passed")
        if result.stdout:
            print("Output:", result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print("[FAILED] Test failed")
        print("Error:", e.stderr)
        return False

def main():
    """Run all tests and validation"""
    print("🧪 Educational Animation Generator - Test Suite")
    print("=" * 50)
    
    # Change to the script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    tests_passed = 0
    total_tests = 0
    
    # Test 1: Python syntax check
    total_tests += 1
    if run_command("python -m py_compile educational_animation_generator.py", "Python syntax check"):
        tests_passed += 1
    
    # Test 2: Import test
    total_tests += 1
    if run_command('python -c "import educational_animation_generator; print(\'Import successful\')"', "Module import test"):
        tests_passed += 1
    
    # Test 3: Unit tests
    total_tests += 1
    if run_command("python -m pytest tests/ -v", "Unit tests"):
        tests_passed += 1
    
    # Test 4: JSON schema validation
    total_tests += 1
    if run_command('python -c "import json; from jsonschema import validate; schema = json.load(open(\'schema.json\')); print(\'Schema is valid JSON\')"', "JSON schema validation"):
        tests_passed += 1
    
    # Test 5: Help command
    total_tests += 1
    if run_command("python educational_animation_generator.py --help", "Help command test"):
        tests_passed += 1
    
    # Test 6: Sample generation
    total_tests += 1
    if run_command("python generate_sample.py", "Sample output generation"):
        tests_passed += 1
    
    # Summary
    print(f"\n{'='*50}")
    print(f"TEST SUMMARY")
    print(f"{'='*50}")
    print(f"Tests passed: {tests_passed}/{total_tests}")
    
    if tests_passed == total_tests:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())
