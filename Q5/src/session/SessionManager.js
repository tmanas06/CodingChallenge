/**
 * Session Manager
 * Manages learning sessions and their lifecycle
 */

const { v4: uuidv4 } = require('uuid');
const LearningAnalytics = require('../analytics/LearningAnalytics');

class SessionManager {
    constructor() {
        this.sessions = new Map();
        this.analytics = new LearningAnalytics();
        this.activeSessions = new Set();
    }

    // Create a new learning session
    createSession(moduleId, userId, mode = 'exploration') {
        const sessionId = uuidv4();
        
        // Create session in analytics
        const session = this.analytics.createSession(sessionId, moduleId, userId, mode);
        
        // Store in session map
        this.sessions.set(sessionId, {
            ...session,
            state: 'active',
            createdAt: new Date().toISOString(),
            lastActivity: Date.now()
        });
        
        this.activeSessions.add(sessionId);
        
        return {
            sessionId,
            moduleId,
            userId,
            mode,
            status: 'created',
            createdAt: session.createdAt
        };
    }

    // Get session by ID
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        
        // Update last activity
        session.lastActivity = Date.now();
        
        return {
            sessionId: session.sessionId,
            moduleId: session.moduleId,
            userId: session.userId,
            mode: session.mode,
            state: session.state,
            duration: session.duration,
            progress: session.progress,
            interactions: session.interactions.length,
            mistakesMade: session.mistakesMade,
            understandingScore: session.understandingScore,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity
        };
    }

    // Update session progress
    updateProgress(sessionId, progressData) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        // Update progress in analytics
        const updatedProgress = this.analytics.updateProgress(sessionId, progressData);
        
        // Update session
        session.progress = updatedProgress;
        session.lastActivity = Date.now();
        
        return updatedProgress;
    }

    // Record interaction
    recordInteraction(sessionId, interaction) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        // Record in analytics
        const interactionData = this.analytics.recordInteraction(sessionId, interaction);
        
        // Update session
        session.interactions.push(interactionData);
        session.lastActivity = Date.now();
        
        return interactionData;
    }

    // Record mistake
    recordMistake(sessionId, mistake) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        // Record in analytics
        const mistakeData = this.analytics.recordMistake(sessionId, mistake);
        
        // Update session
        session.mistakesMade++;
        session.lastActivity = Date.now();
        
        return mistakeData;
    }

    // Provide feedback
    provideFeedback(sessionId, feedback) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        // Record in analytics
        const feedbackData = this.analytics.provideFeedback(sessionId, feedback);
        
        // Update session
        session.feedbackProvided.push(feedbackData);
        session.lastActivity = Date.now();
        
        return feedbackData;
    }

    // Complete session
    completeSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        // Complete in analytics
        const completedSession = this.analytics.completeSession(sessionId);
        
        // Update session state
        session.state = 'completed';
        session.endTime = completedSession.endTime;
        session.duration = completedSession.duration;
        session.understandingScore = completedSession.understandingScore;
        session.lastActivity = Date.now();
        
        // Remove from active sessions
        this.activeSessions.delete(sessionId);
        
        return {
            sessionId: session.sessionId,
            status: 'completed',
            duration: session.duration,
            understandingScore: session.understandingScore,
            completedAt: new Date(session.endTime).toISOString()
        };
    }

    // Pause session
    pauseSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        session.state = 'paused';
        session.lastActivity = Date.now();
        
        return {
            sessionId: session.sessionId,
            status: 'paused',
            pausedAt: new Date().toISOString()
        };
    }

    // Resume session
    resumeSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        session.state = 'active';
        session.lastActivity = Date.now();
        this.activeSessions.add(sessionId);
        
        return {
            sessionId: session.sessionId,
            status: 'resumed',
            resumedAt: new Date().toISOString()
        };
    }

    // Get session analytics
    getSessionAnalytics(sessionId) {
        return this.analytics.getSessionAnalytics(sessionId);
    }

    // Export session data
    exportSession(sessionId, format = 'json') {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        return this.analytics.exportSessionData(sessionId, format);
    }

    // Get all sessions for a user
    getUserSessions(userId) {
        return Array.from(this.sessions.values())
            .filter(session => session.userId === userId)
            .map(session => ({
                sessionId: session.sessionId,
                moduleId: session.moduleId,
                mode: session.mode,
                state: session.state,
                duration: session.duration,
                understandingScore: session.understandingScore,
                createdAt: session.createdAt,
                lastActivity: session.lastActivity
            }));
    }

    // Get active sessions
    getActiveSessions() {
        return Array.from(this.activeSessions)
            .map(sessionId => this.getSession(sessionId));
    }

    // Get session statistics
    getSessionStats() {
        const allSessions = Array.from(this.sessions.values());
        const activeSessions = this.activeSessions.size;
        const completedSessions = allSessions.filter(s => s.state === 'completed').length;
        const pausedSessions = allSessions.filter(s => s.state === 'paused').length;
        
        const totalDuration = allSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        const averageDuration = completedSessions > 0 ? totalDuration / completedSessions : 0;
        
        const averageUnderstandingScore = completedSessions > 0 ? 
            allSessions
                .filter(s => s.state === 'completed')
                .reduce((sum, s) => sum + (s.understandingScore || 0), 0) / completedSessions : 0;
        
        return {
            total: allSessions.length,
            active: activeSessions,
            completed: completedSessions,
            paused: pausedSessions,
            averageDuration: Math.round(averageDuration),
            averageUnderstandingScore: Math.round(averageUnderstandingScore * 100) / 100
        };
    }

    // Cleanup inactive sessions
    cleanupInactiveSessions(maxInactiveTime = 30 * 60 * 1000) { // 30 minutes
        const cutoffTime = Date.now() - maxInactiveTime;
        const sessionsToCleanup = [];
        
        for (const [sessionId, session] of this.sessions) {
            if (session.lastActivity < cutoffTime && session.state === 'active') {
                sessionsToCleanup.push(sessionId);
            }
        }
        
        sessionsToCleanup.forEach(sessionId => {
            this.pauseSession(sessionId);
        });
        
        return sessionsToCleanup.length;
    }

    // Get global analytics
    getGlobalAnalytics() {
        return this.analytics.getGlobalAnalytics();
    }

    // Clear all sessions
    clear() {
        this.sessions.clear();
        this.activeSessions.clear();
        this.analytics.clear();
    }

    // Get session by ID (internal)
    _getSession(sessionId) {
        return this.sessions.get(sessionId);
    }

    // Update session (internal)
    _updateSession(sessionId, updates) {
        const session = this.sessions.get(sessionId);
        if (session) {
            Object.assign(session, updates);
            session.lastActivity = Date.now();
        }
        return session;
    }
}

module.exports = SessionManager;
