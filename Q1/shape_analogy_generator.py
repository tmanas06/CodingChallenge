#!/usr/bin/env python3
"""
Shape-Based Analogy Question Generator
Generates educational analogy questions with visual representations using Hugging Face API
"""

import argparse
import json
import os
import random
import requests
import logging
import time
import hashlib
import shutil
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from jsonschema import validate, ValidationError

# Try to load python-dotenv for .env file support
try:
    from dotenv import load_dotenv
    load_dotenv()  # Load .env file if it exists
except ImportError:
    # python-dotenv not installed, continue without .env support
    pass

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

# Hugging Face API setup
HF_API_TOKEN = os.getenv("HF_API_TOKEN")
HF_MODEL = "runwayml/stable-diffusion-v1-5"  # More reliable model
HF_API_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
HEADERS = {
    "Authorization": f"Bearer {HF_API_TOKEN}",
    "Content-Type": "application/json"
}

# Validate API key
if not HF_API_TOKEN:
    logger.error("Missing HF_API_TOKEN environment variable.")
    logger.error("Please set your Hugging Face API token: export HF_API_TOKEN='your_token_here'")
    exit(1)

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

class ShapeAnalogyGenerator:
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
    
    def get_cache_key(self, prompt: str) -> str:
        """Generate cache key for prompt"""
        return hashlib.md5(prompt.encode()).hexdigest()
    
    def is_cached(self, cache_key: str) -> Optional[Path]:
        """Check if image is already cached"""
        cached_file = CACHE_DIR / f"{cache_key}.png"
        return cached_file if cached_file.exists() else None
    
    def cache_image(self, cache_key: str, image_path: Path) -> None:
        """Cache the generated image"""
        cached_file = CACHE_DIR / f"{cache_key}.png"
        shutil.copy2(image_path, cached_file)
        logger.info(f"Image cached: {cached_file}")
    
    def generate_image(self, prompt: str, output_path: Path, retries: int = 3) -> bool:
        """Generate image via Hugging Face API with caching and retries"""
        cache_key = self.get_cache_key(prompt)
        cached_file = self.is_cached(cache_key)
        
        if cached_file:
            logger.info(f"Using cached image: {cached_file}")
            shutil.copy2(cached_file, output_path)
            return True
        
        payload = {
            "inputs": prompt,
            "parameters": {
                "num_inference_steps": 20,
                "guidance_scale": 7.5
            }
        }
        
        for attempt in range(retries):
            try:
                logger.info(f"Generating image (attempt {attempt + 1}/{retries})...")
                response = requests.post(HF_API_URL, headers=HEADERS, json=payload, timeout=60)
                
                if response.status_code == 200:
                    with open(output_path, "wb") as f:
                        f.write(response.content)
                    
                    # Cache the image
                    self.cache_image(cache_key, output_path)
                    
                    logger.info(f"Image generated successfully: {output_path}")
                    return True
                else:
                    logger.warning(f"API request failed (attempt {attempt + 1}): {response.status_code} - {response.text}")
                    
            except requests.exceptions.RequestException as e:
                logger.warning(f"Request error (attempt {attempt + 1}): {e}")
            
            if attempt < retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff
                logger.info(f"Waiting {wait_time} seconds before retry...")
                time.sleep(wait_time)
        
        logger.error(f"Failed to generate image after {retries} attempts")
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
        image_path = self.images_dir / f"{analogy_id}.png"
        
        # Estimate time based on complexity
        time_estimates = {"beginner": 2, "intermediate": 4, "advanced": 6}
        estimated_time = time_estimates[self.complexity]
        
        logger.info(f"Generating analogy {analogy_id}: {prompt}")
        
        # Generate image
        if not self.generate_image(visual_prompt, image_path):
            logger.error(f"Image generation failed for {analogy_id}, skipping.")
            return None
        
        # Generate tricky questions
        tricky_questions = self.generate_tricky_questions(shape_a, shape_b, relationship)
        
        # Create the analogy entry
        entry = {
            "id": analogy_id,
            "prompt": prompt,
            "model": HF_MODEL,
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
            
            # Add small delay to avoid rate limiting
            time.sleep(1)
        
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
        description="Generate shape-based analogy questions with visual representations",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python shape_analogy_generator.py --n 5 --complexity beginner
  python shape_analogy_generator.py --n 10 --complexity advanced
  python shape_analogy_generator.py --n 1 --complexity intermediate
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
    
    if args.n > 50:
        logger.warning(f"Generating {args.n} analogies may take a long time and consume significant API credits")
        response = input("Continue? (y/N): ")
        if response.lower() != 'y':
            logger.info("Generation cancelled by user")
            return 0
    
    try:
        generator = ShapeAnalogyGenerator(args.complexity)
        results = generator.generate_analogies(args.n)
        generator.save_results(results)
        
        if results:
            logger.info(f"[SUCCESS] Successfully generated {len(results)} analogies!")
            logger.info(f"[INFO] Images saved in: {generator.images_dir}")
            logger.info(f"[INFO] Metadata saved in: {generator.output_dir}")
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
