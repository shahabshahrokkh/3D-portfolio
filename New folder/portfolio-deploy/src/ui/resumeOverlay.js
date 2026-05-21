import gsap from 'gsap';
import { disableControls, enableControls } from '../utils/controlsManager.js';

let isOpen = false;

function buildOverlay() {
  if (document.getElementById('resume-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'resume-overlay';
  overlay.innerHTML = `
    <div class="ro-backdrop" id="ro-backdrop"></div>
    <div class="ro-container">
      <div class="ro-card" id="ro-card">
        <button class="ro-close-btn-top" id="ro-close-btn-top">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
        
        <div class="ro-preview">
          <iframe 
            src="/SH.SH-Resume.pdf#toolbar=0&navpanes=0&scrollbar=0" 
            class="ro-pdf-preview"
            title="Resume Preview"
          ></iframe>
        </div>

        <div class="ro-actions">
          <a href="/SH.SH-Resume.pdf" target="_blank" class="ro-action-btn view">
            <div class="ro-btn-icon">👁️</div>
            <span>View</span>
          </a>
          <a href="/SH.SH-Resume.pdf" download="SH.SH-Resume.pdf" class="ro-action-btn download">
            <div class="ro-btn-icon">⬇️</div>
            <span>Download</span>
          </a>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #resume-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 1000;
      display: none;
      align-items: center;
      justify-content: center;
      opacity: 0;
    }

    .ro-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(10, 10, 15, 0.7);
      backdrop-filter: blur(8px);
    }

    .ro-container {
      position: relative;
      z-index: 2;
      width: 100%;
      max-width: 500px;
      padding: 0 20px;
    }

    .ro-card {
      background: rgba(30, 30, 40, 0.85);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 36px;
      padding: 24px;
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      position: relative;
    }

    .ro-close-btn-top {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      cursor: pointer;
      transition: transform 0.2s, filter 0.2s;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      z-index: 10;
      touch-action: manipulation;
      background: #ff3b30;
      box-shadow: 0 4px 12px rgba(255, 59, 48, 0.4);
    }

    .ro-close-btn-top:hover,
    .ro-close-btn-top:active {
      transform: scale(1.05);
      filter: brightness(1.1);
    }

    .ro-preview {
      width: 100%;
      height: 600px;
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 20px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      position: relative;
    }

    .ro-pdf-preview {
      width: 100%;
      height: 100%;
      border: none;
      background: white;
    }

    .ro-actions {
      display: flex;
      gap: 20px;
      width: 100%;
      justify-content: center;
      position: relative;
      z-index: 5;
    }

    .ro-action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: #fff;
      text-decoration: none;
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      opacity: 0.8;
      transition: all 0.2s;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      position: relative;
      z-index: 10;
    }

    .ro-action-btn:hover,
    .ro-action-btn:active {
      opacity: 1;
      transform: translateY(-2px);
    }

    .ro-btn-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      background: rgba(255, 255, 255, 0.1);
    }

    .ro-action-btn.view .ro-btn-icon {
      background: rgba(52, 152, 219, 0.2);
      color: #3498db;
    }

    .ro-action-btn.download .ro-btn-icon {
      background: rgba(52, 199, 89, 0.2);
      color: #34c759;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .ro-container {
        max-width: 95%;
        padding: 0 10px;
      }

      .ro-card {
        padding: 16px;
        border-radius: 24px;
        max-height: 90vh;
        overflow-y: auto;
      }

      .ro-close-btn-top {
        width: 36px;
        height: 36px;
        top: 12px;
        right: 12px;
      }

      .ro-close-btn-top svg {
        width: 24px;
        height: 24px;
      }

      .ro-preview {
        height: calc(100vh - 220px);
        min-height: 350px;
        max-height: 550px;
        margin-bottom: 16px;
      }

      .ro-actions {
        gap: 24px;
      }

      .ro-action-btn {
        font-size: 13px;
        padding: 8px;
      }

      .ro-btn-icon {
        width: 56px;
        height: 56px;
        font-size: 22px;
      }
    }

    @media (max-width: 480px) {
      .ro-container {
        max-width: 100%;
        padding: 0 8px;
      }

      .ro-card {
        padding: 12px;
        border-radius: 20px;
        max-height: 92vh;
      }

      .ro-close-btn-top {
        width: 34px;
        height: 34px;
        top: 10px;
        right: 10px;
      }

      .ro-close-btn-top svg {
        width: 22px;
        height: 22px;
      }

      .ro-preview {
        height: calc(100vh - 200px);
        min-height: 320px;
        max-height: 500px;
        margin-bottom: 14px;
        border-radius: 12px;
      }

      .ro-actions {
        gap: 20px;
      }

      .ro-btn-icon {
        width: 52px;
        height: 52px;
        font-size: 20px;
      }
    }

    /* Extra small screens (iPhone SE, etc.) */
    @media (max-width: 375px) {
      .ro-card {
        padding: 10px;
        border-radius: 18px;
      }

      .ro-close-btn-top {
        width: 32px;
        height: 32px;
        top: 8px;
        right: 8px;
      }

      .ro-close-btn-top svg {
        width: 20px;
        height: 20px;
      }

      .ro-preview {
        height: calc(100vh - 180px);
        min-height: 280px;
        max-height: 450px;
      }

      .ro-actions {
        gap: 16px;
      }

      .ro-btn-icon {
        width: 48px;
        height: 48px;
        font-size: 18px;
      }
    }

    /* Landscape mode on mobile */
    @media (max-height: 600px) and (orientation: landscape) {
      .ro-card {
        max-height: 95vh;
        padding: 10px;
      }

      .ro-close-btn-top {
        width: 32px;
        height: 32px;
        top: 8px;
        right: 8px;
      }

      .ro-preview {
        height: calc(100vh - 160px);
        min-height: 220px;
        max-height: 400px;
      }

      .ro-actions {
        gap: 16px;
      }

      .ro-btn-icon {
        width: 44px;
        height: 44px;
      }
    }
  `;
  document.head.appendChild(style);

  // Event listeners
  document.getElementById('ro-backdrop').addEventListener('click', () => {
    toggleResumeUI(false);
  });

  document.getElementById('ro-close-btn-top').addEventListener('click', () => {
    toggleResumeUI(false);
  });

  // Close after clicking view or download (with delay)
  const actionBtns = document.querySelectorAll('.ro-action-btn');
  actionBtns.forEach(btn => {
    const handleInteraction = () => {
      setTimeout(() => toggleResumeUI(false), 500);
    };

    btn.addEventListener('click', handleInteraction);

    // Add touch support for mobile
    if ('ontouchstart' in window) {
      btn.addEventListener('touchend', (e) => {
        // Let the link work naturally
      }, { passive: true });
    }
  });
}

export function toggleResumeUI(show) {
  if (show === isOpen) return;

  if (show) {
    buildOverlay();
    isOpen = true;

    // Disable 3D scene interactions
    disableControls();

    const overlay = document.getElementById('resume-overlay');
    overlay.style.display = 'flex';

    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    gsap.fromTo('#ro-card', { y: 100, scale: 0.9, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' });
  } else {
    const overlay = document.getElementById('resume-overlay');
    if (!overlay) return;

    gsap.to('#ro-card', { y: 50, scale: 0.95, opacity: 0, duration: 0.3, ease: 'power2.in' });
    gsap.to(overlay, {
      opacity: 0, duration: 0.3, onComplete: () => {
        overlay.style.display = 'none';
        isOpen = false;

        // Re-enable 3D scene interactions
        enableControls();

        // Reveal the Resume label above the brochure
        window.dispatchEvent(new CustomEvent('reveal-spatial-label', { detail: { modelName: 'resume' } }));
      }
    });
  }
}
