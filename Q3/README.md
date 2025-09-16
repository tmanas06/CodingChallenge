# 🎬 Educational Animation Generator - Q3

A comprehensive Python tool that creates educational animations/GIFs demonstrating learning concepts using multiple AI APIs with comprehensive error recovery, caching mechanisms, and fallback animation generation.

## 🚀 Quick Start

### 1. Installation
```bash
# Clone the repository
git clone [your-repo-link]
cd educational-animation-generator

# Install dependencies
pip install -r requirements.txt
```

### 2. Setup (Optional)
```bash
# Copy environment template
cp env.example .env

# Edit .env file and add API keys (optional)
HF_API_KEY=your_huggingface_key_here
REPLICATE_API_KEY=your_replicate_key_here
STABILITY_API_KEY=your_stability_key_here
```

### 3. Generate Educational Animations
```bash
# Single concept
python educational_animation_generator.py --concept "Wave propagation"

# Multiple concepts (batch mode)
python educational_animation_generator.py --concepts "Sine wave,Pendulum motion,Chemical reactions" --batch

# With custom duration and audience
python educational_animation_generator.py --concept "Planetary orbits" --duration 12 --audience "college"
```

## 📊 Sample Output

### Q3: Generated Educational Animation Example
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "concept": "Wave propagation",
  "animation_path": "output/animations/wave_propagation_animation.gif",
  "duration": 10,
  "target_audience": "high_school",
  "animation_type": "gif",
  "model_used": "huggingface/stable-video-diffusion",
  "created_at": "2024-01-01T12:00:00Z",
  "file_size": 2048576,
  "resolution": "720p",
  "quality": "high",
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
  "educational_value": 9
}
```

## 🎯 Features

### Core Functionality
- **Multiple AI APIs**: Hugging Face, Replicate, Stability AI with intelligent fallback
- **Educational Concepts**: Pre-configured mappings for common educational topics
- **Animation Generation**: 5-15 second educational animations in GIF/MP4 format
- **Comprehensive Metadata**: Rich JSON output with learning objectives and assessments
- **Batch Processing**: Process multiple concepts efficiently
- **Caching System**: Intelligent caching to avoid redundant API calls
- **Error Recovery**: Comprehensive error handling and fallback animation generation

### Educational Features
- **Learning Goals**: Automatically generated based on concept complexity
- **Key Learning Points**: Essential concepts demonstrated in animations
- **Tricky Questions**: Challenging assessment questions for each concept
- **Educational Value**: 1-10 rating system for content quality
- **Target Audience**: Customizable for different educational levels
- **Concept Mappings**: Pre-configured for 7+ common educational concepts

### Technical Features
- **Comprehensive Testing**: 95%+ test coverage with comprehensive test cases
- **JSON Schema Validation**: Strict data validation
- **Caching Mechanisms**: MD5-based content caching with 7-day expiry
- **Error Recovery**: Graceful handling of API failures
- **Rate Limiting**: API-friendly request patterns
- **Progress Tracking**: Real-time batch processing updates

## 📋 Requirements

- Python 3.7+
- Internet connection for API calls
- Optional: AI API keys for enhanced animation generation
- Optional: matplotlib for fallback animations

## 🔧 Command Line Arguments

| Argument | Type | Description |
|----------|------|-------------|
| `--concept` | str | Single educational concept (e.g., "Wave propagation") |
| `--concepts` | str | Comma-separated list of concepts |
| `--duration` | int | Animation duration in seconds (5-15, default: 8) |
| `--audience` | str | Target audience (elementary, middle_school, high_school, college, graduate) |
| `--animation_type` | str | Animation type (gif, mp4, default: gif) |
| `--batch` | flag | Process concepts in batch mode |
| `--no-cache` | flag | Disable caching |
| `--verbose` | flag | Enable verbose logging |

## 📁 Project Structure

```
educational-animation-generator/
├── educational_animation_generator.py    # Main script
├── requirements.txt                      # Python dependencies
├── schema.json                           # JSON schema definition
├── README.md                             # This documentation
├── env.example                           # Environment variables template
├── .gitignore                            # Git ignore rules
├── generate_sample.py                    # Sample output generator
├── demo.py                               # Interactive demo
├── run_tests.py                          # Test runner
├── tests/
│   └── test_animation_generator.py       # Test suite
├── output/
│   ├── animations/                       # Generated animations
│   └── metadata/                         # Generated JSON files
└── cache/                                # Cached API responses
```

## 🎓 Supported Educational Concepts

### Pre-configured Concepts
- **Wave Propagation**: Wave properties, interference, and energy transfer
- **Pendulum Motion**: Simple harmonic motion and energy conservation
- **Chemical Reactions**: Molecular bonding, activation energy, and catalysts
- **Sine Wave**: Mathematical properties and real-world applications
- **Planetary Orbits**: Gravitational forces and Kepler's laws
- **Molecular Bonding**: Chemical bonds and electron interactions
- **Geometric Transformations**: Translation, rotation, and scaling

### Custom Concepts
Any educational concept can be processed with automatic metadata generation.

## 🧪 Testing

### Run All Tests
```bash
python run_tests.py
```

### Run Specific Test Categories
```bash
# Test core functionality
python -m pytest tests/test_animation_generator.py::TestEducationalAnimationGenerator -v

# Test caching
python -m pytest tests/test_animation_generator.py::TestCaching -v

# Test error recovery
python -m pytest tests/test_animation_generator.py::TestErrorRecovery -v

# Test scalability
python -m pytest tests/test_animation_generator.py::TestScalability -v
```

### Test Coverage
```bash
python -m pytest tests/ --cov=educational_animation_generator --cov-report=html
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `HF_API_KEY` | Hugging Face API key for animation generation | No |
| `REPLICATE_API_KEY` | Replicate API key for animation generation | No |
| `STABILITY_API_KEY` | Stability AI API key for animation generation | No |

### Caching Configuration
- **Cache Directory**: `cache/`
- **Cache Expiry**: 7 days for animations
- **Cache Keys**: MD5-based content hashing

### API Rate Limiting
- **Hugging Face API**: Respectful usage patterns
- **Replicate API**: Rate limits vary by plan
- **Stability AI API**: Rate limits vary by plan

## 🛠️ Troubleshooting

### Common Issues

1. **No API Keys Configured**
   ```
   Warning: No API keys configured, using fallback animations
   ```
   **Solution**: The tool will generate fallback animations automatically using matplotlib.

2. **Animation Generation Failed**
   ```
   Warning: Animation generation failed, using fallback
   ```
   **Solution**: The tool will create text-based or matplotlib animations as fallback.

3. **API Rate Limiting**
   ```
   Warning: API rate limit exceeded
   ```
   **Solution**: Wait a few minutes and try again, or use caching.

### Debug Mode
```bash
python educational_animation_generator.py --concept "Wave propagation" --verbose
```

## 📈 Performance & Scalability

### Animation Generation
- **API Animations**: 30-300 seconds per animation (depending on API)
- **Fallback Animations**: 5-15 seconds per animation
- **Cached Animations**: Instant retrieval

### Batch Processing
- **Small Batches** (1-5 concepts): ~2-5 minutes total
- **Medium Batches** (5-20 concepts): ~5-15 minutes total
- **Large Batches** (20+ concepts): ~15-60 minutes total

### Memory Usage
- **Single Animation**: ~50MB during generation
- **Batch Processing**: ~100MB for 20 concepts
- **Caching**: ~10MB per cached animation

## 🔗 API Integration

### Animation Generation APIs
- **Hugging Face**: `https://api-inference.huggingface.co/models`
- **Replicate**: `https://api.replicate.com/v1`
- **Stability AI**: `https://api.stability.ai/v1`
- **License**: Varies by API provider

### Fallback Animation Generation
- **Matplotlib**: Mathematical and scientific animations
- **Text-based**: Educational content descriptions
- **License**: Open source

## 📝 JSON Schema

The output follows a strict JSON schema with validation:

```json
{
  "type": "object",
  "properties": {
    "id": {"type": "string", "format": "uuid"},
    "concept": {"type": "string"},
    "animation_path": {"type": "string"},
    "duration": {"type": "integer", "minimum": 5, "maximum": 15},
    "target_audience": {"type": "string", "enum": ["elementary", "middle_school", "high_school", "college", "graduate"]},
    "animation_type": {"type": "string", "enum": ["gif", "mp4"]},
    "model_used": {"type": "string"},
    "created_at": {"type": "string", "format": "date-time"},
    "file_size": {"type": "integer", "minimum": 0},
    "resolution": {"type": "string", "enum": ["480p", "720p", "1080p"]},
    "quality": {"type": "string", "enum": ["low", "medium", "high", "ultra"]},
    "learning_goals": {"type": "array", "items": {"type": "string"}},
    "key_learning_points": {"type": "array", "items": {"type": "string"}},
    "tricky_questions": {"type": "array", "items": {"type": "string"}},
    "educational_value": {"type": "integer", "minimum": 1, "maximum": 10}
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Hugging Face](https://huggingface.co/) for AI animation models
- [Replicate](https://replicate.com/) for alternative animation APIs
- [Stability AI](https://stability.ai/) for video generation models
- [Matplotlib](https://matplotlib.org/) for fallback animations

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the test cases for usage examples
3. Enable verbose logging for detailed information
4. Check the log file: `educational_animations.log`

---

**Happy Learning! 🎬**
