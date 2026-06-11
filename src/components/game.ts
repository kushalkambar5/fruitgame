import Matter from 'matter-js';

// Game fruit configurations
export interface FruitDef {
  name: string;
  emoji: string;
  radius: number;
  color: string;
  score: number;
}

export const FRUITS: FruitDef[] = [
  { name: 'Cherry', emoji: '🍒', radius: 15, color: '#ff4d4d', score: 1 },
  { name: 'Strawberry', emoji: '🍓', radius: 22, color: '#eb367f', score: 2 },
  { name: 'Grape', emoji: '🍇', radius: 29, color: '#7928ca', score: 4 },
  { name: 'Orange', emoji: '🍊', radius: 37, color: '#f5a623', score: 8 },
  { name: 'Apple', emoji: '🍎', radius: 46, color: '#ee0000', score: 16 },
  { name: 'Pear', emoji: '🍐', radius: 56, color: '#29bc9b', score: 32 },
  { name: 'Peach', emoji: '🍑', radius: 68, color: '#ff9999', score: 64 },
  { name: 'Pineapple', emoji: '🍍', radius: 80, color: '#f9cb28', score: 128 },
  { name: 'Melon', emoji: '🍈', radius: 94, color: '#aaffec', score: 256 },
  { name: 'Watermelon', emoji: '🍉', radius: 110, color: '#0070f3', score: 512 }
];

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface MergeAnimation {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  emoji: string;
  radius: number;
  targetX: number;
  targetY: number;
  nextIndex: number;
  progress: number;
  duration: number;
}

export interface GameStats {
  score: number;
  highScore: number;
  combo: number;
  level: number;
  shakeCharges: number;
  gcCharges: number;
  hotfixCharges: number;
}

// Web Audio API Sound Synthesizer
class SoundEngine {
  private ctx: AudioContext | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playDrop() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playMerge() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playCombo(combo: number) {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const pitch = 400 + combo * 100;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playCmd() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(220, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playGameOver() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.8);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.8);
  }
}

export type LogType = 'info' | 'success' | 'warning' | 'error' | 'cmd';

export class GameEngine {
  // Matter.js components
  private engine: Matter.Engine;
  private runner: Matter.Runner;

  // Viewport / canvas
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 440;
  private height: number = 640;

  // Game state
  public stats: GameStats = {
    score: 0,
    highScore: 0,
    combo: 0,
    level: 1,
    shakeCharges: 1,
    gcCharges: 0,
    hotfixCharges: 0,
  };

  private gameMode: 'classic' | 'zen' | 'time' = 'classic';
  public gameOver: boolean = false;
  private isDestroyed: boolean = false;
  private animationFrameId: number | null = null;
  private timeRemaining: number = 120; // 2 minutes for Time Attack
  private timeIntervalId: number | null = null;
  private redLineY: number = 120; // Align with top of bucket
  private redLineWarning: boolean = false;
  private redLineTimer: number = 0; // Duration stationary fruit is above red line
  private dropCooldown: boolean = false;
  private nextFruitIndex: number = 0;
  private previewX: number = 220;

  // CLI / hotfix status
  public hotfixActive: boolean = false;

  // Sounds
  private sounds = new SoundEngine();

  // Animations & Particles
  private particles: Particle[] = [];
  private activeMerges: MergeAnimation[] = [];

  // Listeners
  private onLogCallback: (msg: string, type: LogType) => void;
  private onStatsCallback: (stats: GameStats) => void;
  private onGameOverCallback: (score: number) => void;
  private onTimerCallback: (seconds: number) => void;

  constructor(
    canvas: HTMLCanvasElement,
    callbacks: {
      onLog: (msg: string, type: LogType) => void;
      onStats: (stats: GameStats) => void;
      onGameOver: (score: number) => void;
      onTimer: (seconds: number) => void;
    }
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onLogCallback = callbacks.onLog;
    this.onStatsCallback = callbacks.onStats;
    this.onGameOverCallback = callbacks.onGameOver;
    this.onTimerCallback = callbacks.onTimer;

    // Initialize Matter.js
    this.engine = Matter.Engine.create({
      gravity: { y: 1.3 } // Satisfying gravity
    });
    this.runner = Matter.Runner.create();

    this.setupWorld();
    this.setupEvents();
    this.rollNextFruit();
  }

  private setupWorld() {
    const wallOptions = { isStatic: true, friction: 0.1, restitution: 0.2 };
    // Bucket boundaries: bottom wall at y = 614, side walls at x = 36 and x = 404
    const bottomWall = Matter.Bodies.rectangle(220, 614, 328, 8, wallOptions);
    const leftWall = Matter.Bodies.rectangle(36, 365, 8, 490, wallOptions);
    const rightWall = Matter.Bodies.rectangle(404, 365, 8, 490, wallOptions);

    // Label walls as static
    (bottomWall as any).label = 'wall';
    (leftWall as any).label = 'wall';
    (rightWall as any).label = 'wall';

    Matter.Composite.add(this.engine.world, [bottomWall, leftWall, rightWall]);
  }

  private setupEvents() {
    // Listen for collisions to handle merges
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      const pairs = event.pairs;

      for (let i = 0; i < pairs.length; i++) {
        const { bodyA, bodyB } = pairs[i];
        
        // Ensure both bodies are fruits and have matching types
        const labelA = (bodyA as any).fruitIndex;
        const labelB = (bodyB as any).fruitIndex;

        if (labelA !== undefined && labelB !== undefined && labelA === labelB) {
          const index = labelA;

          // Prevent double merging of same body in same tick
          if ((bodyA as any).isMerging || (bodyB as any).isMerging) {
            continue;
          }

          // Don't merge beyond Watermelon
          if (index >= FRUITS.length - 1) {
            continue;
          }

          (bodyA as any).isMerging = true;
          (bodyB as any).isMerging = true;

          // Calculate middle point for spawn
          const x = (bodyA.position.x + bodyB.position.x) / 2;
          const y = (bodyA.position.y + bodyB.position.y) / 2;

          const prevFruit = FRUITS[index];
          this.activeMerges.push({
            x1: bodyA.position.x,
            y1: bodyA.position.y,
            x2: bodyB.position.x,
            y2: bodyB.position.y,
            emoji: prevFruit.emoji,
            radius: prevFruit.radius,
            targetX: x,
            targetY: y,
            nextIndex: index + 1,
            progress: 0,
            duration: 18 // 18 frames (~300ms)
          });

          // Remove old bodies immediately from the physics world
          Matter.Composite.remove(this.engine.world, bodyA);
          Matter.Composite.remove(this.engine.world, bodyB);
        }
      }
    });
  }

  // Log outputs to the fake console
  private log(message: string, type: LogType = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    this.onLogCallback(`${timestamp}  ${message}`, type);
  }

  private updateStats() {
    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
      localStorage.setItem(`fg_highscore_${this.gameMode}`, this.stats.highScore.toString());
    }
    // Simple level progression based on score
    this.stats.level = Math.floor(this.stats.score / 500) + 1;
    this.onStatsCallback({ ...this.stats });
  }

  public start(mode: 'classic' | 'zen' | 'time' = 'classic') {
    this.gameMode = mode;
    this.gameOver = false;
    this.isDestroyed = false;
    this.stats.score = 0;
    this.stats.combo = 0;
    this.activeMerges = [];

    // Load Highscore for specific mode
    const savedHighScore = localStorage.getItem(`fg_highscore_${mode}`);
    this.stats.highScore = savedHighScore ? parseInt(savedHighScore, 10) : 0;

    this.stats.shakeCharges = 1;
    this.stats.gcCharges = mode === 'zen' ? 1 : 0;
    this.stats.hotfixCharges = 0;
    this.updateStats();

    // Cancel existing animation loop if any
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Reset Engine world (keep only walls)
    const bodies = Matter.Composite.allBodies(this.engine.world);
    bodies.forEach((body) => {
      if ((body as any).label !== 'wall') {
        Matter.Composite.remove(this.engine.world, body);
      }
    });

    this.log(`[PIPELINE] Booting deployment pipeline in [${mode.toUpperCase()}] mode...`, 'info');
    this.log(`[SYSTEM] Environment variables loaded. Sandbox initialized.`, 'info');

    // Timer management for Time Attack
    if (this.timeIntervalId) {
      window.clearInterval(this.timeIntervalId);
    }
    if (mode === 'time') {
      this.timeRemaining = 120;
      this.onTimerCallback(this.timeRemaining);
      this.timeIntervalId = window.setInterval(() => {
        this.timeRemaining--;
        this.onTimerCallback(this.timeRemaining);
        if (this.timeRemaining <= 0) {
          this.triggerGameOver('Pipeline sprint timer expired.');
        }
      }, 1000);
    }

    // Run Engine & animation frame
    Matter.Runner.run(this.runner, this.engine);
    this.animate();
  }

  private rollNextFruit() {
    // Only roll indices 0 to 4 (Cherry, Strawberry, Grape, Orange, Apple) for drop
    this.nextFruitIndex = Math.floor(Math.random() * 5);
  }

  // Spawns fruit at location
  private spawnFruit(x: number, y: number, fruitIndex: number, isDynamic: boolean = true): Matter.Body {
    const fruit = FRUITS[fruitIndex];
    const options = {
      restitution: 0.12, // slightly lower bounce for more solid feeling
      friction: 0.12, // increased friction to slow down rolling
      frictionAir: 0.02, // slightly increased air friction
      label: 'fruit'
    };

    const body = Matter.Bodies.circle(x, y, fruit.radius, options);
    (body as any).fruitIndex = fruitIndex;
    (body as any).isMerging = false;

    Matter.Composite.add(this.engine.world, body);
    return body;
  }

  // Handle player drop action
  public dropActiveFruit(clickX: number) {
    if (this.gameOver) return;
    if (this.dropCooldown) return;

    // Boundary limits (constrained inside the bucket walls)
    const fruit = FRUITS[this.nextFruitIndex];
    const leftLimit = 40 + fruit.radius;
    const rightLimit = 400 - fruit.radius;
    const dropX = Math.max(leftLimit, Math.min(clickX, rightLimit));

    this.sounds.playDrop();
    this.spawnFruit(dropX, 50, this.nextFruitIndex);
    this.log(`[DEPLOY] Pushed commit containing [${fruit.name} ${fruit.emoji}] at x = ${Math.round(dropX)}px`, 'info');

    // Roll next and trigger cooldown
    this.rollNextFruit();
    this.dropCooldown = true;
    
    // Quick cooldown so fruits don't stack drop immediately
    setTimeout(() => {
      this.dropCooldown = false;
    }, 450);
  }

  // Trigger Hotfix click selection
  public applyHotfixClick(clickX: number, clickY: number) {
    if (!this.hotfixActive || this.stats.hotfixCharges <= 0) return;

    const bodies = Matter.Composite.allBodies(this.engine.world);
    let targetBody: Matter.Body | null = null;
    let closestDist = 999999;

    // Find closest fruit clicked
    bodies.forEach((body) => {
      if ((body as any).label === 'fruit') {
        const dx = body.position.x - clickX;
        const dy = body.position.y - clickY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radius = FRUITS[(body as any).fruitIndex].radius;
        
        if (dist < radius + 15 && dist < closestDist) {
          closestDist = dist;
          targetBody = body;
        }
      }
    });

    if (targetBody) {
      const idx = (targetBody as any).fruitIndex;
      if (idx < FRUITS.length - 1) {
        const x = (targetBody as any).position.x;
        const y = (targetBody as any).position.y;

        Matter.Composite.remove(this.engine.world, targetBody);
        this.spawnFruit(x, y, idx + 1);
        this.createExplosion(x, y, FRUITS[idx + 1].color);
        
        this.stats.hotfixCharges--;
        this.hotfixActive = false;
        this.sounds.playCmd();
        this.log(`[RUN] npm run hotfix completed. Upgraded ${FRUITS[idx].emoji} to ${FRUITS[idx+1].emoji} directly.`, 'cmd');
        this.updateStats();
      } else {
        this.log(`[ERROR] Cannot hotfix Watermelon. Maximum release achieved.`, 'error');
        this.hotfixActive = false;
      }
    } else {
      this.log(`[WARNING] Hotfix target not found. Click directly on a fruit to upgrade.`, 'warning');
      this.hotfixActive = false;
    }
  }

  // CLI Powerups: npm run shake
  public runCmdShake() {
    if (this.gameOver) return;
    if (this.stats.shakeCharges <= 0) {
      this.log(`[ERROR] Command failed: "npm run shake". Insufficient charges.`, 'error');
      return;
    }

    this.sounds.playCmd();
    this.stats.shakeCharges--;
    this.log(`[RUN] Running "npm run shake"... Restructuring container assets.`, 'cmd');

    const bodies = Matter.Composite.allBodies(this.engine.world);
    bodies.forEach((body) => {
      if ((body as any).label === 'fruit') {
        const forceX = (Math.random() - 0.5) * 0.05;
        const forceY = -0.09 * body.mass; // lift up slightly
        Matter.Body.applyForce(body, body.position, { x: forceX, y: forceY });
      }
    });

    this.updateStats();
  }

  // CLI Powerups: npm run gc
  public runCmdGC() {
    if (this.gameOver) return;
    if (this.stats.gcCharges <= 0) {
      this.log(`[ERROR] Command failed: "npm run gc". Insufficient charges.`, 'error');
      return;
    }

    this.sounds.playCmd();
    this.log(`[RUN] Running "npm run gc"... Triggering memory garbage collection.`, 'cmd');

    const bodies = Matter.Composite.allBodies(this.engine.world);
    let count = 0;
    bodies.forEach((body) => {
      if ((body as any).label === 'fruit' && (body as any).fruitIndex === 0) { // Cherry (index 0)
        this.createExplosion(body.position.x, body.position.y, FRUITS[0].color);
        Matter.Composite.remove(this.engine.world, body);
        count++;
      }
    });

    this.stats.gcCharges--;
    this.log(`[RUN] Garbage collection successfully purged ${count} Cherry instances.`, 'cmd');
    this.updateStats();
  }

  // CLI Powerups: npm run hotfix
  public enableHotfix() {
    if (this.gameOver) return;
    if (this.stats.hotfixCharges <= 0) {
      this.log(`[ERROR] Command failed: "npm run hotfix". Insufficient charges.`, 'error');
      return;
    }
    this.hotfixActive = true;
    this.log(`[RUN] "npm run hotfix" active. CLICK directly on a deployed fruit inside the container to upgrade it.`, 'cmd');
  }

  // Create particles on merge
  private createExplosion(x: number, y: number, color: string) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      const life = Math.random() * 20 + 20;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 4 + 2,
        color,
        alpha: 1.0,
        life,
        maxLife: life
      });
    }
  }

  // Main rendering loop
  private animate() {
    if (this.gameOver || this.isDestroyed) return;

    this.updateLogic();
    this.draw();

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  // Update game variables
  private updateLogic() {
    // 1. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // small gravity on particles
      p.life--;
      p.alpha = p.life / p.maxLife;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 1b. Update Merge Animations
    for (let i = this.activeMerges.length - 1; i >= 0; i--) {
      const m = this.activeMerges[i];
      m.progress += 1 / m.duration;
      if (m.progress >= 1.0) {
        // Spawn the new merged fruit
        this.spawnFruit(m.targetX, m.targetY, m.nextIndex);

        const fruit = FRUITS[m.nextIndex];
        const prevFruit = FRUITS[m.nextIndex - 1];

        // Combo handling
        this.stats.combo++;
        const comboBonus = this.stats.combo > 1 ? this.stats.combo - 1 : 0;
        const pointsGained = fruit.score + comboBonus;
        this.stats.score += pointsGained;

        // Play Sound
        if (this.stats.combo > 1) {
          this.sounds.playCombo(this.stats.combo);
          this.log(`[COMBO] x${this.stats.combo}! Merged ${prevFruit.emoji} + ${prevFruit.emoji} -> ${fruit.emoji} (+${pointsGained} score)`, 'success');
        } else {
          this.sounds.playMerge();
          this.log(`[MERGE] ${prevFruit.emoji} + ${prevFruit.emoji} successfully compiled into ${fruit.emoji} (+${pointsGained} score)`, 'success');
        }

        // Trigger particle explosion
        this.createExplosion(m.targetX, m.targetY, fruit.color);

        // Earn Power-ups based on merges
        if (m.nextIndex >= 5 && Math.random() < 0.3) {
          this.stats.shakeCharges++;
          this.log(`[PIPELINE] High-tier merge! Earned 1 "shake" charge.`, 'info');
        }
        if (m.nextIndex >= 7 && Math.random() < 0.4) {
          this.stats.gcCharges++;
          this.log(`[PIPELINE] High-tier merge! Earned 1 "gc" charge.`, 'info');
        }
        if (m.nextIndex === 9) {
          this.stats.hotfixCharges++;
          this.log(`[PIPELINE] Melon created! Earned 1 "hotfix" charge.`, 'info');
        }

        this.updateStats();

        // Remove the finished merge animation
        this.activeMerges.splice(i, 1);
      }
    }

    // 2. Combo Decay
    // If no merges happen for 3 seconds, reset combo
    // Matter.Events can trigger merge. We decay combo in constructor or track time
    // Let's reset combo if fruits are moving slowly and no collisions happened
    // Matter.js engine speeds can be a trigger, but simple timeout or speed checks work.
    // For simplicity, let's reset combo when there is no merger after 4 seconds.
    // Let's implement speed check: if almost all fruits are stationary, combo decays.
    const bodies = Matter.Composite.allBodies(this.engine.world);
    let allStationary = true;
    let fruitAboveLine = false;

    bodies.forEach((body) => {
      if ((body as any).label === 'fruit') {
        // Apply angular damping to slow down the fast rolling
        Matter.Body.setAngularVelocity(body, body.angularVelocity * 0.90);
        
        // Apply minor horizontal damping so they don't slide endlessly like on ice
        Matter.Body.setVelocity(body, { 
          x: body.velocity.x * 0.99, 
          y: body.velocity.y 
        });

        const speed = body.speed;
        if (speed > 0.4) {
          allStationary = false;
        }

        // Check for Red Line Overflow (Game Over checks)
        // Check top boundary of fruit (position.y - radius)
        const fruitIdx = (body as any).fruitIndex;
        const radius = FRUITS[fruitIdx].radius;
        if (body.position.y - radius < this.redLineY) {
          // It's above the line
          fruitAboveLine = true;
        }
      }
    });

    if (allStationary && this.stats.combo > 0) {
      // Decay combo gradually
      this.stats.combo = 0;
      this.onStatsCallback({ ...this.stats });
    }

    // 3. Overflow / Game Over checks (Classic mode only)
    if (this.gameMode === 'classic') {
      if (fruitAboveLine) {
        this.redLineWarning = true;
        this.redLineTimer += 16.67; // Assuming 60fps (~16.7ms per frame)
        if (this.redLineTimer > 2000) { // 2 seconds above red line
          this.triggerGameOver('Pipeline buffer overflow (Red line crossed for > 2s).');
        }
      } else {
        this.redLineWarning = false;
        this.redLineTimer = 0;
      }
    }
  }

  private triggerGameOver(reason: string) {
    this.gameOver = true;
    if (this.timeIntervalId) {
      window.clearInterval(this.timeIntervalId);
      this.timeIntervalId = null;
    }
    Matter.Runner.stop(this.runner);
    this.sounds.playGameOver();
    this.log(`[FATAL] CRASH: ${reason}`, 'error');
    this.log(`[SYSTEM] Pipeline failed. final Score: ${this.stats.score}`, 'error');
    this.onGameOverCallback(this.stats.score);
  }

  // Drawing routines
  private draw() {
    const isDark = document.documentElement.classList.contains('dark');
    
    // Clear Canvas
    this.ctx.fillStyle = isDark ? '#0f0f0f' : '#ffffff';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw grid lines inside the bucket area for Vercel developer dashboard look
    this.ctx.strokeStyle = isDark ? '#1c1c1c' : '#f0f0f0';
    this.ctx.lineWidth = 1;
    // Vertical grid lines
    for (let x = 80; x < 400; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 120);
      this.ctx.lineTo(x, 610);
      this.ctx.stroke();
    }
    // Horizontal grid lines
    for (let y = 160; y < 610; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(40, y);
      this.ctx.lineTo(400, y);
      this.ctx.stroke();
    }

    // Draw the visible U-shaped bucket (half-cut view bucket)
    this.ctx.save();
    // Glassy background fill inside the bucket
    this.ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)';
    this.ctx.beginPath();
    this.ctx.moveTo(40, 120);
    this.ctx.lineTo(40, 600);
    this.ctx.arcTo(40, 610, 50, 610, 10);
    this.ctx.lineTo(390, 610);
    this.ctx.arcTo(400, 610, 400, 600, 10);
    this.ctx.lineTo(400, 120);
    this.ctx.closePath();
    this.ctx.fill();

    // Wall borders
    this.ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.12)';
    this.ctx.lineWidth = 6;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(40, 120);
    this.ctx.lineTo(40, 600);
    this.ctx.arcTo(40, 610, 50, 610, 10);
    this.ctx.lineTo(390, 610);
    this.ctx.arcTo(400, 610, 400, 600, 10);
    this.ctx.lineTo(400, 120);
    this.ctx.stroke();
    this.ctx.restore();

    // Draw active fruits
    const bodies = Matter.Composite.allBodies(this.engine.world);
    bodies.forEach((body) => {
      if ((body as any).label === 'fruit') {
        const fruitIdx = (body as any).fruitIndex;
        const fruit = FRUITS[fruitIdx];
        
        this.ctx.save();
        this.ctx.translate(body.position.x, body.position.y);
        this.ctx.rotate(body.angle);

        // Draw Fruit Emoji centered (no circular background or outline)
        this.ctx.globalAlpha = 1.0;
        this.ctx.font = `${fruit.radius * 1.8}px "Inter", sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(fruit.emoji, 0, 0);

        this.ctx.restore();
      }
    });

    // Draw active merges (transition animation)
    this.activeMerges.forEach((m) => {
      // Interpolate positions from start to midpoint
      const x1 = m.x1 + (m.targetX - m.x1) * m.progress;
      const y1 = m.y1 + (m.targetY - m.y1) * m.progress;
      const x2 = m.x2 + (m.targetX - m.x2) * m.progress;
      const y2 = m.y2 + (m.targetY - m.y2) * m.progress;

      // Shrink size as they get closer to the center
      const currentRadius = m.radius * (1 - m.progress * 0.4); // shrinks by up to 40%

      // Draw fruit 1
      this.ctx.save();
      this.ctx.translate(x1, y1);
      this.ctx.font = `${currentRadius * 1.8}px "Inter", sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.globalAlpha = 1 - m.progress * 0.3; // fade slightly
      this.ctx.fillText(m.emoji, 0, 0);
      this.ctx.restore();

      // Draw fruit 2
      this.ctx.save();
      this.ctx.translate(x2, y2);
      this.ctx.font = `${currentRadius * 1.8}px "Inter", sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.globalAlpha = 1 - m.progress * 0.3; // fade slightly
      this.ctx.fillText(m.emoji, 0, 0);
      this.ctx.restore();
    });

    // Draw particles
    this.particles.forEach((p) => {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fill();
      this.ctx.restore();
    });

    // Draw Dropper Preview Guide Line & Next Fruit
    if (!this.gameOver && !this.hotfixActive) {
      const activeFruit = FRUITS[this.nextFruitIndex];
      const nextX = Math.max(40 + activeFruit.radius, Math.min(this.previewX, 400 - activeFruit.radius));

      this.ctx.save();
      
      // Projection dotted line
      this.ctx.beginPath();
      this.ctx.setLineDash([4, 6]);
      this.ctx.moveTo(nextX, 85);
      this.ctx.lineTo(nextX, 610); // Stop at bottom of bucket
      this.ctx.strokeStyle = isDark ? '#444444' : '#cccccc';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();

      // Dropper Fruit placeholder (only emoji, no circle)
      this.ctx.globalAlpha = 0.7;
      this.ctx.font = `${activeFruit.radius * 1.8}px "Inter", sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(activeFruit.emoji, nextX, 50);

      this.ctx.restore();
    }

    // Draw Hotfix Selection Indicator (if hotfix active)
    if (this.hotfixActive) {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(238, 0, 0, 0.05)';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      this.ctx.strokeStyle = '#ee0000';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(4, 4, this.width - 8, this.height - 8);
      
      this.ctx.font = '12px font-mono, JetBrains Mono, monospace';
      this.ctx.fillStyle = '#ee0000';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('[ HOTFIX ACTIVE: CLICK ASSET TO UPGRADE ]', this.width / 2, 30);
      this.ctx.restore();
    }

    // Draw Red Overflow Warning Line (Classic mode only)
    if (this.gameMode === 'classic') {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.setLineDash([6, 4]);
      this.ctx.moveTo(40, this.redLineY);
      this.ctx.lineTo(400, this.redLineY);
      
      if (this.redLineWarning) {
        // Flash red line
        const alpha = Math.abs(Math.sin(Date.now() * 0.007));
        this.ctx.strokeStyle = `rgba(238, 0, 0, ${alpha * 0.7 + 0.3})`;
        this.ctx.lineWidth = 2.5;
        this.logWarningOnce();
      } else {
        this.ctx.strokeStyle = isDark ? 'rgba(238, 0, 0, 0.4)' : 'rgba(238, 0, 0, 0.25)';
        this.ctx.lineWidth = 1.5;
      }
      
      this.ctx.stroke();

      // "BUFFER OVERFLOW LIMIT" label
      this.ctx.font = '9px JetBrains Mono, monospace';
      this.ctx.fillStyle = this.redLineWarning ? '#ee0000' : (isDark ? '#888888' : '#777777');
      this.ctx.textAlign = 'right';
      this.ctx.fillText('BUFFER OVERFLOW LIMIT', 388, this.redLineY - 6);
      this.ctx.restore();
    }
  }

  private warningLogged: boolean = false;
  private logWarningOnce() {
    if (!this.warningLogged) {
      this.log('[WARNING] Build buffer approaching maximum capacity. Overflow imminent!', 'warning');
      this.warningLogged = true;
      setTimeout(() => {
        this.warningLogged = false;
      }, 5000); // Allow logging again after 5s
    }
  }

  // Update mouse position for dropper preview (constrained inside the bucket walls)
  public updatePreviewX(x: number) {
    const activeFruit = FRUITS[this.nextFruitIndex];
    this.previewX = Math.max(40 + activeFruit.radius, Math.min(x, 400 - activeFruit.radius));
  }

  // Clear running timers/contexts
  public destroy() {
    this.isDestroyed = true;
    if (this.timeIntervalId) {
      window.clearInterval(this.timeIntervalId);
      this.timeIntervalId = null;
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    Matter.Runner.stop(this.runner);
    this.activeMerges = [];
  }
}
