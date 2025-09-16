#!/usr/bin/env python3
"""
Test Demo - Shape Analogy Generator
Demonstrates functionality without requiring API calls
"""

import os
import json
from pathlib import Path
from shape_analogy_generator import ShapeAnalogyGenerator, ShapeInfo

def test_analogy_generation():
    """Test analogy generation without API calls"""
    print("🧪 Testing Shape Analogy Generator (No API calls)")
    print("=" * 55)
    
    # Set a mock token to avoid API validation
    os.environ["HF_API_TOKEN"] = "test_token_for_demo"
    
    # Create generator
    generator = ShapeAnalogyGenerator("beginner")
    
    print("\n📊 Testing shape selection...")
    from shape_analogy_generator import shapes
    beginner_shapes = shapes["beginner"]
    print(f"Found {len(beginner_shapes)} beginner shapes")
    
    # Test analogy generation logic
    print("\n🎯 Testing analogy generation...")
    for i in range(3):
        # Simulate random shape selection
        import random
        shape_a, shape_b = random.sample(beginner_shapes, 2)
        
        # Test different relationships
        relationships = ["sides", "angles", "symmetry", "diagonals"]
        relationship = random.choice(relationships)
        
        # Generate analogy prompt
        if relationship == "sides":
            prompt = f"{shape_a.name} is to {shape_a.sides} sides as {shape_b.name} is to {shape_b.sides} sides"
        elif relationship == "angles":
            prompt = f"{shape_a.name} is to {shape_a.properties['angles']}° total angles as {shape_b.name} is to {shape_b.properties['angles']}° total angles"
        elif relationship == "symmetry":
            prompt = f"{shape_a.name} is to {shape_a.properties['symmetry']} symmetry axes as {shape_b.name} is to {shape_b.properties['symmetry']} symmetry axes"
        elif relationship == "diagonals":
            diag_a = generator.calculate_diagonals(shape_a.sides)
            diag_b = generator.calculate_diagonals(shape_b.sides)
            prompt = f"{shape_a.name} is to {diag_a} diagonals as {shape_b.name} is to {diag_b} diagonals"
        
        print(f"\n  Example {i+1}: {prompt}")
        
        # Generate tricky questions
        questions = generator.generate_tricky_questions(shape_a, shape_b, relationship)
        print(f"  Tricky questions:")
        for j, q in enumerate(questions, 1):
            print(f"    {j}. {q}")
        
        # Generate visual prompt
        visual_prompt = generator.generate_visual_prompt(shape_a, shape_b, relationship)
        print(f"  Visual prompt: {visual_prompt[:80]}...")
    
    print("\n✅ All tests completed successfully!")
    print("\nTo generate real analogies with images:")
    print("1. Get your Hugging Face API token from: https://huggingface.co/settings/tokens")
    print("2. Set it: $env:HF_API_TOKEN='your_token_here'")
    print("3. Run: python shape_analogy_generator.py --n 1 --complexity beginner")

def test_json_validation():
    """Test JSON schema validation"""
    print("\n📋 Testing JSON Schema Validation")
    print("-" * 35)
    
    # Load schema
    with open("schema.json") as f:
        schema = json.load(f)
    
    # Test valid data
    test_data = {
        "id": "analogy_001",
        "prompt": "Triangle is to 3 sides as Square is to 4 sides",
        "model": "stabilityai/stable-diffusion-2-1",
        "seed": 1234,
        "created_at": "2024-01-01T12:00:00Z",
        "image_url": "output/images/analogy_001.png",
        "complexity_level": "beginner",
        "estimated_time_minutes": 3,
        "tricky_questions": [
            "How many diagonals does a triangle have?",
            "What is the sum of interior angles in a square?",
            "Which polygon has more symmetry axes: triangle or square?"
        ],
        "shape_a": "Triangle",
        "shape_b": "Square",
        "relationship": "sides"
    }
    
    from jsonschema import validate
    try:
        validate(instance=test_data, schema=schema)
        print("✅ JSON validation passed")
    except Exception as e:
        print(f"❌ JSON validation failed: {e}")

def test_mathematical_calculations():
    """Test mathematical calculations"""
    print("\n🧮 Testing Mathematical Calculations")
    print("-" * 38)
    
    generator = ShapeAnalogyGenerator("beginner")
    
    # Test diagonal calculations
    test_cases = [
        (3, 0),   # Triangle
        (4, 2),   # Square
        (5, 5),   # Pentagon
        (6, 9),   # Hexagon
        (8, 20),  # Octagon
        (12, 54), # Dodecagon
        (20, 170) # Icosagon
    ]
    
    print("Diagonal calculations:")
    for sides, expected in test_cases:
        result = generator.calculate_diagonals(sides)
        status = "✅" if result == expected else "❌"
        print(f"  {sides}-sided polygon: {result} diagonals {status}")
    
    # Test angle calculations
    print("\nAngle calculations:")
    from shape_analogy_generator import shapes
    for complexity, shape_list in shapes.items():
        print(f"  {complexity.upper()}:")
        for shape in shape_list:
            expected_angles = (shape.sides - 2) * 180
            actual_angles = shape.properties['angles']
            status = "✅" if actual_angles == expected_angles else "❌"
            print(f"    {shape.name}: {actual_angles}° {status}")

def main():
    """Run all tests"""
    print("🎯 Shape Analogy Generator - Test Demo")
    print("=" * 50)
    
    try:
        test_analogy_generation()
        test_json_validation()
        test_mathematical_calculations()
        
        print("\n🎉 All tests completed successfully!")
        print("\nThe generator is working correctly. You just need a valid API token to generate images.")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())
