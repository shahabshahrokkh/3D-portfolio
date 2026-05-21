/**
 * Snake Game — Classic arcade snake rendered on a Canvas.
 * Grid-based movement, food collection, wall collision.
 * Controls: Arrow Keys or WASD
 */

const CELL = 20;         // cell size in pixels
const COLS = 20;         // grid columns
const ROWS = 18;         // grid rows (leaving room for header)
const HEADER = 60;       // px reserved for score header
const W = COLS * CELL;   // 400
const H = ROWS * CELL + HEADER; // 420

export class SnakeGame {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = W;
    this.canvas.height = H;
    this.ctx = this.canvas.getContext('2d');

    this.state = 'title'; // 'title' | 'playing' | 'dead' | 'win'
    this._reset();
    this._bindKeys();

    // Tick the snake on an interval
    this._tickInterval = null;
    this._lastDrawTime = 0;
  }

  _reset() {
    // Snake starts in the middle, moving right
    this.snake = [
      { x: 10, y: 9 },
      { x: 9,  y: 9 },
      { x: 8,  y: 9 },
    ];
    this.dir   = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.score = 0;
    this.speed = 150; // ms per tick
    this.food  = this._spawnFood();
    this.particles = [];
    this.dead  = false;
  }

  _spawnFood() {
    let pos;
    do {
      pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (this.snake.some(s => s.x === pos.x && s.y === pos.y));
    return pos;
  }

  _bindKeys() {
    this._keyHandler = (e) => {
      if (!this._isActive) return;
      
      const keyMap = {
        'ArrowUp':    { x: 0, y: -1 },
        'ArrowDown':  { x: 0, y:  1 },
        'ArrowLeft':  { x: -1, y: 0 },
        'ArrowRight': { x: 1,  y: 0 },
        'w': { x: 0, y: -1 }, 'W': { x: 0, y: -1 },
        's': { x: 0, y:  1 }, 'S': { x: 0, y:  1 },
        'a': { x: -1, y: 0 }, 'A': { x: -1, y: 0 },
        'd': { x: 1,  y: 0 }, 'D': { x: 1,  y: 0 },
      };

      if (this.state === 'title' || this.state === 'dead') {
        if (e.key === ' ' || e.key === 'Enter' || keyMap[e.key]) {
          this.startGame();
          e.preventDefault();
          return;
        }
      }

      if (this.state === 'playing') {
        const newDir = keyMap[e.key];
        if (newDir) {
          // Prevent reversing
          if (newDir.x !== -this.dir.x || newDir.y !== -this.dir.y) {
            this.nextDir = newDir;
          }
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', this._keyHandler);
  }

  activate() {
    this._isActive = true;
    if (this.state === 'playing') this._startTick();
    
    // Start self-contained render loop
    const loop = (time) => {
      if (!this._isActive) return;
      this.update(time / 1000); // pass seconds
      this._rAF = requestAnimationFrame(loop);
    };
    this._rAF = requestAnimationFrame(loop);
  }

  deactivate() {
    this._isActive = false;
    this._stopTick();
    if (this._rAF) {
      cancelAnimationFrame(this._rAF);
      this._rAF = null;
    }
  }

  startGame() {
    this._reset();
    this.state = 'playing';
    this._startTick();
  }

  _startTick() {
    this._stopTick();
    this._tickInterval = setInterval(() => this._tick(), this.speed);
  }

  _stopTick() {
    if (this._tickInterval) {
      clearInterval(this._tickInterval);
      this._tickInterval = null;
    }
  }

  _tick() {
    if (this.state !== 'playing') return;

    this.dir = { ...this.nextDir };

    const head = {
      x: this.snake[0].x + this.dir.x,
      y: this.snake[0].y + this.dir.y,
    };

    // Wall collision
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      this._die();
      return;
    }

    // Self collision
    if (this.snake.some(s => s.x === head.x && s.y === head.y)) {
      this._die();
      return;
    }

    this.snake.unshift(head);

    // Food collision
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score++;
      this._spawnParticles(head.x, head.y);
      this.food = this._spawnFood();
      // Speed up slightly
      if (this.speed > 60) {
        this.speed = Math.max(60, this.speed - 4);
        this._startTick(); // restart with new speed
      }
    } else {
      this.snake.pop();
    }

    this._draw();
  }

  _die() {
    this.state = 'dead';
    this._stopTick();
    this._drawDeadScreen();
  }

  _spawnParticles(gx, gy) {
    const px = gx * CELL + CELL / 2;
    const py = gy * CELL + CELL / 2 + HEADER;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      this.particles.push({
        x: px, y: py,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        life: 1.0,
        color: `hsl(${120 + Math.random() * 60}, 100%, 60%)`,
      });
    }
  }

  /** Called every animation frame for smooth particle updates */
  update(time) {
    if (this.state === 'title') {
      this._drawTitleScreen(time);
    }
    if (this.particles.length > 0) {
      this.particles = this.particles.filter(p => {
        p.x += p.vx; p.y += p.vy;
        p.life -= 0.08;
        return p.life > 0;
      });
      if (this.state === 'playing') {
        this._draw();
      }
    }
  }

  /** Handle click — start/restart on title/dead screens */
  handleClick() {
    if (this.state === 'title' || this.state === 'dead') {
      this.startGame();
    }
  }

  _draw() {
    const ctx = this.ctx;

    // Background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, HEADER);
      ctx.lineTo(x * CELL, H);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, HEADER + y * CELL);
      ctx.lineTo(W, HEADER + y * CELL);
      ctx.stroke();
    }

    // --- Header ---
    // Score bar background
    const headerGrad = ctx.createLinearGradient(0, 0, W, 0);
    headerGrad.addColorStop(0, '#0d1f12');
    headerGrad.addColorStop(1, '#0a1a10');
    ctx.fillStyle = headerGrad;
    ctx.fillRect(0, 0, W, HEADER);

    // Bottom border of header
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(0, HEADER - 2, W, 2);

    // Title
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 8;
    ctx.fillText('🐍 SNAKE', 12, HEADER / 2);
    ctx.shadowBlur = 0;

    // Score
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Score: ${this.score}`, W / 2, HEADER / 2);

    // Length
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '13px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`len: ${this.snake.length}`, W - 10, HEADER / 2);

    // --- Snake ---
    for (let i = 0; i < this.snake.length; i++) {
      const seg = this.snake[i];
      const px = seg.x * CELL;
      const py = seg.y * CELL + HEADER;
      const ratio = i / this.snake.length;

      if (i === 0) {
        // Head — bright green
        ctx.fillStyle = '#00ff88';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 10;
      } else {
        // Body — gradient from green to teal
        const g = Math.floor(255 - ratio * 80);
        const b = Math.floor(ratio * 120);
        ctx.fillStyle = `rgb(0, ${g}, ${b})`;
        ctx.shadowBlur = 0;
      }

      // Rounded segment
      ctx.beginPath();
      this._roundRect(ctx, px + 2, py + 2, CELL - 4, CELL - 4, 4);
      ctx.fill();

      // Eyes on head
      if (i === 0) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        const ex = this.dir.y !== 0 ? 5 : (this.dir.x > 0 ? CELL - 6 : 4);
        const ey = this.dir.x !== 0 ? 5 : (this.dir.y > 0 ? CELL - 6 : 4);
        ctx.beginPath();
        ctx.arc(px + ex, py + ey, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;

    // --- Food ---
    const fx = this.food.x * CELL + CELL / 2;
    const fy = this.food.y * CELL + CELL / 2 + HEADER;
    
    // Glow
    const foodGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, CELL * 0.7);
    foodGrad.addColorStop(0, 'rgba(255, 80, 80, 0.6)');
    foodGrad.addColorStop(1, 'rgba(255, 80, 80, 0)');
    ctx.fillStyle = foodGrad;
    ctx.beginPath();
    ctx.arc(fx, fy, CELL * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Apple
    ctx.fillStyle = '#ff3333';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(fx, fy, CELL * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Stem
    ctx.strokeStyle = '#55aa00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fx, fy - CELL * 0.38);
    ctx.lineTo(fx + 3, fy - CELL * 0.55);
    ctx.stroke();

    // --- Particles ---
    for (const p of this.particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Border
    ctx.strokeStyle = '#00ff8844';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, HEADER, W - 2, H - HEADER - 1);
  }

  _drawTitleScreen(time) {
    const ctx = this.ctx;
    const t = time || 0;
    {

      // Background
      ctx.fillStyle = '#080810';
      ctx.fillRect(0, 0, W, H);

      // Moving grid
      ctx.strokeStyle = 'rgba(0,255,136,0.06)';
      ctx.lineWidth = 1;
      const off = (t * 15) % CELL;
      for (let x = off; x < W; x += CELL) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = off; y < H; y += CELL) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Animated snake demo
      const demoLen = 8;
      for (let i = 0; i < demoLen; i++) {
        const demo_x = Math.floor(COLS / 2 + Math.cos(t * 0.8 + i * 0.5) * 6);
        const demo_y = Math.floor(ROWS / 2 + Math.sin(t * 0.8 + i * 0.5) * 3);
        const ratio = i / demoLen;
        ctx.fillStyle = `rgba(0, ${255 - ratio * 80}, ${ratio * 100}, ${0.3 - ratio * 0.2})`;
        ctx.fillRect(demo_x * CELL + 2, demo_y * CELL + 2, CELL - 4, CELL - 4);
      }

      // Big title
      const pulse = 1 + Math.sin(t * 2.5) * 0.03;
      ctx.save();
      ctx.translate(W / 2, H / 2 - 50);
      ctx.scale(pulse, pulse);
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 52px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐍', 0, 0);
      ctx.restore();

      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SNAKE', W / 2, H / 2 + 10);
      ctx.shadowBlur = 0;

      // Instructions
      ctx.fillStyle = '#ffffffaa';
      ctx.font = '14px monospace';
      ctx.fillText('arrow keys / WASD to move', W / 2, H / 2 + 48);

      // Blink start prompt
      if (Math.sin(t * 4) > 0) {
        ctx.fillStyle = '#ffffff66';
        ctx.font = 'bold 15px monospace';
        ctx.fillText('▶  press any key to start  ◀', W / 2, H / 2 + 80);
      }

      // Scanlines
      ctx.fillStyle = 'rgba(0,0,0,0.07)';
      for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
    }
  }

  _drawDeadScreen() {
    const ctx = this.ctx;
    // Darken over the game
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, W, H);

    ctx.shadowColor = '#ff3333';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ff3333';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', W / 2, H / 2 - 30);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = '20px monospace';
    ctx.fillText(`Score: ${this.score}`, W / 2, H / 2 + 10);
    ctx.fillText(`Length: ${this.snake.length}`, W / 2, H / 2 + 38);

    ctx.fillStyle = '#ffffff66';
    ctx.font = '14px monospace';
    ctx.fillText('press any key or click to retry', W / 2, H / 2 + 78);
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  destroy() {
    this.deactivate();
    window.removeEventListener('keydown', this._keyHandler);
  }
}
