# Adaptive Learning Tracker API Documentation

## Overview

The Adaptive Learning Tracker is a comprehensive JavaScript application that implements an adaptive learning system with spaced repetition, skill assessment, and personalized learning paths. This document provides detailed API documentation for all endpoints and features.

## Base URL

```
http://localhost:3000
```

## Authentication

Currently, the system uses simple user IDs for identification. In a production environment, you would implement proper authentication.

## API Endpoints

### Health Check

#### GET /health
Returns the basic health status of the application.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### User Progress

#### GET /api/progress/:userId
Retrieves user progress data with caching and performance metadata.

**Parameters:**
- `userId` (string): Unique identifier for the user

**Response:**
```json
{
  "user_id": "user1",
  "completed_skills": ["javascript_fundamentals"],
  "skills": {
    "javascript_fundamentals": {
      "mastery_level": 0.85,
      "attempts": 3,
      "last_review": "2024-01-01T00:00:00.000Z",
      "interval": 7,
      "ease_factor": 2.5,
      "total_time_spent": 1800
    }
  },
  "total_time_spent": 1800,
  "created_at": "2024-01-01T00:00:00.000Z",
  "last_updated": "2024-01-01T00:00:00.000Z",
  "_metadata": {
    "cached": true,
    "responseTime": 15.5
  }
}
```

#### GET /api/learning-path/:userId
Gets personalized learning path recommendations.

**Parameters:**
- `userId` (string): Unique identifier for the user

**Response:**
```json
{
  "user_id": "user1",
  "recommended_skills": [
    {
      "skill_id": "javascript_variables",
      "title": "JavaScript Variables",
      "description": "Understanding variable declaration and scope",
      "difficulty_level": 2,
      "priority": 0.95
    }
  ],
  "completed_skills": ["javascript_fundamentals"],
  "total_skills": 6,
  "completion_rate": 0.17,
  "analytics": {
    "javascript_fundamentals": {
      "total_attempts": 3,
      "correct_attempts": 2,
      "time_spent": 1800,
      "mastery_level": 0.67
    }
  }
}
```

### Assessment Management

#### POST /api/assessment/start
Starts a new assessment for a specific skill.

**Request Body:**
```json
{
  "userId": "user1",
  "skillId": "javascript_fundamentals"
}
```

**Response:**
```json
{
  "assessment_id": "uuid-here",
  "skill_id": "javascript_fundamentals",
  "assessment": {
    "type": "multiple_choice",
    "question": "What is the correct way to declare a variable?",
    "options": ["var name = 'John';", "variable name = 'John';"],
    "correct_answer": 0,
    "time_limit": 60,
    "difficulty": 1
  },
  "started_at": "2024-01-01T00:00:00.000Z"
}
```

#### POST /api/assessment/submit
Submits assessment responses and updates user progress.

**Request Body:**
```json
{
  "userId": "user1",
  "assessmentId": "uuid-here",
  "responses": {
    "skill_id": "javascript_fundamentals",
    "responses": [
      {
        "assessment": { /* assessment object */ },
        "answer": 0,
        "timeSpent": 45
      }
    ],
    "totalTimeLimit": 60
  }
}
```

**Response:**
```json
{
  "assessment_id": "uuid-here",
  "skill_id": "javascript_fundamentals",
  "results": [
    {
      "score": 100,
      "correct": true,
      "feedback": "Correct!",
      "timeSpent": 45,
      "performance": 5
    }
  ],
  "average_score": 100,
  "performance": 5,
  "mastery_level": 0.85,
  "next_review": "2024-01-08T00:00:00.000Z",
  "is_mastered": true,
  "feedback": "Excellent work! You're mastering this skill."
}
```

### Skills Management

#### GET /api/skills
Retrieves all available skills in the system.

**Response:**
```json
[
  {
    "skill_id": "javascript_fundamentals",
    "title": "JavaScript Fundamentals",
    "description": "Core JavaScript concepts",
    "prerequisites": [],
    "difficulty_level": 1,
    "mastery_threshold": 0.85,
    "category": "programming",
    "estimated_time_minutes": 30
  }
]
```

#### GET /api/skills/available/:userId
Gets skills available for a specific user based on prerequisites.

**Parameters:**
- `userId` (string): Unique identifier for the user

**Response:**
```json
[
  {
    "skill_id": "javascript_variables",
    "title": "JavaScript Variables",
    "description": "Understanding variable declaration and scope",
    "prerequisites": ["javascript_fundamentals"],
    "difficulty_level": 2,
    "mastery_threshold": 0.85
  }
]
```

### Analytics

#### GET /api/analytics/:userId/:skillId
Gets detailed analytics for a specific skill.

**Parameters:**
- `userId` (string): Unique identifier for the user
- `skillId` (string): Unique identifier for the skill

**Response:**
```json
{
  "skill_id": "javascript_fundamentals",
  "mastery_level": 0.85,
  "attempts": 3,
  "last_review": "2024-01-01T00:00:00.000Z",
  "next_review": "2024-01-08T00:00:00.000Z",
  "analytics": {
    "total_attempts": 3,
    "correct_attempts": 2,
    "time_spent": 1800,
    "mastery_level": 0.67,
    "error_patterns": [
      {
        "timestamp": "2024-01-01T00:00:00.000Z",
        "error_type": "syntax_error",
        "question_type": "code_completion"
      }
    ]
  }
}
```

### System Monitoring

#### GET /api/system/health
Comprehensive system health check with performance metrics.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "rss": 50000000,
    "heapTotal": 20000000,
    "heapUsed": 15000000,
    "external": 1000000
  },
  "cache": {
    "hits": 150,
    "misses": 25,
    "hitRate": "85.71%",
    "size": 50
  },
  "performance": {
    "get_user_progress": {
      "avg": 15.5,
      "min": 5.2,
      "max": 45.8,
      "count": 100
    }
  },
  "retries": {
    "activeRetries": 0,
    "retries": []
  }
}
```

#### GET /api/system/cache/stats
Gets detailed cache statistics.

**Response:**
```json
{
  "hits": 150,
  "misses": 25,
  "sets": 100,
  "deletes": 10,
  "hitRate": "85.71%",
  "size": 50
}
```

#### POST /api/system/cache/clear
Clears cache entries, optionally by pattern.

**Request Body (optional):**
```json
{
  "pattern": "progress_*"
}
```

**Response:**
```json
{
  "message": "Cleared 25 cache entries matching pattern: progress_*"
}
```

#### GET /api/system/performance
Gets performance metrics for all operations.

**Response:**
```json
{
  "get_user_progress": {
    "avg": 15.5,
    "min": 5.2,
    "max": 45.8,
    "count": 100
  },
  "get_learning_path": {
    "avg": 25.3,
    "min": 10.1,
    "max": 60.2,
    "count": 50
  }
}
```

### Bulk Operations

#### POST /api/bulk/progress
Retrieves progress for multiple users efficiently.

**Request Body:**
```json
{
  "userIds": ["user1", "user2", "user3"]
}
```

**Response:**
```json
{
  "successful": 3,
  "failed": 0,
  "results": [
    { /* user1 progress */ },
    { /* user2 progress */ },
    { /* user3 progress */ }
  ],
  "errors": []
}
```

### Data Export/Import

#### GET /api/export/user/:userId
Exports all user data including progress and analytics.

**Parameters:**
- `userId` (string): Unique identifier for the user

**Response:**
```json
{
  "user_id": "user1",
  "progress": { /* user progress object */ },
  "analytics": { /* user analytics object */ },
  "exported_at": "2024-01-01T00:00:00.000Z",
  "version": "1.0"
}
```

#### POST /api/import/user/:userId
Imports user data from an export.

**Request Body:**
```json
{
  "progress": { /* user progress object */ },
  "analytics": { /* user analytics object */ }
}
```

**Response:**
```json
{
  "message": "Data imported successfully"
}
```

## Error Handling

All API endpoints return appropriate HTTP status codes and error messages:

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

Error responses follow this format:
```json
{
  "error": "Error message describing what went wrong",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "uuid-here"
}
```

## Rate Limiting

Currently, there are no rate limits implemented. In production, you would want to add rate limiting to prevent abuse.

## Caching

The system implements intelligent caching with the following TTLs:
- User progress: 5 minutes
- Learning paths: 10 minutes
- Skills data: 24 hours

## Performance Considerations

- All endpoints include performance metadata in responses
- Bulk operations are available for efficient data retrieval
- Caching reduces database load
- Error recovery with exponential backoff
- Performance monitoring tracks operation times

## Assessment Types

The system supports multiple assessment types:

1. **Multiple Choice** - Traditional question/answer format
2. **Code Completion** - Fill in the blanks in code
3. **Drag and Drop** - Interactive element arrangement
4. **Coding Challenge** - Complete programming problems

## Spaced Repetition Algorithm

The system uses a modified SM-2 algorithm for spaced repetition:
- Performance ratings: 0-5 scale
- Ease factors: 1.3 - 3.0 range
- Review intervals: 1, 3, 7, 14, 30+ days
- Adaptive based on user performance

## Learning Analytics

The system tracks:
- Completion rates
- Time spent per skill
- Error patterns
- Mastery levels
- Learning streaks
- Assessment performance

## Scalability Features

- Horizontal scaling support
- Efficient caching mechanisms
- Bulk operations
- Performance monitoring
- Error recovery
- Memory management

## Security Considerations

- Input validation on all endpoints
- SQL injection prevention
- XSS protection
- Rate limiting (recommended for production)
- Authentication/authorization (to be implemented)

## Future Enhancements

- Real-time notifications
- Social learning features
- Advanced analytics dashboard
- Mobile app support
- Offline capability
- Multi-language support
