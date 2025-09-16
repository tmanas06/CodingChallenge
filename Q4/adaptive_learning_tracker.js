#!/usr/bin/env node
/**
 * JavaScript Adaptive Learning Progress Tracker - Q4
 * Implements adaptive learning system with spaced repetition and skill assessment
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { performance } = require('perf_hooks');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Cache configuration
const CACHE_DIR = './data/cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Ensure cache directory exists
const ensureCacheDir = async () => {
    try {
        await fs.mkdir(CACHE_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating cache directory:', error);
    }
};

// Spaced Repetition Algorithm
class SpacedRepetitionAlgorithm {
    constructor() {
        this.intervals = [1, 3, 7, 14, 30, 90]; // days
        this.easeFactor = 2.5;
        this.minEaseFactor = 1.3;
    }

    calculateNextReview(performance, currentInterval, easeFactor = 2.5) {
        let newInterval;
        let newEaseFactor = easeFactor;

        // Performance rating: 0-5 (0 = complete failure, 5 = perfect recall)
        if (performance >= 4) {
            // Correct response
            if (currentInterval === 0) {
                newInterval = 1;
            } else if (currentInterval === 1) {
                newInterval = 6;
            } else {
                newInterval = Math.round(currentInterval * easeFactor);
            }
            newEaseFactor = Math.max(this.minEaseFactor, easeFactor + 0.1);
        } else if (performance >= 2) {
            // Correct but with difficulty
            newInterval = Math.max(1, Math.round(currentInterval * 0.8));
            newEaseFactor = Math.max(this.minEaseFactor, easeFactor - 0.2);
        } else {
            // Incorrect response
            newInterval = 1;
            newEaseFactor = Math.max(this.minEaseFactor, easeFactor - 0.3);
        }

        return {
            nextReview: new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000),
            interval: newInterval,
            easeFactor: newEaseFactor
        };
    }

    getReviewPriority(lastReview, interval, masteryLevel) {
        const daysSinceReview = (Date.now() - new Date(lastReview).getTime()) / (24 * 60 * 60 * 1000);
        const urgency = daysSinceReview / interval;
        const masteryWeight = 1 - masteryLevel; // Lower mastery = higher priority
        return urgency * masteryWeight;
    }
}

// Skill Tree Manager
class SkillTreeManager {
    constructor() {
        this.skillTrees = new Map();
        this.prerequisites = new Map();
        this.loadSkillTrees();
    }

    async loadSkillTrees() {
        try {
            const skillsDir = './skills';
            const files = await fs.readdir(skillsDir);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const skillData = JSON.parse(await fs.readFile(path.join(skillsDir, file), 'utf8'));
                    this.skillTrees.set(skillData.skill_id, skillData);
                    
                    // Build prerequisite map
                    if (skillData.prerequisites) {
                        this.prerequisites.set(skillData.skill_id, skillData.prerequisites);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading skill trees:', error);
        }
    }

    getSkill(skillId) {
        return this.skillTrees.get(skillId);
    }

    getAvailableSkills(userProgress) {
        const available = [];
        const completed = new Set(userProgress.completed_skills || []);
        
        for (const [skillId, skill] of this.skillTrees) {
            const prerequisites = this.prerequisites.get(skillId) || [];
            const allPrerequisitesMet = prerequisites.every(prereq => completed.has(prereq));
            
            if (allPrerequisitesMet && !completed.has(skillId)) {
                available.push(skill);
            }
        }
        
        return available;
    }

    getRecommendedSkills(userProgress, limit = 5) {
        const available = this.getAvailableSkills(userProgress);
        const spacedRepetition = new SpacedRepetitionAlgorithm();
        
        // Sort by review priority
        return available
            .map(skill => {
                const progress = userProgress.skills?.[skill.skill_id] || {};
                const priority = spacedRepetition.getReviewPriority(
                    progress.last_review || new Date(0),
                    progress.interval || 1,
                    progress.mastery_level || 0
                );
                return { ...skill, priority };
            })
            .sort((a, b) => b.priority - a.priority)
            .slice(0, limit);
    }
}

// Learning Analytics Tracker
class LearningAnalytics {
    constructor() {
        this.analytics = new Map();
    }

    recordAttempt(skillId, userId, attempt) {
        const key = `${userId}_${skillId}`;
        if (!this.analytics.has(key)) {
            this.analytics.set(key, {
                total_attempts: 0,
                correct_attempts: 0,
                time_spent: 0,
                error_patterns: [],
                mastery_level: 0,
                last_updated: new Date()
            });
        }

        const data = this.analytics.get(key);
        data.total_attempts++;
        data.time_spent += attempt.timeSpent || 0;
        data.last_updated = new Date();

        if (attempt.correct) {
            data.correct_attempts++;
        } else {
            data.error_patterns.push({
                timestamp: new Date(),
                error_type: attempt.errorType || 'unknown',
                question_type: attempt.questionType || 'unknown'
            });
        }

        // Calculate mastery level
        data.mastery_level = data.correct_attempts / data.total_attempts;
        
        this.analytics.set(key, data);
        return data;
    }

    getAnalytics(userId, skillId = null) {
        if (skillId) {
            return this.analytics.get(`${userId}_${skillId}`);
        }

        const userAnalytics = {};
        for (const [key, data] of this.analytics) {
            if (key.startsWith(`${userId}_`)) {
                const skillId = key.split('_')[1];
                userAnalytics[skillId] = data;
            }
        }
        return userAnalytics;
    }

    getCompletionRate(userId) {
        const userAnalytics = this.getAnalytics(userId);
        const totalSkills = userAnalytics.length;
        const completedSkills = Object.values(userAnalytics).filter(data => data.mastery_level >= 0.85).length;
        return totalSkills > 0 ? completedSkills / totalSkills : 0;
    }
}

// Assessment Engine
class AssessmentEngine {
    constructor() {
        this.questionTypes = {
            multiple_choice: this.generateMultipleChoice,
            code_completion: this.generateCodeCompletion,
            drag_drop: this.generateDragDrop,
            coding_challenge: this.generateCodingChallenge
        };
    }

    generateAssessment(skill, difficultyLevel = 1) {
        const assessments = skill.assessments || [];
        const selectedAssessment = assessments[Math.floor(Math.random() * assessments.length)];
        
        if (!selectedAssessment) {
            return this.generateDefaultAssessment(skill, difficultyLevel);
        }

        const generator = this.questionTypes[selectedAssessment.type];
        if (generator) {
            return generator(selectedAssessment, difficultyLevel);
        }

        return this.generateDefaultAssessment(skill, difficultyLevel);
    }

    generateMultipleChoice(assessment, difficultyLevel) {
        const questions = assessment.questions || [];
        const selectedQuestion = questions[Math.floor(Math.random() * questions.length)];
        
        return {
            type: 'multiple_choice',
            question: selectedQuestion.question,
            options: selectedQuestion.options,
            correct_answer: selectedQuestion.correct_answer,
            explanation: selectedQuestion.explanation,
            difficulty: difficultyLevel,
            time_limit: 60 + (difficultyLevel * 30)
        };
    }

    generateCodeCompletion(assessment, difficultyLevel) {
        return {
            type: 'code_completion',
            template: assessment.template,
            hints: assessment.hints || [],
            correct_solution: assessment.correct_solution,
            test_cases: assessment.test_cases || [],
            difficulty: difficultyLevel,
            time_limit: 120 + (difficultyLevel * 60)
        };
    }

    generateDragDrop(assessment, difficultyLevel) {
        return {
            type: 'drag_drop',
            instructions: assessment.instructions,
            items: assessment.items,
            target_areas: assessment.target_areas,
            correct_mapping: assessment.correct_mapping,
            difficulty: difficultyLevel,
            time_limit: 90 + (difficultyLevel * 30)
        };
    }

    generateCodingChallenge(assessment, difficultyLevel) {
        return {
            type: 'coding_challenge',
            problem_statement: assessment.problem_statement,
            constraints: assessment.constraints || [],
            examples: assessment.examples || [],
            test_cases: assessment.test_cases || [],
            difficulty: difficultyLevel,
            time_limit: 300 + (difficultyLevel * 120)
        };
    }

    generateDefaultAssessment(skill, difficultyLevel) {
        return {
            type: 'multiple_choice',
            question: `What is the main concept of ${skill.title}?`,
            options: [
                'A fundamental programming concept',
                'An advanced data structure',
                'A debugging technique',
                'A performance optimization method'
            ],
            correct_answer: 0,
            explanation: `This question tests understanding of ${skill.title}`,
            difficulty: difficultyLevel,
            time_limit: 60
        };
    }

    evaluateResponse(assessment, response, timeSpent) {
        let score = 0;
        let correct = false;
        let feedback = '';

        switch (assessment.type) {
            case 'multiple_choice':
                correct = response === assessment.correct_answer;
                score = correct ? 100 : 0;
                feedback = correct ? 'Correct!' : `Incorrect. The correct answer is ${assessment.correct_answer}`;
                break;

            case 'code_completion':
                correct = response === assessment.correct_solution;
                score = correct ? 100 : 0;
                feedback = correct ? 'Code completed correctly!' : 'Try again. Check your syntax and logic.';
                break;

            case 'drag_drop':
                correct = JSON.stringify(response) === JSON.stringify(assessment.correct_mapping);
                score = correct ? 100 : 0;
                feedback = correct ? 'Items placed correctly!' : 'Check the correct placement of items.';
                break;

            case 'coding_challenge':
                // This would typically involve running test cases
                correct = this.runTestCases(assessment.test_cases, response);
                score = correct ? 100 : 0;
                feedback = correct ? 'All test cases passed!' : 'Some test cases failed. Review your solution.';
                break;

            default:
                score = 0;
                feedback = 'Unknown assessment type';
        }

        // Adjust score based on time spent
        const timeBonus = Math.max(0, (assessment.time_limit - timeSpent) / assessment.time_limit * 20);
        score = Math.min(100, score + timeBonus);

        return {
            score,
            correct,
            feedback,
            timeSpent,
            performance: this.calculatePerformance(score, timeSpent, assessment.time_limit)
        };
    }

    runTestCases(testCases, code) {
        // Simplified test case runner
        // In a real implementation, this would use a sandboxed environment
        try {
            // This is a placeholder - real implementation would be more complex
            return testCases.every(testCase => {
                // Evaluate code against test case
                return true; // Placeholder
            });
        } catch (error) {
            return false;
        }
    }

    calculatePerformance(score, timeSpent, timeLimit) {
        const timeRatio = timeSpent / timeLimit;
        const timePenalty = timeRatio > 1 ? (timeRatio - 1) * 20 : 0;
        const adjustedScore = Math.max(0, score - timePenalty);
        
        if (adjustedScore >= 90) return 5; // Excellent
        if (adjustedScore >= 80) return 4; // Good
        if (adjustedScore >= 70) return 3; // Fair
        if (adjustedScore >= 60) return 2; // Poor
        return 1; // Very Poor
    }
}

// Progress Tracker
class ProgressTracker {
    constructor() {
        this.userProgress = new Map();
        this.spacedRepetition = new SpacedRepetitionAlgorithm();
        this.analytics = new LearningAnalytics();
        this.assessmentEngine = new AssessmentEngine();
        this.skillTreeManager = new SkillTreeManager();
    }

    async getUserProgress(userId) {
        if (this.userProgress.has(userId)) {
            return this.userProgress.get(userId);
        }

        try {
            const progressData = await fs.readFile(`./data/users/${userId}.json`, 'utf8');
            const progress = JSON.parse(progressData);
            this.userProgress.set(userId, progress);
            return progress;
        } catch (error) {
            // Create new user progress
            const newProgress = {
                user_id: userId,
                completed_skills: [],
                skills: {},
                current_learning_path: [],
                total_time_spent: 0,
                created_at: new Date().toISOString(),
                last_updated: new Date().toISOString()
            };
            this.userProgress.set(userId, newProgress);
            return newProgress;
        }
    }

    async saveUserProgress(userId, progress) {
        try {
            await fs.mkdir('./data/users', { recursive: true });
            await fs.writeFile(`./data/users/${userId}.json`, JSON.stringify(progress, null, 2));
            this.userProgress.set(userId, progress);
        } catch (error) {
            console.error('Error saving user progress:', error);
            throw error;
        }
    }

    async startAssessment(userId, skillId) {
        const progress = await this.getUserProgress(userId);
        const skill = this.skillTreeManager.getSkill(skillId);
        
        if (!skill) {
            throw new Error('Skill not found');
        }

        // Check prerequisites
        const prerequisites = this.skillTreeManager.prerequisites.get(skillId) || [];
        const completedSkills = new Set(progress.completed_skills || []);
        const unmetPrerequisites = prerequisites.filter(prereq => !completedSkills.has(prereq));
        
        if (unmetPrerequisites.length > 0) {
            throw new Error(`Prerequisites not met: ${unmetPrerequisites.join(', ')}`);
        }

        // Generate assessment based on current mastery level
        const skillProgress = progress.skills?.[skillId] || {};
        const difficultyLevel = Math.min(5, Math.max(1, Math.ceil(skillProgress.mastery_level * 5) || 1));
        
        const assessment = this.assessmentEngine.generateAssessment(skill, difficultyLevel);
        
        return {
            assessment_id: crypto.randomUUID(),
            skill_id: skillId,
            assessment,
            started_at: new Date().toISOString()
        };
    }

    async submitAssessment(userId, assessmentId, responses) {
        const progress = await this.getUserProgress(userId);
        const skillId = responses.skill_id;
        const skill = this.skillTreeManager.getSkill(skillId);
        
        if (!skill) {
            throw new Error('Skill not found');
        }

        // Evaluate responses
        const results = [];
        let totalScore = 0;
        let totalTime = 0;

        for (const response of responses.responses) {
            const assessment = response.assessment;
            const evaluation = this.assessmentEngine.evaluateResponse(
                assessment,
                response.answer,
                response.timeSpent
            );
            
            results.push(evaluation);
            totalScore += evaluation.score;
            totalTime += evaluation.timeSpent;
        }

        const averageScore = totalScore / results.length;
        const performance = this.assessmentEngine.calculatePerformance(
            averageScore,
            totalTime,
            responses.totalTimeLimit || totalTime
        );

        // Update skill progress
        const skillProgress = progress.skills?.[skillId] || {
            mastery_level: 0,
            attempts: 0,
            last_review: new Date().toISOString(),
            interval: 1,
            ease_factor: 2.5
        };

        skillProgress.attempts++;
        skillProgress.last_review = new Date().toISOString();
        
        // Calculate new mastery level
        const newMasteryLevel = (skillProgress.mastery_level * (skillProgress.attempts - 1) + averageScore / 100) / skillProgress.attempts;
        skillProgress.mastery_level = Math.min(1, newMasteryLevel);

        // Update spaced repetition
        const spacedRepetitionResult = this.spacedRepetition.calculateNextReview(
            performance,
            skillProgress.interval,
            skillProgress.ease_factor
        );
        
        skillProgress.interval = spacedRepetitionResult.interval;
        skillProgress.ease_factor = spacedRepetitionResult.easeFactor;

        // Check if skill is mastered
        if (skillProgress.mastery_level >= skill.mastery_threshold) {
            if (!progress.completed_skills.includes(skillId)) {
                progress.completed_skills.push(skillId);
            }
        }

        progress.skills[skillId] = skillProgress;
        progress.total_time_spent += totalTime;
        progress.last_updated = new Date().toISOString();

        // Record analytics
        this.analytics.recordAttempt(skillId, userId, {
            correct: performance >= 3,
            timeSpent: totalTime,
            errorType: performance < 3 ? 'low_performance' : null,
            questionType: 'mixed'
        });

        await this.saveUserProgress(userId, progress);

        return {
            assessment_id,
            skill_id: skillId,
            results,
            average_score: averageScore,
            performance,
            mastery_level: skillProgress.mastery_level,
            next_review: spacedRepetitionResult.nextReview,
            is_mastered: skillProgress.mastery_level >= skill.mastery_threshold,
            feedback: this.generateFeedback(results, skillProgress)
        };
    }

    generateFeedback(results, skillProgress) {
        const correctCount = results.filter(r => r.correct).length;
        const totalCount = results.length;
        const accuracy = correctCount / totalCount;

        if (accuracy >= 0.9) {
            return "Excellent work! You're mastering this skill.";
        } else if (accuracy >= 0.7) {
            return "Good progress! Keep practicing to improve further.";
        } else if (accuracy >= 0.5) {
            return "You're making progress. Consider reviewing the fundamentals.";
        } else {
            return "Don't give up! Review the material and try again.";
        }
    }

    async getLearningPath(userId) {
        const progress = await this.getUserProgress(userId);
        const recommendedSkills = this.skillTreeManager.getRecommendedSkills(progress, 10);
        
        return {
            user_id: userId,
            recommended_skills: recommendedSkills,
            completed_skills: progress.completed_skills,
            total_skills: this.skillTreeManager.skillTrees.size,
            completion_rate: this.analytics.getCompletionRate(userId),
            analytics: this.analytics.getAnalytics(userId)
        };
    }

    async getSkillAnalytics(userId, skillId) {
        const progress = await this.getUserProgress(userId);
        const skillProgress = progress.skills?.[skillId];
        const analytics = this.analytics.getAnalytics(userId, skillId);
        
        return {
            skill_id: skillId,
            mastery_level: skillProgress?.mastery_level || 0,
            attempts: skillProgress?.attempts || 0,
            last_review: skillProgress?.last_review,
            next_review: skillProgress?.last_review ? 
                new Date(new Date(skillProgress.last_review).getTime() + skillProgress.interval * 24 * 60 * 60 * 1000) : 
                new Date(),
            analytics: analytics || {}
        };
    }
}

// Enhanced Cache Manager with Redis-like functionality
class CacheManager {
    constructor() {
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };
    }

    async get(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
            this.stats.hits++;
            return cached.data;
        }
        this.stats.misses++;
        return null;
    }

    async set(key, data, ttl = CACHE_EXPIRY) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
        this.stats.sets++;
    }

    async delete(key) {
        const deleted = this.cache.delete(key);
        if (deleted) this.stats.deletes++;
        return deleted;
    }

    async clear() {
        this.cache.clear();
        this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
    }

    async clearExpired() {
        const now = Date.now();
        let cleared = 0;
        for (const [key, value] of this.cache) {
            if (now - value.timestamp >= value.ttl) {
                this.cache.delete(key);
                cleared++;
            }
        }
        return cleared;
    }

    getStats() {
        const total = this.stats.hits + this.stats.misses;
        return {
            ...this.stats,
            hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : '0%',
            size: this.cache.size
        };
    }

    async getKeys(pattern = null) {
        const keys = Array.from(this.cache.keys());
        if (pattern) {
            const regex = new RegExp(pattern);
            return keys.filter(key => regex.test(key));
        }
        return keys;
    }
}

// Error Recovery and Retry Manager
class ErrorRecoveryManager {
    constructor() {
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second base delay
    }

    async executeWithRetry(operation, context = '') {
        const key = `${context}_${Date.now()}`;
        let attempts = 0;
        
        while (attempts < this.maxRetries) {
            try {
                const result = await operation();
                this.retryAttempts.delete(key);
                return result;
            } catch (error) {
                attempts++;
                this.retryAttempts.set(key, { attempts, lastError: error, timestamp: Date.now() });
                
                if (attempts >= this.maxRetries) {
                    console.error(`Operation failed after ${attempts} attempts:`, error);
                    throw new Error(`Operation failed after ${attempts} attempts: ${error.message}`);
                }
                
                // Exponential backoff
                const delay = this.retryDelay * Math.pow(2, attempts - 1);
                console.warn(`Attempt ${attempts} failed, retrying in ${delay}ms...`);
                await this.sleep(delay);
            }
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getRetryStats() {
        return {
            activeRetries: this.retryAttempts.size,
            retries: Array.from(this.retryAttempts.values())
        };
    }

    clearOldRetries(maxAge = 300000) { // 5 minutes
        const now = Date.now();
        for (const [key, retry] of this.retryAttempts) {
            if (now - retry.timestamp > maxAge) {
                this.retryAttempts.delete(key);
            }
        }
    }
}

// Performance Monitoring
class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.startTimes = new Map();
    }

    startTimer(operation) {
        this.startTimes.set(operation, performance.now());
    }

    endTimer(operation) {
        const startTime = this.startTimes.get(operation);
        if (startTime) {
            const duration = performance.now() - startTime;
            this.recordMetric(operation, duration);
            this.startTimes.delete(operation);
            return duration;
        }
        return 0;
    }

    recordMetric(operation, value) {
        if (!this.metrics.has(operation)) {
            this.metrics.set(operation, []);
        }
        this.metrics.get(operation).push({
            value,
            timestamp: Date.now()
        });
        
        // Keep only last 100 measurements
        const metrics = this.metrics.get(operation);
        if (metrics.length > 100) {
            metrics.splice(0, metrics.length - 100);
        }
    }

    getStats(operation) {
        const metrics = this.metrics.get(operation) || [];
        if (metrics.length === 0) return null;
        
        const values = metrics.map(m => m.value);
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        return { avg, min, max, count: values.length };
    }

    getAllStats() {
        const stats = {};
        for (const [operation] of this.metrics) {
            stats[operation] = this.getStats(operation);
        }
        return stats;
    }
}

// Initialize services
const progressTracker = new ProgressTracker();
const cacheManager = new CacheManager();
const errorRecovery = new ErrorRecoveryManager();
const performanceMonitor = new PerformanceMonitor();

// API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Get user progress with caching and error recovery
app.get('/api/progress/:userId', async (req, res) => {
    const { userId } = req.params;
    const cacheKey = `progress_${userId}`;
    
    try {
        performanceMonitor.startTimer('get_user_progress');
        
        // Try cache first
        let progress = await cacheManager.get(cacheKey);
        if (!progress) {
            progress = await errorRecovery.executeWithRetry(
                () => progressTracker.getUserProgress(userId),
                `get_progress_${userId}`
            );
            await cacheManager.set(cacheKey, progress, 300000); // 5 minutes
        }
        
        const duration = performanceMonitor.endTimer('get_user_progress');
        res.json({ ...progress, _metadata: { cached: !!progress, responseTime: duration } });
    } catch (error) {
        console.error('Error getting user progress:', error);
        res.status(500).json({ 
            error: error.message,
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID()
        });
    }
});

// Get learning path with caching
app.get('/api/learning-path/:userId', async (req, res) => {
    const { userId } = req.params;
    const cacheKey = `learning_path_${userId}`;
    
    try {
        performanceMonitor.startTimer('get_learning_path');
        
        let learningPath = await cacheManager.get(cacheKey);
        if (!learningPath) {
            learningPath = await errorRecovery.executeWithRetry(
                () => progressTracker.getLearningPath(userId),
                `get_learning_path_${userId}`
            );
            await cacheManager.set(cacheKey, learningPath, 600000); // 10 minutes
        }
        
        const duration = performanceMonitor.endTimer('get_learning_path');
        res.json({ ...learningPath, _metadata: { cached: !!learningPath, responseTime: duration } });
    } catch (error) {
        console.error('Error getting learning path:', error);
        res.status(500).json({ 
            error: error.message,
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID()
        });
    }
});

// Start assessment
app.post('/api/assessment/start', async (req, res) => {
    try {
        const { userId, skillId } = req.body;
        const assessment = await progressTracker.startAssessment(userId, skillId);
        res.json(assessment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Submit assessment
app.post('/api/assessment/submit', async (req, res) => {
    try {
        const { userId, assessmentId, responses } = req.body;
        const result = await progressTracker.submitAssessment(userId, assessmentId, responses);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get skill analytics
app.get('/api/analytics/:userId/:skillId', async (req, res) => {
    try {
        const { userId, skillId } = req.params;
        const analytics = await progressTracker.getSkillAnalytics(userId, skillId);
        res.json(analytics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all skills
app.get('/api/skills', async (req, res) => {
    try {
        const skills = Array.from(progressTracker.skillTreeManager.skillTrees.values());
        res.json(skills);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get available skills for user
app.get('/api/skills/available/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const progress = await progressTracker.getUserProgress(userId);
        const availableSkills = progressTracker.skillTreeManager.getAvailableSkills(progress);
        res.json(availableSkills);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// System monitoring endpoints
app.get('/api/system/health', (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cache: cacheManager.getStats(),
        performance: performanceMonitor.getAllStats(),
        retries: errorRecovery.getRetryStats()
    };
    res.json(health);
});

app.get('/api/system/cache/stats', (req, res) => {
    res.json(cacheManager.getStats());
});

app.post('/api/system/cache/clear', async (req, res) => {
    try {
        const { pattern } = req.body;
        if (pattern) {
            const keys = await cacheManager.getKeys(pattern);
            for (const key of keys) {
                await cacheManager.delete(key);
            }
            res.json({ message: `Cleared ${keys.length} cache entries matching pattern: ${pattern}` });
        } else {
            await cacheManager.clear();
            res.json({ message: 'Cache cleared successfully' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/system/performance', (req, res) => {
    res.json(performanceMonitor.getAllStats());
});

app.get('/api/system/retries', (req, res) => {
    res.json(errorRecovery.getRetryStats());
});

// Bulk operations for scalability
app.post('/api/bulk/progress', async (req, res) => {
    try {
        const { userIds } = req.body;
        if (!Array.isArray(userIds) || userIds.length > 100) {
            return res.status(400).json({ error: 'Invalid userIds array or too many users (max 100)' });
        }
        
        const results = await Promise.allSettled(
            userIds.map(userId => progressTracker.getUserProgress(userId))
        );
        
        const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
        const failed = results.filter(r => r.status === 'rejected').map(r => r.reason);
        
        res.json({
            successful: successful.length,
            failed: failed.length,
            results: successful,
            errors: failed.map(e => e.message)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Data export/import endpoints
app.get('/api/export/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const progress = await progressTracker.getUserProgress(userId);
        const analytics = progressTracker.analytics.getAnalytics(userId);
        
        const exportData = {
            user_id: userId,
            progress,
            analytics,
            exported_at: new Date().toISOString(),
            version: '1.0'
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="user_${userId}_export.json"`);
        res.json(exportData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/import/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { progress, analytics } = req.body;
        
        if (progress) {
            await progressTracker.saveUserProgress(userId, progress);
        }
        
        if (analytics) {
            // Import analytics data
            for (const [skillId, data] of Object.entries(analytics)) {
                progressTracker.analytics.analytics.set(`${userId}_${skillId}`, data);
            }
        }
        
        // Clear cache for this user
        await cacheManager.delete(`progress_${userId}`);
        await cacheManager.delete(`learning_path_${userId}`);
        
        res.json({ message: 'Data imported successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
    await ensureCacheDir();
    
    // Clear expired cache every hour
    setInterval(async () => {
        const cleared = await cacheManager.clearExpired();
        console.log(`🧹 Cleared ${cleared} expired cache entries`);
    }, 60 * 60 * 1000);

    // Clear old retry attempts every 5 minutes
    setInterval(() => {
        errorRecovery.clearOldRetries();
    }, 5 * 60 * 1000);

    // Log performance stats every 10 minutes
    setInterval(() => {
        const stats = performanceMonitor.getAllStats();
        const cacheStats = cacheManager.getStats();
        console.log(`📊 Performance Stats:`, stats);
        console.log(`💾 Cache Stats:`, cacheStats);
    }, 10 * 60 * 1000);

    app.listen(PORT, () => {
        console.log(`🚀 Adaptive Learning Tracker running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`🔧 System health: http://localhost:${PORT}/api/system/health`);
        console.log(`📚 API docs: http://localhost:${PORT}/api`);
        console.log(`🎯 Frontend: http://localhost:${PORT}/`);
    });
};

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down gracefully...');
    process.exit(0);
});

// Start the server (only if not in Vercel environment)
if (require.main === module && !process.env.VERCEL) {
    startServer().catch(console.error);
}

module.exports = {
    app,
    ProgressTracker,
    SpacedRepetitionAlgorithm,
    SkillTreeManager,
    LearningAnalytics,
    AssessmentEngine,
    CacheManager,
    ErrorRecoveryManager,
    PerformanceMonitor
};
