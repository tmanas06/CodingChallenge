# 🚀 Setup Guide - Shape Analogy Generator

This guide will walk you through setting up the Shape Analogy Generator with all necessary API keys and configurations.

## 📋 Prerequisites

- Python 3.7 or higher
- Internet connection
- Hugging Face account (free)

## 🔑 Step 1: Get Your Hugging Face API Token

### Option A: Quick Setup (Recommended)
1. **Visit**: [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. **Sign up/Login**: Create a free account if you don't have one
3. **Create Token**: Click "New token"
4. **Configure**:
   - Name: `Shape Analogy Generator`
   - Type: `Read` (sufficient for inference)
5. **Copy Token**: Save the generated token securely

### Option B: Detailed Steps
1. Go to [https://huggingface.co/](https://huggingface.co/)
2. Click "Sign Up" or "Login" in the top right
3. Complete account creation (email verification required)
4. Click on your profile picture (top right)
5. Select "Settings" from dropdown
6. Click "Access Tokens" in left sidebar
7. Click "New token" button
8. Fill in:
   - **Token name**: `Shape Analogy Generator`
   - **Type**: `Read` (for inference only)
9. Click "Generate a token"
10. **Important**: Copy the token immediately (you won't see it again)

## ⚙️ Step 2: Configure Environment Variables

### Method 1: Using .env file (Recommended)

1. **Copy the example file**:
   ```bash
   # Windows
   copy env.example .env
   
   # Linux/macOS
   cp env.example .env
   ```

2. **Edit .env file**:
   - Open `.env` in any text editor
   - Replace `your_hugging_face_token_here` with your actual token
   - Save the file

3. **Example .env content**:
   ```env
   HF_API_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Method 2: Using Environment Variables

#### Windows (PowerShell)
```powershell
$env:HF_API_TOKEN="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

#### Windows (Command Prompt)
```cmd
set HF_API_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Linux/macOS
```bash
export HF_API_TOKEN="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

## 🐍 Step 3: Install Dependencies

### Automatic Setup (Recommended)
```bash
python setup.py
```

### Manual Setup
```bash
# Install requirements
pip install -r requirements.txt

# Create directories
mkdir output output/images cache tests
```

## ✅ Step 4: Verify Installation

### Test the Setup
```bash
# Run the demo
python demo.py

# Test the generator (with mock token)
python shape_analogy_generator.py --help
```

### Run Tests
```bash
# Run all tests
python run_tests.py

# Run specific tests
python -m pytest tests/ -v
```

## 🎯 Step 5: Generate Your First Analogy

```bash
# Generate 1 beginner analogy
python shape_analogy_generator.py

# Generate 5 intermediate analogies
python shape_analogy_generator.py --n 5 --complexity intermediate

# Generate with verbose output
python shape_analogy_generator.py --n 3 --complexity advanced --verbose
```

## 🔧 Advanced Configuration

### Custom Settings in .env
You can customize the generator by editing your `.env` file:

```env
# Basic settings
HF_API_TOKEN=your_token_here
DEFAULT_ANALOGIES=5
DEFAULT_COMPLEXITY=intermediate

# Logging
LOG_LEVEL=DEBUG
VERBOSE_OUTPUT=true

# API settings
API_TIMEOUT=120
API_RETRIES=5

# Caching
ENABLE_CACHING=true
MAX_CACHED_IMAGES=500
```

### Configuration File
Edit `config.py` for more advanced customization:

```python
# Change default model
HF_MODEL = "stabilityai/stable-diffusion-xl-base-1.0"

# Modify time estimates
TIME_ESTIMATES = {
    "beginner": 1,
    "intermediate": 3,
    "advanced": 5
}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. "Missing HF_API_TOKEN" Error
```bash
Error: Missing HF_API_TOKEN environment variable
```
**Solution**: Make sure you've set the environment variable correctly:
- Check your `.env` file exists and has the correct token
- Verify the token format: `hf_` followed by 37 characters
- Restart your terminal/command prompt

#### 2. "API request failed" Error
```bash
Warning: API request failed: 401 Unauthorized
```
**Solution**: 
- Verify your API token is correct
- Check if the token has expired
- Ensure you have the right permissions (Read access)

#### 3. "Permission denied" Error
```bash
Error: Permission denied when creating output directory
```
**Solution**:
- Run as administrator (Windows) or with sudo (Linux/macOS)
- Check folder permissions
- Try running from a different directory

#### 4. "Module not found" Error
```bash
ModuleNotFoundError: No module named 'requests'
```
**Solution**:
```bash
pip install -r requirements.txt
```

### Debug Mode
Enable detailed logging to diagnose issues:

```bash
# Set debug logging
export LOG_LEVEL=DEBUG  # Linux/macOS
set LOG_LEVEL=DEBUG     # Windows

# Run with verbose output
python shape_analogy_generator.py --verbose
```

## 📊 API Usage and Limits

### Hugging Face API
- **Free Tier**: 1,000 requests per month
- **Rate Limit**: ~10 requests per minute
- **Model**: `stabilityai/stable-diffusion-2-1`
- **Cost**: Free for basic usage

### Monitoring Usage
Check your API usage at: [https://huggingface.co/settings/billing](https://huggingface.co/settings/billing)

## 🔒 Security Best Practices

1. **Never commit .env files** to version control
2. **Use environment variables** in production
3. **Rotate tokens regularly** (every 90 days)
4. **Monitor usage** to detect unauthorized access
5. **Use least privilege** (Read-only tokens)

## 📞 Getting Help

### Documentation
- **README.md**: Complete project documentation
- **PROJECT_SUMMARY.md**: Technical overview
- **Demo**: Run `python demo.py` for examples

### Support
1. Check the troubleshooting section above
2. Review the log file: `shape_analogy.log`
3. Run the test suite: `python run_tests.py`
4. Check your API token validity

### Useful Links
- [Hugging Face API Documentation](https://huggingface.co/docs/api-inference)
- [Stable Diffusion Model](https://huggingface.co/stabilityai/stable-diffusion-2-1)
- [Python Environment Variables](https://docs.python.org/3/library/os.html#os.environ)

---

## 🎉 You're Ready!

Once you've completed these steps, you can start generating shape analogies:

```bash
python shape_analogy_generator.py --n 1 --complexity beginner
```

Happy learning! 🎓
