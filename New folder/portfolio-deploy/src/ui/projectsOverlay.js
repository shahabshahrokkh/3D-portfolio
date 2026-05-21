import gsap from 'gsap';
import { PROJECTS } from '../data/projects.js';
import { disableControls, enableControls } from '../utils/controlsManager.js';

// ─── State ────────────────────────────────────────────────────────────────────
let selectedProject = null;
let isOpen = false;
let onCloseCallback = null;

// ─── DOM Builder ──────────────────────────────────────────────────────────────
function buildOverlay() {
  if (document.getElementById('projects-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'projects-overlay';
  overlay.innerHTML = `
    <div class="po-backdrop"></div>
    <div class="po-container">

      <!-- LEFT PANEL: Laptop screen — project list -->
      <div class="po-left" id="po-left">
        <div class="po-left-header">
          <div class="po-device-indicator">
            <span class="po-dot"></span>
            <span class="po-label">LAPTOP</span>
          </div>
          <h2 class="po-title">My <span class="po-accent">Projects</span></h2>
          <p class="po-subtitle">Select a project to preview on the monitor →</p>
        </div>
        <ul class="po-list" id="po-list">
          ${PROJECTS.map((p, i) => `
            <li class="po-list-item" data-id="${p.id}" data-index="${i}" style="--accent: ${p.color}">
              <span class="po-item-num">${String(i + 1).padStart(2, '0')}</span>
              <div class="po-item-info">
                <span class="po-item-title">${p.title}</span>
                <span class="po-item-cat">${p.category} · ${p.year}</span>
              </div>
              <span class="po-item-arrow">›</span>
            </li>
          `).join('')}
        </ul>
        <button class="po-close-btn" id="po-close-btn">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M13 5L5 13M5 5l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Exit
        </button>
      </div>

      <!-- RIGHT PANEL: Monitor — project detail -->
      <div class="po-right" id="po-right">
        <div class="po-device-indicator">
          <span class="po-dot po-dot--monitor"></span>
          <span class="po-label">MONITOR</span>
        </div>

        <!-- Empty state -->
        <div class="po-empty" id="po-empty">
          <div class="po-empty-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <rect x="4" y="8" width="56" height="36" rx="4" stroke="currentColor" stroke-width="2"/>
              <path d="M20 44v8M44 44v8M12 52h40" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <circle cx="32" cy="26" r="8" stroke="currentColor" stroke-width="2" stroke-dasharray="4 2"/>
            </svg>
          </div>
          <p class="po-empty-text">Select a project from<br/>the laptop to preview here</p>
        </div>

        <!-- Project detail -->
        <div class="po-detail" id="po-detail" style="display:none">
          <div class="po-video-wrap">
            <video id="po-video" autoplay muted loop playsinline></video>
            <div class="po-video-scanline"></div>
          </div>
          <div class="po-detail-body">
            <div class="po-detail-top">
              <div>
                <span class="po-detail-cat" id="po-detail-cat"></span>
                <span class="po-detail-year" id="po-detail-year"></span>
              </div>
              <h3 class="po-detail-title" id="po-detail-title"></h3>
              <p class="po-detail-desc" id="po-detail-desc"></p>
            </div>
            <div class="po-tech-wrap" id="po-tech-wrap"></div>
            <div class="po-cta-wrap">
              <a class="po-btn po-btn--primary" id="po-live-btn" href="#" target="_blank" rel="noopener">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 2H2v12h12v-4M14 2H8m6 0v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Live Site
              </a>
              <a class="po-btn po-btn--secondary" id="po-github-btn" href="#" target="_blank" rel="noopener">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(overlay);
  bindEvents();
}

// ─── Bind Events ──────────────────────────────────────────────────────────────
function bindEvents() {
  // List item click
  document.getElementById('po-list').addEventListener('click', (e) => {
    const item = e.target.closest('.po-list-item');
    if (!item) return;
    const project = PROJECTS.find(p => p.id === item.dataset.id);
    if (project) selectProject(project, item);
  });

  // Close button
  document.getElementById('po-close-btn').addEventListener('click', closeProjects);

  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeProjects();
  });
}

// ─── Select Project ───────────────────────────────────────────────────────────
function selectProject(project, listItem) {
  // Update active state in list
  document.querySelectorAll('.po-list-item').forEach(el => el.classList.remove('active'));
  listItem.classList.add('active');

  // If same project, skip
  if (selectedProject?.id === project.id) return;
  selectedProject = project;

  const detail = document.getElementById('po-detail');
  const empty = document.getElementById('po-empty');

  // Transition out then in
  gsap.to(detail.children, {
    opacity: 0,
    y: 10,
    duration: 0.2,
    stagger: 0.03,
    onComplete: () => {
      populateDetail(project);
      empty.style.display = 'none';
      detail.style.display = 'flex';
      // Force reflow
      detail.offsetHeight;
      gsap.fromTo(detail.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.07, ease: 'power2.out' }
      );
    }
  });
}

// ─── Populate Detail Panel ────────────────────────────────────────────────────
function populateDetail(project) {
  // Video
  const video = document.getElementById('po-video');
  video.src = project.video;
  video.load();
  video.play().catch(() => { });

  // Text
  document.getElementById('po-detail-cat').textContent = project.category;
  document.getElementById('po-detail-year').textContent = project.year;
  document.getElementById('po-detail-title').textContent = project.title;
  document.getElementById('po-detail-desc').textContent = project.longDescription || project.description;

  // Tech tags
  const techWrap = document.getElementById('po-tech-wrap');
  techWrap.innerHTML = project.tech.map(t =>
    `<span class="po-tech-tag" style="--accent: ${project.color}">${t}</span>`
  ).join('');

  // Update accent color for the right panel
  document.getElementById('po-right').style.setProperty('--accent', project.color);

  // Links
  document.getElementById('po-live-btn').href = project.liveUrl || '#';
  document.getElementById('po-github-btn').href = project.githubUrl || '#';
}

// ─── Open / Close ─────────────────────────────────────────────────────────────
export function openProjects(onClose) {
  if (isOpen) return;
  isOpen = true;
  onCloseCallback = onClose || null;

  // Disable 3D scene interactions
  disableControls();

  buildOverlay();
  const overlay = document.getElementById('projects-overlay');
  overlay.style.display = 'flex';

  // Animate in
  gsap.timeline()
    .fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' })
    .fromTo('#po-left',
      { x: -60, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' },
      '-=0.2'
    )
    .fromTo('#po-right',
      { x: 60, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' },
      '<'
    )
    .fromTo('.po-list-item',
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, stagger: 0.06, duration: 0.35, ease: 'power2.out' },
      '-=0.3'
    );
}

export function closeProjects() {
  if (!isOpen) return;

  // Stop any playing video
  const video = document.getElementById('po-video');
  if (video) { video.pause(); video.src = ''; }

  const overlay = document.getElementById('projects-overlay');
  gsap.timeline()
    .to('#po-left', { x: -40, opacity: 0, duration: 0.3 })
    .to('#po-right', { x: 40, opacity: 0, duration: 0.3 }, '<')
    .to(overlay, {
      opacity: 0, duration: 0.3,
      onComplete: () => {
        overlay.style.display = 'none';
        isOpen = false;
        selectedProject = null;
        // Reset list active states
        document.querySelectorAll('.po-list-item').forEach(el => el.classList.remove('active'));
        // Reset detail panel
        document.getElementById('po-detail').style.display = 'none';
        document.getElementById('po-empty').style.display = 'flex';

        // Re-enable 3D scene interactions
        enableControls();

        // Reveal the Projects label above the laptop
        window.dispatchEvent(new CustomEvent('reveal-spatial-label', { detail: { modelName: 'laptop' } }));

        if (onCloseCallback) onCloseCallback();
      }
    });
}
