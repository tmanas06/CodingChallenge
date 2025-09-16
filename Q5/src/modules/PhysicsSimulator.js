/**
 * Physics Simulator Module
 * Interactive physics simulations including pendulum, waves, and projectile motion
 */

class PhysicsSimulator {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.options = {
            width: 800,
            height: 600,
            gravity: 9.81,
            damping: 0.99,
            timeStep: 0.016, // ~60 FPS
            colors: {
                background: '#1a1a1a',
                pendulum: '#3498db',
                string: '#7f8c8d',
                wave: '#e74c3c',
                projectile: '#2ecc71',
                trail: '#95a5a6'
            },
            ...options
        };
        
        this.setupCanvas();
        this.reset();
        this.startAnimation();
    }

    setupCanvas() {
        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;
        this.ctx.fillStyle = this.options.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    reset() {
        this.simulation = null;
        this.isRunning = false;
        this.isPaused = false;
        this.time = 0;
        this.trail = [];
        this.callbacks = {
            onUpdate: null,
            onComplete: null
        };
    }

    // Pendulum Simulation
    createPendulum(length = 200, angle = Math.PI / 4, mass = 1) {
        this.simulation = {
            type: 'pendulum',
            length,
            angle,
            angularVelocity: 0,
            mass,
            pivot: { x: this.canvas.width / 2, y: 50 },
            bob: { x: 0, y: 0 },
            energy: 0,
            maxAngle: Math.abs(angle)
        };
        
        this.updatePendulumPosition();
        this.isRunning = true;
    }

    updatePendulumPosition() {
        const { length, angle, pivot } = this.simulation;
        this.simulation.bob.x = pivot.x + length * Math.sin(angle);
        this.simulation.bob.y = pivot.y + length * Math.cos(angle);
    }

    updatePendulum() {
        if (!this.simulation || this.simulation.type !== 'pendulum') return;
        
        const { length, mass, gravity } = this.simulation;
        const dt = this.options.timeStep;
        
        // Calculate angular acceleration
        const angularAcceleration = -(gravity / length) * Math.sin(this.simulation.angle);
        
        // Update angular velocity and angle
        this.simulation.angularVelocity += angularAcceleration * dt;
        this.simulation.angularVelocity *= this.options.damping; // Apply damping
        this.simulation.angle += this.simulation.angularVelocity * dt;
        
        // Update position
        this.updatePendulumPosition();
        
        // Calculate energy
        const kinetic = 0.5 * mass * Math.pow(this.simulation.angularVelocity * length, 2);
        const potential = mass * gravity * length * (1 - Math.cos(this.simulation.angle));
        this.simulation.energy = kinetic + potential;
        
        // Update max angle
        this.simulation.maxAngle = Math.max(this.simulation.maxAngle, Math.abs(this.simulation.angle));
    }

    renderPendulum() {
        const { pivot, bob, length, angle } = this.simulation;
        
        // Clear canvas
        this.ctx.fillStyle = this.options.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw string
        this.ctx.strokeStyle = this.options.colors.string;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(pivot.x, pivot.y);
        this.ctx.lineTo(bob.x, bob.y);
        this.ctx.stroke();
        
        // Draw pivot
        this.ctx.fillStyle = this.options.colors.string;
        this.ctx.beginPath();
        this.ctx.arc(pivot.x, pivot.y, 5, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw bob
        this.ctx.fillStyle = this.options.colors.pendulum;
        this.ctx.beginPath();
        this.ctx.arc(bob.x, bob.y, 15, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw angle indicator
        this.ctx.strokeStyle = this.options.colors.pendulum;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(pivot.x, pivot.y, 30, -Math.PI/2, -Math.PI/2 + angle);
        this.ctx.stroke();
        
        // Draw info
        this.drawPendulumInfo();
    }

    drawPendulumInfo() {
        const { angle, angularVelocity, energy, maxAngle } = this.simulation;
        
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        
        let y = 20;
        this.ctx.fillText(`Angle: ${(angle * 180 / Math.PI).toFixed(1)}°`, 10, y);
        y += 20;
        this.ctx.fillText(`Angular Velocity: ${(angularVelocity * 180 / Math.PI).toFixed(1)}°/s`, 10, y);
        y += 20;
        this.ctx.fillText(`Energy: ${energy.toFixed(2)} J`, 10, y);
        y += 20;
        this.ctx.fillText(`Max Angle: ${(maxAngle * 180 / Math.PI).toFixed(1)}°`, 10, y);
    }

    // Wave Interference Simulation
    createWaveInterference(wave1 = { amplitude: 50, frequency: 0.02, phase: 0 }, 
                          wave2 = { amplitude: 50, frequency: 0.02, phase: Math.PI }) {
        this.simulation = {
            type: 'wave_interference',
            wave1: { ...wave1, x: 100 },
            wave2: { ...wave2, x: this.canvas.width - 100 },
            time: 0,
            points: []
        };
        
        this.isRunning = true;
    }

    updateWaveInterference() {
        if (!this.simulation || this.simulation.type !== 'wave_interference') return;
        
        this.simulation.time += this.options.timeStep;
        this.simulation.points = [];
        
        for (let x = 0; x < this.canvas.width; x += 2) {
            const y1 = this.canvas.height / 2 + 
                      this.simulation.wave1.amplitude * 
                      Math.sin(this.simulation.wave1.frequency * x - this.simulation.time + this.simulation.wave1.phase);
            
            const y2 = this.canvas.height / 2 + 
                      this.simulation.wave2.amplitude * 
                      Math.sin(this.simulation.wave2.frequency * x - this.simulation.time + this.simulation.wave2.phase);
            
            const interference = y1 + y2;
            
            this.simulation.points.push({ x, y1, y2, interference });
        }
    }

    renderWaveInterference() {
        // Clear canvas
        this.ctx.fillStyle = this.options.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!this.simulation.points.length) return;
        
        // Draw individual waves
        this.ctx.strokeStyle = this.options.colors.wave;
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.7;
        
        // Wave 1
        this.ctx.beginPath();
        this.simulation.points.forEach((point, index) => {
            if (index === 0) {
                this.ctx.moveTo(point.x, point.y1);
            } else {
                this.ctx.lineTo(point.x, point.y1);
            }
        });
        this.ctx.stroke();
        
        // Wave 2
        this.ctx.strokeStyle = '#3498db';
        this.ctx.beginPath();
        this.simulation.points.forEach((point, index) => {
            if (index === 0) {
                this.ctx.moveTo(point.x, point.y2);
            } else {
                this.ctx.lineTo(point.x, point.y2);
            }
        });
        this.ctx.stroke();
        
        // Draw interference pattern
        this.ctx.strokeStyle = '#f39c12';
        this.ctx.lineWidth = 3;
        this.ctx.globalAlpha = 1;
        this.ctx.beginPath();
        this.simulation.points.forEach((point, index) => {
            if (index === 0) {
                this.ctx.moveTo(point.x, point.interference);
            } else {
                this.ctx.lineTo(point.x, point.interference);
            }
        });
        this.ctx.stroke();
        
        this.ctx.globalAlpha = 1;
        
        // Draw info
        this.drawWaveInfo();
    }

    drawWaveInfo() {
        const { wave1, wave2, time } = this.simulation;
        
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        
        let y = 20;
        this.ctx.fillText(`Wave 1 - Amplitude: ${wave1.amplitude}, Frequency: ${wave1.frequency.toFixed(3)}`, 10, y);
        y += 20;
        this.ctx.fillText(`Wave 2 - Amplitude: ${wave2.amplitude}, Frequency: ${wave2.frequency.toFixed(3)}`, 10, y);
        y += 20;
        this.ctx.fillText(`Time: ${time.toFixed(2)}s`, 10, y);
    }

    // Projectile Motion Simulation
    createProjectileMotion(initialVelocity = 50, angle = 45, initialHeight = 0) {
        this.simulation = {
            type: 'projectile_motion',
            x: 50,
            y: this.canvas.height - 50 - initialHeight,
            vx: initialVelocity * Math.cos(angle * Math.PI / 180),
            vy: initialVelocity * Math.sin(angle * Math.PI / 180),
            initialVelocity,
            angle,
            gravity: this.options.gravity,
            trail: [],
            maxHeight: initialHeight,
            range: 0,
            time: 0
        };
        
        this.isRunning = true;
    }

    updateProjectileMotion() {
        if (!this.simulation || this.simulation.type !== 'projectile_motion') return;
        
        const dt = this.options.timeStep;
        this.simulation.time += dt;
        
        // Update position
        this.simulation.x += this.simulation.vx * dt;
        this.simulation.y -= this.simulation.vy * dt;
        
        // Update velocity (gravity)
        this.simulation.vy -= this.simulation.gravity * dt;
        
        // Add to trail
        this.simulation.trail.push({ x: this.simulation.x, y: this.simulation.y });
        if (this.simulation.trail.length > 100) {
            this.simulation.trail.shift();
        }
        
        // Update max height
        this.simulation.maxHeight = Math.max(this.simulation.maxHeight, 
            this.canvas.height - this.simulation.y);
        
        // Check if hit ground
        if (this.simulation.y >= this.canvas.height - 50) {
            this.simulation.y = this.canvas.height - 50;
            this.simulation.range = this.simulation.x;
            this.isRunning = false;
            this.callbacks.onComplete?.(this.simulation);
        }
    }

    renderProjectileMotion() {
        // Clear canvas
        this.ctx.fillStyle = this.options.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ground
        this.ctx.fillStyle = '#8b4513';
        this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
        
        // Draw trail
        if (this.simulation.trail.length > 1) {
            this.ctx.strokeStyle = this.options.colors.trail;
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = 0.5;
            this.ctx.beginPath();
            this.simulation.trail.forEach((point, index) => {
                if (index === 0) {
                    this.ctx.moveTo(point.x, point.y);
                } else {
                    this.ctx.lineTo(point.x, point.y);
                }
            });
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        }
        
        // Draw projectile
        this.ctx.fillStyle = this.options.colors.projectile;
        this.ctx.beginPath();
        this.ctx.arc(this.simulation.x, this.simulation.y, 8, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw velocity vector
        this.ctx.strokeStyle = this.options.colors.projectile;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(this.simulation.x, this.simulation.y);
        this.ctx.lineTo(this.simulation.x + this.simulation.vx * 2, 
                       this.simulation.y - this.simulation.vy * 2);
        this.ctx.stroke();
        
        // Draw info
        this.drawProjectileInfo();
    }

    drawProjectileInfo() {
        const { x, y, vx, vy, maxHeight, range, time, initialVelocity, angle } = this.simulation;
        
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        
        let yPos = 20;
        this.ctx.fillText(`Initial Velocity: ${initialVelocity.toFixed(1)} m/s`, 10, yPos);
        yPos += 20;
        this.ctx.fillText(`Angle: ${angle.toFixed(1)}°`, 10, yPos);
        yPos += 20;
        this.ctx.fillText(`Position: (${x.toFixed(1)}, ${(this.canvas.height - y).toFixed(1)})`, 10, yPos);
        yPos += 20;
        this.ctx.fillText(`Velocity: (${vx.toFixed(1)}, ${(-vy).toFixed(1)}) m/s`, 10, yPos);
        yPos += 20;
        this.ctx.fillText(`Max Height: ${maxHeight.toFixed(1)} m`, 10, yPos);
        yPos += 20;
        this.ctx.fillText(`Range: ${range.toFixed(1)} m`, 10, yPos);
        yPos += 20;
        this.ctx.fillText(`Time: ${time.toFixed(2)} s`, 10, yPos);
    }

    // Animation loop
    startAnimation() {
        const animate = () => {
            if (this.isRunning && !this.isPaused) {
                this.update();
                this.render();
                this.callbacks.onUpdate?.(this.getState());
            }
            requestAnimationFrame(animate);
        };
        animate();
    }

    update() {
        if (!this.simulation) return;
        
        switch (this.simulation.type) {
            case 'pendulum':
                this.updatePendulum();
                break;
            case 'wave_interference':
                this.updateWaveInterference();
                break;
            case 'projectile_motion':
                this.updateProjectileMotion();
                break;
        }
    }

    render() {
        if (!this.simulation) return;
        
        switch (this.simulation.type) {
            case 'pendulum':
                this.renderPendulum();
                break;
            case 'wave_interference':
                this.renderWaveInterference();
                break;
            case 'projectile_motion':
                this.renderProjectileMotion();
                break;
        }
    }

    // Control methods
    play() {
        this.isRunning = true;
        this.isPaused = false;
    }

    pause() {
        this.isPaused = true;
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;
        this.reset();
    }

    setGravity(gravity) {
        this.options.gravity = gravity;
        if (this.simulation) {
            this.simulation.gravity = gravity;
        }
    }

    setDamping(damping) {
        this.options.damping = damping;
    }

    // Event handlers
    onUpdate(callback) {
        this.callbacks.onUpdate = callback;
    }

    onComplete(callback) {
        this.callbacks.onComplete = callback;
    }

    // Get current state
    getState() {
        return {
            simulation: this.simulation ? { ...this.simulation } : null,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            time: this.time
        };
    }

    destroy() {
        this.stop();
        this.callbacks = {};
    }
}

module.exports = PhysicsSimulator;
