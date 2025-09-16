#!/usr/bin/env python3
"""
Unit tests for Shape Analogy Generator
"""

import unittest
import json
import tempfile
import os
from pathlib import Path
import sys

# Add parent directory to path to import the main module
sys.path.insert(0, str(Path(__file__).parent.parent))

from shape_analogy_generator import ShapeAnalogyGenerator, ShapeInfo, schema
from jsonschema import validate, ValidationError

class TestShapeAnalogyGenerator(unittest.TestCase):
    """Test cases for ShapeAnalogyGenerator class"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.generator = ShapeAnalogyGenerator("beginner")
        self.temp_dir = tempfile.mkdtemp()
        self.generator.output_dir = Path(self.temp_dir)
        self.generator.images_dir = self.generator.output_dir / "images"
        self.generator.images_dir.mkdir(exist_ok=True)
    
    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_shape_info_creation(self):
        """Test ShapeInfo dataclass creation"""
        shape = ShapeInfo("Triangle", 3, {"angles": 180, "symmetry": 3}, "test prompt")
        self.assertEqual(shape.name, "Triangle")
        self.assertEqual(shape.sides, 3)
        self.assertEqual(shape.properties["angles"], 180)
        self.assertEqual(shape.visual_prompt, "test prompt")
    
    def test_calculate_diagonals(self):
        """Test diagonal calculation"""
        # Triangle: 3 * (3-3) / 2 = 0
        self.assertEqual(self.generator.calculate_diagonals(3), 0)
        # Square: 4 * (4-3) / 2 = 2
        self.assertEqual(self.generator.calculate_diagonals(4), 2)
        # Pentagon: 5 * (5-3) / 2 = 5
        self.assertEqual(self.generator.calculate_diagonals(5), 5)
        # Hexagon: 6 * (6-3) / 2 = 9
        self.assertEqual(self.generator.calculate_diagonals(6), 9)
    
    def test_generate_tricky_questions(self):
        """Test tricky questions generation"""
        shape_a = ShapeInfo("Triangle", 3, {"angles": 180, "symmetry": 3}, "test")
        shape_b = ShapeInfo("Square", 4, {"angles": 360, "symmetry": 4}, "test")
        
        questions = self.generator.generate_tricky_questions(shape_a, shape_b, "sides")
        
        self.assertEqual(len(questions), 3)
        self.assertTrue(all(isinstance(q, str) for q in questions))
        self.assertTrue(all(len(q) > 10 for q in questions))
        
        # Check that questions contain shape names
        all_questions = " ".join(questions).lower()
        self.assertIn("triangle", all_questions)
        self.assertIn("square", all_questions)
    
    def test_generate_visual_prompt(self):
        """Test visual prompt generation"""
        shape_a = ShapeInfo("Triangle", 3, {"angles": 180, "symmetry": 3}, "triangle")
        shape_b = ShapeInfo("Square", 4, {"angles": 360, "symmetry": 4}, "square")
        
        prompt = self.generator.generate_visual_prompt(shape_a, shape_b, "sides")
        
        self.assertIsInstance(prompt, str)
        self.assertIn("triangle", prompt.lower())
        self.assertIn("square", prompt.lower())
        self.assertIn("3", prompt)
        self.assertIn("4", prompt)
    
    def test_get_cache_key(self):
        """Test cache key generation"""
        prompt1 = "test prompt"
        prompt2 = "test prompt"
        prompt3 = "different prompt"
        
        key1 = self.generator.get_cache_key(prompt1)
        key2 = self.generator.get_cache_key(prompt2)
        key3 = self.generator.get_cache_key(prompt3)
        
        self.assertEqual(key1, key2)  # Same prompt should generate same key
        self.assertNotEqual(key1, key3)  # Different prompts should generate different keys
        self.assertEqual(len(key1), 32)  # MD5 hash length
    
    def test_json_schema_validation(self):
        """Test JSON schema validation"""
        # Valid entry
        valid_entry = {
            "id": "analogy_001",
            "prompt": "Triangle is to 3 sides as Square is to 4 sides",
            "model": "stabilityai/stable-diffusion-2-1",
            "seed": 1234,
            "created_at": "2024-01-01T00:00:00Z",
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
        
        # Should not raise ValidationError
        validate(instance=valid_entry, schema=schema)
        
        # Invalid entry - missing required field
        invalid_entry = valid_entry.copy()
        del invalid_entry["id"]
        
        with self.assertRaises(ValidationError):
            validate(instance=invalid_entry, schema=schema)
        
        # Invalid entry - wrong complexity level
        invalid_entry2 = valid_entry.copy()
        invalid_entry2["complexity_level"] = "expert"
        
        with self.assertRaises(ValidationError):
            validate(instance=invalid_entry2, schema=schema)
    
    def test_save_results(self):
        """Test saving results to JSON file"""
        results = [
            {
                "id": "analogy_001",
                "prompt": "Test prompt",
                "model": "test-model",
                "seed": 1234,
                "created_at": "2024-01-01T00:00:00Z",
                "image_url": "test.png",
                "complexity_level": "beginner",
                "estimated_time_minutes": 3,
                "tricky_questions": ["Question 1", "Question 2", "Question 3"]
            }
        ]
        
        self.generator.save_results(results)
        
        # Check main file was created
        main_file = self.generator.output_dir / "analogies.json"
        self.assertTrue(main_file.exists())
        
        with open(main_file) as f:
            saved_results = json.load(f)
        
        self.assertEqual(len(saved_results), 1)
        self.assertEqual(saved_results[0]["id"], "analogy_001")
        
        # Check individual file was created
        individual_file = self.generator.output_dir / "analogy_001.json"
        self.assertTrue(individual_file.exists())
    
    def test_save_empty_results(self):
        """Test saving empty results"""
        self.generator.save_results([])
        
        # Should not create files for empty results
        main_file = self.generator.output_dir / "analogies.json"
        self.assertFalse(main_file.exists())

class TestShapeData(unittest.TestCase):
    """Test cases for shape data integrity"""
    
    def test_shape_data_structure(self):
        """Test that shape data has correct structure"""
        from shape_analogy_generator import shapes
        
        for complexity, shape_list in shapes.items():
            self.assertIn(complexity, ["beginner", "intermediate", "advanced"])
            self.assertIsInstance(shape_list, list)
            self.assertGreater(len(shape_list), 0)
            
            for shape in shape_list:
                self.assertIsInstance(shape, ShapeInfo)
                self.assertIsInstance(shape.name, str)
                self.assertIsInstance(shape.sides, int)
                self.assertGreater(shape.sides, 2)  # Must have at least 3 sides
                self.assertIsInstance(shape.properties, dict)
                self.assertIn("angles", shape.properties)
                self.assertIn("symmetry", shape.properties)
                self.assertIsInstance(shape.visual_prompt, str)
    
    def test_shape_relationships(self):
        """Test shape relationships data"""
        from shape_analogy_generator import shape_relationships
        
        expected_relationships = [
            "sides", "angles", "symmetry", "diagonals", "vertices", "edges",
            "interior angles", "exterior angles", "area", "perimeter"
        ]
        
        self.assertEqual(set(shape_relationships), set(expected_relationships))

if __name__ == "__main__":
    # Set up test environment
    os.environ["HF_API_TOKEN"] = "test_token"  # Mock token for testing
    
    unittest.main(verbosity=2)
