import gsap from 'gsap';
import { stopPhoneRinging } from '../objects/iphone.js';
import { disableControls, enableControls } from '../utils/controlsManager.js';

let isOpen = false;

function buildOverlay() {
  if (document.getElementById('contact-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'contact-overlay';
  overlay.innerHTML = `
    <div class="co-backdrop" id="co-backdrop"></div>
    <div class="co-container">
      <div class="co-card" id="co-card">
        <div class="co-header">
          <div class="co-avatar">
            <img src="/assets/polaroid_art.webp" alt="Avatar" />
          </div>
          <h2 class="co-name">Contact Me</h2>
          <p class="co-role">Ready to build something amazing?</p>
        </div>
        
        <div class="co-actions">
          <a href="mailto:Shahabshahrokhh@gmail.com" class="co-action-btn email">
            <div class="co-icon">✉️</div>
            <span>Email</span>
          </a>
          <a href="https://linkedin.com/" target="_blank" class="co-action-btn linkedin">
            <div class="co-icon">💼</div>
            <span>LinkedIn</span>
          </a>
          <a href="https://github.com/" target="_blank" class="co-action-btn github">
            <div class="co-icon">💻</div>
            <span>GitHub</span>
          </a>
        </div>

        <div class="co-dialer">
          <a href="tel:+1234567890" class="co-call-btn">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
            </svg>
          </a>
          <button class="co-end-btn" id="co-close-btn">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white" style="transform: rotate(135deg);">
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('co-backdrop').addEventListener('click', () => {
    stopPhoneRinging();
    toggleContactUI(false);
  });

  // Stop ringing when clicking any action button
  const actionBtns = document.querySelectorAll('.co-action-btn, .co-call-btn, .co-end-btn');
  actionBtns.forEach(btn => {
    // Add both click and touchend for better mobile support
    const handleInteraction = (e) => {
      stopPhoneRinging();
      if (btn.classList.contains('co-end-btn')) {
        e.preventDefault();
        toggleContactUI(false);
      } else if (btn.classList.contains('co-call-btn')) {
        // Let the link work naturally, but close after a delay
        setTimeout(() => toggleContactUI(false), 300);
      }
      // For action buttons (email, linkedin, github), let them work naturally
    };

    btn.addEventListener('click', handleInteraction);

    // Add touch support for mobile
    if ('ontouchstart' in window) {
      btn.addEventListener('touchend', (e) => {
        // Prevent ghost clicks
        if (btn.classList.contains('co-end-btn')) {
          e.preventDefault();
          handleInteraction(e);
        }
      }, { passive: false });
    }
  });
}

export function toggleContactUI(show) {
  if (show === isOpen) return;

  if (show) {
    buildOverlay();
    isOpen = true;

    // Disable 3D scene interactions
    disableControls();

    const overlay = document.getElementById('contact-overlay');
    overlay.style.display = 'flex';

    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    gsap.fromTo('#co-card', { y: 100, scale: 0.9, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' });
  } else {
    const overlay = document.getElementById('contact-overlay');
    if (!overlay) return;

    gsap.to('#co-card', { y: 50, scale: 0.95, opacity: 0, duration: 0.3, ease: 'power2.in' });
    gsap.to(overlay, {
      opacity: 0, duration: 0.3, onComplete: () => {
        overlay.style.display = 'none';
        isOpen = false;

        // Re-enable 3D scene interactions
        enableControls();

        // Reveal the Contact label above the iPhone
        window.dispatchEvent(new CustomEvent('reveal-spatial-label', { detail: { modelName: 'iphone' } }));
      }
    });
  }
}
