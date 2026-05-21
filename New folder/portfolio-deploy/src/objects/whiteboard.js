import * as THREE from 'three';
import { createObjectWithPlaceholder } from '../utils/helpers_v2.js';
import { loadGLTFModel } from '../loaders/gltfLoader.js';
import { ModelRegistry } from '../utils/registry.js';

// ─── Exported refs for animation module ──────────────────────────────────────
export let markerRef = null;
export let callButtonMesh = null;

// Resting position: lying on the tray at the bottom of the whiteboard
// Tray Y ≈ board_center(2.0) - half_board_height(~0.75) = ~1.25
// Adjust MARKER_REST.position if it's slightly off after testing
export const MARKER_REST = {
  position: new THREE.Vector3(-0.55, 2.03, -7.185),
  rotation: new THREE.Euler(0, 0, 0) // Horizontal (lying flat on tray)
};

export async function initWhiteboard(scene) {
  // 1. Load whiteboard as usual
  const board = await createObjectWithPlaceholder('whiteboard', scene);

  // Add a dedicated light to illuminate the whiteboard so it's not dark/lifeless
  const boardLight = new THREE.PointLight(0xffffff, 2.5, 2); // Pure white, intensity 2.5, falloff 6
  boardLight.position.set(0, 2.5, -6.2); // Positioned just in front and slightly above
  scene.add(boardLight);

  // 2. Load marker GLB separately
  try {
    const gltf = await loadGLTFModel('/assets/models/black_marker.glb');

    // Normalize to ~16cm
    const box = new THREE.Box3().setFromObject(gltf);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 0.16 / maxDim;
    gltf.scale.setScalar(scale);

    gltf.position.copy(MARKER_REST.position);
    gltf.rotation.copy(MARKER_REST.rotation);
    gltf.name = 'marker';

    // Disable shadow initially while resting on the tray
    gltf.traverse(c => { if (c.isMesh) { c.castShadow = false; c.receiveShadow = false; } });

    scene.add(gltf);
    markerRef = gltf;

    // 3. Create the "Click to Call" button (hidden initially)
    const callGeo = new THREE.PlaneGeometry(0.5, 0.15);
    const callCanvas = document.createElement('canvas');
    callCanvas.width = 512;
    callCanvas.height = 153; // aspect ratio 0.5/0.15 = 3.33 => 512/3.33 = ~153
    const ctx = callCanvas.getContext('2d');

    // Pill shape background
    ctx.fillStyle = 'rgba(20, 20, 30, 0.8)';
    ctx.beginPath();
    ctx.roundRect(10, 10, 492, 133, 40);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📱 Click to Call', 256, 76);

    const callTex = new THREE.CanvasTexture(callCanvas);
    callTex.anisotropy = 16;

    const callMat = new THREE.MeshBasicMaterial({
      map: callTex,
      transparent: true,
      opacity: 0, // Hidden initially
      depthWrite: false
    });

    const callButton = new THREE.Mesh(callGeo, callMat);
    // Position it under the "Contact me!" text
    // text is at Y=2.3. Let's put button at Y=1.9, X=0.04
    callButton.position.set(0.04, 1.85, -7.18);
    callButton.userData = {
      action: 'callIphone',
      isInteractableGroup: true,
      isActive: false // custom flag
    };

    // Add larger invisible hitbox for mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || window.innerWidth < 768;

    if (isMobile) {
      // Create a larger hitbox for easier tapping on mobile
      const hitboxGeo = new THREE.PlaneGeometry(0.8, 0.3); // 60% larger
      const hitboxMat = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.0, // Invisible
        depthWrite: false
      });
      const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
      hitbox.position.set(0, 0, 0.01); // Slightly in front
      hitbox.userData = {
        action: 'callIphone',
        parentGroup: callButton,
        isMobileHitbox: true
      };
      callButton.add(hitbox);
    }

    scene.add(callButton);
    callButtonMesh = callButton;

    ModelRegistry.registerModel('marker', gltf);
  } catch (e) {
    console.warn('[Whiteboard] Could not load marker:', e);
  }

  return board;
}
