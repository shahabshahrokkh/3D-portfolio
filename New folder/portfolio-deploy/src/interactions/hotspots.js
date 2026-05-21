import { openProjects } from '../ui/projectsOverlay.js';
import { triggerWhiteboardAnimation } from '../animations/whiteboardAnim.js';
import { toggleContactUI } from '../ui/contactOverlay.js';
import { toggleResumeUI } from '../ui/resumeOverlay.js';
import { ModelRegistry } from '../utils/registry.js';
import { focusOnObject } from './cameraTransitions.js';
import { startPhoneRinging } from '../objects/iphone.js';

// Scene ref — set by main.js after init
let _scene = null;
export function setHotspotScene(scene) { _scene = scene; }

// Track zoomed objects for two-click behavior
const zoomedObjects = new WeakMap();
let lastZoomedObject = null; // Track the last zoomed object

// Memo navigation
let memoObjects = []; // Will be populated by initMemos
let currentMemoIndex = -1;

export function registerMemos(memos) {
  memoObjects = memos;
}

export function navigateMemos(direction) {
  if (memoObjects.length === 0) return;

  // If no memo is currently zoomed, start from first
  if (currentMemoIndex === -1) {
    currentMemoIndex = 0;
  } else {
    // Move to next/previous
    currentMemoIndex += direction;
    // Wrap around
    if (currentMemoIndex < 0) currentMemoIndex = memoObjects.length - 1;
    if (currentMemoIndex >= memoObjects.length) currentMemoIndex = 0;
  }

  const memo = memoObjects[currentMemoIndex];

  // Reset previous zoom state
  if (lastZoomedObject) {
    zoomedObjects.delete(lastZoomedObject);
  }

  // Zoom to new memo (but don't open link)
  focusOnObject(memo);
  zoomedObjects.set(memo, true);
  lastZoomedObject = memo;

  // Show navigation UI
  showMemoNavigation();
}

function showMemoNavigation() {
  // Create or update navigation UI
  let nav = document.getElementById('memo-nav');
  if (!nav) {
    nav = document.createElement('div');
    nav.id = 'memo-nav';
    nav.innerHTML = `
      <button id="memo-prev" class="memo-nav-btn">◀</button>
      <span id="memo-counter">${currentMemoIndex + 1} / ${memoObjects.length}</span>
      <button id="memo-next" class="memo-nav-btn">▶</button>
    `;
    document.body.appendChild(nav);

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #memo-nav {
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 16px;
        background: rgba(30, 30, 40, 0.9);
        backdrop-filter: blur(16px);
        padding: 12px 24px;
        border-radius: 50px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        z-index: 10000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s;
      }

      #memo-nav.visible {
        opacity: 1;
        pointer-events: all;
      }

      .memo-nav-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        font-size: 18px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }

      .memo-nav-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.1);
      }

      .memo-nav-btn:active {
        transform: scale(0.95);
        background: rgba(255, 255, 255, 0.3);
      }

      #memo-counter {
        color: white;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        font-weight: 500;
        min-width: 60px;
        text-align: center;
        user-select: none;
      }

      @media (max-width: 768px) {
        #memo-nav {
          bottom: 80px;
          padding: 14px 24px;
          gap: 16px;
        }

        .memo-nav-btn {
          width: 48px;
          height: 48px;
          font-size: 20px;
        }

        #memo-counter {
          font-size: 15px;
          min-width: 70px;
        }
      }
    `;
    document.head.appendChild(style);

    // Add event listeners
    document.getElementById('memo-prev').addEventListener('click', (e) => {
      e.stopPropagation();
      navigateMemos(-1);
    });
    document.getElementById('memo-next').addEventListener('click', (e) => {
      e.stopPropagation();
      navigateMemos(1);
    });

    // Add touch event listeners for mobile
    document.getElementById('memo-prev').addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      navigateMemos(-1);
    });
    document.getElementById('memo-next').addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      navigateMemos(1);
    });

    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (nav.classList.contains('visible')) {
        if (e.key === 'ArrowLeft') navigateMemos(-1);
        if (e.key === 'ArrowRight') navigateMemos(1);
      }
    });
  }

  // Update counter
  document.getElementById('memo-counter').textContent = `${currentMemoIndex + 1} / ${memoObjects.length}`;

  // Show navigation
  nav.classList.add('visible');

  // Hide after 3 seconds of inactivity
  clearTimeout(nav.hideTimeout);
  nav.hideTimeout = setTimeout(() => {
    nav.classList.remove('visible');
  }, 3000);
}

export const HotspotActions = {
  openProjects: () => {
    openProjects();
  },
  openAbout: (object) => {
    showUI('About Me - Coming Soon!');
    if (object) {
      focusOnObject(object);
    }
  },
  openSkills: () => {
    showUI('Skills - Coming Soon!');
  },
  playCatAnimation: (object) => {
    showUI('Meow! 🐱');
    if (object) {
      focusOnObject(object);
    }
    window.dispatchEvent(new CustomEvent('triggerCatAction'));
  },
  openWhiteboard: () => {
    triggerWhiteboardAnimation(_scene);
    // Reveal the About Me label above the whiteboard
    window.dispatchEvent(new CustomEvent('reveal-spatial-label', { detail: { modelName: 'whiteboard' } }));
  },
  playArcade: () => {
    showUI('🕹️ Arcade - Click the screen to play!');
    window.dispatchEvent(new CustomEvent('activateArcade'));
  },
  openLink: (object) => {
    if (!object || !object.userData || !object.userData.url) return;

    // Get the root group (in case we clicked on a child mesh like pin or plane)
    const targetGroup = object.userData.parentGroup || object;

    // If clicking a different memo, reset previous one
    if (lastZoomedObject && lastZoomedObject !== targetGroup) {
      zoomedObjects.delete(lastZoomedObject);
    }

    const isZoomed = zoomedObjects.get(targetGroup);

    // Check if already zoomed (clicked before)
    if (isZoomed) {
      // Second click - open link
      window.open(targetGroup.userData.url, '_blank');
      // Reset zoom state after opening
      zoomedObjects.delete(targetGroup);
      lastZoomedObject = null;
    } else {
      // First click - zoom to object
      focusOnObject(targetGroup);
      // Mark as zoomed
      zoomedObjects.set(targetGroup, true);
      lastZoomedObject = targetGroup;

      // Update current memo index for navigation (use targetGroup, not object)
      const memoIndex = memoObjects.indexOf(targetGroup);
      if (memoIndex !== -1) {
        currentMemoIndex = memoIndex;
      }

      // Show navigation UI after zooming
      showMemoNavigation();

      // Reset zoom state after longer time on mobile (10s vs 5s on desktop)
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || window.innerWidth < 768;
      const resetTime = isMobile ? 10000 : 5000;

      setTimeout(() => {
        if (zoomedObjects.get(targetGroup)) {
          zoomedObjects.delete(targetGroup);
          if (lastZoomedObject === targetGroup) {
            lastZoomedObject = null;
          }
        }
      }, resetTime);
    }
  },
  callIphone: (object) => {
    const userData = object?.userData;
    if (!userData || !userData.isActive) return;
    const iphoneModel = ModelRegistry.getModel('iphone');
    if (iphoneModel) {
      // Start ringing effect
      startPhoneRinging();
      // Focus the iPhone
      focusOnObject(iphoneModel);
      setTimeout(() => {
        // After focusing iPhone, open the Contact UI
        toggleContactUI(true);
      }, 1200); // Wait for camera transition duration
    }
  },
  openContact: () => {
    toggleContactUI(true);
  },
  focusBookshelf: () => {
    showUI('📚 Programming Languages');
    // Reveal the Skills label above the bookshelf
    window.dispatchEvent(new CustomEvent('reveal-spatial-label', { detail: { modelName: 'bookshelf' } }));
  },
  focusShelves: (object) => {
    showUI('🖼️ My Photo Frame');
    focusOnObject(object);
  },
  openResume: (object) => {
    // Focus camera on the resume first
    if (object) {
      focusOnObject(object);
    }
    // After camera focuses, show the resume UI
    setTimeout(() => {
      toggleResumeUI(true);
    }, 1200); // Wait for camera transition duration
  }
};

function showUI(text) {
  const ui = document.getElementById('action-ui');
  if (ui) {
    ui.innerText = text;
    ui.style.display = 'block';
    if (ui.timeoutId) clearTimeout(ui.timeoutId);
    ui.timeoutId = setTimeout(() => {
      ui.style.display = 'none';
    }, 3000);
  }
  // Debug removed for production
}
