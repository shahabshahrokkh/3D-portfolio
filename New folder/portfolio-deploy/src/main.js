import * as THREE from 'three';
import { setupScene } from './scene/setup.js';
import { createEnvironment, glitchMeshes } from './scene/environment.js';
import { updateDustParticles } from './scene/environment.js';
import { ShaderGlitchManager } from './scene/shaderGlitch.js';
import { initCosmicEnvironment, updateCosmicEnvironment } from './scene/cosmic.js';
import { setupRaycaster } from './interactions/raycaster.js';
import { setupAnimations, updateAnimations } from './animations/idle.js';
import { setupCameraTransitions } from './interactions/cameraTransitions.js';
import { setupDragControls } from './interactions/dragControls.js';
import { setupArcadeInteraction } from './interactions/arcadeInteraction.js';
import { initControlsManager } from './utils/controlsManager.js';
import { setupSpatialUI, revealLabel } from './ui/SpatialUI.js';
import '../style.css';

import { initLaptop } from './objects/laptop.js';
import { initBed } from './objects/bed.js';
import { initDesk } from './objects/desk.js';
import { initChair } from './objects/chair.js';
import { initCat } from './objects/cat.js';
import { initWhiteboard } from './objects/whiteboard.js';
import { initMemos } from './objects/memos.js';
import { initArcade, updateArcade } from './objects/arcade.js';
import { initIphone } from './objects/iphone.js';
import { initShelves } from './objects/shelves.js';
import { initBookshelf } from './objects/bookshelf.js';
import { initPythonIcon } from './objects/pythonIcon.js';
import { initReactIcon } from './objects/reactIcon.js';
import { initHtmlIcon } from './objects/htmlIcon.js';
import { initBlenderIcon } from './objects/blenderIcon.js';
import { initTypewriter } from './objects/typewriter.js';
import { initCsharpIcon } from './objects/csharpIcon.js';
import { initCIcon } from './objects/cIcon.js';
import { initSpaceHelmet } from './objects/spaceHelmet.js';
import { initSonicCartridge } from './objects/sonicCartridge.js';
import { initLogoModel } from './objects/logoModel.js';
import { initThreejsIcon } from './objects/threejsIcon.js';
import { initResume } from './objects/resume.js';
import { initCarpet } from './objects/carpet.js';
import { initMonitor } from './objects/monitor.js';
import { initMouseKeyboard } from './objects/mouseKeyboard.js';
import { setHotspotScene, registerMemos } from './interactions/hotspots.js';
import { initAstronaut, updateAstronaut } from './objects/astronaut.js';
import { setupEarth, updateEarth } from './scene/earth.js';
import { createCompleteRoomWireframe } from './scene/wireframeDome.js';

// UI Styles
import './ui/controls.css';
import './ui/mobile.css';

async function init() {
  const { scene, camera, renderer, controls, composer, labelRenderer, isMobile } = setupScene();

  // 1. Initial Scene Setup
  createEnvironment(scene);
  camera.layers.enable(1);
  initCosmicEnvironment(scene);
  setupEarth(scene);
  setHotspotScene(scene);

  // Add Complete Room Wireframe (dome + glass panels + geodesic floor aligned with wireframe)
  const { dome, glass, floor, animate: animateWireframe } = createCompleteRoomWireframe(scene);

  // Add glitch effect to floor
  if (floor) {
    const floorGlitch = new ShaderGlitchManager(1024, 1024);
    floor.userData.isGlitchSurface = true;
    floor.userData.glitchManager = floorGlitch;
    glitchMeshes.push(floor);
  }

  // 2. Setup Interaction & Controls
  setupRaycaster(camera, scene);
  const dragControls = setupDragControls(camera, controls);
  setupAnimations(scene);
  setupCameraTransitions(camera, controls);
  setupArcadeInteraction(camera);
  initControlsManager(controls);

  // ═══════════════════════════════════════════════════════════════════
  // PROGRESSIVE LOADING TIERS
  // ═══════════════════════════════════════════════════════════════════

  // TIER 1: Core Environment (Desk, Room shell, Monitor)
  const tier1 = [
    initDesk(scene),
    initMonitor(scene),
    initChair(scene),
    initLaptop(scene),
    initCarpet(scene)
  ];

  await Promise.all(tier1);

  // Hide Loading Screen after Core elements are ready
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.opacity = '0';
    setTimeout(() => loadingScreen.remove(), 1000);
  }

  // TIER 2: Secondary Furniture & Essentials
  const tier2 = [
    initBed(scene),
    initShelves(scene),
    initBookshelf(scene),
    initWhiteboard(scene),
    initMouseKeyboard(scene),
    initResume(scene)
  ];

  await Promise.all(tier2);

  // TIER 3: Details & Interactive Icons
  const tier3 = [
    initIphone(scene),
    initCat(scene),
    initAstronaut(scene),
    initArcade(scene, camera, renderer),
    initPythonIcon(scene),
    initReactIcon(scene),
    initHtmlIcon(scene),
    initBlenderIcon(scene),
    initTypewriter(scene),
    initCsharpIcon(scene),
    initCIcon(scene),
    initSpaceHelmet(scene),
    initSonicCartridge(scene),
    initLogoModel(scene),
    initThreejsIcon(scene)
  ];

  // Initialize memos separately to register them for navigation
  const memoObjects = await initMemos(scene);
  registerMemos(memoObjects);

  // Load Tier 3 in the background (no await needed for the whole tier if we want it truly progressive)
  Promise.all(tier3).then(() => {
    // Setup Spatial UI after everything is loaded for best positioning
    setupSpatialUI(scene, camera);

    // Bookshelf icons block raycasting on the bookshelf mesh itself.
    // Auto-reveal the Skills label after a short delay as an onboarding hint.
    setTimeout(() => revealLabel('bookshelf'), 4000);
  });


  // UI Controls - Desktop
  const resetBtn = document.getElementById('reset-view-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      controls.reset();
    });
  }

  // UI Controls - Mobile
  const resetBtnMobile = document.getElementById('reset-view-btn-mobile');
  if (resetBtnMobile) {
    resetBtnMobile.addEventListener('click', () => {
      controls.reset();

      // Haptic feedback on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    });
  }

  // Mobile Control Panel Toggle
  const controlToggleBtn = document.getElementById('control-toggle-btn');
  const controlContent = document.getElementById('control-content');

  if (controlToggleBtn && controlContent) {
    // Load saved state from localStorage
    const savedState = localStorage.getItem('mobileControlsExpanded');
    if (savedState === 'true') {
      controlContent.classList.remove('collapsed');
      controlContent.classList.add('expanded');
      controlToggleBtn.classList.add('expanded');
    }

    controlToggleBtn.addEventListener('click', () => {
      const isCollapsed = controlContent.classList.contains('collapsed');

      if (isCollapsed) {
        // Expand
        controlContent.classList.remove('collapsed');
        controlContent.classList.add('expanded');
        controlToggleBtn.classList.add('expanded');
        localStorage.setItem('mobileControlsExpanded', 'true');
      } else {
        // Collapse
        controlContent.classList.remove('expanded');
        controlContent.classList.add('collapsed');
        controlToggleBtn.classList.remove('expanded');
        localStorage.setItem('mobileControlsExpanded', 'false');
      }

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
    });
  }

  // Setup Glitch Raycaster
  const glitchRaycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    glitchRaycaster.setFromCamera(mouse, camera);
    const intersects = glitchRaycaster.intersectObjects(glitchMeshes);
    if (intersects.length > 0) {
      const hit = intersects[0];
      if (hit.uv && hit.object.userData.glitchManager) {
        hit.object.userData.glitchManager.setHover(hit.uv.x, hit.uv.y);
      }
    }
  });

  // Animation clock
  const clock = new THREE.Clock();

  // Render loop
  function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    controls.update();
    dragControls.update();
    updateAnimations();
    updateArcade(time);
    updateCosmicEnvironment(time);
    updateEarth(time);
    updateAstronaut(time);
    updateDustParticles(time);
    animateWireframe(); // Update room wireframe
    glitchMeshes.forEach(mesh => {
      if (mesh.userData.glitchManager) mesh.userData.glitchManager.update(renderer, time);
    });

    // Use composer for post-processing if available, otherwise fallback to renderer
    if (composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }

    // Render CSS labels
    if (labelRenderer) {
      labelRenderer.render(scene, camera);
    }
  }

  animate();
}

// Start application
init();

// Force full reload on HMR to prevent scene duplication/cache issues
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.location.reload();
  });
}
