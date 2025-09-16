#!/usr/bin/env node
/**
 * Interactive Concept Visualization Tool - Server
 * Q5: JavaScript Interactive Concept Visualization Tool
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs').promises;

// Import core modules
const VisualizationEngine = require('./src/core/VisualizationEngine');
const LearningAnalytics = require('./src/analytics/LearningAnalytics');
const SessionManager = require('./src/session/SessionManager');
const CacheManager = require('./src/cache/CacheManager');
const ErrorRecovery = require('./src/utils/ErrorRecovery');
const PerformanceMonitor = require('./src/monitoring/PerformanceMonitor');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize core systems
const visualizationEngine = new VisualizationEngine();
const analytics = new LearningAnalytics();
const sessionManager = new SessionManager();
const cacheManager = new CacheManager();
const errorRecovery = new ErrorRecovery();
const performanceMonitor = new PerformanceMonitor();

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'", "ws:", "wss:"]
        }
    }
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/src', express.static(path.join(__dirname, 'src')));

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        memory: process.memoryUsage(),
        performance: performanceMonitor.getStats()
    });
});

// Get available visualization modules
app.get('/api/modules', async (req, res) => {
    try {
        performanceMonitor.startTimer('get_modules');
        const modules = await visualizationEngine.getAvailableModules();
        performanceMonitor.endTimer('get_modules');
        res.json(modules);
    } catch (error) {
        errorRecovery.handleError(error, req, res);
    }
});

// Get specific module configuration
app.get('/api/modules/:moduleId', async (req, res) => {
    try {
        const { moduleId } = req.params;
        performanceMonitor.startTimer('get_module_config');
        const config = await visualizationEngine.getModuleConfig(moduleId);
        performanceMonitor.endTimer('get_module_config');
        res.json(config);
    } catch (error) {
        errorRecovery.handleError(error, req, res);
    }
});

// Create new learning session
app.post('/api/sessions', async (req, res) => {
    try {
        const { moduleId, userId, mode = 'exploration' } = req.body;
        performanceMonitor.startTimer('create_session');
        const session = await sessionManager.createSession(moduleId, userId, mode);
        performanceMonitor.endTimer('create_session');
        res.json(session);
    } catch (error) {
        errorRecovery.handleError(error, req, res);
    }
});

// Get session data
app.get('/api/sessions/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        performanceMonitor.startTimer('get_session');
        const session = await sessionManager.getSession(sessionId);
        performanceMonitor.endTimer('get_session');
        res.json(session);
    } catch (error) {
        errorRecovery.handleError(error, req, res);
    }
});

// Update session progress
app.put('/api/sessions/:sessionId/progress', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const progressData = req.body;
        performanceMonitor.startTimer('update_progress');
        const result = await sessionManager.updateProgress(sessionId, progressData);
        performanceMonitor.endTimer('update_progress');
        res.json(result);
    } catch (error) {
        errorRecovery.handleError(error, req, res);
    }
});

// Record interaction
app.post('/api/sessions/:sessionId/interactions', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const interaction = req.body;
        performanceMonitor.startTimer('record_interaction');
        const result = await sessionManager.recordInteraction(sessionId, interaction);
        performanceMonitor.endTimer('record_interaction');
        res.json(result);
    } catch (error) {
        errorRecovery.handleError(error, req, res);
    }
});

// Get learning analytics
app.get('/api/analytics/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        performanceMonitor.startTimer('get_analytics');
        const analyticsData = await analytics.getSessionAnalytics(sessionId);
        performanceMonitor.endTimer('get_analytics');
        res.json(analyticsData);
    } catch (error) {
        errorRecovery.handleError(error, req, res);
    }
});

// Export session data
app.get('/api/sessions/:sessionId/export', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { format = 'json' } = req.query;
        performanceMonitor.startTimer('export_session');
        const exportData = await sessionManager.exportSession(sessionId, format);
        performanceMonitor.endTimer('export_session');
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="session_${sessionId}.json"`);
        res.json(exportData);
    } catch (error) {
        errorRecovery.handleError(error, req, res);
    }
});

// System monitoring endpoints
app.get('/api/system/performance', (req, res) => {
    res.json(performanceMonitor.getStats());
});

app.get('/api/system/cache/stats', (req, res) => {
    res.json(cacheManager.getStats());
});

app.post('/api/system/cache/clear', (req, res) => {
    cacheManager.clear();
    res.json({ message: 'Cache cleared successfully' });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
if (require.main === module && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 Interactive Concept Visualization Tool running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
        console.log(`🎯 Modules: http://localhost:${PORT}/api/modules`);
        console.log(`📈 Analytics: http://localhost:${PORT}/api/analytics`);
    });
}

module.exports = app;
