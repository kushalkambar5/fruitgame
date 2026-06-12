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
  swapCharges: number;
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
    shakeCharges: 2,
    gcCharges: 2,
    hotfixCharges: 2,
    swapCharges: 2,
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
  public currentFruitIndex: number = 0;
  public nextFruitIndex: number = 0;
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
  private onGameOverCallback: (score: number, reason: string) => void;
  private onTimerCallback: (seconds: number) => void;

  constructor(
    canvas: HTMLCanvasElement,
    callbacks: {
      onLog: (msg: string, type: LogType) => void;
      onStats: (stats: GameStats) => void;
      onGameOver: (score: number, reason: string) => void;
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
    this.currentFruitIndex = Math.floor(Math.random() * 5);
    this.rollNextFruit();
  }

  private setupWorld() {
    const wallOptions = { isStatic: true, friction: 0.1, restitution: 0.2 };
    // Bucket boundaries: bottom wall top is at y = 610, left wall right edge is at x = 40, right wall left edge is at x = 400.
    // We make them 100px thick and extend/overlap them to eliminate corner gaps and prevent tunneling.
    const bottomWall = Matter.Bodies.rectangle(220, 660, 400, 100, wallOptions);
    const leftWall = Matter.Bodies.rectangle(-10, 385, 100, 530, wallOptions);
    const rightWall = Matter.Bodies.rectangle(450, 385, 100, 530, wallOptions);

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

    this.stats.shakeCharges = 2;
    this.stats.gcCharges = 2;
    this.stats.hotfixCharges = 2;
    this.stats.swapCharges = 2;
    
    this.currentFruitIndex = Math.floor(Math.random() * 5);
    this.rollNextFruit();
    
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
    const fruit = FRUITS[this.currentFruitIndex];
    const leftLimit = 40 + fruit.radius;
    const rightLimit = 400 - fruit.radius;
    const dropX = Math.max(leftLimit, Math.min(clickX, rightLimit));

    this.sounds.playDrop();
    this.spawnFruit(dropX, 50, this.currentFruitIndex);
    this.log(`Dropped a cute ${fruit.name} ${fruit.emoji}!`, 'info');

    // Shift next to current, and roll new next
    this.currentFruitIndex = this.nextFruitIndex;
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
        this.log(`Magic Upgrade! Upgraded ${FRUITS[idx].emoji} to ${FRUITS[idx+1].emoji}!`, 'success');
        this.updateStats();
      } else {
        this.log(`Cannot upgrade Watermelon. It's already the biggest!`, 'error');
        this.hotfixActive = false;
      }
    } else {
      this.log(`Upgrade target not found. Click directly on a fruit to upgrade.`, 'warning');
      this.hotfixActive = false;
    }
  }

  // Swap current fruit with next fruit
  public swapFruit() {
    if (this.gameOver) return;
    if (this.stats.swapCharges <= 0) {
      this.log(`No swap charges remaining!`, 'warning');
      return;
    }
    this.sounds.playCmd();
    this.stats.swapCharges--;
    
    const temp = this.currentFruitIndex;
    this.currentFruitIndex = this.nextFruitIndex;
    this.nextFruitIndex = temp;

    this.log(`Swapped current fruit with next fruit!`, 'success');
    this.updateStats();
  }

  // CLI Powerups: npm run shake
  public runCmdShake() {
    if (this.gameOver) return;
    if (this.stats.shakeCharges <= 0) {
      this.log(`No shake charges remaining!`, 'error');
      return;
    }

    this.sounds.playCmd();
    this.stats.shakeCharges--;
    this.log(`Jiggle! Shook the box to mix up the fruits!`, 'success');

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
      this.log(`No Cherry Bomb charges remaining!`, 'error');
      return;
    }

    this.sounds.playCmd();
    this.log(`Cherry Bomb! Boom! All tiny cherries popped!`, 'success');

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
    this.updateStats();
  }

  // CLI Powerups: npm run hotfix
  public enableHotfix() {
    if (this.gameOver) return;
    if (this.stats.hotfixCharges <= 0) {
      this.log(`No Upgrade charges remaining!`, 'error');
      return;
    }
    this.hotfixActive = true;
    this.log(`Magic Upgrade active! Click on a fruit inside the container to upgrade it!`, 'info');
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

        // Check if a fruit has dropped/spilled out of the bucket
        if (body.position.y > 630 || (body.position.y - radius > 610 && (body.position.x < 36 || body.position.x > 404))) {
          this.triggerGameOver('A fruit dropped out of the bucket!');
          return;
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
    this.onGameOverCallback(this.stats.score, reason);
  }

  private drawFruit(
    x: number,
    y: number,
    radius: number,
    index: number,
    angle: number,
    alpha: number = 1.0
  ) {
    const fruit = FRUITS[index];
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(angle);
    this.ctx.globalAlpha = alpha;

    // Draw main circle body
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = fruit.color;
    this.ctx.fill();

    // 3D glossy gradient overlay
    const gloss = this.ctx.createRadialGradient(-radius * 0.35, -radius * 0.35, radius * 0.05, 0, 0, radius);
    gloss.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    gloss.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)');
    gloss.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = gloss;
    this.ctx.fill();

    // Thick cartoon outline
    this.ctx.strokeStyle = '#2c1e13';
    this.ctx.lineWidth = Math.max(2.5, radius * 0.08);
    this.ctx.stroke();

    // Glint spot
    this.ctx.beginPath();
    this.ctx.arc(-radius * 0.4, -radius * 0.4, radius * 0.15, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.fill();

    // Draw leaf/stem decorations
    if (fruit.name === 'Cherry') {
      this.ctx.strokeStyle = '#5c4033';
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();
      this.ctx.moveTo(0, -radius * 0.85);
      this.ctx.quadraticCurveTo(-radius * 0.25, -radius * 1.4, -radius * 0.15, -radius * 1.5);
      this.ctx.stroke();
      this.ctx.fillStyle = '#22c55e';
      this.ctx.beginPath();
      this.ctx.ellipse(-radius * 0.15, -radius * 1.5, radius * 0.3, radius * 0.15, -Math.PI / 4, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    } else if (fruit.name === 'Strawberry') {
      this.ctx.fillStyle = '#22c55e';
      this.ctx.beginPath();
      this.ctx.moveTo(-radius * 0.75, -radius * 0.5);
      this.ctx.quadraticCurveTo(0, -radius * 0.2, radius * 0.75, -radius * 0.5);
      this.ctx.lineTo(radius * 0.4, -radius * 0.95);
      this.ctx.lineTo(0, -radius * 0.65);
      this.ctx.lineTo(-radius * 0.4, -radius * 0.95);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();

      // Yellow seeds
      this.ctx.fillStyle = '#fef08a';
      const numSeeds = 5;
      for (let i = 0; i < numSeeds; i++) {
        const sa = (i / numSeeds) * Math.PI * 2 + 0.3;
        const sx = Math.cos(sa) * radius * 0.55;
        const sy = Math.sin(sa) * radius * 0.55 * 0.8;
        if (sy > -radius * 0.25 && sy < radius * 0.3 && sx > -radius * 0.35 && sx < radius * 0.35) continue;
        this.ctx.beginPath();
        this.ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    } else if (fruit.name === 'Grape') {
      this.ctx.strokeStyle = '#5c4033';
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();
      this.ctx.moveTo(0, -radius * 0.85);
      this.ctx.lineTo(radius * 0.15, -radius * 1.25);
      this.ctx.stroke();
    } else if (fruit.name === 'Orange') {
      this.ctx.fillStyle = '#22c55e';
      this.ctx.beginPath();
      this.ctx.ellipse(radius * 0.25, -radius * 0.95, radius * 0.25, radius * 0.12, Math.PI / 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    } else if (fruit.name === 'Apple') {
      this.ctx.strokeStyle = '#5c4033';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(0, -radius * 0.85);
      this.ctx.lineTo(radius * 0.15, -radius * 1.3);
      this.ctx.stroke();
      this.ctx.fillStyle = '#22c55e';
      this.ctx.beginPath();
      this.ctx.ellipse(radius * 0.35, -radius * 1.2, radius * 0.3, radius * 0.15, Math.PI / 4, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    } else if (fruit.name === 'Pear') {
      this.ctx.strokeStyle = '#5c4033';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(0, -radius * 0.85);
      this.ctx.lineTo(-radius * 0.15, -radius * 1.35);
      this.ctx.stroke();
    } else if (fruit.name === 'Peach') {
      this.ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();
      this.ctx.moveTo(0, -radius * 0.95);
      this.ctx.quadraticCurveTo(-radius * 0.2, 0, 0, radius * 0.95);
      this.ctx.stroke();
    } else if (fruit.name === 'Pineapple') {
      this.ctx.fillStyle = '#15803d';
      this.ctx.beginPath();
      this.ctx.moveTo(-radius * 0.45, -radius * 0.65);
      this.ctx.lineTo(-radius * 0.55, -radius * 1.35);
      this.ctx.lineTo(-radius * 0.2, -radius * 0.9);
      this.ctx.lineTo(0, -radius * 1.55);
      this.ctx.lineTo(radius * 0.2, -radius * 0.9);
      this.ctx.lineTo(radius * 0.55, -radius * 1.35);
      this.ctx.lineTo(radius * 0.45, -radius * 0.65);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      for (let d = -radius; d < radius; d += radius * 0.45) {
        this.ctx.moveTo(d, -Math.sqrt(radius * radius - d * d));
        this.ctx.lineTo(d + radius, Math.sqrt(radius * radius - (d + radius) * (d + radius)) || radius);
        this.ctx.moveTo(d, Math.sqrt(radius * radius - d * d));
        this.ctx.lineTo(d + radius, -Math.sqrt(radius * radius - (d + radius) * (d + radius)) || -radius);
      }
      this.ctx.stroke();
    } else if (fruit.name === 'Melon') {
      this.ctx.strokeStyle = '#15803d';
      this.ctx.lineWidth = 3.5;
      this.ctx.beginPath();
      this.ctx.moveTo(0, -radius * 0.9);
      this.ctx.quadraticCurveTo(radius * 0.25, -radius * 1.3, 0, -radius * 1.5);
      this.ctx.stroke();
    } else if (fruit.name === 'Watermelon') {
      this.ctx.strokeStyle = '#14532d';
      this.ctx.lineWidth = Math.max(3.5, radius * 0.08);
      const numStripes = 5;
      for (let i = 0; i < numStripes; i++) {
        const sx = -radius + (i + 0.5) * (radius * 2 / numStripes);
        this.ctx.beginPath();
        this.ctx.moveTo(sx, -Math.sqrt(radius * radius - sx * sx));
        this.ctx.bezierCurveTo(
          sx - radius * 0.1, -radius * 0.5,
          sx + radius * 0.1, radius * 0.5,
          sx, Math.sqrt(radius * radius - sx * sx)
        );
        this.ctx.stroke();
      }
    }

    // Draw cheeks (blush)
    this.ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
    this.ctx.beginPath();
    this.ctx.arc(-radius * 0.5, radius * 0.15, radius * 0.18, 0, Math.PI * 2);
    this.ctx.arc(radius * 0.5, radius * 0.15, radius * 0.18, 0, Math.PI * 2);
    this.ctx.fill();

    // Eyes
    const eyeX = radius * 0.28;
    const eyeY = -radius * 0.08;
    const eyeR = Math.max(2.5, radius * 0.07);
    this.ctx.fillStyle = '#2c1e13';
    this.ctx.beginPath();
    this.ctx.arc(-eyeX, eyeY, eyeR, 0, Math.PI * 2);
    this.ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2);
    this.ctx.fill();

    // Eye glints
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(-eyeX - eyeR * 0.25, eyeY - eyeR * 0.25, eyeR * 0.3, 0, Math.PI * 2);
    this.ctx.arc(eyeX - eyeR * 0.25, eyeY - eyeR * 0.25, eyeR * 0.3, 0, Math.PI * 2);
    this.ctx.fill();

    // Smile
    this.ctx.strokeStyle = '#2c1e13';
    this.ctx.lineWidth = Math.max(2, radius * 0.06);
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.arc(0, radius * 0.12, radius * 0.15, 0, Math.PI, false);
    this.ctx.stroke();

    this.ctx.restore();
  }

  private draw() {
    const isDark = document.documentElement.classList.contains('dark');
    
    // Clear Canvas with a soft color
    this.ctx.fillStyle = isDark ? '#221812' : '#f0f9ff'; // sky/night blue background
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw a cute centerline down the bucket
    this.ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([8, 8]);
    this.ctx.beginPath();
    this.ctx.moveTo(220, 120);
    this.ctx.lineTo(220, 610);
    this.ctx.stroke();
    this.ctx.setLineDash([]); // Reset line dash

    // Draw the visible U-shaped bucket
    this.ctx.save();
    // Glassy background fill inside the bucket (light cream inside)
    this.ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.5)';
    this.ctx.beginPath();
    this.ctx.moveTo(40, 120);
    this.ctx.lineTo(40, 600);
    this.ctx.arcTo(40, 610, 50, 610, 10);
    this.ctx.lineTo(390, 610);
    this.ctx.arcTo(400, 610, 400, 600, 10);
    this.ctx.lineTo(400, 120);
    this.ctx.closePath();
    this.ctx.fill();

    // Draw bucket frame (thick border)
    this.ctx.strokeStyle = isDark ? '#ea580c' : '#fed7aa'; // Indigo / orange-yellow frame
    this.ctx.lineWidth = 8;
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

    // Wooden ground floor under the bucket
    this.ctx.fillStyle = '#b45309'; // warm wooden brown
    this.ctx.fillRect(0, 610, this.width, 30);
    this.ctx.fillStyle = '#78350f'; // darker wood border
    this.ctx.fillRect(0, 610, this.width, 4);
    this.ctx.restore();

    // Draw active fruits using vector drawing
    const bodies = Matter.Composite.allBodies(this.engine.world);
    bodies.forEach((body) => {
      if ((body as any).label === 'fruit') {
        const fruitIdx = (body as any).fruitIndex;
        const fruit = FRUITS[fruitIdx];
        this.drawFruit(body.position.x, body.position.y, fruit.radius, fruitIdx, body.angle, 1.0);
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
      const currentRadius = m.radius * (1 - m.progress * 0.4);

      // Draw fruit 1
      this.drawFruit(x1, y1, currentRadius, m.nextIndex - 1, 0, 1.0 - m.progress * 0.3);
      // Draw fruit 2
      this.drawFruit(x2, y2, currentRadius, m.nextIndex - 1, 0, 1.0 - m.progress * 0.3);
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

    // Draw Dropper Preview Guide Line & Dropper Fruit
    if (!this.gameOver && !this.hotfixActive) {
      const activeFruit = FRUITS[this.currentFruitIndex];
      const nextX = Math.max(40 + activeFruit.radius, Math.min(this.previewX, 400 - activeFruit.radius));

      this.ctx.save();
      
      // Projection dotted line
      this.ctx.beginPath();
      this.ctx.setLineDash([4, 6]);
      this.ctx.moveTo(nextX, 85);
      this.ctx.lineTo(nextX, 610);
      this.ctx.strokeStyle = isDark ? '#4c3224' : '#cbd5e1';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Dropper Fruit placeholder
      this.drawFruit(nextX, 50, activeFruit.radius, this.currentFruitIndex, 0, 0.85);

      this.ctx.restore();
    }

    // Draw Hotfix Selection Indicator (if upgrade active)
    if (this.hotfixActive) {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      this.ctx.strokeStyle = '#ef4444';
      this.ctx.lineWidth = 4;
      this.ctx.strokeRect(4, 4, this.width - 8, this.height - 8);
      
      this.ctx.font = 'bold 14px "Fredoka", sans-serif';
      this.ctx.fillStyle = '#ef4444';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('✨ MAGIC UPGRADE: TAP A FRUIT TO GROW IT! ✨', this.width / 2, 30);
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
        this.ctx.strokeStyle = `rgba(239, 68, 68, ${alpha * 0.7 + 0.3})`;
        this.ctx.lineWidth = 3.5;
        this.logWarningOnce();
      } else {
        this.ctx.strokeStyle = isDark ? 'rgba(239, 68, 68, 0.5)' : 'rgba(239, 68, 68, 0.35)';
        this.ctx.lineWidth = 2.5;
      }
      
      this.ctx.stroke();

      // "DANGER ZONE!" label
      this.ctx.font = 'bold 10px "Fredoka", sans-serif';
      this.ctx.fillStyle = this.redLineWarning ? '#ef4444' : (isDark ? '#cbd5e1' : '#6b432a');
      this.ctx.textAlign = 'right';
      this.ctx.fillText('⚠️ DANGER ZONE!', 388, this.redLineY - 8);
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
    const activeFruit = FRUITS[this.currentFruitIndex];
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
