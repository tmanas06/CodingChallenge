#!/usr/bin/env python3
"""
Configuration file for Shape Analogy Generator
Contains all configurable parameters and settings
"""

import os
from pathlib import Path

# API Configuration
HF_API_TOKEN = os.getenv("HF_API_TOKEN")
HF_MODEL = "stabilityai/stable-diffusion-2-1"
HF_API_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
API_TIMEOUT = 60  # seconds
API_RETRIES = 3
API_RETRY_DELAY = 2  # seconds

# Output Configuration
OUTPUT_DIR = Path("output")
IMAGES_DIR = OUTPUT_DIR / "images"
CACHE_DIR = Path("cache")
LOG_FILE = "shape_analogy.log"

# Generation Configuration
MAX_ANALOGIES_PER_RUN = 50
DEFAULT_ANALOGIES = 1
DEFAULT_COMPLEXITY = "beginner"

# Time Estimates (in minutes)
TIME_ESTIMATES = {
    "beginner": 2,
    "intermediate": 4,
    "advanced": 6
}

# Visual Prompt Templates
VISUAL_PROMPT_TEMPLATES = {
    "sides": "Educational diagram showing geometric shapes: {shape_a_prompt} and {shape_b_prompt}, clearly labeled with side counts {sides_a} and {sides_b}, clean mathematical illustration",
    "angles": "Educational diagram showing geometric shapes: {shape_a_prompt} and {shape_b_prompt}, showing interior angle measurements {angles_a}° and {angles_b}°, geometric diagram",
    "symmetry": "Educational diagram showing geometric shapes: {shape_a_prompt} and {shape_b_prompt}, highlighting symmetry axes {symmetry_a} and {symmetry_b}, educational geometry",
    "diagonals": "Educational diagram showing geometric shapes: {shape_a_prompt} and {shape_b_prompt}, showing diagonal lines {diagonals_a} and {diagonals_b}, mathematical visualization",
    "default": "Educational diagram showing geometric shapes: {shape_a_prompt} and {shape_b_prompt}, mathematical relationship diagram, clean educational style"
}

# Question Templates
QUESTION_TEMPLATES = {
    "sides": [
        "How many diagonals does a {shape_a} have?",
        "What is the sum of interior angles in a {shape_b}?",
        "Which polygon has more symmetry axes: {shape_a} or {shape_b}?"
    ],
    "angles": [
        "What is the measure of each interior angle in a regular {shape_a}?",
        "How many degrees are in each exterior angle of a {shape_b}?",
        "Which shape has a larger total angle sum: {shape_a} or {shape_b}?"
    ],
    "symmetry": [
        "How many lines of symmetry does a regular {shape_a} have?",
        "What is the rotational symmetry order of a {shape_b}?",
        "Which polygon has more rotational symmetry: {shape_a} or {shape_b}?"
    ],
    "diagonals": [
        "How many diagonals can be drawn from one vertex of a {shape_a}?",
        "What is the total number of diagonals in a {shape_b}?",
        "Which polygon has more diagonals: {shape_a} or {shape_b}?"
    ],
    "default": [
        "What is the perimeter of a regular {shape_a} with side length 1?",
        "How many vertices does a {shape_b} have?",
        "Which shape is more complex: {shape_a} or {shape_b}?"
    ]
}

# Logging Configuration
LOG_FORMAT = "%(asctime)s - %(levelname)s - %(message)s"
LOG_LEVEL = "INFO"

# Validation Configuration
SCHEMA_FILE = "schema.json"
REQUIRED_FIELDS = [
    "id", "prompt", "model", "seed", "created_at", 
    "image_url", "complexity_level", "estimated_time_minutes", "tricky_questions"
]

# File Extensions
IMAGE_EXTENSION = ".png"
JSON_EXTENSION = ".json"

# Cache Configuration
CACHE_ENABLED = True
CACHE_MAX_SIZE = 1000  # Maximum number of cached images

# Error Messages
ERROR_MESSAGES = {
    "missing_token": "Missing HF_API_TOKEN environment variable. Please set your Hugging Face API token.",
    "api_failure": "API request failed. Please check your internet connection and API token.",
    "validation_error": "JSON validation failed. Please check the generated data.",
    "file_error": "File operation failed. Please check permissions and disk space.",
    "generation_failed": "Image generation failed. Please try again or check API status."
}

# Success Messages
SUCCESS_MESSAGES = {
    "generation_complete": "Successfully generated {count} analogies!",
    "file_saved": "Results saved to {file_path}",
    "image_cached": "Image cached for future use",
    "validation_passed": "JSON validation passed"
}
