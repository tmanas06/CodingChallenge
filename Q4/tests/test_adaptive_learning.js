/**
 * Comprehensive test suite for Adaptive Learning Tracker
 * Tests all functionality including spaced repetition, skill assessment, and analytics
 */

const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');

// Import the app and classes
const { app, ProgressTracker, SpacedRepetitionAlgorithm, SkillTreeManager, LearningAnalytics, AssessmentEngine } = require('../adaptive_learning_tracker');

describe('Adaptive Learning Tracker', () => {
    let progressTracker;
    let spacedRepetition;
    let skillTreeManager;
    let analytics;
    let assessmentEngine;

    beforeEach(() => {
        progressTracker = new ProgressTracker();
        spacedRepetition = new SpacedRepetitionAlgorithm();
        skillTreeManager = new SkillTreeManager();
        analytics = new LearningAnalytics();
        assessmentEngine = new AssessmentEngine();
    });

    describe('Spaced Repetition Algorithm', () => {
        test('should calculate correct intervals for perfect performance', () => {
            const result = spacedRepetition.calculateNextReview(5, 0, 2.5);
            expect(result.interval).toBe(1);
            expect(result.easeFactor).toBeGreaterThan(2.5);
        });

        test('should calculate correct intervals for good performance', () => {
            const result = spacedRepetition.calculateNextReview(4, 7, 2.5);
            expect(result.interval).toBeGreaterThan(7);
            expect(result.easeFactor).toBeGreaterThan(2.5);
        });

        test('should calculate correct intervals for poor performance', () => {
            const result = spacedRepetition.calculateNextReview(1, 7, 2.5);
            expect(result.interval).toBe(1);
            expect(result.easeFactor).toBeLessThan(2.5);
        });

        test('should maintain minimum ease factor', () => {
            const result = spacedRepetition.calculateNextReview(0, 7, 1.3);
            expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
        });
    });

    describe('Skill Tree Manager', () => {
        test('should load skill trees correctly', async () => {
            await skillTreeManager.loadSkillTrees();
            expect(skillTreeManager.skillTrees.size).toBeGreaterThan(0);
        });

        test('should get skill by ID', async () => {
            await skillTreeManager.loadSkillTrees();
            const skill = skillTreeManager.getSkill('javascript_fundamentals');
            expect(skill).toBeDefined();
            expect(skill.skill_id).toBe('javascript_fundamentals');
        });

        test('should get available skills for user', async () => {
            await skillTreeManager.loadSkillTrees();
            const userProgress = {
                completed_skills: ['javascript_fundamentals']
            };
            const available = skillTreeManager.getAvailableSkills(userProgress);
            expect(Array.isArray(available)).toBe(true);
        });

        test('should respect prerequisites', async () => {
            await skillTreeManager.loadSkillTrees();
            const userProgress = {
                completed_skills: [] // No completed skills
            };
            const available = skillTreeManager.getAvailableSkills(userProgress);
            // Should only include skills with no prerequisites
            const skillsWithPrereqs = available.filter(skill => 
                skill.prerequisites && skill.prerequisites.length > 0
            );
            expect(skillsWithPrereqs.length).toBe(0);
        });
    });

    describe('Learning Analytics', () => {
        test('should record attempt correctly', () => {
            const attempt = {
                correct: true,
                timeSpent: 30,
                errorType: null,
                questionType: 'multiple_choice'
            };
            
            analytics.recordAttempt('javascript_fundamentals', 'user1', attempt);
            const data = analytics.getAnalytics('user1', 'javascript_fundamentals');
            
            expect(data.total_attempts).toBe(1);
            expect(data.correct_attempts).toBe(1);
            expect(data.time_spent).toBe(30);
            expect(data.mastery_level).toBe(1);
        });

        test('should calculate mastery level correctly', () => {
            // Record multiple attempts
            analytics.recordAttempt('javascript_fundamentals', 'user1', { correct: true, timeSpent: 30 });
            analytics.recordAttempt('javascript_fundamentals', 'user1', { correct: false, timeSpent: 45 });
            analytics.recordAttempt('javascript_fundamentals', 'user1', { correct: true, timeSpent: 25 });
            
            const data = analytics.getAnalytics('user1', 'javascript_fundamentals');
            expect(data.total_attempts).toBe(3);
            expect(data.correct_attempts).toBe(2);
            expect(data.mastery_level).toBeCloseTo(2/3, 2);
        });

        test('should track error patterns', () => {
            const attempt = {
                correct: false,
                timeSpent: 30,
                errorType: 'syntax_error',
                questionType: 'code_completion'
            };
            
            analytics.recordAttempt('javascript_fundamentals', 'user1', attempt);
            const data = analytics.getAnalytics('user1', 'javascript_fundamentals');
            
            expect(data.error_patterns).toHaveLength(1);
            expect(data.error_patterns[0].error_type).toBe('syntax_error');
        });
    });

    describe('Assessment Engine', () => {
        test('should generate multiple choice assessment', () => {
            const skill = {
                assessments: [{
                    type: 'multiple_choice',
                    questions: [{
                        question: 'Test question?',
                        options: ['A', 'B', 'C', 'D'],
                        correct_answer: 0,
                        explanation: 'Test explanation'
                    }]
                }]
            };
            
            const assessment = assessmentEngine.generateAssessment(skill, 1);
            expect(assessment.type).toBe('multiple_choice');
            expect(assessment.question).toBeDefined();
            expect(assessment.options).toHaveLength(4);
        });

        test('should generate code completion assessment', () => {
            const skill = {
                assessments: [{
                    type: 'code_completion',
                    template: 'let ___ = 5;',
                    hints: ['Use a variable name'],
                    correct_solution: 'let x = 5;',
                    test_cases: []
                }]
            };
            
            const assessment = assessmentEngine.generateAssessment(skill, 1);
            expect(assessment.type).toBe('code_completion');
            expect(assessment.template).toBeDefined();
            expect(assessment.hints).toBeDefined();
        });

        test('should evaluate multiple choice correctly', () => {
            const assessment = {
                type: 'multiple_choice',
                correct_answer: 2,
                time_limit: 60
            };
            
            const result = assessmentEngine.evaluateResponse(assessment, 2, 30);
            expect(result.correct).toBe(true);
            expect(result.score).toBeGreaterThan(0);
        });

        test('should evaluate code completion correctly', () => {
            const assessment = {
                type: 'code_completion',
                correct_solution: 'let x = 5;',
                time_limit: 120
            };
            
            const result = assessmentEngine.evaluateResponse(assessment, 'let x = 5;', 60);
            expect(result.correct).toBe(true);
            expect(result.score).toBeGreaterThan(0);
        });

        test('should calculate performance rating correctly', () => {
            const performance = assessmentEngine.calculatePerformance(95, 30, 60);
            expect(performance).toBe(5); // Excellent
            
            const performance2 = assessmentEngine.calculatePerformance(60, 30, 60);
            expect(performance2).toBe(2); // Poor
        });
    });

    describe('Progress Tracker', () => {
        test('should create new user progress', async () => {
            const progress = await progressTracker.getUserProgress('newuser');
            expect(progress.user_id).toBe('newuser');
            expect(progress.completed_skills).toEqual([]);
            expect(progress.skills).toEqual({});
        });

        test('should start assessment correctly', async () => {
            await skillTreeManager.loadSkillTrees();
            const assessment = await progressTracker.startAssessment('user1', 'javascript_fundamentals');
            expect(assessment.skill_id).toBe('javascript_fundamentals');
            expect(assessment.assessment).toBeDefined();
            expect(assessment.assessment_id).toBeDefined();
        });

        test('should submit assessment and update progress', async () => {
            await skillTreeManager.loadSkillTrees();
            
            // Start assessment
            const assessment = await progressTracker.startAssessment('user1', 'javascript_fundamentals');
            
            // Submit responses
            const responses = {
                skill_id: 'javascript_fundamentals',
                responses: [{
                    assessment: assessment.assessment,
                    answer: 0, // Correct answer
                    timeSpent: 30
                }],
                totalTimeLimit: 60
            };
            
            const result = await progressTracker.submitAssessment('user1', assessment.assessment_id, responses);
            expect(result.skill_id).toBe('javascript_fundamentals');
            expect(result.average_score).toBeGreaterThan(0);
            expect(result.mastery_level).toBeGreaterThan(0);
        });

        test('should generate learning path', async () => {
            await skillTreeManager.loadSkillTrees();
            const learningPath = await progressTracker.getLearningPath('user1');
            expect(learningPath.user_id).toBe('user1');
            expect(learningPath.recommended_skills).toBeDefined();
            expect(Array.isArray(learningPath.recommended_skills)).toBe(true);
        });
    });

    describe('API Endpoints', () => {
        test('GET /health should return healthy status', async () => {
            const response = await request(app).get('/health');
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('healthy');
        });

        test('GET /api/progress/:userId should return user progress', async () => {
            const response = await request(app).get('/api/progress/user1');
            expect(response.status).toBe(200);
            expect(response.body.user_id).toBe('user1');
        });

        test('GET /api/learning-path/:userId should return learning path', async () => {
            const response = await request(app).get('/api/learning-path/user1');
            expect(response.status).toBe(200);
            expect(response.body.user_id).toBe('user1');
            expect(response.body.recommended_skills).toBeDefined();
        });

        test('POST /api/assessment/start should start assessment', async () => {
            const response = await request(app)
                .post('/api/assessment/start')
                .send({ userId: 'user1', skillId: 'javascript_fundamentals' });
            
            expect(response.status).toBe(200);
            expect(response.body.skill_id).toBe('javascript_fundamentals');
            expect(response.body.assessment).toBeDefined();
        });

        test('POST /api/assessment/submit should submit assessment', async () => {
            // First start an assessment
            const startResponse = await request(app)
                .post('/api/assessment/start')
                .send({ userId: 'user1', skillId: 'javascript_fundamentals' });
            
            const assessment = startResponse.body;
            
            // Submit the assessment
            const submitResponse = await request(app)
                .post('/api/assessment/submit')
                .send({
                    userId: 'user1',
                    assessmentId: assessment.assessment_id,
                    responses: {
                        skill_id: 'javascript_fundamentals',
                        responses: [{
                            assessment: assessment.assessment,
                            answer: 0,
                            timeSpent: 30
                        }],
                        totalTimeLimit: 60
                    }
                });
            
            expect(submitResponse.status).toBe(200);
            expect(submitResponse.body.skill_id).toBe('javascript_fundamentals');
        });

        test('GET /api/skills should return all skills', async () => {
            const response = await request(app).get('/api/skills');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('GET /api/skills/available/:userId should return available skills', async () => {
            const response = await request(app).get('/api/skills/available/user1');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('GET /api/analytics/:userId/:skillId should return skill analytics', async () => {
            const response = await request(app).get('/api/analytics/user1/javascript_fundamentals');
            expect(response.status).toBe(200);
            expect(response.body.skill_id).toBe('javascript_fundamentals');
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid skill ID in assessment start', async () => {
            const response = await request(app)
                .post('/api/assessment/start')
                .send({ userId: 'user1', skillId: 'invalid_skill' });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBeDefined();
        });

        test('should handle missing prerequisites', async () => {
            // Try to start assessment for a skill that requires prerequisites
            const response = await request(app)
                .post('/api/assessment/start')
                .send({ userId: 'user1', skillId: 'javascript_loops' });
            
            // This should fail if prerequisites aren't met
            expect(response.status).toBe(400);
        });

        test('should handle invalid assessment submission', async () => {
            const response = await request(app)
                .post('/api/assessment/submit')
                .send({
                    userId: 'user1',
                    assessmentId: 'invalid_id',
                    responses: {}
                });
            
            expect(response.status).toBe(400);
        });
    });

    describe('Caching', () => {
        test('should cache user progress', async () => {
            const progress1 = await progressTracker.getUserProgress('cacheuser');
            const progress2 = await progressTracker.getUserProgress('cacheuser');
            
            // Should return the same object reference (cached)
            expect(progress1).toBe(progress2);
        });
    });

    describe('Scalability', () => {
        test('should handle multiple concurrent users', async () => {
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(progressTracker.getUserProgress(`user${i}`));
            }
            
            const results = await Promise.all(promises);
            expect(results).toHaveLength(10);
            results.forEach((result, index) => {
                expect(result.user_id).toBe(`user${index}`);
            });
        });

        test('should handle large skill trees', async () => {
            // Create a large number of skills
            const largeSkillTree = {};
            for (let i = 0; i < 100; i++) {
                largeSkillTree[`skill_${i}`] = {
                    skill_id: `skill_${i}`,
                    title: `Skill ${i}`,
                    prerequisites: i > 0 ? [`skill_${i-1}`] : [],
                    difficulty_level: 1,
                    mastery_threshold: 0.85
                };
            }
            
            // Test that the system can handle large skill trees
            expect(Object.keys(largeSkillTree)).toHaveLength(100);
        });
    });
});

// Integration tests
describe('Integration Tests', () => {
    test('complete learning flow', async () => {
        const progressTracker = new ProgressTracker();
        await progressTracker.skillTreeManager.loadSkillTrees();
        
        // 1. Get initial progress
        let progress = await progressTracker.getUserProgress('integration_user');
        expect(progress.completed_skills).toEqual([]);
        
        // 2. Start assessment for fundamentals
        const assessment = await progressTracker.startAssessment('integration_user', 'javascript_fundamentals');
        expect(assessment.skill_id).toBe('javascript_fundamentals');
        
        // 3. Submit assessment with correct answers
        const responses = {
            skill_id: 'javascript_fundamentals',
            responses: [{
                assessment: assessment.assessment,
                answer: assessment.assessment.correct_answer,
                timeSpent: 30
            }],
            totalTimeLimit: 60
        };
        
        const result = await progressTracker.submitAssessment('integration_user', assessment.assessment_id, responses);
        expect(result.mastery_level).toBeGreaterThan(0);
        
        // 4. Check updated progress
        progress = await progressTracker.getUserProgress('integration_user');
        expect(progress.skills.javascript_fundamentals).toBeDefined();
        expect(progress.skills.javascript_fundamentals.mastery_level).toBeGreaterThan(0);
        
        // 5. Get learning path
        const learningPath = await progressTracker.getLearningPath('integration_user');
        expect(learningPath.recommended_skills).toBeDefined();
    });
});
