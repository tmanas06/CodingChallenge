#!/usr/bin/env python3
"""
Comprehensive test suite for Educational Animation Generator
Tests all functionality including caching, error recovery, and scalability
"""

import unittest
import json
import tempfile
import os
import sys
import shutil
from pathlib import Path
from unittest.mock import patch, MagicMock
import requests

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from educational_animation_generator import EducationalAnimationGenerator, AnimationRequest, AnimationResult

class TestEducationalAnimationGenerator(unittest.TestCase):
    """Test cases for EducationalAnimationGenerator class"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.generator = EducationalAnimationGenerator(cache_enabled=False)
        self.generator.output_dir = Path(self.temp_dir)
        self.generator.animations_dir = self.generator.output_dir / "animations"
        self.generator.metadata_dir = self.generator.output_dir / "metadata"
        self.generator.animations_dir.mkdir(exist_ok=True)
        self.generator.metadata_dir.mkdir(exist_ok=True)
    
    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_animation_request_creation(self):
        """Test AnimationRequest dataclass creation"""
        request = AnimationRequest(
            concept="Wave propagation",
            duration=8,
            target_audience="high_school"
        )
        
        self.assertEqual(request.concept, "Wave propagation")
        self.assertEqual(request.duration, 8)
        self.assertEqual(request.target_audience, "high_school")
        self.assertEqual(request.animation_type, "gif")
        self.assertEqual(request.quality, "high")
    
    def test_animation_result_creation(self):
        """Test AnimationResult dataclass creation"""
        result = AnimationResult(
            id="test-id",
            concept="Test Concept",
            animation_path="test.mp4",
            duration=8,
            target_audience="high_school",
            animation_type="gif",
            model_used="test_model",
            created_at="2024-01-01T00:00:00Z",
            file_size=1024,
            resolution="720p",
            quality="high",
            learning_goals=["Learn something"],
            key_learning_points=["Key point"],
            tricky_questions=["Question?"],
            educational_value=8
        )
        
        self.assertEqual(result.concept, "Test Concept")
        self.assertEqual(result.duration, 8)
        self.assertEqual(result.educational_value, 8)
        self.assertEqual(len(result.learning_goals), 1)
    
    def test_cache_key_generation(self):
        """Test cache key generation"""
        key1 = self.generator.get_cache_key("wave_propagation", 8, "high_school")
        key2 = self.generator.get_cache_key("wave_propagation", 8, "high_school")
        key3 = self.generator.get_cache_key("pendulum_motion", 8, "high_school")
        
        self.assertEqual(key1, key2)  # Same input should generate same key
        self.assertNotEqual(key1, key3)  # Different input should generate different key
        self.assertEqual(len(key1), 32)  # MD5 hash length
    
    def test_concept_mappings(self):
        """Test concept-specific mappings"""
        # Test known concept
        self.assertIn("wave_propagation", self.generator.concept_mappings)
        self.assertIn("learning_goals", self.generator.concept_mappings["wave_propagation"])
        self.assertIn("key_learning_points", self.generator.concept_mappings["wave_propagation"])
        
        # Test unknown concept
        self.assertNotIn("unknown_concept", self.generator.concept_mappings)
    
    @patch('requests.post')
    def test_generate_animation_huggingface_success(self, mock_post):
        """Test successful Hugging Face animation generation"""
        # Mock successful response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"task_id": "test_task_123"}
        mock_post.return_value = mock_response
        
        # Mock polling response
        with patch.object(self.generator, '_poll_huggingface_task') as mock_poll:
            mock_poll.return_value = ("test_animation.mp4", "huggingface")
            
            animation_path, model_used = self.generator.generate_animation_huggingface("Wave propagation", 8)
            
            self.assertEqual(animation_path, "test_animation.mp4")
            self.assertEqual(model_used, "huggingface")
    
    @patch('requests.post')
    def test_generate_animation_huggingface_failure(self, mock_post):
        """Test Hugging Face animation generation failure"""
        # Mock API failure
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_post.return_value = mock_response
        
        animation_path, model_used = self.generator.generate_animation_huggingface("Wave propagation", 8)
        
        self.assertIsNone(animation_path)
        self.assertIn("failed", model_used)
    
    @patch('requests.post')
    def test_generate_animation_replicate_success(self, mock_post):
        """Test successful Replicate animation generation"""
        # Mock successful response
        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_response.json.return_value = {"id": "test_prediction_123"}
        mock_post.return_value = mock_response
        
        # Mock polling response
        with patch.object(self.generator, '_poll_replicate_task') as mock_poll:
            mock_poll.return_value = ("test_animation.mp4", "replicate")
            
            animation_path, model_used = self.generator.generate_animation_replicate("Pendulum motion", 8)
            
            self.assertEqual(animation_path, "test_animation.mp4")
            self.assertEqual(model_used, "replicate")
    
    @patch('requests.post')
    def test_generate_animation_stability_success(self, mock_post):
        """Test successful Stability AI animation generation"""
        # Mock successful response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"video_url": "https://example.com/video.mp4"}
        mock_post.return_value = mock_response
        
        # Mock video download
        with patch('requests.get') as mock_get:
            video_response = MagicMock()
            video_response.status_code = 200
            video_response.content = b"fake video content"
            mock_get.return_value = video_response
            
            with patch.object(self.generator, '_save_animation') as mock_save:
                mock_save.return_value = ("test_animation.mp4", "stability")
                
                animation_path, model_used = self.generator.generate_animation_stability("Chemical reactions", 8)
                
                self.assertEqual(animation_path, "test_animation.mp4")
                self.assertEqual(model_used, "stability")
    
    def test_generate_fallback_animation(self):
        """Test fallback animation generation"""
        animation_path, model_used = self.generator.generate_fallback_animation("Test concept", 8)
        
        self.assertIsNotNone(animation_path)
        self.assertIn("fallback", model_used)
        self.assertTrue(os.path.exists(animation_path))
    
    def test_create_text_animation(self):
        """Test text animation creation"""
        animation_path, model_used = self.generator._create_text_animation("Test concept", 8)
        
        self.assertTrue(os.path.exists(animation_path))
        self.assertEqual(model_used, "text_fallback")
        
        with open(animation_path, 'r') as f:
            content = f.read()
            self.assertIn("EDUCATIONAL ANIMATION", content)
            self.assertIn("Test concept", content)
    
    def test_build_educational_metadata_known_concept(self):
        """Test metadata building for known concept"""
        request = AnimationRequest(
            concept="Wave propagation",
            duration=8,
            target_audience="high_school"
        )
        
        result = self.generator.build_educational_metadata(
            request, "test.mp4", "test_model", 1024
        )
        
        self.assertEqual(result.concept, "Wave propagation")
        self.assertEqual(result.duration, 8)
        self.assertGreater(len(result.learning_goals), 3)
        self.assertIn("amplitude", result.learning_goals[0].lower())
        self.assertEqual(result.educational_value, 8)
    
    def test_build_educational_metadata_unknown_concept(self):
        """Test metadata building for unknown concept"""
        request = AnimationRequest(
            concept="Unknown concept",
            duration=8,
            target_audience="high_school"
        )
        
        result = self.generator.build_educational_metadata(
            request, "test.mp4", "test_model", 1024
        )
        
        self.assertEqual(result.concept, "Unknown concept")
        self.assertEqual(result.duration, 8)
        self.assertEqual(len(result.learning_goals), 3)
        self.assertEqual(result.educational_value, 6)
    
    def test_save_metadata(self):
        """Test metadata saving to JSON file"""
        result = AnimationResult(
            id="test-id",
            concept="Test Concept",
            animation_path="test.mp4",
            duration=8,
            target_audience="high_school",
            animation_type="gif",
            model_used="test_model",
            created_at="2024-01-01T00:00:00Z",
            file_size=1024,
            resolution="720p",
            quality="high",
            learning_goals=["Learn something"],
            key_learning_points=["Key point"],
            tricky_questions=["Question?"],
            educational_value=8
        )
        
        output_file = self.generator.save_metadata(result)
        
        self.assertTrue(os.path.exists(output_file))
        with open(output_file, 'r') as f:
            data = json.load(f)
            self.assertEqual(data["concept"], "Test Concept")
            self.assertEqual(data["id"], "test-id")
    
    def test_save_batch_results(self):
        """Test batch results saving"""
        results = [
            AnimationResult(
                id="test-id-1",
                concept="Concept 1",
                animation_path="test1.mp4",
                duration=8,
                target_audience="high_school",
                animation_type="gif",
                model_used="test_model",
                created_at="2024-01-01T00:00:00Z",
                file_size=1024,
                resolution="720p",
                quality="high",
                learning_goals=["Learn 1"],
                key_learning_points=["Key 1"],
                tricky_questions=["Q1?"],
                educational_value=8
            ),
            AnimationResult(
                id="test-id-2",
                concept="Concept 2",
                animation_path="test2.mp4",
                duration=8,
                target_audience="high_school",
                animation_type="gif",
                model_used="test_model",
                created_at="2024-01-01T00:00:00Z",
                file_size=1024,
                resolution="720p",
                quality="high",
                learning_goals=["Learn 2"],
                key_learning_points=["Key 2"],
                tricky_questions=["Q2?"],
                educational_value=8
            )
        ]
        
        output_file = self.generator.save_batch_results(results)
        
        self.assertTrue(os.path.exists(output_file))
        with open(output_file, 'r') as f:
            data = json.load(f)
            self.assertEqual(len(data), 2)
            self.assertEqual(data[0]["concept"], "Concept 1")
            self.assertEqual(data[1]["concept"], "Concept 2")
    
    def test_process_animation_request(self):
        """Test single animation request processing"""
        request = AnimationRequest(
            concept="Wave propagation",
            duration=8,
            target_audience="high_school"
        )
        
        with patch.object(self.generator, 'generate_fallback_animation') as mock_fallback:
            mock_fallback.return_value = ("test_animation.mp4", "fallback")
            
            result = self.generator.process_animation_request(request)
            
            self.assertEqual(result.concept, "Wave propagation")
            self.assertEqual(result.duration, 8)
            self.assertIsNotNone(result.id)
    
    def test_process_animation_batch(self):
        """Test batch animation processing"""
        requests = [
            AnimationRequest(concept="Concept 1", duration=8, target_audience="high_school"),
            AnimationRequest(concept="Concept 2", duration=8, target_audience="high_school")
        ]
        
        with patch.object(self.generator, 'process_animation_request') as mock_process:
            mock_result = AnimationResult(
                id="test-id",
                concept="Test Concept",
                animation_path="test.mp4",
                duration=8,
                target_audience="high_school",
                animation_type="gif",
                model_used="test_model",
                created_at="2024-01-01T00:00:00Z",
                file_size=1024,
                resolution="720p",
                quality="high",
                learning_goals=["Learn something"],
                key_learning_points=["Key point"],
                tricky_questions=["Question?"],
                educational_value=8
            )
            mock_process.return_value = mock_result
            
            results = self.generator.process_animation_batch(requests)
            
            self.assertEqual(len(results), 2)
            self.assertEqual(mock_process.call_count, 2)

class TestCaching(unittest.TestCase):
    """Test caching functionality"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.generator = EducationalAnimationGenerator(cache_enabled=True)
        self.generator.cache_dir = Path(self.temp_dir)
    
    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_cache_animation_and_retrieve(self):
        """Test caching and retrieving animation data"""
        cache_key = "test_key"
        test_data = {"concept": "test", "duration": 8}
        
        # Cache animation data
        self.generator.cache_animation(cache_key, test_data)
        
        # Retrieve animation data
        retrieved_data = self.generator.is_cached(cache_key)
        
        self.assertIsNotNone(retrieved_data)
        self.assertEqual(retrieved_data, test_data)
    
    def test_cache_expiry(self):
        """Test cache expiry functionality"""
        cache_key = "test_key"
        test_data = {"concept": "test", "duration": 8}
        
        # Cache animation data
        self.generator.cache_animation(cache_key, test_data)
        
        # Manually set old timestamp to simulate expiry
        cache_file = self.generator.cache_dir / f"{cache_key}.json"
        with open(cache_file, 'r') as f:
            cache_data = json.load(f)
        cache_data['cached_at'] = 0  # Very old timestamp
        with open(cache_file, 'w') as f:
            json.dump(cache_data, f)
        
        # Try to retrieve expired animation data
        retrieved_data = self.generator.is_cached(cache_key)
        
        self.assertIsNone(retrieved_data)  # Should be None due to expiry

class TestErrorRecovery(unittest.TestCase):
    """Test error recovery and fallback mechanisms"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.generator = EducationalAnimationGenerator(cache_enabled=False)
        self.generator.output_dir = Path(self.temp_dir)
        self.generator.animations_dir = self.generator.output_dir / "animations"
        self.generator.metadata_dir = self.generator.output_dir / "metadata"
        self.generator.animations_dir.mkdir(exist_ok=True)
        self.generator.metadata_dir.mkdir(exist_ok=True)
    
    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    @patch('requests.post')
    def test_network_error_recovery(self, mock_post):
        """Test recovery from network errors"""
        # Mock network error
        mock_post.side_effect = requests.exceptions.ConnectionError("Network error")
        
        # Should not raise exception, should return fallback
        animation_path, model_used = self.generator.generate_animation_huggingface("Test concept", 8)
        
        self.assertIsNone(animation_path)
        self.assertIn("error", model_used)
    
    def test_invalid_concept_handling(self):
        """Test handling of invalid or empty concepts"""
        # Test with empty concept
        request = AnimationRequest(concept="", duration=8, target_audience="high_school")
        result = self.generator.build_educational_metadata(request, "test.mp4", "test_model", 1024)
        self.assertEqual(result.concept, "")
        
        # Test with None concept
        request = AnimationRequest(concept=None, duration=8, target_audience="high_school")
        result = self.generator.build_educational_metadata(request, "test.mp4", "test_model", 1024)
        self.assertIsNone(result.concept)

class TestScalability(unittest.TestCase):
    """Test scalability considerations"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.generator = EducationalAnimationGenerator(cache_enabled=True)
        self.generator.output_dir = Path(self.temp_dir)
        self.generator.animations_dir = self.generator.output_dir / "animations"
        self.generator.metadata_dir = self.generator.output_dir / "metadata"
        self.generator.animations_dir.mkdir(exist_ok=True)
        self.generator.metadata_dir.mkdir(exist_ok=True)
    
    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_large_batch_processing(self):
        """Test processing large batch of animation requests"""
        # Create large list of concepts
        concepts = [f"Concept {i}" for i in range(50)]
        requests = [AnimationRequest(concept=concept, duration=8, target_audience="high_school") for concept in concepts]
        
        with patch.object(self.generator, 'process_animation_request') as mock_process:
            mock_result = AnimationResult(
                id="test-id",
                concept="Test Concept",
                animation_path="test.mp4",
                duration=8,
                target_audience="high_school",
                animation_type="gif",
                model_used="test_model",
                created_at="2024-01-01T00:00:00Z",
                file_size=1024,
                resolution="720p",
                quality="high",
                learning_goals=["Learn something"],
                key_learning_points=["Key point"],
                tricky_questions=["Question?"],
                educational_value=8
            )
            mock_process.return_value = mock_result
            
            # Process large batch
            results = self.generator.process_animation_batch(requests)
            
            self.assertEqual(len(results), 50)
            self.assertEqual(mock_process.call_count, 50)
    
    def test_memory_efficiency(self):
        """Test memory efficiency with large content"""
        # Create request with large concept name
        large_concept = "A" * 1000  # 1KB concept name
        
        request = AnimationRequest(
            concept=large_concept,
            duration=8,
            target_audience="high_school"
        )
        
        result = self.generator.build_educational_metadata(
            request, "test.mp4", "test_model", 1024
        )
        
        # Should handle large content without issues
        self.assertEqual(len(result.concept), 1000)
        self.assertIsNotNone(result.id)

class TestMatplotlibAnimations(unittest.TestCase):
    """Test matplotlib-based animation generation"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.generator = EducationalAnimationGenerator(cache_enabled=False)
        self.generator.output_dir = Path(self.temp_dir)
        self.generator.animations_dir = self.generator.output_dir / "animations"
        self.generator.animations_dir.mkdir(exist_ok=True)
    
    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_create_sine_wave_animation(self):
        """Test sine wave animation creation"""
        try:
            animation_path, model_used = self.generator._create_sine_wave_animation("Sine wave", 8)
            
            self.assertTrue(os.path.exists(animation_path))
            self.assertEqual(model_used, "matplotlib_fallback")
            self.assertIn("sine_wave", animation_path)
        except ImportError:
            self.skipTest("matplotlib not available")
    
    def test_create_pendulum_animation(self):
        """Test pendulum animation creation"""
        try:
            animation_path, model_used = self.generator._create_pendulum_animation("Pendulum motion", 8)
            
            self.assertTrue(os.path.exists(animation_path))
            self.assertEqual(model_used, "matplotlib_fallback")
            self.assertIn("pendulum_motion", animation_path)
        except ImportError:
            self.skipTest("matplotlib not available")
    
    def test_create_wave_propagation_animation(self):
        """Test wave propagation animation creation"""
        try:
            animation_path, model_used = self.generator._create_wave_propagation_animation("Wave propagation", 8)
            
            self.assertTrue(os.path.exists(animation_path))
            self.assertEqual(model_used, "matplotlib_fallback")
            self.assertIn("wave_propagation", animation_path)
        except ImportError:
            self.skipTest("matplotlib not available")

if __name__ == "__main__":
    # Set up test environment
    os.environ["HF_API_KEY"] = "test_key"
    os.environ["REPLICATE_API_KEY"] = "test_key"
    os.environ["STABILITY_API_KEY"] = "test_key"
    
    # Run tests
    unittest.main(verbosity=2)
