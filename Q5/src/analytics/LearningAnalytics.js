/**
 * Learning Analytics System
 * Tracks user interactions, progress, and provides insights
 */

class LearningAnalytics {
    constructor() {
        this.sessions = new Map();
        this.interactions = [];
        this.performanceMetrics = {
            totalSessions: 0,
            totalTimeSpent: 0,
            averageSessionDuration: 0,
            mostPopularModules: {},
            averageUnderstandingScore: 0,
            commonMistakes: {},
            learningProgress: []
        };
    }

    // Create a new learning session
    createSession(sessionId, moduleId, userId, mode = 'exploration') {
        const session = {
            sessionId,
            moduleId,
            userId,
            mode,
            startTime: Date.now(),
            endTime: null,
            duration: 0,
            interactions: [],
            stepsCompleted: 0,
            mistakesMade: 0,
            understandingScore: 0,
            feedbackProvided: [],
            progress: {
                currentStep: 0,
                totalSteps: 0,
                completionRate: 0
            },
            performance: {
                responseTime: [],
                accuracy: 0,
                efficiency: 0
            },
            learningPath: [],
            achievements: [],
            metadata: {
                device: this.detectDevice(),
                browser: this.detectBrowser(),
                timestamp: new Date().toISOString()
            }
        };

        this.sessions.set(sessionId, session);
        this.performanceMetrics.totalSessions++;
        
        return session;
    }

    // Record user interaction
    recordInteraction(sessionId, interaction) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        const interactionData = {
            id: Date.now() + Math.random(),
            type: interaction.type,
            timestamp: Date.now(),
            data: interaction.data,
            responseTime: interaction.responseTime || 0,
            success: interaction.success !== false,
            difficulty: interaction.difficulty || 'medium',
            context: interaction.context || {}
        };

        session.interactions.push(interactionData);
        this.interactions.push({
            sessionId,
            ...interactionData
        });

        // Update session metrics
        this.updateSessionMetrics(sessionId, interactionData);
        
        return interactionData;
    }

    // Update session metrics
    updateSessionMetrics(sessionId, interactionData) {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        // Update basic metrics
        session.stepsCompleted = session.interactions.length;
        
        // Update performance metrics
        if (interactionData.responseTime) {
            session.performance.responseTime.push(interactionData.responseTime);
        }
        
        // Update accuracy
        const successfulInteractions = session.interactions.filter(i => i.success).length;
        session.performance.accuracy = successfulInteractions / session.interactions.length;
        
        // Update efficiency
        session.performance.efficiency = this.calculateEfficiency(session);
    }

    // Update session progress
    updateProgress(sessionId, progressData) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        session.progress = {
            ...session.progress,
            ...progressData
        };

        // Calculate completion rate
        if (session.progress.totalSteps > 0) {
            session.progress.completionRate = 
                (session.progress.currentStep / session.progress.totalSteps) * 100;
        }

        return session.progress;
    }

    // Record a mistake
    recordMistake(sessionId, mistake) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        session.mistakesMade++;
        
        const mistakeData = {
            id: Date.now() + Math.random(),
            type: mistake.type,
            description: mistake.description,
            timestamp: Date.now(),
            context: mistake.context || {},
            severity: mistake.severity || 'low'
        };

        // Track common mistakes
        const mistakeKey = `${session.moduleId}_${mistake.type}`;
        this.performanceMetrics.commonMistakes[mistakeKey] = 
            (this.performanceMetrics.commonMistakes[mistakeKey] || 0) + 1;

        return mistakeData;
    }

    // Provide feedback
    provideFeedback(sessionId, feedback) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        const feedbackData = {
            id: Date.now() + Math.random(),
            type: feedback.type,
            message: feedback.message,
            timestamp: Date.now(),
            context: feedback.context || {},
            helpful: feedback.helpful || true
        };

        session.feedbackProvided.push(feedbackData);
        return feedbackData;
    }

    // Calculate understanding score
    calculateUnderstandingScore(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        const interactions = session.interactions;
        const totalInteractions = interactions.length;
        
        if (totalInteractions === 0) {
            session.understandingScore = 0;
            return 0;
        }

        // Calculate based on success rate, response time, and progression
        const successRate = interactions.filter(i => i.success).length / totalInteractions;
        const averageResponseTime = interactions.reduce((sum, i) => sum + i.responseTime, 0) / totalInteractions;
        const completionRate = session.progress.completionRate / 100;
        
        // Normalize response time (lower is better)
        const normalizedResponseTime = Math.max(0, 1 - (averageResponseTime / 5000)); // 5 seconds max
        
        // Calculate understanding score (0-1)
        const understandingScore = (
            successRate * 0.4 +
            normalizedResponseTime * 0.3 +
            completionRate * 0.3
        );

        session.understandingScore = Math.min(1, Math.max(0, understandingScore));
        return session.understandingScore;
    }

    // Complete a session
    completeSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        session.endTime = Date.now();
        session.duration = session.endTime - session.startTime;
        
        // Calculate final metrics
        this.calculateUnderstandingScore(sessionId);
        this.updatePerformanceMetrics(session);
        
        return session;
    }

    // Get session analytics
    getSessionAnalytics(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        const interactions = session.interactions;
        const totalInteractions = interactions.length;
        
        return {
            sessionId: session.sessionId,
            moduleId: session.moduleId,
            userId: session.userId,
            mode: session.mode,
            duration: session.duration,
            interactions: totalInteractions,
            stepsCompleted: session.stepsCompleted,
            mistakesMade: session.mistakesMade,
            understandingScore: session.understandingScore,
            completionRate: session.progress.completionRate,
            feedbackProvided: session.feedbackProvided.length,
            performance: {
                averageResponseTime: interactions.length > 0 ? 
                    interactions.reduce((sum, i) => sum + i.responseTime, 0) / interactions.length : 0,
                successRate: interactions.length > 0 ? 
                    interactions.filter(i => i.success).length / interactions.length : 0,
                efficiency: this.calculateEfficiency(session)
            },
            learningPath: session.learningPath,
            achievements: session.achievements,
            recommendations: this.generateRecommendations(session),
            metadata: session.metadata
        };
    }

    // Calculate learning efficiency
    calculateEfficiency(session) {
        const { duration, interactions, mistakesMade, understandingScore } = session;
        
        if (duration === 0 || interactions.length === 0) return 0;
        
        // Efficiency = (understanding score * interactions) / (time + mistakes)
        const timeFactor = duration / 1000; // Convert to seconds
        const mistakePenalty = mistakesMade * 10; // Penalty for mistakes
        
        return (understandingScore * interactions.length) / (timeFactor + mistakePenalty);
    }

    // Generate learning recommendations
    generateRecommendations(session) {
        const recommendations = [];
        const { understandingScore, mistakesMade, performance } = session;
        
        if (understandingScore < 0.6) {
            recommendations.push({
                type: 'review',
                message: 'Consider reviewing the basic concepts before proceeding',
                priority: 'high'
            });
        }
        
        if (mistakesMade > 5) {
            recommendations.push({
                type: 'practice',
                message: 'More practice with similar problems would be beneficial',
                priority: 'medium'
            });
        }
        
        if (performance.averageResponseTime > 3000) {
            recommendations.push({
                type: 'speed',
                message: 'Try to work more quickly while maintaining accuracy',
                priority: 'low'
            });
        }
        
        if (understandingScore > 0.8 && session.progress.completionRate > 80) {
            recommendations.push({
                type: 'advance',
                message: 'Great job! You\'re ready for more advanced topics',
                priority: 'low'
            });
        }
        
        return recommendations;
    }

    // Update performance metrics
    updatePerformanceMetrics(session) {
        this.performanceMetrics.totalTimeSpent += session.duration;
        this.performanceMetrics.averageSessionDuration = 
            this.performanceMetrics.totalTimeSpent / this.performanceMetrics.totalSessions;
        
        // Update module popularity
        const moduleId = session.moduleId;
        this.performanceMetrics.mostPopularModules[moduleId] = 
            (this.performanceMetrics.mostPopularModules[moduleId] || 0) + 1;
        
        // Update average understanding score
        const totalScore = Array.from(this.sessions.values())
            .reduce((sum, s) => sum + s.understandingScore, 0);
        this.performanceMetrics.averageUnderstandingScore = 
            totalScore / this.performanceMetrics.totalSessions;
        
        // Update learning progress
        this.performanceMetrics.learningProgress.push({
            timestamp: Date.now(),
            understandingScore: session.understandingScore,
            moduleId: session.moduleId,
            duration: session.duration
        });
    }

    // Get global analytics
    getGlobalAnalytics() {
        return {
            ...this.performanceMetrics,
            totalSessions: this.sessions.size,
            activeSessions: Array.from(this.sessions.values())
                .filter(s => !s.endTime).length,
            averageUnderstandingScore: this.performanceMetrics.averageUnderstandingScore,
            topModules: Object.entries(this.performanceMetrics.mostPopularModules)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([module, count]) => ({ module, sessions: count })),
            commonMistakes: Object.entries(this.performanceMetrics.commonMistakes)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([mistake, count]) => ({ mistake, occurrences: count }))
        };
    }

    // Export session data
    exportSessionData(sessionId, format = 'json') {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        const exportData = {
            session_id: session.sessionId,
            concept: session.moduleId,
            interactions: session.interactions.length,
            time_spent_minutes: Math.round(session.duration / 60000),
            steps_completed: session.stepsCompleted,
            mistakes_made: session.mistakesMade,
            understanding_score: session.understandingScore,
            feedback_provided: session.feedbackProvided.map(f => f.message),
            performance: session.performance,
            learning_path: session.learningPath,
            achievements: session.achievements,
            metadata: session.metadata
        };

        if (format === 'json') {
            return JSON.stringify(exportData, null, 2);
        } else if (format === 'csv') {
            return this.convertToCSV(exportData);
        }

        return exportData;
    }

    // Convert data to CSV format
    convertToCSV(data) {
        const headers = Object.keys(data);
        const values = headers.map(header => {
            const value = data[header];
            if (typeof value === 'object') {
                return JSON.stringify(value);
            }
            return value;
        });
        
        return [headers.join(','), values.join(',')].join('\n');
    }

    // Device and browser detection
    detectDevice() {
        const userAgent = navigator.userAgent;
        if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
            return 'mobile';
        } else if (/Tablet|iPad/.test(userAgent)) {
            return 'tablet';
        }
        return 'desktop';
    }

    detectBrowser() {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        return 'Unknown';
    }

    // Cleanup old sessions
    cleanupOldSessions(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days
        const cutoffTime = Date.now() - maxAge;
        const sessionsToDelete = [];
        
        for (const [sessionId, session] of this.sessions) {
            if (session.startTime < cutoffTime) {
                sessionsToDelete.push(sessionId);
            }
        }
        
        sessionsToDelete.forEach(sessionId => {
            this.sessions.delete(sessionId);
        });
        
        return sessionsToDelete.length;
    }

    // Get session by ID
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }

    // Get all sessions
    getAllSessions() {
        return Array.from(this.sessions.values());
    }

    // Clear all data
    clear() {
        this.sessions.clear();
        this.interactions = [];
        this.performanceMetrics = {
            totalSessions: 0,
            totalTimeSpent: 0,
            averageSessionDuration: 0,
            mostPopularModules: {},
            averageUnderstandingScore: 0,
            commonMistakes: {},
            learningProgress: []
        };
    }
}

module.exports = LearningAnalytics;
