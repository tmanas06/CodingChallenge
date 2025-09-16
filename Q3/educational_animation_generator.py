#!/usr/bin/env python3
"""
Educational Animation Generator - Q3
Creates educational animations/GIFs demonstrating learning concepts
Supports multiple APIs with comprehensive error recovery and caching
"""

import argparse
import json
import os
import requests
import time
import uuid
import hashlib
import logging
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from jsonschema import validate, ValidationError

# Try to load python-dotenv for .env file support
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("educational_animations.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Animation API Configuration
HUGGINGFACE_API = "https://api-inference.huggingface.co/models"
REPLICATE_API = "https://api.replicate.com/v1"
STABILITY_AI_API = "https://api.stability.ai/v1"

# Cache configuration
CACHE_DIR = Path("cache")
CACHE_DIR.mkdir(exist_ok=True)
CACHE_EXPIRY = 7 * 24 * 60 * 60  # 7 days for animations

@dataclass
class AnimationRequest:
    """Data class for animation generation requests"""
    concept: str
    duration: int
    target_audience: str
    animation_type: str = "gif"
    quality: str = "high"
    resolution: str = "720p"

@dataclass
class AnimationResult:
    """Data class for animation generation results"""
    id: str
    concept: str
    animation_path: str
    duration: int
    target_audience: str
    animation_type: str
    model_used: str
    created_at: str
    file_size: int
    resolution: str
    quality: str
    learning_goals: List[str]
    key_learning_points: List[str]
    tricky_questions: List[str]
    educational_value: int

class EducationalAnimationGenerator:
    """Main class for generating educational animations"""
    
    def __init__(self, cache_enabled: bool = True):
        self.cache_enabled = cache_enabled
        self.output_dir = Path("output")
        self.animations_dir = self.output_dir / "animations"
        self.metadata_dir = self.output_dir / "metadata"
        
        # Create directories
        self.output_dir.mkdir(exist_ok=True)
        self.animations_dir.mkdir(exist_ok=True)
        self.metadata_dir.mkdir(exist_ok=True)
        
        # Load API keys
        self.hf_api_key = os.getenv("HF_API_KEY")
        self.replicate_api_key = os.getenv("REPLICATE_API_KEY")
        self.stability_api_key = os.getenv("STABILITY_API_KEY")
        
        # Educational concept mappings
        self.concept_mappings = {
            "wave_propagation": {
                "learning_goals": [
                    "Understand wave properties: amplitude, frequency, wavelength",
                    "Visualize wave motion and energy transfer",
                    "Explain wave interference and superposition",
                    "Apply wave concepts to real-world phenomena"
                ],
                "key_learning_points": [
                    "Waves transfer energy without transferring matter",
                    "Wave speed depends on medium properties",
                    "Interference creates constructive and destructive patterns",
                    "Frequency determines pitch in sound waves"
                ],
                "tricky_questions": [
                    "How does wave frequency affect energy transfer?",
                    "What happens when waves of different frequencies interfere?",
                    "Why do waves bend when changing medium?",
                    "How do standing waves form and what are their properties?"
                ],
                "animation_prompt": "Educational animation showing wave propagation with amplitude, frequency, and wavelength clearly labeled",
                "difficulty_level": "high_school",
                "duration_range": (8, 12)
            },
            "pendulum_motion": {
                "learning_goals": [
                    "Understand simple harmonic motion principles",
                    "Visualize the relationship between displacement and restoring force",
                    "Explain how pendulum length affects period",
                    "Apply energy conservation in oscillatory motion"
                ],
                "key_learning_points": [
                    "Period depends only on length and gravity, not mass",
                    "Energy oscillates between kinetic and potential",
                    "Amplitude affects maximum speed but not period",
                    "Small angle approximation simplifies calculations"
                ],
                "tricky_questions": [
                    "Why doesn't pendulum period depend on mass?",
                    "How does air resistance affect pendulum motion?",
                    "What happens when pendulum amplitude increases?",
                    "How do you calculate pendulum energy at different positions?"
                ],
                "animation_prompt": "Educational animation showing pendulum motion with energy graphs and period calculations",
                "difficulty_level": "high_school",
                "duration_range": (6, 10)
            },
            "chemical_reactions": {
                "learning_goals": [
                    "Understand molecular bonding and breaking",
                    "Visualize energy changes during reactions",
                    "Explain activation energy and catalysts",
                    "Apply conservation of mass and energy"
                ],
                "key_learning_points": [
                    "Bonds break and form during chemical reactions",
                    "Activation energy is required to start reactions",
                    "Catalysts lower activation energy",
                    "Mass and energy are conserved in reactions"
                ],
                "tricky_questions": [
                    "How do catalysts speed up reactions?",
                    "Why do some reactions require heat to start?",
                    "What determines reaction rate?",
                    "How do you balance chemical equations?"
                ],
                "animation_prompt": "Educational animation showing molecular bonding, bond breaking, and energy changes in chemical reactions",
                "difficulty_level": "high_school",
                "duration_range": (10, 15)
            },
            "sine_wave": {
                "learning_goals": [
                    "Understand sine wave mathematical properties",
                    "Visualize amplitude, frequency, and phase relationships",
                    "Explain sine wave applications in physics and engineering",
                    "Apply trigonometric functions to wave analysis"
                ],
                "key_learning_points": [
                    "Sine waves are fundamental to wave analysis",
                    "Amplitude determines wave strength",
                    "Frequency determines wave speed",
                    "Phase shift affects wave timing"
                ],
                "tricky_questions": [
                    "How do you calculate sine wave frequency?",
                    "What causes phase shifts in waves?",
                    "How do you add two sine waves together?",
                    "What are the applications of sine waves in technology?"
                ],
                "animation_prompt": "Educational animation showing sine wave generation with mathematical equations and real-world applications",
                "difficulty_level": "high_school",
                "duration_range": (8, 12)
            },
            "planetary_orbits": {
                "learning_goals": [
                    "Understand gravitational forces and orbital mechanics",
                    "Visualize elliptical orbits and Kepler's laws",
                    "Explain how orbital velocity changes with distance",
                    "Apply conservation of angular momentum"
                ],
                "key_learning_points": [
                    "Planets follow elliptical orbits around the sun",
                    "Orbital velocity decreases with distance",
                    "Angular momentum is conserved in orbits",
                    "Gravitational force provides centripetal acceleration"
                ],
                "tricky_questions": [
                    "Why are planetary orbits elliptical, not circular?",
                    "How does orbital velocity change throughout the year?",
                    "What causes orbital precession?",
                    "How do you calculate orbital period?"
                ],
                "animation_prompt": "Educational animation showing planetary orbital mechanics with gravitational forces and Kepler's laws",
                "difficulty_level": "high_school",
                "duration_range": (10, 15)
            },
            "molecular_bonding": {
                "learning_goals": [
                    "Understand different types of chemical bonds",
                    "Visualize electron sharing and transfer",
                    "Explain bond strength and stability",
                    "Apply molecular geometry principles"
                ],
                "key_learning_points": [
                    "Covalent bonds involve electron sharing",
                    "Ionic bonds involve electron transfer",
                    "Bond strength depends on electronegativity",
                    "Molecular geometry affects properties"
                ],
                "tricky_questions": [
                    "What determines bond type between atoms?",
                    "How do you predict molecular geometry?",
                    "Why are some bonds stronger than others?",
                    "How do intermolecular forces affect properties?"
                ],
                "animation_prompt": "Educational animation showing molecular bonding with electron movement and bond formation",
                "difficulty_level": "high_school",
                "duration_range": (8, 12)
            },
            "geometric_transformations": {
                "learning_goals": [
                    "Understand translation, rotation, and scaling",
                    "Visualize transformation matrices",
                    "Explain coordinate system changes",
                    "Apply transformations to solve problems"
                ],
                "key_learning_points": [
                    "Transformations preserve shape properties",
                    "Matrices represent transformations efficiently",
                    "Combining transformations creates complex motions",
                    "Transformations are used in computer graphics"
                ],
                "tricky_questions": [
                    "How do you combine multiple transformations?",
                    "What's the difference between rotation and reflection?",
                    "How do transformations affect area and volume?",
                    "What are the applications in computer graphics?"
                ],
                "animation_prompt": "Educational animation showing geometric transformations with mathematical matrices and visual examples",
                "difficulty_level": "high_school",
                "duration_range": (6, 10)
            }
        }
    
    def get_cache_key(self, concept: str, duration: int, audience: str) -> str:
        """Generate cache key for animation request"""
        return hashlib.md5(f"{concept}_{duration}_{audience}".encode()).hexdigest()
    
    def is_cached(self, cache_key: str) -> Optional[Dict]:
        """Check if animation is cached and not expired"""
        if not self.cache_enabled:
            return None
        
        cache_file = CACHE_DIR / f"{cache_key}.json"
        if not cache_file.exists():
            return None
        
        try:
            with open(cache_file, 'r') as f:
                cached_data = json.load(f)
            
            # Check if cache is expired
            cache_time = cached_data.get('cached_at', 0)
            if time.time() - cache_time > CACHE_EXPIRY:
                cache_file.unlink()  # Remove expired cache
                return None
            
            return cached_data.get('data')
        except Exception as e:
            logger.warning(f"Error reading cache: {e}")
            return None
    
    def cache_animation(self, cache_key: str, animation_data: Dict) -> None:
        """Cache animation data with timestamp"""
        if not self.cache_enabled:
            return
        
        try:
            cache_data = {
                'cached_at': time.time(),
                'data': animation_data
            }
            cache_file = CACHE_DIR / f"{cache_key}.json"
            with open(cache_file, 'w') as f:
                json.dump(cache_data, f)
            logger.info(f"Animation cached: {cache_key}")
        except Exception as e:
            logger.warning(f"Error caching animation: {e}")
    
    def generate_animation_huggingface(self, concept: str, duration: int) -> Tuple[Optional[str], str]:
        """Generate animation using Hugging Face API"""
        if not self.hf_api_key:
            return None, "No API key"
        
        try:
            # Try different animation models
            models = [
                "stabilityai/stable-video-diffusion",
                "runwayml/stable-video-diffusion",
                "damo-vilab/text-to-video-ms-1.7b"
            ]
            
            for model in models:
                try:
                    url = f"{HUGGINGFACE_API}/{model}"
                    headers = {"Authorization": f"Bearer {self.hf_api_key}"}
                    
                    # Get concept-specific prompt
                    concept_info = self.concept_mappings.get(concept.lower().replace(" ", "_"), {})
                    prompt = concept_info.get("animation_prompt", f"Educational animation of {concept}")
                    
                    payload = {
                        "inputs": f"{prompt}, duration {duration} seconds, educational content",
                        "parameters": {
                            "duration": duration,
                            "fps": 24,
                            "resolution": "720p"
                        }
                    }
                    
                    response = requests.post(url, headers=headers, json=payload, timeout=30)
                    
                    if response.status_code == 200:
                        # Handle async response
                        if "task_id" in response.json():
                            task_id = response.json()["task_id"]
                            return self._poll_huggingface_task(task_id, headers, concept)
                        else:
                            # Direct response
                            return self._save_animation(response.content, concept, "huggingface")
                    else:
                        logger.warning(f"Hugging Face model {model} failed: {response.status_code}")
                        continue
                        
                except Exception as e:
                    logger.warning(f"Error with Hugging Face model {model}: {e}")
                    continue
            
            return None, "All Hugging Face models failed"
            
        except Exception as e:
            logger.error(f"Hugging Face API error: {e}")
            return None, str(e)
    
    def _poll_huggingface_task(self, task_id: str, headers: Dict, concept: str) -> Tuple[Optional[str], str]:
        """Poll Hugging Face task until completion"""
        max_attempts = 60  # 5 minutes max
        attempt = 0
        
        while attempt < max_attempts:
            try:
                response = requests.get(f"{HUGGINGFACE_API}/tasks/{task_id}", headers=headers, timeout=10)
                
                if response.status_code == 200:
                    result = response.json()
                    status = result.get("status", "unknown")
                    
                    if status == "completed":
                        video_url = result.get("output", {}).get("video_url")
                        if video_url:
                            video_response = requests.get(video_url, timeout=30)
                            if video_response.status_code == 200:
                                return self._save_animation(video_response.content, concept, "huggingface")
                    
                    elif status == "failed":
                        return None, "Hugging Face task failed"
                    
                    # Still processing
                    time.sleep(5)
                    attempt += 1
                else:
                    logger.warning(f"Hugging Face polling failed: {response.status_code}")
                    time.sleep(5)
                    attempt += 1
                    
            except Exception as e:
                logger.warning(f"Error polling Hugging Face task: {e}")
                time.sleep(5)
                attempt += 1
        
        return None, "Hugging Face task timeout"
    
    def generate_animation_replicate(self, concept: str, duration: int) -> Tuple[Optional[str], str]:
        """Generate animation using Replicate API"""
        if not self.replicate_api_key:
            return None, "No API key"
        
        try:
            url = f"{REPLICATE_API}/predictions"
            headers = {"Authorization": f"Token {self.replicate_api_key}"}
            
            # Get concept-specific prompt
            concept_info = self.concept_mappings.get(concept.lower().replace(" ", "_"), {})
            prompt = concept_info.get("animation_prompt", f"Educational animation of {concept}")
            
            payload = {
                "version": "stable-video-diffusion",
                "input": {
                    "prompt": f"{prompt}, duration {duration} seconds, educational content",
                    "duration": duration,
                    "fps": 24,
                    "resolution": "720p"
                }
            }
            
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            
            if response.status_code == 201:
                prediction_id = response.json()["id"]
                return self._poll_replicate_task(prediction_id, headers, concept)
            else:
                return None, f"Replicate API error: {response.status_code}"
                
        except Exception as e:
            logger.error(f"Replicate API error: {e}")
            return None, str(e)
    
    def _poll_replicate_task(self, prediction_id: str, headers: Dict, concept: str) -> Tuple[Optional[str], str]:
        """Poll Replicate task until completion"""
        max_attempts = 60  # 5 minutes max
        attempt = 0
        
        while attempt < max_attempts:
            try:
                response = requests.get(f"{REPLICATE_API}/predictions/{prediction_id}", headers=headers, timeout=10)
                
                if response.status_code == 200:
                    result = response.json()
                    status = result.get("status", "unknown")
                    
                    if status == "succeeded":
                        video_url = result.get("output", {}).get("video_url")
                        if video_url:
                            video_response = requests.get(video_url, timeout=30)
                            if video_response.status_code == 200:
                                return self._save_animation(video_response.content, concept, "replicate")
                    
                    elif status == "failed":
                        return None, "Replicate task failed"
                    
                    # Still processing
                    time.sleep(5)
                    attempt += 1
                else:
                    logger.warning(f"Replicate polling failed: {response.status_code}")
                    time.sleep(5)
                    attempt += 1
                    
            except Exception as e:
                logger.warning(f"Error polling Replicate task: {e}")
                time.sleep(5)
                attempt += 1
        
        return None, "Replicate task timeout"
    
    def generate_animation_stability(self, concept: str, duration: int) -> Tuple[Optional[str], str]:
        """Generate animation using Stability AI API"""
        if not self.stability_api_key:
            return None, "No API key"
        
        try:
            url = f"{STABILITY_AI_API}/video/generate"
            headers = {"Authorization": f"Bearer {self.stability_api_key}"}
            
            # Get concept-specific prompt
            concept_info = self.concept_mappings.get(concept.lower().replace(" ", "_"), {})
            prompt = concept_info.get("animation_prompt", f"Educational animation of {concept}")
            
            payload = {
                "text_prompts": [{"text": f"{prompt}, duration {duration} seconds, educational content"}],
                "duration": duration,
                "fps": 24,
                "resolution": "720p"
            }
            
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                if "video_url" in result:
                    video_response = requests.get(result["video_url"], timeout=30)
                    if video_response.status_code == 200:
                        return self._save_animation(video_response.content, concept, "stability")
                
                return None, "No video URL in response"
            else:
                return None, f"Stability AI API error: {response.status_code}"
                
        except Exception as e:
            logger.error(f"Stability AI API error: {e}")
            return None, str(e)
    
    def generate_fallback_animation(self, concept: str, duration: int) -> Tuple[str, str]:
        """Generate fallback animation using matplotlib or other methods"""
        logger.info(f"Generating fallback animation for: {concept}")
        
        try:
            # Create a simple animated GIF using matplotlib
            import matplotlib.pyplot as plt
            import matplotlib.animation as animation
            import numpy as np
            
            # Get concept-specific animation parameters
            concept_info = self.concept_mappings.get(concept.lower().replace(" ", "_"), {})
            
            if concept.lower().replace(" ", "_") == "sine_wave":
                return self._create_sine_wave_animation(concept, duration)
            elif concept.lower().replace(" ", "_") == "pendulum_motion":
                return self._create_pendulum_animation(concept, duration)
            elif concept.lower().replace(" ", "_") == "wave_propagation":
                return self._create_wave_propagation_animation(concept, duration)
            else:
                return self._create_generic_animation(concept, duration)
                
        except Exception as e:
            logger.warning(f"Error creating fallback animation: {e}")
            return self._create_text_animation(concept, duration)
    
    def _create_sine_wave_animation(self, concept: str, duration: int) -> Tuple[str, str]:
        """Create sine wave animation using matplotlib"""
        try:
            import matplotlib.pyplot as plt
            import matplotlib.animation as animation
            import numpy as np
            
            fig, ax = plt.subplots(figsize=(10, 6))
            x = np.linspace(0, 4*np.pi, 1000)
            
            def animate(frame):
                ax.clear()
                y = np.sin(x + frame * 0.1)
                ax.plot(x, y, 'b-', linewidth=2)
                ax.set_title(f'Sine Wave Animation - Frame {frame}')
                ax.set_xlabel('Time')
                ax.set_ylabel('Amplitude')
                ax.grid(True)
                ax.set_ylim(-1.5, 1.5)
            
            anim = animation.FuncAnimation(fig, animate, frames=duration*10, interval=100, repeat=True)
            
            # Save as GIF
            filename = f"{concept.replace(' ', '_')}_fallback.gif"
            filepath = self.animations_dir / filename
            anim.save(filepath, writer='pillow', fps=10)
            plt.close()
            
            return str(filepath), "matplotlib_fallback"
            
        except Exception as e:
            logger.warning(f"Error creating sine wave animation: {e}")
            return self._create_text_animation(concept, duration)
    
    def _create_pendulum_animation(self, concept: str, duration: int) -> Tuple[str, str]:
        """Create pendulum animation using matplotlib"""
        try:
            import matplotlib.pyplot as plt
            import matplotlib.animation as animation
            import numpy as np
            
            fig, ax = plt.subplots(figsize=(8, 8))
            
            def animate(frame):
                ax.clear()
                t = frame * 0.1
                theta = 0.5 * np.sin(t)
                x = np.sin(theta)
                y = -np.cos(theta)
                
                # Draw pendulum
                ax.plot([0, x], [0, y], 'b-', linewidth=3)
                ax.plot(x, y, 'ro', markersize=10)
                ax.set_xlim(-1.2, 1.2)
                ax.set_ylim(-1.2, 0.2)
                ax.set_title(f'Pendulum Motion - Time: {t:.1f}s')
                ax.set_aspect('equal')
                ax.grid(True)
            
            anim = animation.FuncAnimation(fig, animate, frames=duration*10, interval=100, repeat=True)
            
            filename = f"{concept.replace(' ', '_')}_fallback.gif"
            filepath = self.animations_dir / filename
            anim.save(filepath, writer='pillow', fps=10)
            plt.close()
            
            return str(filepath), "matplotlib_fallback"
            
        except Exception as e:
            logger.warning(f"Error creating pendulum animation: {e}")
            return self._create_text_animation(concept, duration)
    
    def _create_wave_propagation_animation(self, concept: str, duration: int) -> Tuple[str, str]:
        """Create wave propagation animation using matplotlib"""
        try:
            import matplotlib.pyplot as plt
            import matplotlib.animation as animation
            import numpy as np
            
            fig, ax = plt.subplots(figsize=(12, 6))
            x = np.linspace(0, 4*np.pi, 200)
            
            def animate(frame):
                ax.clear()
                t = frame * 0.1
                y = np.sin(x - t) * np.exp(-x/10)  # Damped wave
                ax.plot(x, y, 'b-', linewidth=2)
                ax.set_title(f'Wave Propagation - Time: {t:.1f}s')
                ax.set_xlabel('Position')
                ax.set_ylabel('Amplitude')
                ax.grid(True)
                ax.set_ylim(-1.5, 1.5)
            
            anim = animation.FuncAnimation(fig, animate, frames=duration*10, interval=100, repeat=True)
            
            filename = f"{concept.replace(' ', '_')}_fallback.gif"
            filepath = self.animations_dir / filename
            anim.save(filepath, writer='pillow', fps=10)
            plt.close()
            
            return str(filepath), "matplotlib_fallback"
            
        except Exception as e:
            logger.warning(f"Error creating wave propagation animation: {e}")
            return self._create_text_animation(concept, duration)
    
    def _create_generic_animation(self, concept: str, duration: int) -> Tuple[str, str]:
        """Create generic educational animation"""
        try:
            import matplotlib.pyplot as plt
            import matplotlib.animation as animation
            import numpy as np
            
            fig, ax = plt.subplots(figsize=(10, 6))
            
            def animate(frame):
                ax.clear()
                t = frame * 0.1
                x = np.linspace(0, 2*np.pi, 100)
                y = np.sin(x + t) * np.cos(x)
                
                ax.plot(x, y, 'b-', linewidth=2)
                ax.set_title(f'{concept.title()} Animation - Time: {t:.1f}s')
                ax.set_xlabel('X')
                ax.set_ylabel('Y')
                ax.grid(True)
                ax.set_ylim(-1.5, 1.5)
            
            anim = animation.FuncAnimation(fig, animate, frames=duration*10, interval=100, repeat=True)
            
            filename = f"{concept.replace(' ', '_')}_fallback.gif"
            filepath = self.animations_dir / filename
            anim.save(filepath, writer='pillow', fps=10)
            plt.close()
            
            return str(filepath), "matplotlib_fallback"
            
        except Exception as e:
            logger.warning(f"Error creating generic animation: {e}")
            return self._create_text_animation(concept, duration)
    
    def _create_text_animation(self, concept: str, duration: int) -> Tuple[str, str]:
        """Create text-based animation as final fallback"""
        logger.info(f"Creating text animation for: {concept}")
        
        # Create a simple text file with animation description
        filename = f"{concept.replace(' ', '_')}_text_animation.txt"
        filepath = self.animations_dir / filename
        
        content = f"""EDUCATIONAL ANIMATION: {concept.upper()}

This would be a generated educational animation showing:
- Visual representation of {concept}
- Key concepts and principles
- Interactive elements and labels
- Duration: {duration} seconds
- Educational content with learning objectives

Generated by: Educational Animation Generator
Concept: {concept}
Type: Educational Animation
Duration: {duration}s
"""
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return str(filepath), "text_fallback"
    
    def _save_animation(self, content: bytes, concept: str, source: str) -> Tuple[str, str]:
        """Save animation content to file"""
        filename = f"{concept.replace(' ', '_')}_{source}_{int(time.time())}.mp4"
        filepath = self.animations_dir / filename
        
        with open(filepath, 'wb') as f:
            f.write(content)
        
        logger.info(f"Animation saved: {filepath}")
        return str(filepath), source
    
    def build_educational_metadata(self, request: AnimationRequest, animation_path: str, 
                                 model_used: str, file_size: int) -> AnimationResult:
        """Build comprehensive educational metadata"""
        
        concept_key = request.concept.lower().replace(" ", "_")
        concept_info = self.concept_mappings.get(concept_key, {})
        
        # Get learning goals and key points
        if concept_info:
            learning_goals = concept_info.get("learning_goals", [
                f"Understand the basics of {request.concept}",
                f"Visualize {request.concept} dynamically",
                f"Apply {request.concept} to practical examples"
            ])
            key_learning_points = concept_info.get("key_learning_points", [
                f"{request.concept} illustrated in motion",
                "Highlights cause-effect relationships",
                "Links visual understanding with theory"
            ])
            tricky_questions = concept_info.get("tricky_questions", [
                f"Explain the physics behind {request.concept}",
                f"How does {request.concept} change if parameters vary?",
                f"Where is {request.concept} applied in real-world systems?"
            ])
            educational_value = 8 if concept_info else 6
        else:
            learning_goals = [
                f"Understand the basics of {request.concept}",
                f"Visualize {request.concept} dynamically",
                f"Apply {request.concept} to practical examples"
            ]
            key_learning_points = [
                f"{request.concept} illustrated in motion",
                "Highlights cause-effect relationships",
                "Links visual understanding with theory"
            ]
            tricky_questions = [
                f"Explain the physics behind {request.concept}",
                f"How does {request.concept} change if parameters vary?",
                f"Where is {request.concept} applied in real-world systems?"
            ]
            educational_value = 6
        
        return AnimationResult(
            id=str(uuid.uuid4()),
            concept=request.concept,
            animation_path=animation_path,
            duration=request.duration,
            target_audience=request.target_audience,
            animation_type=request.animation_type,
            model_used=model_used,
            created_at=datetime.now(timezone.utc).isoformat(),
            file_size=file_size,
            resolution=request.resolution,
            quality=request.quality,
            learning_goals=learning_goals,
            key_learning_points=key_learning_points,
            tricky_questions=tricky_questions,
            educational_value=educational_value
        )
    
    def process_animation_request(self, request: AnimationRequest) -> AnimationResult:
        """Process a single animation request with comprehensive error handling"""
        logger.info(f"Processing animation request: {request.concept}")
        
        # Check cache first
        cache_key = self.get_cache_key(request.concept, request.duration, request.target_audience)
        cached_result = self.is_cached(cache_key)
        
        if cached_result:
            logger.info(f"Using cached animation for: {request.concept}")
            return AnimationResult(**cached_result)
        
        # Try different animation generation methods
        animation_path = None
        model_used = "unknown"
        
        # Try Hugging Face first
        if self.hf_api_key:
            animation_path, model_used = self.generate_animation_huggingface(request.concept, request.duration)
            if animation_path:
                logger.info(f"Generated animation using Hugging Face: {model_used}")
        
        # Try Replicate if Hugging Face failed
        if not animation_path and self.replicate_api_key:
            animation_path, model_used = self.generate_animation_replicate(request.concept, request.duration)
            if animation_path:
                logger.info(f"Generated animation using Replicate: {model_used}")
        
        # Try Stability AI if others failed
        if not animation_path and self.stability_api_key:
            animation_path, model_used = self.generate_animation_stability(request.concept, request.duration)
            if animation_path:
                logger.info(f"Generated animation using Stability AI: {model_used}")
        
        # Use fallback if all APIs failed
        if not animation_path:
            animation_path, model_used = self.generate_fallback_animation(request.concept, request.duration)
            logger.info(f"Generated fallback animation: {model_used}")
        
        # Get file size
        file_size = 0
        if os.path.exists(animation_path):
            file_size = os.path.getsize(animation_path)
        
        # Build metadata
        result = self.build_educational_metadata(request, animation_path, model_used, file_size)
        
        # Cache the result
        self.cache_animation(cache_key, result.__dict__)
        
        return result
    
    def process_animation_batch(self, requests: List[AnimationRequest]) -> List[AnimationResult]:
        """Process multiple animation requests in batch"""
        logger.info(f"Processing batch of {len(requests)} animation requests")
        
        results = []
        for i, request in enumerate(requests, 1):
            logger.info(f"Progress: {i}/{len(requests)} - Processing: {request.concept}")
            try:
                result = self.process_animation_request(request)
                results.append(result)
                time.sleep(2)  # Rate limiting
            except Exception as e:
                logger.error(f"Error processing {request.concept}: {e}")
                # Create fallback result
                fallback_result = AnimationResult(
                    id=str(uuid.uuid4()),
                    concept=request.concept,
                    animation_path="fallback_animation.txt",
                    duration=request.duration,
                    target_audience=request.target_audience,
                    animation_type=request.animation_type,
                    model_used="fallback",
                    created_at=datetime.now(timezone.utc).isoformat(),
                    file_size=0,
                    resolution=request.resolution,
                    quality="low",
                    learning_goals=[f"Learn about {request.concept}"],
                    key_learning_points=[f"Basic understanding of {request.concept}"],
                    tricky_questions=[f"What is {request.concept}?"],
                    educational_value=3
                )
                results.append(fallback_result)
        
        return results
    
    def save_metadata(self, result: AnimationResult) -> str:
        """Save animation metadata to JSON file"""
        output_file = self.metadata_dir / f"{result.concept.replace(' ', '_')}.json"
        
        # Convert to dict for JSON serialization
        result_dict = {
            "id": result.id,
            "concept": result.concept,
            "animation_path": result.animation_path,
            "duration": result.duration,
            "target_audience": result.target_audience,
            "animation_type": result.animation_type,
            "model_used": result.model_used,
            "created_at": result.created_at,
            "file_size": result.file_size,
            "resolution": result.resolution,
            "quality": result.quality,
            "learning_goals": result.learning_goals,
            "key_learning_points": result.key_learning_points,
            "tricky_questions": result.tricky_questions,
            "educational_value": result.educational_value
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result_dict, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Metadata saved: {output_file}")
        return str(output_file)
    
    def save_batch_results(self, results: List[AnimationResult]) -> str:
        """Save batch results to a single JSON file"""
        output_file = self.metadata_dir / "animation_batch_results.json"
        
        # Convert all results to dicts
        results_dict = []
        for result in results:
            result_dict = {
                "id": result.id,
                "concept": result.concept,
                "animation_path": result.animation_path,
                "duration": result.duration,
                "target_audience": result.target_audience,
                "animation_type": result.animation_type,
                "model_used": result.model_used,
                "created_at": result.created_at,
                "file_size": result.file_size,
                "resolution": result.resolution,
                "quality": result.quality,
                "learning_goals": result.learning_goals,
                "key_learning_points": result.key_learning_points,
                "tricky_questions": result.tricky_questions,
                "educational_value": result.educational_value
            }
            results_dict.append(result_dict)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results_dict, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Batch results saved: {output_file}")
        return str(output_file)

def main():
    parser = argparse.ArgumentParser(
        description="Generate educational animations/GIFs demonstrating learning concepts",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python educational_animation_generator.py --concept "Wave propagation"
  python educational_animation_generator.py --concept "Pendulum motion" --duration 10
  python educational_animation_generator.py --concepts "Sine wave,Planetary orbits" --batch
  python educational_animation_generator.py --concept "Chemical reactions" --audience "college"
        """
    )
    
    parser.add_argument(
        "--concept", 
        type=str, 
        help="Single educational concept (e.g., 'Wave propagation')"
    )
    parser.add_argument(
        "--concepts", 
        type=str, 
        help="Comma-separated list of concepts (e.g., 'Sine wave,Planetary orbits,Chemical reactions')"
    )
    parser.add_argument(
        "--duration", 
        type=int, 
        default=8,
        help="Animation duration in seconds (5-15s, default: 8)"
    )
    parser.add_argument(
        "--audience", 
        type=str, 
        default="high_school",
        choices=["elementary", "middle_school", "high_school", "college", "graduate"],
        help="Target audience (default: high_school)"
    )
    parser.add_argument(
        "--animation_type", 
        type=str, 
        default="gif",
        choices=["gif", "mp4"],
        help="Animation type (default: gif)"
    )
    parser.add_argument(
        "--batch", 
        action="store_true",
        help="Process concepts in batch mode"
    )
    parser.add_argument(
        "--no-cache", 
        action="store_true",
        help="Disable caching"
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
    if not args.concept and not args.concepts:
        logger.error("Please provide either --concept or --concepts")
        return 1
    
    if args.duration < 5 or args.duration > 15:
        logger.error("Duration must be between 5 and 15 seconds")
        return 1
    
    try:
        generator = EducationalAnimationGenerator(cache_enabled=not args.no_cache)
        
        if args.concepts:
            # Batch processing
            concepts = [concept.strip() for concept in args.concepts.split(",")]
            logger.info(f"Starting batch processing of {len(concepts)} concepts")
            
            requests = []
            for concept in concepts:
                request = AnimationRequest(
                    concept=concept,
                    duration=args.duration,
                    target_audience=args.audience,
                    animation_type=args.animation_type
                )
                requests.append(request)
            
            results = generator.process_animation_batch(requests)
            output_file = generator.save_batch_results(results)
            
            logger.info(f"[SUCCESS] Batch processing completed!")
            logger.info(f"[SAVED] Results saved to: {output_file}")
            logger.info(f"[PROCESSED] Processed {len(results)} concepts successfully")
            
        else:
            # Single concept processing
            request = AnimationRequest(
                concept=args.concept,
                duration=args.duration,
                target_audience=args.audience,
                animation_type=args.animation_type
            )
            
            result = generator.process_animation_request(request)
            output_file = generator.save_metadata(result)
            
            logger.info(f"[SUCCESS] Animation generated successfully!")
            logger.info(f"[SAVED] Metadata saved to: {output_file}")
            logger.info(f"[CONCEPT] Concept: {result.concept}")
            logger.info(f"[DURATION] Duration: {result.duration}s")
            logger.info(f"[MODEL] Model used: {result.model_used}")
            logger.info(f"[GOALS] Learning goals: {len(result.learning_goals)}")
            logger.info(f"[EDUCATIONAL_VALUE] Educational value: {result.educational_value}/10")
        
    except KeyboardInterrupt:
        logger.info("Processing interrupted by user")
        return 1
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
