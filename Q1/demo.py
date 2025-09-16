#!/usr/bin/env python3
"""
Demo script for Shape Analogy Generator
Shows how to use the generator programmatically
"""

import os
import json
from pathlib import Path
from shape_analogy_generator import ShapeAnalogyGenerator

def demo_basic_usage():
    """Demonstrate basic usage of the generator"""
    print("🎯 Shape Analogy Generator - Demo")
    print("=" * 40)
    
    # Set up a mock API token for demo (won't actually call API)
    os.environ["HF_API_TOKEN"] = "demo_token"
    
    # Create generator instance
    generator = ShapeAnalogyGenerator("beginner")
    
    print("\n📊 Available Shapes by Complexity:")
    from shape_analogy_generator import shapes
    for complexity, shape_list in shapes.items():
        print(f"\n{complexity.upper()}:")
        for shape in shape_list:
            print(f"  - {shape.name}: {shape.sides} sides, {shape.properties['angles']}° total angles")
    
    print("\n🔗 Available Relationships:")
    from shape_analogy_generator import shape_relationships
    for i, rel in enumerate(shape_relationships, 1):
        print(f"  {i}. {rel}")
    
    print("\n🧮 Diagonal Calculation Examples:")
    test_shapes = [3, 4, 5, 6, 8, 12, 20]
    for n in test_shapes:
        diag = generator.calculate_diagonals(n)
        print(f"  {n}-sided polygon: {diag} diagonals")
    
    print("\n❓ Sample Tricky Questions:")
    from shape_analogy_generator import ShapeInfo
    shape_a = ShapeInfo("Triangle", 3, {"angles": 180, "symmetry": 3}, "triangle")
    shape_b = ShapeInfo("Square", 4, {"angles": 360, "symmetry": 4}, "square")
    
    questions = generator.generate_tricky_questions(shape_a, shape_b, "sides")
    for i, q in enumerate(questions, 1):
        print(f"  {i}. {q}")
    
    print("\n🎨 Sample Visual Prompts:")
    visual_prompt = generator.generate_visual_prompt(shape_a, shape_b, "sides")
    print(f"  Sides relationship: {visual_prompt}")
    
    visual_prompt = generator.generate_visual_prompt(shape_a, shape_b, "angles")
    print(f"  Angles relationship: {visual_prompt}")

def demo_json_schema():
    """Demonstrate JSON schema validation"""
    print("\n📋 JSON Schema Validation Demo")
    print("=" * 40)
    
    # Load schema
    with open("schema.json") as f:
        schema = json.load(f)
    
    # Sample valid data
    sample_data = {
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
    
    print("✅ Sample data structure:")
    print(json.dumps(sample_data, indent=2))
    
    print("\n🔍 Schema validation:")
    from jsonschema import validate
    try:
        validate(instance=sample_data, schema=schema)
        print("✅ Validation passed!")
    except Exception as e:
        print(f"❌ Validation failed: {e}")

def demo_file_structure():
    """Show the expected file structure"""
    print("\n📁 Project Structure")
    print("=" * 40)
    
    structure = """
shape-analogy-generator/
├── shape_analogy_generator.py    # Main script
├── config.py                     # Configuration
├── requirements.txt              # Dependencies
├── schema.json                   # JSON schema
├── README.md                     # Documentation
├── run_tests.py                  # Test runner
├── demo.py                       # This demo
├── sample_output.json            # Example output
├── tests/
│   └── test_shape_analogy.py     # Unit tests
├── output/                       # Generated files
│   ├── analogies.json
│   └── images/
│       ├── analogy_001.png
│       └── ...
└── cache/                        # Cached images
    └── *.png
    """
    
    print(structure)

def main():
    """Run all demos"""
    try:
        demo_basic_usage()
        demo_json_schema()
        demo_file_structure()
        
        print("\n🎉 Demo completed successfully!")
        print("\nTo run the actual generator:")
        print("1. Set your HF_API_TOKEN environment variable")
        print("2. Run: python shape_analogy_generator.py --n 1 --complexity beginner")
        
    except Exception as e:
        print(f"\n❌ Demo failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())
