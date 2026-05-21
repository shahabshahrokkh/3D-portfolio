import * as THREE from 'three';
import gsap from 'gsap';
import { ModelRegistry } from '../utils/registry.js';
import { HotspotActions } from './hotspots.js';
import { CONFIG } from '../utils/config.js';
import { focusOnObject } from './cameraTransitions.js';
import { isRaycasterEnabled } from '../utils/controlsManager.js';

export function setupRaycaster(camera, scene) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let hoveredObject = null;
  const originalMaterials = new Map(); // Store original materials to restore them

  // Mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || window.innerWidth < 768;

  // Increase raycaster threshold for touch devices (easier to tap)
  if (isMobile) {
    raycaster.params.Points.threshold = 0.5;
    raycaster.params.Line.threshold = 0.5;
  }

  const updatePointer = (clientX, clientY) => {
    // Check if raycaster is enabled
    if (!isRaycasterEnabled()) {
      // Reset hover if disabled
      if (hoveredObject) {
        resetHover(hoveredObject);
        hoveredObject = null;
        document.body.style.cursor = 'default';
      }
      return;
    }

    // Calculate pointer position in normalized device coordinates (-1 to +1)
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Intersect against only interactable objects
    const interactables = ModelRegistry.getInteractables();
    const intersects = raycaster.intersectObjects(interactables, false);

    // Filter out invisible meshes or meshes without an explicit action
    const validIntersects = intersects.filter(hit =>
      hit.object.visible &&
      hit.object.userData &&
      hit.object.userData.action
    );

    if (validIntersects.length > 0) {
      const object = validIntersects[0].object;

      if (hoveredObject !== object) {
        // Reset previous hovered
        if (hoveredObject) resetHover(hoveredObject);

        // Apply hover effect to new object
        hoveredObject = object;
        applyHover(hoveredObject);
        document.body.style.cursor = 'pointer';
      }
    } else {
      if (hoveredObject) {
        resetHover(hoveredObject);
        hoveredObject = null;
        document.body.style.cursor = 'default';
      }
    }
  };

  const onMouseMove = (event) => {
    updatePointer(event.clientX, event.clientY);
  };

  // Touch move handler for mobile (only for hover effect)
  const onTouchMove = (event) => {
    if (event.touches.length === 1 && !isMobile) {
      // Only handle single touch for hover effect on tablets
      const touch = event.touches[0];
      updatePointer(touch.clientX, touch.clientY);
    }
  };

  // Prevent double-firing on mobile (touchend + click)
  let lastClickTime = 0;
  const CLICK_DEBOUNCE = 300; // 300ms debounce

  const handleClick = (clientX, clientY, isTouchEvent = false) => {
    // Debounce to prevent double-firing
    const now = Date.now();
    if (now - lastClickTime < CLICK_DEBOUNCE) {
      return;
    }
    lastClickTime = now;

    // Update pointer position for click
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const interactables = ModelRegistry.getInteractables();
    const intersects = raycaster.intersectObjects(interactables, false);

    const validIntersects = intersects.filter(hit =>
      hit.object.visible &&
      hit.object.userData &&
      hit.object.userData.action
    );

    if (validIntersects.length > 0) {
      const object = validIntersects[0].object;
      const actionName = object.userData.action;

      // Get the root interactive group
      const targetGroup = object.userData.parentGroup || object;

      // Haptic feedback on mobile
      if (isTouchEvent && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }

      // Focus Camera (skip for openLink action - it handles zoom internally)
      if (!object.userData.isPlaceholder && actionName !== 'openLink') {
        focusOnObject(targetGroup);
      }

      if (HotspotActions[actionName]) {
        HotspotActions[actionName](targetGroup);
      } else {
        console.warn(`Action ${actionName} not found`);
      }
    }
  };

  const onMouseClick = (event) => {
    handleClick(event.clientX, event.clientY, false);
  };

  // Touch handler for mobile
  const onTouchEnd = (event) => {
    if (event.changedTouches.length > 0) {
      const touch = event.changedTouches[0];
      handleClick(touch.clientX, touch.clientY, true);
    }
  };

  function applyHover(object) {
    if (!object.material) return;

    // Smooth Scale Hover Effect (Targeting the parent group to scale everything)
    const targetGroup = object.userData.parentGroup || object;
    if (!targetGroup.userData.isPlaceholder) {
      if (!targetGroup.userData.baseScaleVal) targetGroup.userData.baseScaleVal = targetGroup.scale.x;
      const hoverScale = targetGroup.userData.baseScaleVal * 1.05;
      gsap.to(targetGroup.scale, { x: hoverScale, y: hoverScale, z: hoverScale, duration: 0.3, ease: 'power2.out' });
    }

    // Store original material if not stored
    if (!originalMaterials.has(object.uuid)) {
      originalMaterials.set(object.uuid, object.material.clone());
    }

    // Apply highlight (emissive)
    if (object.material.emissive) {
      // Brighter emissive to trigger Bloom effect
      object.material.emissive.setHex(0x555555);
      if (object.material.emissiveIntensity !== undefined) {
        if (!object.userData.originalEmissiveIntensity) object.userData.originalEmissiveIntensity = object.material.emissiveIntensity;
        object.material.emissiveIntensity = 2.0; // Stronger glow for Bloom
      }
    } else if (object.material.color) {
      // Fallback for basic materials
      object.material.color.addScalar(0.3);
    }
  }

  function resetHover(object) {
    if (!object.material) return;

    // Reset Smooth Scale
    const targetGroup = object.userData.parentGroup || object;
    if (!targetGroup.userData.isPlaceholder && targetGroup.userData.baseScaleVal) {
      const baseScale = targetGroup.userData.baseScaleVal;
      gsap.to(targetGroup.scale, { x: baseScale, y: baseScale, z: baseScale, duration: 0.3, ease: 'power2.out' });
    }

    if (originalMaterials.has(object.uuid)) {
      const orig = originalMaterials.get(object.uuid);
      if (object.material.emissive && orig.emissive) {
        object.material.emissive.copy(orig.emissive);
        if (object.userData.originalEmissiveIntensity !== undefined) {
          object.material.emissiveIntensity = object.userData.originalEmissiveIntensity;
        }
      } else if (object.material.color && orig.color) {
        object.material.color.copy(orig.color);
      }
    }
  }

  window.addEventListener('mousemove', onMouseMove, false);

  // Add touch event listeners for mobile
  if (isMobile) {
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, false);
  } else {
    // Only add click listener on desktop to avoid double-firing on mobile
    window.addEventListener('click', onMouseClick, false);
  }

  return {
    cleanup: () => {
      window.removeEventListener('mousemove', onMouseMove);
      if (isMobile) {
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
      } else {
        window.removeEventListener('click', onMouseClick);
      }
    }
  };
}
