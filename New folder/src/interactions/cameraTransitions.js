import gsap from 'gsap';
import * as THREE from 'three';

let globalCamera, globalControls;
let lastFocusTime = 0;
const FOCUS_DEBOUNCE = 100; // 100ms debounce

export function setupCameraTransitions(camera, controls) {
  globalCamera = camera;
  globalControls = controls;
}

export function focusOnObject(object) {
  if (!globalCamera || !globalControls) return;

  // Debounce to prevent multiple rapid calls
  const now = Date.now();
  if (now - lastFocusTime < FOCUS_DEBOUNCE) {
    return;
  }
  lastFocusTime = now;

  // Calculate target position based on object bounding box
  const box = new THREE.Box3().setFromObject(object);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const size = new THREE.Vector3();
  box.getSize(size);

  const maxDim = Math.max(size.x, size.y, size.z);

  // Target position for controls (look at center of object)
  const targetControl = center.clone();

  // Determine camera offset based on object name/type
  let offset;
  const objectName = object.name || object.userData?.parentGroup?.name || '';

  if (objectName === 'shelves') {
    // Wall shelves on left wall - camera should be in front (positive X direction)
    offset = new THREE.Vector3(maxDim * 2.5, maxDim * 0.5, 0);
  } else if (objectName === 'cat' || objectName === 'bed') {
    // Cat bed on left wall - camera should be in front (positive X direction)
    offset = new THREE.Vector3(maxDim * 2.5, maxDim * 0.8, 0);
  } else if (object.userData?.action === 'openLink') {
    // Memos on whiteboard - less zoom, further back for better view
    offset = new THREE.Vector3(0, maxDim * 0.3, maxDim * 2.0);
  } else {
    // Default offset - slightly up and back from the object's front
    offset = new THREE.Vector3(0, maxDim * 0.8, maxDim * 2.0);
  }

  const targetCamera = center.clone().add(offset);

  // Tween controls target
  gsap.to(globalControls.target, {
    x: targetControl.x,
    y: targetControl.y,
    z: targetControl.z,
    duration: 1.2,
    ease: 'power3.inOut'
  });

  // Tween camera position
  gsap.to(globalCamera.position, {
    x: targetCamera.x,
    y: targetCamera.y,
    z: targetCamera.z,
    duration: 1.2,
    ease: 'power3.inOut'
  });
}
