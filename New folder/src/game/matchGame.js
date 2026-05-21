import * as THREE from 'three';

/**
 * A Memory Match game rendered on a Canvas texture.
 * The game draws a 4x4 grid of cards with emoji symbols.
 * Players click to flip two cards — if they match, they stay revealed.
 */

const EMOJIS = ['🚀', '🎮', '💎', '🔥', '⚡', '🎯', '🐱', '🎸'];
const GRID_COLS = 4;
const GRID_ROWS = 4;

export class MatchGame {
  constructor(width = 512, height = 512) {
    // Canvas setup
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');

    // Three.js texture
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;

    // Game state
    this.cards = [];
    this.flipped = [];      // indices of currently flipped cards (max 2)
    this.matched = new Set(); // indices of matched cards
    this.moves = 0;
    this.gameWon = false;
    this.lockInput = false;
    this.animTime = 0;
    this.showingTitle = true; // Start with title screen
    this.titleAnimPhase = 0;

    // Grid layout
    this.padding = 20;
    this.gap = 8;
    this.cardWidth = (width - this.padding * 2 - this.gap * (GRID_COLS - 1)) / GRID_COLS;
    this.cardHeight = (height - this.padding * 2 - this.gap * (GRID_ROWS - 1) - 60) / GRID_ROWS; // 60px for header
    this.headerHeight = 50;

    this._initCards();
    this._draw();
  }

  _initCards() {
    // Create pairs and shuffle
    const pairs = [...EMOJIS, ...EMOJIS]; // 16 cards = 8 pairs
    this.cards = this._shuffle(pairs);
    this.flipped = [];
    this.matched = new Set();
    this.moves = 0;
    this.gameWon = false;
    this.lockInput = false;
  }

  _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /**
   * Handle a click at normalized UV coordinates (0-1)
   * @param {number} u - horizontal UV (0 = left, 1 = right)
   * @param {number} v - vertical UV (0 = bottom, 1 = top)
   */
  handleClick(u, v) {
    // Title screen → start game
    if (this.showingTitle) {
      this.showingTitle = false;
      this._initCards();
      this._draw();
      return;
    }

    // Win screen → restart
    if (this.gameWon) {
      this._initCards();
      this._draw();
      return;
    }

    if (this.lockInput) return;

    // Convert UV to canvas pixel coords
    // Note: V is flipped in Three.js (0=bottom, 1=top)
    const px = u * this.canvas.width;
    const py = (1 - v) * this.canvas.height;

    // Find which card was clicked
    const cardIndex = this._getCardAtPixel(px, py);
    if (cardIndex === -1) return;
    if (this.flipped.includes(cardIndex)) return;
    if (this.matched.has(cardIndex)) return;

    this.flipped.push(cardIndex);
    this._draw();

    if (this.flipped.length === 2) {
      this.moves++;
      this.lockInput = true;

      const [i, j] = this.flipped;
      if (this.cards[i] === this.cards[j]) {
        // Match!
        this.matched.add(i);
        this.matched.add(j);
        this.flipped = [];
        this.lockInput = false;

        if (this.matched.size === this.cards.length) {
          this.gameWon = true;
        }
        this._draw();
      } else {
        // No match — flip back after delay
        setTimeout(() => {
          this.flipped = [];
          this.lockInput = false;
          this._draw();
        }, 800);
      }
    }
  }

  _getCardAtPixel(px, py) {
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const x = this.padding + col * (this.cardWidth + this.gap);
        const y = this.padding + this.headerHeight + row * (this.cardHeight + this.gap);
        if (px >= x && px <= x + this.cardWidth && py >= y && py <= y + this.cardHeight) {
          return row * GRID_COLS + col;
        }
      }
    }
    return -1;
  }

  /** Called every frame to animate and refresh texture */
  update(time) {
    this.animTime = time;
    if (this.showingTitle) {
      this.titleAnimPhase = time;
      this._drawTitleScreen();
      this.texture.needsUpdate = true;
    } else if (this.gameWon) {
      this._drawWinScreen();
      this.texture.needsUpdate = true;
    }
    // Normal gameplay: only update on interaction (handled in handleClick)
  }

  _draw() {
    if (this.showingTitle) {
      this._drawTitleScreen();
    } else if (this.gameWon) {
      this._drawWinScreen();
    } else {
      this._drawGame();
    }
    this.texture.needsUpdate = true;
  }

  _drawGame() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Background — dark arcade CRT look
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0a0a1a');
    grad.addColorStop(1, '#0f0f2d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Scanline effect
    ctx.fillStyle = 'rgba(255,255,255,0.015)';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 1);
    }

    // Header
    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`MEMORY MATCH`, w / 2, 30);

    ctx.fillStyle = '#ffffff88';
    ctx.font = '14px monospace';
    ctx.fillText(`Moves: ${this.moves}  |  Pairs: ${this.matched.size / 2}/${EMOJIS.length}`, w / 2, 48);

    // Draw cards
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const idx = row * GRID_COLS + col;
        const x = this.padding + col * (this.cardWidth + this.gap);
        const y = this.padding + this.headerHeight + row * (this.cardHeight + this.gap);

        const isFlipped = this.flipped.includes(idx);
        const isMatched = this.matched.has(idx);

        // Card background
        ctx.save();
        ctx.beginPath();
        this._roundRect(ctx, x, y, this.cardWidth, this.cardHeight, 8);
        ctx.clip();

        if (isMatched) {
          // Matched: green glow
          const matchGrad = ctx.createLinearGradient(x, y, x, y + this.cardHeight);
          matchGrad.addColorStop(0, '#0a3a2a');
          matchGrad.addColorStop(1, '#0d4f3a');
          ctx.fillStyle = matchGrad;
          ctx.fill();
          ctx.strokeStyle = '#00ffcc44';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (isFlipped) {
          // Flipped: bright
          const flipGrad = ctx.createLinearGradient(x, y, x, y + this.cardHeight);
          flipGrad.addColorStop(0, '#1a1a4a');
          flipGrad.addColorStop(1, '#2a2a6a');
          ctx.fillStyle = flipGrad;
          ctx.fill();
          ctx.strokeStyle = '#6c63ff88';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          // Hidden: dark card
          const hidGrad = ctx.createLinearGradient(x, y, x, y + this.cardHeight);
          hidGrad.addColorStop(0, '#1a1a3e');
          hidGrad.addColorStop(1, '#12122a');
          ctx.fillStyle = hidGrad;
          ctx.fill();
          ctx.strokeStyle = '#ffffff15';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Question mark
          ctx.fillStyle = '#ffffff30';
          ctx.font = 'bold 28px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('?', x + this.cardWidth / 2, y + this.cardHeight / 2);
        }

        // Draw emoji if revealed
        if (isFlipped || isMatched) {
          ctx.font = `${Math.min(this.cardWidth, this.cardHeight) * 0.5}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(this.cards[idx], x + this.cardWidth / 2, y + this.cardHeight / 2);
        }

        ctx.restore();
      }
    }
  }

  _drawTitleScreen() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const t = this.titleAnimPhase || 0;

    // Animated background
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
    grad.addColorStop(0, '#1a0a3e');
    grad.addColorStop(0.5, '#0a0a2a');
    grad.addColorStop(1, '#050510');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Animated grid lines
    ctx.strokeStyle = '#6c63ff15';
    ctx.lineWidth = 1;
    const offset = (t * 20) % 40;
    for (let x = offset; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = offset; y < h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Floating particles
    for (let i = 0; i < 12; i++) {
      const px = w * 0.5 + Math.sin(t * 0.7 + i * 1.3) * w * 0.35;
      const py = h * 0.5 + Math.cos(t * 0.5 + i * 1.7) * h * 0.35;
      const size = 2 + Math.sin(t * 2 + i) * 1.5;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(108, 99, 255, ${0.3 + Math.sin(t + i) * 0.2})`;
      ctx.fill();
    }

    // Title with glow
    const pulse = 0.8 + Math.sin(t * 3) * 0.2;
    ctx.save();
    ctx.shadowColor = '#6c63ff';
    ctx.shadowBlur = 20 * pulse;
    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MEMORY', w / 2, h / 2 - 40);
    ctx.fillText('MATCH', w / 2, h / 2 + 10);
    ctx.restore();

    // Subtitle blink
    const blink = Math.sin(t * 4) > 0;
    if (blink) {
      ctx.fillStyle = '#ffffff88';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('▶ CLICK TO START ◀', w / 2, h / 2 + 70);
    }

    // Scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let y = 0; y < h; y += 3) {
      ctx.fillRect(0, y, w, 1);
    }

    // Decorative emojis
    const emojis = EMOJIS;
    ctx.font = '20px serif';
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < emojis.length; i++) {
      const ex = w * 0.5 + Math.sin(t * 0.3 + i * 0.8) * w * 0.4;
      const ey = h * 0.1 + (i / emojis.length) * h * 0.15 + Math.cos(t * 0.5 + i) * 10;
      ctx.fillText(emojis[i], ex, ey);
    }
    ctx.globalAlpha = 1;
  }

  _drawWinScreen() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const t = this.animTime || 0;

    // Celebration background
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.6);
    grad.addColorStop(0, '#0a2a1a');
    grad.addColorStop(1, '#050510');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Confetti particles
    const confettiColors = ['#00ffcc', '#6c63ff', '#ff6b9d', '#ffd93d', '#6bff63'];
    for (let i = 0; i < 30; i++) {
      const cx = (Math.sin(t * 1.5 + i * 2.1) * 0.5 + 0.5) * w;
      const cy = ((t * 0.3 + i * 0.12) % 1.2) * h;
      const size = 3 + Math.sin(i * 3) * 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 2 + i);
      ctx.fillStyle = confettiColors[i % confettiColors.length];
      ctx.fillRect(-size / 2, -size / 2, size, size * 2);
      ctx.restore();
    }

    // Win text
    const pulse = 1 + Math.sin(t * 4) * 0.05;
    ctx.save();
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 25;
    ctx.fillStyle = '#00ffcc';
    ctx.font = `bold ${40 * pulse}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎉 YOU WIN! 🎉', w / 2, h / 2 - 30);
    ctx.restore();

    ctx.fillStyle = '#ffffffcc';
    ctx.font = '18px monospace';
    ctx.fillText(`Completed in ${this.moves} moves!`, w / 2, h / 2 + 20);

    const blink = Math.sin(t * 4) > 0;
    if (blink) {
      ctx.fillStyle = '#ffffff66';
      ctx.font = '14px monospace';
      ctx.fillText('▶ CLICK TO PLAY AGAIN ◀', w / 2, h / 2 + 60);
    }

    // Scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    for (let y = 0; y < h; y += 3) {
      ctx.fillRect(0, y, w, 1);
    }
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
}
