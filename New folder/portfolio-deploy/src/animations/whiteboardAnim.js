import * as THREE from 'three';
import gsap from 'gsap';
import { markerRef, callButtonMesh, MARKER_REST } from '../objects/whiteboard.js';
import { ModelRegistry } from '../utils/registry.js';
import { startPhoneRinging } from '../objects/iphone.js';

// ─── Config ────────────────────────────────────────────────────────────────────
const TEXT = 'Contact me!';
const BOARD_Z = -7.185;         // Z just in front of whiteboard surface
const WRITE_Y_CTR = 2.30;          // 3D vertical centre of writing
const WRITE_Y_RANGE = 0.13;          // ±Y the marker travels following letterforms
const WRITE_X_START = -0.52;          // 3D X where text starts
const WRITE_X_END = 0.60;          // 3D X where text ends
const LIFT_Z = 0.07;          // Z lift for whitespace / gaps
const WRITE_SPEED = 250;           // canvas-columns revealed per second (افزایش از 125 به 250)
const CANVAS_W = 1024;
const CANVAS_H = 192;
const FONT_STR = `bold 152px 'Caveat','Comic Sans MS',cursive`;
const INK_COLOR = '#1a1a2e';

// ─── Module state ──────────────────────────────────────────────────────────────
let isAnimating = false;
let writingPlane = null;
let mainTex = null;
let mainCtx = null;
let offCanvas = null;   // fully rendered text — never cleared
let columnMap = null;   // per-pixel-column Y info

// ─── Writing plane ──────────────────────────────────────────────────────────────
function ensureWritingPlane(scene) {
  if (writingPlane) { clearDisplay(); return; }

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  mainCtx = canvas.getContext('2d');
  mainTex = new THREE.CanvasTexture(canvas);

  const planeW = (WRITE_X_END - WRITE_X_START) * 1.05;
  const geo = new THREE.PlaneGeometry(planeW, 0.24);
  const mat = new THREE.MeshBasicMaterial({ map: mainTex, transparent: true, depthWrite: false });

  writingPlane = new THREE.Mesh(geo, mat);
  writingPlane.position.set(
    (WRITE_X_START + WRITE_X_END) / 2,
    WRITE_Y_CTR,
    BOARD_Z + 0.005
  );
  writingPlane.name = 'whiteboard-writing';
  scene.add(writingPlane);
}

// ─── Pre-render text & build column map ────────────────────────────────────────
function prepareOffscreen() {
  offCanvas = document.createElement('canvas');
  offCanvas.width = CANVAS_W;
  offCanvas.height = CANVAS_H;
  const ctx = offCanvas.getContext('2d');
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.font = FONT_STR;
  ctx.fillStyle = INK_COLOR;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(TEXT, 20, CANVAS_H / 2);

  const imgData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
  columnMap = new Array(CANVAS_W);
  for (let x = 0; x < CANVAS_W; x++) {
    let minY = null, maxY = null;
    for (let y = 0; y < CANVAS_H; y++) {
      if (imgData.data[(y * CANVAS_W + x) * 4 + 3] > 12) {
        if (minY === null) minY = y;
        maxY = y;
      }
    }
    columnMap[x] = {
      hasInk: minY !== null,
      midY: minY !== null ? (minY + maxY) / 2 : CANVAS_H / 2,
      minY, maxY
    };
  }
}

function clearDisplay() {
  if (!mainCtx) return;
  mainCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  if (mainTex) mainTex.needsUpdate = true;
}

function revealUpTo(px) {
  if (!mainCtx || !offCanvas) return;
  mainCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  mainCtx.save();
  mainCtx.beginPath();
  mainCtx.rect(0, 0, Math.max(1, px), CANVAS_H);
  mainCtx.clip();
  mainCtx.drawImage(offCanvas, 0, 0);
  mainCtx.restore();
  mainTex.needsUpdate = true;
}

// ─── Coord helpers ─────────────────────────────────────────────────────────────
function colToWorldX(px) {
  return WRITE_X_START + (px / CANVAS_W) * (WRITE_X_END - WRITE_X_START);
}
function rowToWorldY(py) {
  // canvas 0=top → higher 3D Y;  canvas H=bottom → lower 3D Y
  return WRITE_Y_CTR + (0.5 - py / CANVAS_H) * WRITE_Y_RANGE * 2;
}

// ─── Main trigger ─────────────────────────────────────────────────────────────
export function triggerWhiteboardAnimation(scene) {
  if (isAnimating || !markerRef) return;
  isAnimating = true;

  ensureWritingPlane(scene);
  prepareOffscreen();
  clearDisplay();

  const marker = markerRef;
  const rest = MARKER_REST.position;

  // Find last ink column
  let lastInk = CANVAS_W - 30;
  for (let x = CANVAS_W - 30; x > 0; x--) {
    if (columnMap[x].hasInk) { lastInk = x + 6; break; }
  }

  // Phase 1 & 2 via GSAP, then Phase 3 (writing) via rAF
  const phase1 = gsap.timeline({
    onComplete: startWritingPhase
  });

  // Turn on shadows while animating
  marker.traverse(c => { if (c.isMesh) c.castShadow = true; });

  // ── Lift from tray ──
  phase1.to(marker.position, { y: rest.y + 0.40, duration: 0.3, ease: 'power2.out' });
  phase1.to(marker.rotation, { z: Math.PI / 2.5, x: 0.15, duration: 0.28, ease: 'power1.out' }, '<');

  // ── Glide to writing start ──
  const col0 = columnMap[20];
  phase1.to(marker.position, {
    x: colToWorldX(20),
    y: rowToWorldY(col0.midY) + 0.08,
    z: BOARD_Z + 0.06,
    duration: 0.35, ease: 'power2.inOut'
  });

  // ── Touch board ──
  phase1.to(marker.position, {
    z: BOARD_Z + 0.01,
    y: '-=0.07',
    duration: 0.1, ease: 'power2.in'
  });

  // ──────────────────────────────────────────────────────────────────────────
  function startWritingPhase() {
    let currentPx = 20;
    let lastTime = performance.now();
    let markerY = rowToWorldY(col0.midY);  // smoothed Y

    function frame(now) {
      const dt = Math.min((now - lastTime) / 1000, 0.05); // cap at 50ms
      lastTime = now;
      const advance = Math.max(1, Math.round(WRITE_SPEED * dt));
      currentPx = Math.min(currentPx + advance, lastInk);

      // Update canvas
      revealUpTo(currentPx);

      // Find ink at look-ahead column for smoother motion
      const lookAhead = Math.min(currentPx + 5, CANVAS_W - 1);
      const col = columnMap[lookAhead];

      // Smooth Y lerp
      const targetY = rowToWorldY(col.midY);
      markerY += (targetY - markerY) * 0.28;

      marker.position.x = colToWorldX(currentPx);
      marker.position.y = markerY;

      if (col.hasInk) {
        // On ink — press toward board
        marker.position.z = BOARD_Z + 0.008;
      } else {
        // Whitespace / gap — lift slightly
        marker.position.z = BOARD_Z + LIFT_Z;
      }

      if (currentPx < lastInk) {
        requestAnimationFrame(frame);
      } else {
        returnPhase();
      }
    }

    requestAnimationFrame(frame);
  }

  // ──────────────────────────────────────────────────────────────────────────
  function returnPhase() {
    const tl = gsap.timeline({
      onComplete: () => {
        isAnimating = false;
        // Turn off shadows when resting on tray
        marker.traverse(c => { if (c.isMesh) c.castShadow = false; });

        // Reveal the "Call" button and start ringing
        if (callButtonMesh) {
          callButtonMesh.userData.isActive = true;
          ModelRegistry.registerInteractable(callButtonMesh);

          // Register mobile hitbox if it exists
          callButtonMesh.traverse((child) => {
            if (child.userData.isMobileHitbox) {
              child.userData.isActive = true;
              ModelRegistry.registerInteractable(child);
            }
          });

          gsap.to(callButtonMesh.material, { opacity: 1, duration: 0.6, ease: 'power2.out' });

          // Start ringing immediately!
          startPhoneRinging();
        }
      }
    });

    // Pause to read
    tl.to({}, { duration: 0.4 });

    // Lift from board
    tl.to(marker.position, { z: BOARD_Z + 0.12, y: '+=0.18', duration: 0.2, ease: 'power2.out' });

    // Return to rest
    tl.to(marker.position, {
      x: rest.x, y: rest.y + 0.38, z: rest.z + 0.05,
      duration: 0.4, ease: 'power2.inOut'
    });

    // Lower to tray
    tl.to(marker.position, { y: rest.y, z: rest.z, duration: 0.2, ease: 'power2.in' });

    // Rotate back flat (horizontal)
    tl.to(marker.rotation, { z: 0, x: 0, duration: 0.25, ease: 'power1.out' }, '-=0.22');
  }
}

export function clearWhiteboardText() {
  clearDisplay();
}
