import * as THREE from 'three';
import { CONFIG } from '../utils/config.js';
import { ModelRegistry } from '../utils/registry.js';
import { loadGLTFModel } from '../loaders/gltfLoader.js';
import { registerModelAnimations } from '../animations/idle.js';
import { createPlaceholder } from '../utils/helpers_v2.js';

let arcadeGroup = null;
let previewTexture = null;
let previewCtx = null;
let previewCanvas = null;

function createPreviewCanvas() {
  previewCanvas = document.createElement('canvas');
  previewCanvas.width = 1024;
  previewCanvas.height = 1024;
  previewCtx = previewCanvas.getContext('2d');

  previewTexture = new THREE.CanvasTexture(previewCanvas);
  previewTexture.minFilter = THREE.LinearFilter;
  previewTexture.magFilter = THREE.LinearFilter;
  previewTexture.colorSpace = THREE.SRGBColorSpace;
  previewTexture.flipY = true; // User preference

  // High-res mapping: scale the texture 2x. 
  // This gives us a massive safety margin so the text fits perfectly inside the UV map.
  previewTexture.wrapS = THREE.ClampToEdgeWrapping;
  previewTexture.wrapT = THREE.ClampToEdgeWrapping;
  previewTexture.repeat.set(2, 2);
  previewTexture.offset.set(-0.5, -0.5); // Centers the 2x scaled texture
}

function updatePreviewCanvas(time) {
  if (!previewCtx) return;
  const ctx = previewCtx;
  const w = previewCanvas.width;
  const h = previewCanvas.height;

  // 1. Solid black background for the entire 1024x1024 canvas
  // This ensures anything outside the intended screen area (like coin slots) stays pure black.
  ctx.fillStyle = '#000000ff';
  ctx.fillRect(0, 0, w, h);

  // 2. Define the inner clipping area where the physical screen UVs will definitely land.
  // The user found that h/2 + 120 is the visual center, so we shift the clipping box down.
  const clipW = 600;
  const clipH = 500;
  const clipX = w / 2 - clipW / 2;
  const clipY = (h / 2 - clipH / 2) + 120; // Shift down to match monitor UV placement

  // Clip EVERYTHING (Grid, Scanlines, Text) to this box to prevent bleeding
  ctx.save();
  ctx.beginPath();
  ctx.rect(clipX, clipY, clipW, clipH);
  ctx.clip();

  // Screen background inside the box
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(clipX, clipY, clipW, clipH);

  // Grid
  ctx.strokeStyle = 'rgba(0,255,136,0.1)';
  ctx.lineWidth = 4;
  const step = 30;
  const off = (time * 30) % step;
  for (let x = off; x < clipW; x += step) { ctx.beginPath(); ctx.moveTo(clipX + x, clipY); ctx.lineTo(clipX + x, clipY + clipH); ctx.stroke(); }
  for (let y = off; y < clipH; y += step) { ctx.beginPath(); ctx.moveTo(clipX, clipY + y); ctx.lineTo(clipX + clipW, clipY + y); ctx.stroke(); }

  // Scanlines
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  for (let y = 0; y < clipH; y += 6) ctx.fillRect(clipX, clipY + y, clipW, 3);

  // Flashing Text (Centered around the user's adjusted Y position)
  if (Math.sin(time * 2) > 0) {
    ctx.shadowColor = '#184630ff';
    ctx.shadowBlur = 40;
    ctx.fillStyle = '#00ff88';

    // Equal font sizes for both phrases
    ctx.font = 'bold 30px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Positioned relative to the visual center (h/2 + 120)
    const centerY = h / 2 + 120;
    ctx.fillText('INSERT COIN', w / 2, centerY - 45);
    ctx.fillText('TO PLAY!', w / 2, centerY + 45);

    ctx.shadowBlur = 0;
  }

  ctx.restore();

  if (previewTexture) previewTexture.needsUpdate = true;
}

/**
 * Initialize the arcade machine in the scene.
 */
export async function initArcade(scene) {
  const config = CONFIG.models.arcade;
  if (!config) {
    console.error('[Arcade] Config not found');
    return null;
  }

  const placeholder = createPlaceholder(config);
  placeholder.name = 'arcade';
  placeholder.userData = { action: config.action, isPlaceholder: true };
  ModelRegistry.registerInteractable(placeholder);
  scene.add(placeholder);

  try {
    const model = await loadGLTFModel(config.url);

    // Normalize scale
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const scale = config.targetSize.height / size.y;

    const wrapper = new THREE.Group();
    model.position.set(-center.x, -box.min.y, -center.z);
    wrapper.add(model);
    wrapper.scale.setScalar(scale);

    const pos = config.position || [0, 0, 0];
    const rot = config.rotation || [0, 0, 0];
    wrapper.position.set(pos[0], pos[1], pos[2]);
    wrapper.rotation.set(rot[0], rot[1], rot[2]);
    wrapper.name = 'arcade';

    // Create preview canvas
    createPreviewCanvas();

    // Find ALL screen meshes (top and bottom)
    const screenMeshes = [];
    model.traverse((child) => {
      if (child.isMesh) {
        const name = child.name.toLowerCase();
        const matName = Array.isArray(child.material)
          ? child.material.map(m => m.name).join(',').toLowerCase()
          : (child.material?.name || '').toLowerCase();

        if (name.includes('screen') || name.includes('display') || name.includes('monitor') || name.includes('glass') || name.includes('null') ||
          matName.includes('screen') || matName.includes('glass') || matName.includes('emission') || matName.includes('null')) {
          screenMeshes.push(child);
        }
      }
    });

    if (screenMeshes.length > 0) {
      // Debug removed for production
      screenMeshes.forEach(mesh => {
        if (mesh.geometry.attributes.uv) {
          mesh.material = new THREE.MeshBasicMaterial({
            map: previewTexture,
            toneMapped: false,
            side: THREE.FrontSide,
          });
        }
      });
    } else {
      // Debug removed for production
      const modelBox2 = new THREE.Box3().setFromObject(model);
      const modelSize2 = new THREE.Vector3();
      modelBox2.getSize(modelSize2);

      const planeW = modelSize2.x * 0.55;
      const planeH = modelSize2.y * 0.32;
      const screenGeo = new THREE.PlaneGeometry(planeW, planeH);
      const screenMat = new THREE.MeshBasicMaterial({
        map: previewTexture,
        toneMapped: false,
        side: THREE.DoubleSide,
      });
      const screenPlane = new THREE.Mesh(screenGeo, screenMat);
      screenPlane.position.set(0, modelSize2.y * 0.65, -modelSize2.z * 0.48);
      model.add(screenPlane);
    }

    // Glow ring removed - no longer needed

    // Register interactable
    wrapper.userData = {
      action: config.action,
      isPlaceholder: false,
      isInteractableGroup: true,
    };
    ModelRegistry.removeInteractable(placeholder);

    wrapper.traverse((child) => {
      if (child.isMesh) {
        // Only assign action if the child doesn't explicitly have a DIFFERENT action to avoid overriding
        // Also ensure we don't accidentally capture giant invisible meshes from elsewhere
        child.userData = { ...child.userData, action: config.action, parentGroup: wrapper };
        ModelRegistry.registerInteractable(child);
      }
    });

    ModelRegistry.registerModel('arcade', wrapper);
    registerModelAnimations(model);

    scene.add(wrapper);
    scene.remove(placeholder);
    placeholder.geometry?.dispose();
    placeholder.material?.dispose();

    arcadeGroup = wrapper;
    return wrapper;

  } catch (error) {
    console.error('[Arcade] ❌ Failed to load:', error);
    placeholder.material.color.setHex(0xff0000);
    return placeholder;
  }
}

export function getArcadeGroup() { return arcadeGroup; }

export function updateArcade(time) {
  updatePreviewCanvas(time);

  // Glow ring animation removed
}
