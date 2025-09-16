# JavaScript Adaptive Learning Progress Tracker

A comprehensive adaptive learning system with spaced repetition, skill assessment, and personalized learning paths built with Node.js and modern web technologies.

image 

image.png

## 🚀 Features

### Core Learning System
- **Adaptive Learning Paths** - Personalized recommendations based on user progress
- **Spaced Repetition Algorithm** - Optimized review timing using SM-2 algorithm
- **Skill Tree Management** - Prerequisite-based skill progression
- **Multiple Assessment Types** - Multiple choice, code completion, drag-and-drop, coding challenges
- **Real-time Progress Tracking** - Comprehensive analytics and performance monitoring

### Advanced Features
- **Intelligent Caching** - Redis-like caching with TTL and performance metrics
- **Error Recovery** - Automatic retry with exponential backoff
- **Performance Monitoring** - Real-time performance tracking and optimization
- **Achievement System** - Badges, milestones, and progress rewards
- **Bulk Operations** - Efficient handling of multiple users and data
- **Export/Import** - Complete data portability
- **System Monitoring** - Health checks, cache stats, and performance metrics

### User Interface
- **Modern Web UI** - Responsive design with Tailwind CSS
- **Interactive Assessments** - Drag-and-drop, code completion, and more
- **Real-time Feedback** - Instant results and progress updates
- **Achievement Notifications** - Visual feedback for accomplishments
- **System Dashboard** - Performance and health monitoring

## 📋 Prerequisites

- Node.js 14.0.0 or higher
- npm 6.0.0 or higher
- Modern web browser with JavaScript enabled

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Q4
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Enhanced UI: http://localhost:3000/enhanced.html
   - API Health: http://localhost:3000/health
   - System Monitor: http://localhost:3000/api/system/health

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run performance tests
npm run test:performance

# Run in watch mode
npm run test:watch
```

## 📚 API Documentation

The API provides comprehensive endpoints for:

- **User Progress Management** - Track learning progress and achievements
- **Assessment System** - Start, submit, and evaluate assessments
- **Skill Management** - Manage skill trees and prerequisites
- **Analytics** - Detailed learning analytics and insights
- **System Monitoring** - Health checks and performance metrics
- **Bulk Operations** - Efficient multi-user operations
- **Data Export/Import** - Complete data portability

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed endpoint documentation.

## 🎯 Usage Examples

### Starting an Assessment

```javascript
// Start a new assessment
const response = await fetch('http://localhost:3000/api/assessment/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user1',
    skillId: 'javascript_fundamentals'
  })
});

const assessment = await response.json();
console.log('Assessment started:', assessment);
```

### Submitting Assessment Results

```javascript
// Submit assessment responses
const response = await fetch('http://localhost:3000/api/assessment/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user1',
    assessmentId: assessment.assessment_id,
    responses: {
      skill_id: 'javascript_fundamentals',
      responses: [{
        assessment: assessment.assessment,
        answer: 0, // Selected option
        timeSpent: 45 // Seconds
      }],
      totalTimeLimit: 60
    }
  })
});

const result = await response.json();
console.log('Assessment result:', result);
```

### Getting User Progress

```javascript
// Get user progress with caching
const response = await fetch('http://localhost:3000/api/progress/user1');
const progress = await response.json();
console.log('User progress:', progress);
```

### Bulk Operations

```javascript
// Get progress for multiple users
const response = await fetch('http://localhost:3000/api/bulk/progress', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userIds: ['user1', 'user2', 'user3']
  })
});

const results = await response.json();
console.log('Bulk results:', results);
```

## 🏗️ Architecture

### Backend Components

- **ProgressTracker** - Main learning progress management
- **SpacedRepetitionAlgorithm** - SM-2 algorithm implementation
- **SkillTreeManager** - Skill hierarchy and prerequisites
- **AssessmentEngine** - Assessment generation and evaluation
- **LearningAnalytics** - Analytics and performance tracking
- **CacheManager** - Intelligent caching system
- **ErrorRecoveryManager** - Automatic error recovery
- **PerformanceMonitor** - Real-time performance tracking
- **AchievementSystem** - Badges and milestone tracking

### Frontend Components

- **Dashboard** - Main learning interface
- **Assessment Interface** - Interactive assessment taking
- **System Monitor** - Performance and health monitoring
- **Achievement Display** - Progress and badge visualization

### Data Flow

1. **User starts assessment** → ProgressTracker validates prerequisites
2. **Assessment generated** → AssessmentEngine creates appropriate questions
3. **User submits responses** → AssessmentEngine evaluates answers
4. **Progress updated** → SpacedRepetitionAlgorithm calculates next review
5. **Analytics recorded** → LearningAnalytics tracks performance
6. **Achievements checked** → AchievementSystem awards badges
7. **Cache updated** → CacheManager stores results

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
CACHE_TTL=86400000
MAX_RETRIES=3
PERFORMANCE_MONITORING=true
```

### Skill Configuration

Skills are defined in JSON files in the `skills/` directory. Each skill includes:

```json
{
  "skill_id": "javascript_fundamentals",
  "title": "JavaScript Fundamentals",
  "description": "Core JavaScript concepts",
  "prerequisites": [],
  "difficulty_level": 1,
  "mastery_threshold": 0.85,
  "review_intervals": [1, 3, 7, 14, 30],
  "category": "programming",
  "estimated_time_minutes": 30,
  "assessments": [
    {
      "type": "multiple_choice",
      "questions": [/* question objects */]
    }
  ]
}
```

## 📊 Performance Metrics

The system tracks comprehensive performance metrics:

- **Response Times** - Average, min, max for all operations
- **Cache Performance** - Hit rates, miss rates, size
- **Error Rates** - Failed operations and retry attempts
- **Memory Usage** - Heap usage and garbage collection
- **Concurrent Users** - Load handling capabilities

## 🚀 Scalability Considerations

### Horizontal Scaling
- Stateless design allows multiple instances
- Shared cache (Redis recommended for production)
- Load balancer support
- Database clustering

### Performance Optimizations
- Intelligent caching with TTL
- Bulk operations for efficiency
- Lazy loading of skill trees
- Connection pooling
- Memory management

### Monitoring
- Real-time performance metrics
- Health check endpoints
- Error tracking and recovery
- Resource usage monitoring

## 🔒 Security Features

- Input validation on all endpoints
- SQL injection prevention
- XSS protection
- Rate limiting (configurable)
- Error message sanitization
- Secure data export/import

## 🧪 Testing Strategy

### Unit Tests
- Individual component testing
- Mock dependencies
- Edge case coverage
- Error condition testing

### Integration Tests
- API endpoint testing
- Database integration
- Cache functionality
- End-to-end workflows

### Performance Tests
- Load testing
- Stress testing
- Memory leak detection
- Concurrent user simulation

### Test Coverage
- Aim for 90%+ code coverage
- Critical path testing
- Performance regression testing
- Security vulnerability testing

## 📈 Monitoring and Observability

### Health Checks
- `/health` - Basic health status
- `/api/system/health` - Comprehensive system health
- `/api/system/performance` - Performance metrics
- `/api/system/cache/stats` - Cache statistics

### Logging
- Structured logging with timestamps
- Error tracking and alerting
- Performance monitoring
- User activity tracking

### Metrics
- Response time percentiles
- Error rates by endpoint
- Cache hit/miss ratios
- Memory and CPU usage
- Active user counts

## 🔄 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Recommended)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Spaced repetition algorithm based on SM-2
- Modern web technologies and best practices
- Open source community contributions
- Educational technology research

## 📞 Support

For questions, issues, or contributions:
- Create an issue in the repository
- Check the API documentation
- Review the test suite for examples
- Contact the development team

---

**Built with ❤️ for adaptive learning and educational technology**