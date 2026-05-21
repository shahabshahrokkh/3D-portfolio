import { SnakeGame } from '../game/snakeGame.js';
import { disableControls, enableControls } from '../utils/controlsManager.js';

let isArcadeActive = false;
let arcadeGame = null;
let overlayEl = null;
let containerEl = null;

export function setupArcadeInteraction(camera) {
  overlayEl = document.getElementById('arcade-overlay');
  containerEl = document.getElementById('arcade-container');
  const closeBtn = document.getElementById('close-arcade-btn');

  // Listen for arcade activation from hotspot
  window.addEventListener('activateArcade', () => {
    activateArcadeMode();
  });

  // ESC to deactivate
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isArcadeActive) {
      deactivateArcadeMode();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => deactivateArcadeMode());
  }
}

function activateArcadeMode() {
  if (isArcadeActive) return;
  isArcadeActive = true;

  // Disable 3D scene interactions
  disableControls();

  if (overlayEl) {
    overlayEl.classList.add('active');
  }

  // Hide 3D action UI if open
  const actionUi = document.getElementById('action-ui');
  if (actionUi) actionUi.style.display = 'none';

  // Instantiate and mount game
  if (!arcadeGame) {
    arcadeGame = new SnakeGame();
  }

  if (containerEl) {
    containerEl.innerHTML = '';
    containerEl.appendChild(arcadeGame.canvas);
    // Focus the container to catch keyboard events easily without scrolling the page
    containerEl.focus();
  }

  arcadeGame.activate();
}

function deactivateArcadeMode() {
  if (!isArcadeActive) return;
  isArcadeActive = false;

  if (overlayEl) {
    overlayEl.classList.remove('active');
  }

  if (arcadeGame) {
    arcadeGame.destroy();
    arcadeGame = null;
  }

  if (containerEl) {
    containerEl.innerHTML = '';
  }

  // Re-enable 3D scene interactions
  enableControls();

  // Reveal the Gaming label above the arcade machine
  window.dispatchEvent(new CustomEvent('reveal-spatial-label', { detail: { modelName: 'arcade' } }));
}

export function isArcadeModeActive() {
  return isArcadeActive;
}
