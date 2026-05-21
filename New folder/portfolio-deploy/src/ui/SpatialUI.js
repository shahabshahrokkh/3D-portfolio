import * as THREE from 'three';
import { HotspotActions } from '../interactions/hotspots.js';
import { ModelRegistry } from '../utils/registry.js';

// ─── State ────────────────────────────────────────────────────────────────────
const labelMap = new Map(); // modelName → { worldPos, el, revealed, animating, animProgress, startX, startY }
let _camera = null;
let _rafId = null;
let lastTime = null;

const ANIM_DURATION = 0.75; // seconds for fly-in animation

// ─── Easing ───────────────────────────────────────────────────────────────────
function easeOutBack(t) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// ─── DOM helpers ──────────────────────────────────────────────────────────────
function createLabelEl(text, icon, action) {
  const el = document.createElement('div');
  el.className = 'spatial-label';
  el.innerHTML = `<span class="sl-icon">${icon}</span><span class="sl-text">${text}</span>`;
  el.style.position = 'absolute';
  el.style.transform = 'translate(-50%, -50%)';
  el.style.pointerEvents = 'auto';
  el.style.opacity = '0';
  el.style.display = 'none';

  if (action) {
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
    el.addEventListener('click', () => action());
  }
  return el;
}

function projectToScreen(worldPos, camera, W, H) {
  const v = worldPos.clone().project(camera);
  return {
    x: (v.x * 0.5 + 0.5) * W,
    y: (-v.y * 0.5 + 0.5) * H,
    behind: v.z > 1,
  };
}

// ─── Per-frame update loop ────────────────────────────────────────────────────
function updateLabelPositions(timestamp) {
  if (!_camera) return;

  const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0;
  lastTime = timestamp;

  const W = window.innerWidth;
  const H = window.innerHeight;

  labelMap.forEach(item => {
    if (!item.revealed) return;

    const { x: tx, y: ty, behind } = projectToScreen(item.worldPos, _camera, W, H);

    if (behind) {
      item.el.style.display = 'none';
      return;
    }
    item.el.style.display = '';

    if (item.animating) {
      item.animProgress = Math.min(1, item.animProgress + dt / ANIM_DURATION);
      const t = easeOutBack(item.animProgress);
      const x = item.startX + (tx - item.startX) * t;
      const y = item.startY + (ty - item.startY) * t;
      item.el.style.left = `${x}px`;
      item.el.style.top = `${y}px`;
      item.el.style.opacity = `${Math.min(1, item.animProgress * 2)}`;

      if (item.animProgress >= 1) item.animating = false;
    } else {
      item.el.style.left = `${tx}px`;
      item.el.style.top = `${ty}px`;
      item.el.style.opacity = '1';
    }
  });

  _rafId = requestAnimationFrame(updateLabelPositions);
}

// ─── Public: reveal a label with fly-in animation ────────────────────────────
export function revealLabel(modelName) {
  const item = labelMap.get(modelName);
  if (!item || item.revealed) return;

  item.revealed = true;
  item.animating = true;
  item.animProgress = 0;
  // Fly-in starts from top-left corner of screen
  item.startX = 36;
  item.startY = 24;
  item.el.style.left = `${item.startX}px`;
  item.el.style.top = `${item.startY}px`;
  item.el.style.opacity = '0';
  item.el.style.display = '';
}

// ─── Public: setup all labels (hidden until revealed) ────────────────────────
export function setupSpatialUI(scene, camera) {
  _camera = camera;

  // Overlay container
  let container = document.getElementById('spatial-ui-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'spatial-ui-container';
    container.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      z-index: 10;
    `;
    document.body.appendChild(container);
  }

  const labelConfigs = [
    { modelName: 'laptop', text: 'Projects', icon: '💻', action: HotspotActions.openProjects, extraY: 0.5 },
    { modelName: 'bookshelf', text: 'Skills', icon: '🧠', action: HotspotActions.openSkills, extraY: 0.4 },
    { modelName: 'whiteboard', text: 'About Me', icon: '👋', action: HotspotActions.openAbout, extraY: 0.5 },
    { modelName: 'iphone', text: 'Contact', icon: '✉️', action: HotspotActions.openContact, extraY: 0.3 },
    { modelName: 'arcade', text: 'Gaming', icon: '🕹️', action: HotspotActions.playArcade, extraY: 0.5 },
    { modelName: 'resume', text: 'Resume', icon: '📄', action: HotspotActions.openResume, extraY: 0.3 },
  ];

  labelConfigs.forEach(cfg => {
    const model = ModelRegistry.getModel(cfg.modelName);
    if (!model) {
      console.warn(`[SpatialUI] Model '${cfg.modelName}' not found.`);
      return;
    }

    model.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const worldPos = new THREE.Vector3(center.x, box.max.y + cfg.extraY, center.z);
    const el = createLabelEl(cfg.text, cfg.icon, cfg.action);
    container.appendChild(el);

    labelMap.set(cfg.modelName, {
      worldPos, el,
      revealed: false, animating: false,
      animProgress: 0, startX: 0, startY: 0,
    });
  });

  // Listen for reveal events dispatched by other modules
  window.addEventListener('reveal-spatial-label', (e) => {
    revealLabel(e.detail?.modelName);
  });

  // Start update loop
  if (_rafId) cancelAnimationFrame(_rafId);
  lastTime = null;
  requestAnimationFrame(updateLabelPositions);
}
