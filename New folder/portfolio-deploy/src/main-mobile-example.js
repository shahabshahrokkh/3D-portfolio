/**
 * Example: How to integrate mobile utilities into main.js
 * This is a reference file showing how to use the mobile detection utilities
 * Copy the relevant parts to your actual main.js file
 */

import * as THREE from 'three';
import { setupScene } from './scene/setup.js';
import { createEnvironment, glitchMeshes } from './scene/environment.js';
import { initCosmicEnvironment, updateCosmicEnvironment } from './scene/cosmic.js';
import { setupRaycaster } from './interactions/raycaster.js';
import { setupAnimations, updateAnimations } from './animations/idle.js';
import { setupCameraTransitions } from './interactions/cameraTransitions.js';
import { setupDragControls } from './interactions/dragControls.js';
import { setupArcadeInteraction } from './interactions/arcadeInteraction.js';

// Import all object initializers
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
import { initCarpet } from './objects/carpet.js';
import { initMonitor } from './objects/monitor.js';
import { initMouseKeyboard } from './objects/mouseKeyboard.js';
import { setHotspotScene } from './interactions/hotspots.js';
import { initAstronaut, updateAstronaut } from './objects/astronaut.js';
import { setupEarth, updateEarth } from './scene/earth.js';

// Import mobile utilities
import {
    addDeviceClass,
    preventDefaultTouchBehaviors,
    getDeviceType,
    getPerformanceTier,
    isMobileDevice
} from './utils/mobileDetect.js';

// UI Styles
import './ui/controls.css';
import './ui/mobile.css';

function init() {
    // ═══════════════════════════════════════════════════════════
    // MOBILE OPTIMIZATION - Step 1: Setup device detection
    // ═══════════════════════════════════════════════════════════

    // Add device-specific classes to body for CSS targeting
    addDeviceClass();

    // Prevent unwanted touch behaviors (pull-to-refresh, double-tap zoom)
    preventDefaultTouchBehaviors();

    // Get device information
    const deviceType = getDeviceType(); // 'mobile', 'tablet', or 'desktop'
    const performanceTier = getPerformanceTier(); // 'low', 'medium', or 'high'
    const isMobile = isMobileDevice();

    // Log device info for debugging
    console.log(`📱 Device: ${deviceType} | Performance: ${performanceTier}`);

    // ═══════════════════════════════════════════════════════════
    // MOBILE OPTIMIZATION - Step 2: Show mobile message (optional)
    // ═══════════════════════════════════════════════════════════

    if (isMobile) {
        showMobileOptimizationMessage();
    }

    // ═══════════════════════════════════════════════════════════
    // Scene Setup (already optimized for mobile in setup.js)
    // ═══════════════════════════════════════════════════════════

    const { scene, camera, renderer, controls } = setupScene();

    // ═══════════════════════════════════════════════════════════
    // MOBILE OPTIMIZATION - Step 3: Adjust quality based on performance
    // ═══════════════════════════════════════════════════════════

    // Reduce quality for low-end devices
    if (performanceTier === 'low') {
        renderer.setPixelRatio(1); // Lower pixel ratio
        console.log('⚡ Low-end device detected - Quality reduced for better performance');
    }

    // Load environment
    createEnvironment(scene);

    // Enable camera to see Layer 1 (Earth layer) in addition to Layer 0
    camera.layers.enable(1);

    // ═══════════════════════════════════════════════════════════
    // MOBILE OPTIMIZATION - Step 4: Conditional feature loading
    // ═══════════════════════════════════════════════════════════

    // Setup Cosmic Environment (reduce particles on mobile)
    if (performanceTier !== 'low') {
        initCosmicEnvironment(scene);
    } else {
        console.log('⚡ Cosmic environment disabled for performance');
    }

    // Setup Earth Background
    setupEarth(scene);

    // ═══════════════════════════════════════════════════════════
    // Load 3D Objects
    // ═══════════════════════════════════════════════════════════

    // Load all objects (they handle their own placeholders)
    initDesk(scene);
    initChair(scene);
    initBed(scene);
    initLaptop(scene);
    initIphone(scene);
    initCat(scene);
    initWhiteboard(scene);
    initMemos(scene);
    initArcade(scene, camera, renderer);
    initShelves(scene);
    initCarpet(scene);
    initMonitor(scene);
    initMouseKeyboard(scene);
    initAstronaut(scene);

    // Pass scene to hotspots so whiteboard animation can add canvas plane
    setHotspotScene(scene);

    // ═══════════════════════════════════════════════════════════
    // Setup Interactions
    // ═══════════════════════════════════════════════════════════

    setupRaycaster(camera, scene);
    const dragControls = setupDragControls(camera, controls);
    setupAnimations(scene);
    setupCameraTransitions(camera, controls);
    setupArcadeInteraction(camera);

    // ═══════════════════════════════════════════════════════════
    // UI Controls
    // ═══════════════════════════════════════════════════════════

    const resetBtn = document.getElementById('reset-view-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            controls.reset();

            // Haptic feedback on mobile
            if (isMobile && 'vibrate' in navigator) {
                navigator.vibrate(50);
            }
        });
    }

    // ═══════════════════════════════════════════════════════════
    // MOBILE OPTIMIZATION - Step 5: Touch-optimized glitch effect
    // ═══════════════════════════════════════════════════════════

    // Setup Glitch Raycaster
    const glitchRaycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    // Handle both mouse and touch events
    const updatePointer = (clientX, clientY) => {
        pointer.x = (clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(clientY / window.innerHeight) * 2 + 1;

        glitchRaycaster.setFromCamera(pointer, camera);
        const intersects = glitchRaycaster.intersectObjects(glitchMeshes);
        if (intersects.length > 0) {
            const hit = intersects[0];
            if (hit.uv && hit.object.userData.glitchManager) {
                hit.object.userData.glitchManager.setHover(hit.uv.x, hit.uv.y);
            }
        }
    };

    // Mouse events (desktop)
    window.addEventListener('mousemove', (event) => {
        updatePointer(event.clientX, event.clientY);
    });

    // Touch events (mobile)
    if (isMobile) {
        window.addEventListener('touchmove', (event) => {
            if (event.touches.length > 0) {
                updatePointer(event.touches[0].clientX, event.touches[0].clientY);
            }
        }, { passive: true });
    }

    // ═══════════════════════════════════════════════════════════
    // MOBILE OPTIMIZATION - Step 6: Adaptive frame rate
    // ═══════════════════════════════════════════════════════════

    // Animation clock
    const clock = new THREE.Clock();
    let frameCount = 0;
    let lastFPSCheck = 0;
    let currentFPS = 60;

    // Adaptive quality based on FPS
    const checkPerformance = (time) => {
        frameCount++;

        if (time - lastFPSCheck >= 1000) {
            currentFPS = frameCount;
            frameCount = 0;
            lastFPSCheck = time;

            // If FPS drops below 30 on mobile, reduce quality
            if (isMobile && currentFPS < 30 && renderer.getPixelRatio() > 1) {
                renderer.setPixelRatio(1);
                console.log('⚡ FPS low - Reducing quality');
            }
        }
    };

    // ═══════════════════════════════════════════════════════════
    // Render Loop
    // ═══════════════════════════════════════════════════════════

    function animate() {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime();

        // Check performance periodically
        if (isMobile) {
            checkPerformance(performance.now());
        }

        controls.update(); // required if damping enabled
        dragControls.update();
        updateAnimations();
        updateArcade(time);

        // Only update cosmic environment if enabled
        if (performanceTier !== 'low') {
            updateCosmicEnvironment(time);
        }

        updateEarth(time);
        updateAstronaut(time);

        glitchMeshes.forEach(mesh => {
            if (mesh.userData.glitchManager) mesh.userData.glitchManager.update(renderer, time);
        });

        renderer.render(scene, camera);
    }

    animate();

    // ═══════════════════════════════════════════════════════════
    // MOBILE OPTIMIZATION - Step 7: Visibility change handling
    // ═══════════════════════════════════════════════════════════

    // Pause rendering when tab is not visible (save battery)
    let isVisible = true;

    document.addEventListener('visibilitychange', () => {
        isVisible = !document.hidden;

        if (isMobile) {
            if (isVisible) {
                console.log('📱 Tab visible - Resuming rendering');
                animate();
            } else {
                console.log('📱 Tab hidden - Pausing rendering');
                // Animation loop will stop naturally
            }
        }
    });
}

// ═══════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════

/**
 * Show a temporary message indicating mobile optimizations are active
 */
function showMobileOptimizationMessage() {
    const message = document.createElement('div');
    message.textContent = '📱 بهینه‌سازی موبایل فعال است';
    message.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 255, 100, 0.15);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(0, 255, 100, 0.3);
    padding: 10px 20px;
    border-radius: 8px;
    color: #00ff64;
    font-size: 0.8rem;
    font-family: monospace;
    z-index: 1000;
    pointer-events: none;
    animation: fadeInOut 3s ease-in-out;
  `;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
    @keyframes fadeInOut {
      0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
      10% { opacity: 1; transform: translateX(-50%) translateY(0); }
      90% { opacity: 1; transform: translateX(-50%) translateY(0); }
      100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
    }
  `;
    document.head.appendChild(style);

    document.body.appendChild(message);

    setTimeout(() => {
        message.remove();
        style.remove();
    }, 3000);
}

// ═══════════════════════════════════════════════════════════
// Start Application
// ═══════════════════════════════════════════════════════════

init();

// Force full reload on HMR to prevent scene duplication/cache issues
if (import.meta.hot) {
    import.meta.hot.on('vite:beforeUpdate', () => {
        window.location.reload();
    });
}
