#!/usr/bin/env python3
"""
Shape-Based Analogy Question Generator - Offline Version
Generates educational analogy questions with mock images for demonstration
"""

import argparse
import json
import os
import random
import logging
import time
import hashlib
import shutil
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from jsonschema import validate, ValidationError

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("shape_analogy.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Enhanced shape dataset with more relationships
@dataclass
class ShapeInfo:
    name: str
    sides: int
    properties: Dict[str, any]
    visual_prompt: str

shapes = {
    "beginner": [
        ShapeInfo("Triangle", 3, {"angles": 180, "symmetry": 3}, "geometric triangle with three equal sides"),
        ShapeInfo("Square", 4, {"angles": 360, "symmetry": 4}, "perfect square with four equal sides"),
        ShapeInfo("Pentagon", 5, {"angles": 540, "symmetry": 5}, "regular pentagon with five equal sides"),
        ShapeInfo("Hexagon", 6, {"angles": 720, "symmetry": 6}, "hexagonal shape with six equal sides"),
        ShapeInfo("Octagon", 8, {"angles": 1080, "symmetry": 8}, "octagonal shape with eight equal sides")
    ],
    "intermediate": [
        ShapeInfo("Heptagon", 7, {"angles": 900, "symmetry": 7}, "heptagonal shape with seven equal sides"),
        ShapeInfo("Nonagon", 9, {"angles": 1260, "symmetry": 9}, "nonagonal shape with nine equal sides"),
        ShapeInfo("Decagon", 10, {"angles": 1440, "symmetry": 10}, "decagonal shape with ten equal sides"),
        ShapeInfo("Dodecagon", 12, {"angles": 1800, "symmetry": 12}, "dodecagonal shape with twelve equal sides")
    ],
    "advanced": [
        ShapeInfo("Tridecagon", 13, {"angles": 1980, "symmetry": 13}, "tridecagonal shape with thirteen equal sides"),
        ShapeInfo("Tetradecagon", 14, {"angles": 2160, "symmetry": 14}, "tetradecagonal shape with fourteen equal sides"),
        ShapeInfo("Pentadecagon", 15, {"angles": 2340, "symmetry": 15}, "pentadecagonal shape with fifteen equal sides"),
        ShapeInfo("Icosagon", 20, {"angles": 3240, "symmetry": 20}, "icosagonal shape with twenty equal sides")
    ]
}

# Additional shape relationships for more diverse analogies
shape_relationships = [
    "sides", "angles", "symmetry", "diagonals", "vertices", "edges",
    "interior angles", "exterior angles", "area", "perimeter"
]

# Cache directory
CACHE_DIR = Path("cache")
CACHE_DIR.mkdir(exist_ok=True)

# JSON schema definition
schema = {
    "type": "object",
    "properties": {
        "id": {"type": "string"},
        "prompt": {"type": "string"},
        "model": {"type": "string"},
        "seed": {"type": "integer"},
        "created_at": {"type": "string"},
        "image_url": {"type": "string"},
        "complexity_level": {"type": "string", "enum": ["beginner", "intermediate", "advanced"]},
        "estimated_time_minutes": {"type": "integer"},
        "tricky_questions": {"type": "array", "items": {"type": "string"}},
        "shape_a": {"type": "string"},
        "shape_b": {"type": "string"},
        "relationship": {"type": "string"}
    },
    "required": ["id", "prompt", "model", "seed", "created_at", "image_url", "complexity_level", "estimated_time_minutes", "tricky_questions"]
}

class OfflineShapeAnalogyGenerator:
    def __init__(self, complexity: str = "beginner"):
        self.complexity = complexity
        self.output_dir = Path("output")
        self.images_dir = self.output_dir / "images"
        self.output_dir.mkdir(exist_ok=True)
        self.images_dir.mkdir(exist_ok=True)
        
    def calculate_diagonals(self, n: int) -> int:
        """Calculate number of diagonals in a polygon with n sides"""
        return n * (n - 3) // 2
    
    def generate_visual_prompt(self, shape_a: ShapeInfo, shape_b: ShapeInfo, relationship: str) -> str:
        """Generate enhanced visual prompt for image generation"""
        base_prompt = f"Educational diagram showing geometric shapes: {shape_a.visual_prompt} and {shape_b.visual_prompt}"
        
        if relationship == "sides":
            return f"{base_prompt}, clearly labeled with side counts {shape_a.sides} and {shape_b.sides}, clean mathematical illustration"
        elif relationship == "angles":
            return f"{base_prompt}, showing interior angle measurements {shape_a.properties['angles']}° and {shape_b.properties['angles']}°, geometric diagram"
        elif relationship == "symmetry":
            return f"{base_prompt}, highlighting symmetry axes {shape_a.properties['symmetry']} and {shape_b.properties['symmetry']}, educational geometry"
        elif relationship == "diagonals":
            diag_a = self.calculate_diagonals(shape_a.sides)
            diag_b = self.calculate_diagonals(shape_b.sides)
            return f"{base_prompt}, showing diagonal lines {diag_a} and {diag_b}, mathematical visualization"
        else:
            return f"{base_prompt}, mathematical relationship diagram, clean educational style"
    
    def generate_tricky_questions(self, shape_a: ShapeInfo, shape_b: ShapeInfo, relationship: str) -> List[str]:
        """Generate challenging questions based on the shapes and relationship"""
        questions = []
        
        if relationship == "sides":
            questions.extend([
                f"How many diagonals does a {shape_a.name.lower()} have?",
                f"What is the sum of interior angles in a {shape_b.name.lower()}?",
                f"Which polygon has more symmetry axes: {shape_a.name.lower()} or {shape_b.name.lower()}?"
            ])
        elif relationship == "angles":
            questions.extend([
                f"What is the measure of each interior angle in a regular {shape_a.name.lower()}?",
                f"How many degrees are in each exterior angle of a {shape_b.name.lower()}?",
                f"Which shape has a larger total angle sum: {shape_a.name.lower()} or {shape_b.name.lower()}?"
            ])
        elif relationship == "symmetry":
            questions.extend([
                f"How many lines of symmetry does a regular {shape_a.name.lower()} have?",
                f"What is the rotational symmetry order of a {shape_b.name.lower()}?",
                f"Which polygon has more rotational symmetry: {shape_a.name.lower()} or {shape_b.name.lower()}?"
            ])
        elif relationship == "diagonals":
            diag_a = self.calculate_diagonals(shape_a.sides)
            diag_b = self.calculate_diagonals(shape_b.sides)
            questions.extend([
                f"How many diagonals can be drawn from one vertex of a {shape_a.name.lower()}?",
                f"What is the total number of diagonals in a {shape_b.name.lower()}?",
                f"Which polygon has more diagonals: {shape_a.name.lower()} or {shape_b.name.lower()}?"
            ])
        else:
            questions.extend([
                f"What is the perimeter of a regular {shape_a.name.lower()} with side length 1?",
                f"How many vertices does a {shape_b.name.lower()} have?",
                f"Which shape is more complex: {shape_a.name.lower()} or {shape_b.name.lower()}?"
            ])
        
        return questions[:3]  # Return exactly 3 questions
    
    def create_mock_image(self, prompt: str, output_path: Path) -> bool:
        """Create a mock image file for demonstration"""
        try:
            # Create a simple text file that represents the image
            mock_content = f"""MOCK IMAGE: {prompt}

This would be a generated image showing:
- Geometric shapes with mathematical properties
- Educational labels and measurements
- Clean, professional mathematical illustration

Generated by: Shape Analogy Generator (Offline Mode)
Prompt: {prompt}
"""
            
            # Save as a text file instead of PNG for demo
            text_path = output_path.with_suffix('.txt')
            with open(text_path, 'w', encoding='utf-8') as f:
                f.write(mock_content)
            
            logger.info(f"Mock image created: {text_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create mock image: {e}")
            return False
    
    def generate_analogy(self, index: int) -> Optional[Dict]:
        """Generate a single analogy with metadata"""
        # Select two random shapes from the complexity level
        available_shapes = shapes[self.complexity]
        shape_a, shape_b = random.sample(available_shapes, 2)
        
        # Select a random relationship
        relationship = random.choice(shape_relationships)
        
        # Generate the analogy prompt
        if relationship == "sides":
            prompt = f"{shape_a.name} is to {shape_a.sides} sides as {shape_b.name} is to {shape_b.sides} sides"
        elif relationship == "angles":
            prompt = f"{shape_a.name} is to {shape_a.properties['angles']}° total angles as {shape_b.name} is to {shape_b.properties['angles']}° total angles"
        elif relationship == "symmetry":
            prompt = f"{shape_a.name} is to {shape_a.properties['symmetry']} symmetry axes as {shape_b.name} is to {shape_b.properties['symmetry']} symmetry axes"
        elif relationship == "diagonals":
            diag_a = self.calculate_diagonals(shape_a.sides)
            diag_b = self.calculate_diagonals(shape_b.sides)
            prompt = f"{shape_a.name} is to {diag_a} diagonals as {shape_b.name} is to {diag_b} diagonals"
        else:
            prompt = f"{shape_a.name} is to {relationship} as {shape_b.name} is to {relationship}"
        
        # Generate visual prompt
        visual_prompt = self.generate_visual_prompt(shape_a, shape_b, relationship)
        
        # Generate metadata
        analogy_id = f"analogy_{index+1:03d}"
        seed = random.randint(1000, 9999)
        try:
            # Python 3.11+
            created_at = datetime.now(datetime.timezone.utc).isoformat()
        except AttributeError:
            # Python 3.7-3.10
            from datetime import timezone
            created_at = datetime.now(timezone.utc).isoformat()
        image_path = self.images_dir / f"{analogy_id}.txt"  # Use .txt for mock images
        
        # Estimate time based on complexity
        time_estimates = {"beginner": 2, "intermediate": 4, "advanced": 6}
        estimated_time = time_estimates[self.complexity]
        
        logger.info(f"Generating analogy {analogy_id}: {prompt}")
        
        # Create mock image
        if not self.create_mock_image(visual_prompt, image_path):
            logger.error(f"Mock image creation failed for {analogy_id}, skipping.")
            return None
        
        # Generate tricky questions
        tricky_questions = self.generate_tricky_questions(shape_a, shape_b, relationship)
        
        # Create the analogy entry
        entry = {
            "id": analogy_id,
            "prompt": prompt,
            "model": "offline-demo-mode",
            "seed": seed,
            "created_at": created_at,
            "image_url": str(image_path),
            "complexity_level": self.complexity,
            "estimated_time_minutes": estimated_time,
            "tricky_questions": tricky_questions,
            "shape_a": shape_a.name,
            "shape_b": shape_b.name,
            "relationship": relationship
        }
        
        # Validate the entry
        try:
            validate(instance=entry, schema=schema)
            logger.info(f"[SUCCESS] Analogy {analogy_id} generated successfully")
            return entry
        except ValidationError as e:
            logger.error(f"JSON validation failed for {analogy_id}: {e}")
            return None
    
    def generate_analogies(self, count: int) -> List[Dict]:
        """Generate multiple analogies"""
        logger.info(f"Starting generation of {count} analogies with complexity: {self.complexity}")
        
        results = []
        for i in range(count):
            logger.info(f"Progress: {i+1}/{count}")
            analogy = self.generate_analogy(i)
            if analogy:
                results.append(analogy)
            
            # Add small delay for realism
            time.sleep(0.5)
        
        return results
    
    def save_results(self, results: List[Dict]) -> None:
        """Save results to JSON file"""
        if not results:
            logger.warning("No valid results to save.")
            return
        
        output_file = self.output_dir / "analogies.json"
        with open(output_file, "w") as f:
            json.dump(results, f, indent=2)
        
        logger.info(f"[SUCCESS] {len(results)} analogies saved to {output_file}")
        
        # Also save individual files for each analogy
        for result in results:
            individual_file = self.output_dir / f"{result['id']}.json"
            with open(individual_file, "w") as f:
                json.dump(result, f, indent=2)

def main():
    parser = argparse.ArgumentParser(
        description="Generate shape-based analogy questions (Offline Demo Mode)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python shape_analogy_generator_offline.py --n 5 --complexity beginner
  python shape_analogy_generator_offline.py --n 10 --complexity advanced
  python shape_analogy_generator_offline.py --n 1 --complexity intermediate
        """
    )
    
    parser.add_argument(
        "--n", 
        type=int, 
        default=1, 
        help="Number of analogies to generate (default: 1)"
    )
    parser.add_argument(
        "--complexity", 
        choices=["beginner", "intermediate", "advanced"], 
        default="beginner",
        help="Complexity level of shapes (default: beginner)"
    )
    parser.add_argument(
        "--verbose", 
        action="store_true",
        help="Enable verbose logging"
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Validate arguments
    if args.n < 1:
        logger.error("Number of analogies must be at least 1")
        return 1
    
    try:
        generator = OfflineShapeAnalogyGenerator(args.complexity)
        results = generator.generate_analogies(args.n)
        generator.save_results(results)
        
        if results:
            logger.info(f"[SUCCESS] Successfully generated {len(results)} analogies!")
            logger.info(f"[INFO] Mock images saved in: {generator.images_dir}")
            logger.info(f"[INFO] Metadata saved in: {generator.output_dir}")
            logger.info(f"[INFO] Note: This is offline demo mode - images are text files")
        else:
            logger.error("[ERROR] No analogies were generated successfully")
            return 1
            
    except KeyboardInterrupt:
        logger.info("Generation interrupted by user")
        return 1
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
