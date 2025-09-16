/**
 * Achievement System for Adaptive Learning Tracker
 * Handles badges, milestones, and progress rewards
 */

class AchievementSystem {
    constructor() {
        this.achievements = new Map();
        this.userAchievements = new Map();
        this.initializeAchievements();
    }

    initializeAchievements() {
        // Learning achievements
        this.achievements.set('first_skill', {
            id: 'first_skill',
            name: 'First Steps',
            description: 'Complete your first skill assessment',
            category: 'learning',
            icon: '🎓',
            condition: (progress) => progress.completed_skills.length >= 1,
            points: 10
        });

        this.achievements.set('skill_master', {
            id: 'skill_master',
            name: 'Skill Master',
            description: 'Master 5 different skills',
            category: 'learning',
            icon: '🏆',
            condition: (progress) => progress.completed_skills.length >= 5,
            points: 50
        });

        this.achievements.set('expert_learner', {
            id: 'expert_learner',
            name: 'Expert Learner',
            description: 'Master 10 different skills',
            category: 'learning',
            icon: '🎯',
            condition: (progress) => progress.completed_skills.length >= 10,
            points: 100
        });

        // Streak achievements
        this.achievements.set('daily_learner', {
            id: 'daily_learner',
            name: 'Daily Learner',
            description: 'Maintain a 7-day learning streak',
            category: 'streak',
            icon: '🔥',
            condition: (progress) => progress.streak_days >= 7,
            points: 25
        });

        this.achievements.set('dedicated_student', {
            id: 'dedicated_student',
            name: 'Dedicated Student',
            description: 'Maintain a 30-day learning streak',
            category: 'streak',
            icon: '💪',
            condition: (progress) => progress.streak_days >= 30,
            points: 100
        });

        // Mastery achievements
        this.achievements.set('perfect_score', {
            id: 'perfect_score',
            name: 'Perfect Score',
            description: 'Achieve a perfect score on any assessment',
            category: 'mastery',
            icon: '⭐',
            condition: (progress, assessment) => assessment && assessment.average_score >= 100,
            points: 20
        });

        this.achievements.set('speed_learner', {
            id: 'speed_learner',
            name: 'Speed Learner',
            description: 'Complete an assessment in under 30 seconds',
            category: 'mastery',
            icon: '⚡',
            condition: (progress, assessment) => assessment && assessment.timeSpent < 30,
            points: 15
        });

        // Exploration achievements
        this.achievements.set('curious_mind', {
            id: 'curious_mind',
            name: 'Curious Mind',
            description: 'Try 3 different types of assessments',
            category: 'exploration',
            icon: '🔍',
            condition: (progress) => this.getAssessmentTypesTried(progress).length >= 3,
            points: 30
        });

        this.achievements.set('versatile_learner', {
            id: 'versatile_learner',
            name: 'Versatile Learner',
            description: 'Complete all types of assessments',
            category: 'exploration',
            icon: '🎨',
            condition: (progress) => this.getAssessmentTypesTried(progress).length >= 4,
            points: 50
        });

        // Time-based achievements
        this.achievements.set('time_investor', {
            id: 'time_investor',
            name: 'Time Investor',
            description: 'Spend 10 hours learning',
            category: 'learning',
            icon: '⏰',
            condition: (progress) => progress.total_time_spent >= 36000, // 10 hours in seconds
            points: 40
        });

        this.achievements.set('learning_marathon', {
            id: 'learning_marathon',
            name: 'Learning Marathon',
            description: 'Spend 100 hours learning',
            category: 'learning',
            icon: '🏃',
            condition: (progress) => progress.total_time_spent >= 360000, // 100 hours in seconds
            points: 200
        });

        // Difficulty achievements
        this.achievements.set('challenge_accepted', {
            id: 'challenge_accepted',
            name: 'Challenge Accepted',
            description: 'Complete a level 5 skill',
            category: 'mastery',
            icon: '💎',
            condition: (progress) => this.hasCompletedDifficultyLevel(progress, 5),
            points: 75
        });

        this.achievements.set('progressive_learner', {
            id: 'progressive_learner',
            name: 'Progressive Learner',
            description: 'Complete skills at all difficulty levels',
            category: 'mastery',
            icon: '📈',
            condition: (progress) => this.hasCompletedAllDifficultyLevels(progress),
            points: 100
        });
    }

    checkAchievements(userId, progress, assessment = null) {
        const newAchievements = [];
        const currentAchievements = this.userAchievements.get(userId) || [];

        for (const [achievementId, achievement] of this.achievements) {
            // Skip if already earned
            if (currentAchievements.some(a => a.id === achievementId)) {
                continue;
            }

            // Check if condition is met
            if (achievement.condition(progress, assessment)) {
                const earnedAchievement = {
                    ...achievement,
                    earned_at: new Date().toISOString(),
                    user_id: userId
                };

                newAchievements.push(earnedAchievement);
                currentAchievements.push(earnedAchievement);
            }
        }

        if (newAchievements.length > 0) {
            this.userAchievements.set(userId, currentAchievements);
        }

        return newAchievements;
    }

    getUserAchievements(userId) {
        return this.userAchievements.get(userId) || [];
    }

    getAchievementStats(userId) {
        const achievements = this.getUserAchievements(userId);
        const totalPoints = achievements.reduce((sum, a) => sum + a.points, 0);
        
        const byCategory = {};
        achievements.forEach(achievement => {
            if (!byCategory[achievement.category]) {
                byCategory[achievement.category] = [];
            }
            byCategory[achievement.category].push(achievement);
        });

        return {
            total: achievements.length,
            totalPoints,
            byCategory,
            recent: achievements.slice(-5).reverse()
        };
    }

    getAvailableAchievements(userId) {
        const earnedIds = new Set(this.getUserAchievements(userId).map(a => a.id));
        return Array.from(this.achievements.values()).filter(a => !earnedIds.has(a.id));
    }

    getProgressTowardsAchievement(userId, achievementId) {
        const achievement = this.achievements.get(achievementId);
        if (!achievement) return null;

        const userProgress = this.getUserProgress(userId);
        if (!userProgress) return null;

        // This is a simplified version - in a real implementation,
        // you'd have more sophisticated progress tracking
        return {
            achievement,
            progress: 0, // Would calculate actual progress
            isEarned: this.getUserAchievements(userId).some(a => a.id === achievementId)
        };
    }

    // Helper methods
    getAssessmentTypesTried(progress) {
        const types = new Set();
        if (progress.skills) {
            Object.values(progress.skills).forEach(skill => {
                if (skill.assessment_types) {
                    skill.assessment_types.forEach(type => types.add(type));
                }
            });
        }
        return Array.from(types);
    }

    hasCompletedDifficultyLevel(progress, level) {
        if (!progress.skills) return false;
        return Object.values(progress.skills).some(skill => 
            skill.mastery_level >= 0.85 && skill.difficulty_level === level
        );
    }

    hasCompletedAllDifficultyLevels(progress) {
        if (!progress.skills) return false;
        const completedLevels = new Set();
        Object.values(progress.skills).forEach(skill => {
            if (skill.mastery_level >= 0.85) {
                completedLevels.add(skill.difficulty_level);
            }
        });
        return completedLevels.size >= 5; // Assuming levels 1-5
    }

    getUserProgress(userId) {
        // This would typically fetch from the progress tracker
        // For now, return a mock object
        return {
            completed_skills: [],
            skills: {},
            total_time_spent: 0,
            streak_days: 0
        };
    }

    // Achievement notification system
    createAchievementNotification(achievement) {
        return {
            type: 'achievement',
            title: 'Achievement Unlocked!',
            message: `${achievement.name}: ${achievement.description}`,
            icon: achievement.icon,
            points: achievement.points,
            timestamp: new Date().toISOString()
        };
    }

    // Leaderboard functionality
    getLeaderboard(limit = 10) {
        const leaderboard = [];
        
        for (const [userId, achievements] of this.userAchievements) {
            const totalPoints = achievements.reduce((sum, a) => sum + a.points, 0);
            leaderboard.push({
                userId,
                totalPoints,
                achievementCount: achievements.length,
                lastAchievement: achievements[achievements.length - 1]?.earned_at
            });
        }

        return leaderboard
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .slice(0, limit);
    }

    // Badge system
    getBadges(userId) {
        const achievements = this.getUserAchievements(userId);
        const badges = [];

        // Calculate badge levels based on achievements
        const learningCount = achievements.filter(a => a.category === 'learning').length;
        const streakCount = achievements.filter(a => a.category === 'streak').length;
        const masteryCount = achievements.filter(a => a.category === 'mastery').length;

        if (learningCount >= 1) badges.push({ name: 'Learner', level: 1, icon: '🎓' });
        if (learningCount >= 5) badges.push({ name: 'Scholar', level: 2, icon: '📚' });
        if (learningCount >= 10) badges.push({ name: 'Expert', level: 3, icon: '🎯' });

        if (streakCount >= 1) badges.push({ name: 'Consistent', level: 1, icon: '🔥' });
        if (streakCount >= 2) badges.push({ name: 'Dedicated', level: 2, icon: '💪' });

        if (masteryCount >= 1) badges.push({ name: 'Skilled', level: 1, icon: '⭐' });
        if (masteryCount >= 3) badges.push({ name: 'Master', level: 2, icon: '🏆' });

        return badges;
    }

    // Export/Import functionality
    exportUserAchievements(userId) {
        const achievements = this.getUserAchievements(userId);
        return {
            userId,
            achievements,
            exported_at: new Date().toISOString(),
            version: '1.0'
        };
    }

    importUserAchievements(data) {
        if (data.userId && data.achievements) {
            this.userAchievements.set(data.userId, data.achievements);
            return true;
        }
        return false;
    }
}

module.exports = { AchievementSystem };
