/**
 * Test Suite for Learning Analytics
 */

const LearningAnalytics = require('../src/analytics/LearningAnalytics');

describe('LearningAnalytics', () => {
    let analytics;

    beforeEach(() => {
        analytics = new LearningAnalytics();
    });

    afterEach(() => {
        if (analytics) {
            analytics.clear();
        }
    });

    test('should initialize with empty state', () => {
        expect(analytics.sessions).toBeDefined();
        expect(analytics.interactions).toBeDefined();
        expect(analytics.performanceMetrics).toBeDefined();
    });

    test('should create session', () => {
        const session = analytics.createSession('session_1', 'bubble_sort', 'user_1', 'exploration');
        
        expect(session).toHaveProperty('sessionId', 'session_1');
        expect(session).toHaveProperty('moduleId', 'bubble_sort');
        expect(session).toHaveProperty('userId', 'user_1');
        expect(session).toHaveProperty('mode', 'exploration');
        expect(session).toHaveProperty('startTime');
        expect(session).toHaveProperty('interactions');
        expect(session).toHaveProperty('progress');
        expect(session).toHaveProperty('performance');
    });

    test('should record interaction', () => {
        analytics.createSession('session_1', 'bubble_sort', 'user_1', 'exploration');
        
        const interaction = analytics.recordInteraction('session_1', {
            type: 'algorithm_start',
            data: { algorithm: 'bubble_sort' },
            success: true,
            responseTime: 150
        });
        
        expect(interaction).toHaveProperty('id');
        expect(interaction).toHaveProperty('type', 'algorithm_start');
        expect(interaction).toHaveProperty('timestamp');
        expect(interaction).toHaveProperty('success', true);
        expect(interaction).toHaveProperty('responseTime', 150);
    });

    test('should throw error for non-existent session', () => {
        expect(() => {
            analytics.recordInteraction('non_existent_session', { type: 'test' });
        }).toThrow('Session non_existent_session not found');
    });

    test('should update progress', () => {
        analytics.createSession('session_1', 'bubble_sort', 'user_1', 'exploration');
        
        const progress = analytics.updateProgress('session_1', {
            currentStep: 5,
            totalSteps: 10
        });
        
        expect(progress).toHaveProperty('currentStep', 5);
        expect(progress).toHaveProperty('totalSteps', 10);
        expect(progress).toHaveProperty('completionRate', 50);
    });

    test('should record mistake', () => {
        analytics.createSession('session_1', 'bubble_sort', 'user_1', 'exploration');
        
        const mistake = analytics.recordMistake('session_1', {
            type: 'logic_error',
            description: 'Incorrect comparison',
            severity: 'medium'
        });
        
        expect(mistake).toHaveProperty('id');
        expect(mistake).toHaveProperty('type', 'logic_error');
        expect(mistake).toHaveProperty('description', 'Incorrect comparison');
        expect(mistake).toHaveProperty('severity', 'medium');
    });

    test('should provide feedback', () => {
        analytics.createSession('session_1', 'bubble_sort', 'user_1', 'exploration');
        
        const feedback = analytics.provideFeedback('session_1', {
            type: 'hint',
            message: 'Great job!',
            helpful: true
        });
        
        expect(feedback).toHaveProperty('id');
        expect(feedback).toHaveProperty('type', 'hint');
        expect(feedback).toHaveProperty('message', 'Great job!');
        expect(feedback).toHaveProperty('helpful', true);
    });

    test('should calculate understanding score', () => {
        analytics.createSession('session_1', 'bubble_sort', 'user_1', 'exploration');
        
        // Record successful interactions
        analytics.recordInteraction('session_1', {
            type: 'step_complete',
            success: true,
            responseTime: 100
        });
        
        analytics.recordInteraction('session_1', {
            type: 'step_complete',
            success: true,
            responseTime: 150
        });
        
        analytics.updateProgress('session_1', {
            currentStep: 8,
            totalSteps: 10
        });
        
        const score = analytics.calculateUnderstandingScore('session_1');
        
        expect(score).toBeGreaterThan(0);
        expect(score).toBeLessThanOrEqual(1);
    });

    test('should complete session', () => {
        analytics.createSession('session_1', 'bubble_sort', 'user_1', 'exploration');
        
        const completedSession = analytics.completeSession('session_1');
        
        expect(completedSession).toHaveProperty('endTime');
        expect(completedSession).toHaveProperty('duration');
        expect(completedSession.duration).toBeGreaterThan(0);
    });

    test('should get session analytics', () => {
        analytics.createSession('session_1', 'bubble_sort', 'user_1', 'exploration');
        
        analytics.recordInteraction('session_1', {
            type: 'step_complete',
            success: true,
            responseTime: 100
        });
        
        analytics.updateProgress('session_1', {
            currentStep: 5,
            totalSteps: 10
        });
        
        const sessionAnalytics = analytics.getSessionAnalytics('session_1');
        
        expect(sessionAnalytics).toHaveProperty('sessionId', 'session_1');
        expect(sessionAnalytics).toHaveProperty('moduleId', 'bubble_sort');
        expect(sessionAnalytics).toHaveProperty('interactions', 1);
        expect(sessionAnalytics).toHaveProperty('completionRate', 50);
        expect(sessionAnalytics).toHaveProperty('performance');
        expect(sessionAnalytics).toHaveProperty('recommendations');
    });

    test('should get global analytics', () => {
        analytics.createSession('session_1', 'bubble_sort', 'user_1', 'exploration');
        analytics.createSession('session_2', 'pendulum', 'user_1', 'guided');
        
        analytics.completeSession('session_1');
        analytics.completeSession('session_2');
        
        const globalAnalytics = analytics.getGlobalAnalytics();
        
        expect(globalAnalytics).toHaveProperty('totalSessions', 2);
        expect(globalAnalytics).toHaveProperty('averageUnderstandingScore');
        expect(globalAnalytics).toHaveProperty('mostPopularModules');
        expect(globalAnalytics).toHaveProperty('commonMistakes');
    });

    test('should export session data', () => {
        analytics.createSession('session_1', 'bubble_sort', 'user_1', 'exploration');
        
        analytics.recordInteraction('session_1', {
            type: 'step_complete',
            success: true,
            responseTime: 100
        });
        
        analytics.completeSession('session_1');
        
        const exportData = analytics.exportSessionData('session_1');
        
        expect(exportData).toHaveProperty('session_id', 'session_1');
        expect(exportData).toHaveProperty('concept', 'bubble_sort');
        expect(exportData).toHaveProperty('interactions', 1);
        expect(exportData).toHaveProperty('understanding_score');
        expect(exportData).toHaveProperty('performance');
    });

    test('should cleanup old sessions', () => {
        // Create old session
        const oldSession = analytics.createSession('old_session', 'bubble_sort', 'user_1', 'exploration');
        oldSession.startTime = Date.now() - (31 * 24 * 60 * 60 * 1000); // 31 days ago
        
        const cleanedCount = analytics.cleanupOldSessions(30 * 24 * 60 * 60 * 1000); // 30 days
        
        expect(cleanedCount).toBe(1);
    });

    test('should clear all data', () => {
        analytics.createSession('session_1', 'bubble_sort', 'user_1', 'exploration');
        analytics.recordInteraction('session_1', { type: 'test' });
        
        analytics.clear();
        
        expect(analytics.sessions.size).toBe(0);
        expect(analytics.interactions.length).toBe(0);
        expect(analytics.performanceMetrics.totalSessions).toBe(0);
    });
});
