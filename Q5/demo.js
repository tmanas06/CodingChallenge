#!/usr/bin/env node
/**
 * Interactive Concept Visualization Tool - Demo Script
 * Demonstrates all features and capabilities
 */

const express = require('express');
const path = require('path');

// Import core modules
const VisualizationEngine = require('./src/core/VisualizationEngine');
const LearningAnalytics = require('./src/analytics/LearningAnalytics');
const SessionManager = require('./src/session/SessionManager');

class InteractiveLearningDemo {
    constructor() {
        this.visualizationEngine = new VisualizationEngine();
        this.analytics = new LearningAnalytics();
        this.sessionManager = new SessionManager();
        this.demoResults = [];
    }

    async runDemo() {
        console.log('🚀 Starting Interactive Concept Visualization Tool Demo\n');
        
        try {
            // Demo 1: Algorithm Visualizer
            await this.demoAlgorithmVisualizer();
            
            // Demo 2: Physics Simulator
            await this.demoPhysicsSimulator();
            
            // Demo 3: Math Grapher
            await this.demoMathGrapher();
            
            // Demo 4: Data Structure Explorer
            await this.demoDataStructureExplorer();
            
            // Demo 5: Learning Analytics
            await this.demoLearningAnalytics();
            
            // Demo 6: Session Management
            await this.demoSessionManagement();
            
            // Demo 7: Performance Testing
            await this.demoPerformanceTesting();
            
            // Display results
            this.displayResults();
            
        } catch (error) {
            console.error('❌ Demo failed:', error);
        }
    }

    async demoAlgorithmVisualizer() {
        console.log('📊 Demo 1: Algorithm Visualizer');
        console.log('================================');
        
        try {
            // Get available algorithm modules
            const modules = await this.visualizationEngine.getAvailableModules();
            const algorithmModules = modules.filter(m => m.type === 'algorithm');
            
            console.log(`✅ Found ${algorithmModules.length} algorithm modules:`);
            algorithmModules.forEach(module => {
                console.log(`   - ${module.name} (${module.difficulty})`);
            });
            
            // Demo bubble sort configuration
            const bubbleSortConfig = await this.visualizationEngine.getModuleConfig('bubble_sort');
            console.log(`\n✅ Bubble Sort Configuration:`);
            console.log(`   - Features: ${bubbleSortConfig.features.length} features`);
            console.log(`   - Examples: ${bubbleSortConfig.examples.length} examples`);
            console.log(`   - Learning Modes: ${bubbleSortConfig.learningModes.join(', ')}`);
            
            this.demoResults.push({
                module: 'Algorithm Visualizer',
                status: 'success',
                metrics: {
                    modules: algorithmModules.length,
                    features: bubbleSortConfig.features.length,
                    examples: bubbleSortConfig.examples.length
                }
            });
            
        } catch (error) {
            console.error('❌ Algorithm Visualizer demo failed:', error.message);
            this.demoResults.push({
                module: 'Algorithm Visualizer',
                status: 'failed',
                error: error.message
            });
        }
        
        console.log('');
    }

    async demoPhysicsSimulator() {
        console.log('⚡ Demo 2: Physics Simulator');
        console.log('============================');
        
        try {
            // Get physics modules
            const modules = await this.visualizationEngine.getAvailableModules();
            const physicsModules = modules.filter(m => m.type === 'physics');
            
            console.log(`✅ Found ${physicsModules.length} physics modules:`);
            physicsModules.forEach(module => {
                console.log(`   - ${module.name} (${module.difficulty})`);
            });
            
            // Demo pendulum configuration
            const pendulumConfig = await this.visualizationEngine.getModuleConfig('pendulum');
            console.log(`\n✅ Pendulum Physics Configuration:`);
            console.log(`   - Features: ${pendulumConfig.features.length} features`);
            console.log(`   - Requirements: ${pendulumConfig.requirements.join(', ')}`);
            console.log(`   - Estimated Time: ${pendulumConfig.estimatedTime} minutes`);
            
            this.demoResults.push({
                module: 'Physics Simulator',
                status: 'success',
                metrics: {
                    modules: physicsModules.length,
                    features: pendulumConfig.features.length,
                    estimatedTime: pendulumConfig.estimatedTime
                }
            });
            
        } catch (error) {
            console.error('❌ Physics Simulator demo failed:', error.message);
            this.demoResults.push({
                module: 'Physics Simulator',
                status: 'failed',
                error: error.message
            });
        }
        
        console.log('');
    }

    async demoMathGrapher() {
        console.log('📈 Demo 3: Math Grapher');
        console.log('=======================');
        
        try {
            // Get math modules
            const modules = await this.visualizationEngine.getAvailableModules();
            const mathModules = modules.filter(m => m.type === 'mathematics');
            
            console.log(`✅ Found ${mathModules.length} math modules:`);
            mathModules.forEach(module => {
                console.log(`   - ${module.name} (${module.difficulty})`);
            });
            
            // Demo function grapher configuration
            const grapherConfig = await this.visualizationEngine.getModuleConfig('function_grapher');
            console.log(`\n✅ Function Grapher Configuration:`);
            console.log(`   - Features: ${grapherConfig.features.length} features`);
            console.log(`   - Examples: ${grapherConfig.examples.length} examples`);
            console.log(`   - Learning Modes: ${grapherConfig.learningModes.join(', ')}`);
            
            this.demoResults.push({
                module: 'Math Grapher',
                status: 'success',
                metrics: {
                    modules: mathModules.length,
                    features: grapherConfig.features.length,
                    examples: grapherConfig.examples.length
                }
            });
            
        } catch (error) {
            console.error('❌ Math Grapher demo failed:', error.message);
            this.demoResults.push({
                module: 'Math Grapher',
                status: 'failed',
                error: error.message
            });
        }
        
        console.log('');
    }

    async demoDataStructureExplorer() {
        console.log('🌳 Demo 4: Data Structure Explorer');
        console.log('==================================');
        
        try {
            // Get data structure modules
            const modules = await this.visualizationEngine.getAvailableModules();
            const dataStructureModules = modules.filter(m => m.type === 'data_structure');
            
            console.log(`✅ Found ${dataStructureModules.length} data structure modules:`);
            dataStructureModules.forEach(module => {
                console.log(`   - ${module.name} (${module.difficulty})`);
            });
            
            // Demo binary tree configuration
            const binaryTreeConfig = await this.visualizationEngine.getModuleConfig('binary_tree');
            console.log(`\n✅ Binary Tree Configuration:`);
            console.log(`   - Features: ${binaryTreeConfig.features.length} features`);
            console.log(`   - Requirements: ${binaryTreeConfig.requirements.join(', ')}`);
            console.log(`   - Estimated Time: ${binaryTreeConfig.estimatedTime} minutes`);
            
            this.demoResults.push({
                module: 'Data Structure Explorer',
                status: 'success',
                metrics: {
                    modules: dataStructureModules.length,
                    features: binaryTreeConfig.features.length,
                    estimatedTime: binaryTreeConfig.estimatedTime
                }
            });
            
        } catch (error) {
            console.error('❌ Data Structure Explorer demo failed:', error.message);
            this.demoResults.push({
                module: 'Data Structure Explorer',
                status: 'failed',
                error: error.message
            });
        }
        
        console.log('');
    }

    async demoLearningAnalytics() {
        console.log('📊 Demo 5: Learning Analytics');
        console.log('=============================');
        
        try {
            // Create demo sessions
            const session1 = this.analytics.createSession('demo_session_1', 'bubble_sort', 'demo_user_1', 'exploration');
            const session2 = this.analytics.createSession('demo_session_2', 'pendulum', 'demo_user_1', 'guided');
            
            // Record interactions
            this.analytics.recordInteraction('demo_session_1', {
                type: 'algorithm_start',
                data: { algorithm: 'bubble_sort', dataSize: 20 },
                success: true,
                responseTime: 150
            });
            
            this.analytics.recordInteraction('demo_session_1', {
                type: 'step_complete',
                data: { step: 1, totalSteps: 10 },
                success: true,
                responseTime: 200
            });
            
            this.analytics.recordMistake('demo_session_1', {
                type: 'logic_error',
                description: 'Incorrect comparison logic',
                severity: 'medium'
            });
            
            this.analytics.provideFeedback('demo_session_1', {
                type: 'hint',
                message: 'Remember: bubble sort compares adjacent elements',
                helpful: true
            });
            
            // Complete sessions
            this.analytics.completeSession('demo_session_1');
            this.analytics.completeSession('demo_session_2');
            
            // Get analytics
            const session1Analytics = this.analytics.getSessionAnalytics('demo_session_1');
            const globalAnalytics = this.analytics.getGlobalAnalytics();
            
            console.log(`✅ Session Analytics:`);
            console.log(`   - Understanding Score: ${Math.round(session1Analytics.understandingScore * 100)}%`);
            console.log(`   - Interactions: ${session1Analytics.interactions}`);
            console.log(`   - Mistakes: ${session1Analytics.mistakesMade}`);
            console.log(`   - Duration: ${Math.round(session1Analytics.duration / 1000)}s`);
            
            console.log(`\n✅ Global Analytics:`);
            console.log(`   - Total Sessions: ${globalAnalytics.totalSessions}`);
            console.log(`   - Average Understanding: ${Math.round(globalAnalytics.averageUnderstandingScore * 100)}%`);
            console.log(`   - Total Time: ${Math.round(globalAnalytics.totalTimeSpent / 60000)}m`);
            
            this.demoResults.push({
                module: 'Learning Analytics',
                status: 'success',
                metrics: {
                    sessions: globalAnalytics.totalSessions,
                    averageScore: Math.round(globalAnalytics.averageUnderstandingScore * 100),
                    totalTime: Math.round(globalAnalytics.totalTimeSpent / 60000)
                }
            });
            
        } catch (error) {
            console.error('❌ Learning Analytics demo failed:', error.message);
            this.demoResults.push({
                module: 'Learning Analytics',
                status: 'failed',
                error: error.message
            });
        }
        
        console.log('');
    }

    async demoSessionManagement() {
        console.log('📝 Demo 6: Session Management');
        console.log('=============================');
        
        try {
            // Create sessions
            const session1 = this.sessionManager.createSession('bubble_sort', 'user_1', 'exploration');
            const session2 = this.sessionManager.createSession('pendulum', 'user_1', 'guided');
            
            console.log(`✅ Created ${session1.sessionId} and ${session2.sessionId}`);
            
            // Record interactions
            this.sessionManager.recordInteraction(session1.sessionId, {
                type: 'module_start',
                data: { module: 'bubble_sort' },
                success: true
            });
            
            this.sessionManager.updateProgress(session1.sessionId, {
                currentStep: 5,
                totalSteps: 10,
                completionRate: 50
            });
            
            // Get session stats
            const stats = this.sessionManager.getSessionStats();
            console.log(`✅ Session Statistics:`);
            console.log(`   - Total Sessions: ${stats.total}`);
            console.log(`   - Active Sessions: ${stats.active}`);
            console.log(`   - Completed Sessions: ${stats.completed}`);
            console.log(`   - Average Duration: ${stats.averageDuration}ms`);
            
            this.demoResults.push({
                module: 'Session Management',
                status: 'success',
                metrics: {
                    totalSessions: stats.total,
                    activeSessions: stats.active,
                    averageDuration: stats.averageDuration
                }
            });
            
        } catch (error) {
            console.error('❌ Session Management demo failed:', error.message);
            this.demoResults.push({
                module: 'Session Management',
                status: 'failed',
                error: error.message
            });
        }
        
        console.log('');
    }

    async demoPerformanceTesting() {
        console.log('⚡ Demo 7: Performance Testing');
        console.log('==============================');
        
        try {
            const startTime = Date.now();
            
            // Test module loading performance
            const modulesStart = Date.now();
            const modules = await this.visualizationEngine.getAvailableModules();
            const modulesTime = Date.now() - modulesStart;
            
            // Test session creation performance
            const sessionStart = Date.now();
            const session = this.sessionManager.createSession('test_module', 'test_user', 'exploration');
            const sessionTime = Date.now() - sessionStart;
            
            // Test analytics performance
            const analyticsStart = Date.now();
            const analytics = this.analytics.getGlobalAnalytics();
            const analyticsTime = Date.now() - analyticsStart;
            
            const totalTime = Date.now() - startTime;
            
            console.log(`✅ Performance Results:`);
            console.log(`   - Module Loading: ${modulesTime}ms`);
            console.log(`   - Session Creation: ${sessionTime}ms`);
            console.log(`   - Analytics Query: ${analyticsTime}ms`);
            console.log(`   - Total Demo Time: ${totalTime}ms`);
            
            this.demoResults.push({
                module: 'Performance Testing',
                status: 'success',
                metrics: {
                    moduleLoading: modulesTime,
                    sessionCreation: sessionTime,
                    analyticsQuery: analyticsTime,
                    totalTime: totalTime
                }
            });
            
        } catch (error) {
            console.error('❌ Performance Testing demo failed:', error.message);
            this.demoResults.push({
                module: 'Performance Testing',
                status: 'failed',
                error: error.message
            });
        }
        
        console.log('');
    }

    displayResults() {
        console.log('📋 Demo Results Summary');
        console.log('=======================');
        
        const successful = this.demoResults.filter(r => r.status === 'success').length;
        const failed = this.demoResults.filter(r => r.status === 'failed').length;
        
        console.log(`✅ Successful: ${successful}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📊 Total: ${this.demoResults.length}`);
        
        console.log('\n📈 Detailed Results:');
        this.demoResults.forEach((result, index) => {
            const status = result.status === 'success' ? '✅' : '❌';
            console.log(`${status} ${index + 1}. ${result.module}`);
            
            if (result.metrics) {
                Object.entries(result.metrics).forEach(([key, value]) => {
                    console.log(`   - ${key}: ${value}`);
                });
            }
            
            if (result.error) {
                console.log(`   - Error: ${result.error}`);
            }
        });
        
        console.log('\n🎉 Demo completed successfully!');
        console.log('🚀 Interactive Concept Visualization Tool is ready for use.');
    }
}

// Run demo if this file is executed directly
if (require.main === module) {
    const demo = new InteractiveLearningDemo();
    demo.runDemo().catch(console.error);
}

module.exports = InteractiveLearningDemo;
