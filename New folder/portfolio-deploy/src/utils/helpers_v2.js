import * as THREE from 'three';
import { CONFIG } from './config.js';
import { ModelRegistry } from './registry.js';
import { loadGLTFModel } from '../loaders/gltfLoader.js';
import { registerModelAnimations } from '../animations/idle.js';

export function createPlaceholder(config) {
  let s = 1;
  if (config.targetSize) {
    s = config.targetSize.width || config.targetSize.height || config.targetSize.depth || 1;
  }
  const geometry = new THREE.BoxGeometry(s, s, s);
  const material = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.placeholder,
    wireframe: true
  });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(...(config.position || [0, 0, 0]));
  mesh.rotation.set(...(config.rotation || [0, 0, 0]));
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

function normalizeModelScale(model, targetSizeConfig, name) {
  // Compute bounding box
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  // Calculate scale based on real-world reference
  // Use max of X and Z for width/depth to handle 90-degree internal GLB rotations
  let scale = 1;
  if (targetSizeConfig.width) {
    const trueWidth = Math.max(size.x, size.z);
    scale = targetSizeConfig.width / trueWidth;
  } else if (targetSizeConfig.height) {
    scale = targetSizeConfig.height / size.y;
  } else if (targetSizeConfig.depth) {
    const trueDepth = Math.max(size.x, size.z);
    scale = targetSizeConfig.depth / trueDepth;
  } else {
    // fallback
    const target = typeof targetSizeConfig === 'number' ? targetSizeConfig : 1;
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) scale = target / maxDim;
  }

  // Debug removed for production

  // Wrap model to adjust pivot to bottom center
  const wrapper = new THREE.Group();

  // Center X and Z, put min Y at 0
  model.position.set(-center.x, -box.min.y, -center.z);
  wrapper.add(model);

  // Apply uniform scale to wrapper
  wrapper.scale.setScalar(scale);

  return wrapper;
}

export async function createObjectWithPlaceholder(name, scene) {
  const config = CONFIG.models[name];
  if (!config) {
    console.error(`Configuration for object '${name}' not found.`);
    return null;
  }

  const placeholder = createPlaceholder(config);
  placeholder.name = name;

  if (config.type === 'interactable') {
    placeholder.userData = { action: config.action, isPlaceholder: true };
    ModelRegistry.registerInteractable(placeholder);
  }

  // Attach to scene directly (No hierarchy scaling issues)
  scene.add(placeholder);

  // 2. Load GLB asynchronously
  try {
    const model = await loadGLTFModel(config.url);

    // 3. Replace placeholder

    // Normalize scale and fix pivot
    let finalObject = model;
    if (config.targetSize) {
      finalObject = normalizeModelScale(model, config.targetSize, name);
    }

    // FORCE POSITIONS
    const targetPos = config.position || [0, 0, 0];
    finalObject.position.set(targetPos[0], targetPos[1], targetPos[2]);

    const targetRot = config.rotation || [0, 0, 0];
    finalObject.rotation.set(targetRot[0], targetRot[1], targetRot[2]);

    finalObject.name = name;

    // Apply shadow settings from config
    if (config.castShadow === false) {
      finalObject.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
        }
      });
    }

    // Debug removed for production

    if (config.type === 'interactable') {
      finalObject.userData = { action: config.action, isPlaceholder: false, isInteractableGroup: true };
      ModelRegistry.removeInteractable(placeholder);

      finalObject.traverse((child) => {
        if (child.isMesh) {
          child.userData = { ...finalObject.userData, parentGroup: finalObject };
          ModelRegistry.registerInteractable(child);
        }
      });
    }

    if (config.draggable) {
      finalObject.userData.draggable = true;

      // Create a large invisible hitbox around the entire model for easy grabbing
      const dragBox = new THREE.Box3().setFromObject(finalObject);
      const dragSize = new THREE.Vector3();
      dragBox.getSize(dragSize);
      const dragCenter = new THREE.Vector3();
      dragBox.getCenter(dragCenter);

      // Fix double-scaling bug: hitBox is added as a child of finalObject, so we must 
      // divide its geometry dimensions by the parent's scale to achieve the desired world size.
      const hitWidth = (Math.max(dragSize.x, 1.0) * 1.3) / finalObject.scale.x;
      const hitHeight = (Math.max(dragSize.y, 1.0) * 1.2) / finalObject.scale.y;
      const hitDepth = (Math.max(dragSize.z, 1.0) * 1.3) / finalObject.scale.z;

      const hitGeo = new THREE.BoxGeometry(hitWidth, hitHeight, hitDepth);
      const hitMat = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.0, // Make it invisible but still raycastable
        depthWrite: false
      });
      const hitBox = new THREE.Mesh(hitGeo, hitMat);

      // Position hitbox correctly in local space by dividing the world offset by the parent's scale
      hitBox.position.set(
        (dragCenter.x - finalObject.position.x) / finalObject.scale.x,
        (dragCenter.y - finalObject.position.y) / finalObject.scale.y,
        (dragCenter.z - finalObject.position.z) / finalObject.scale.z
      );
      hitBox.userData.draggable = true;
      hitBox.userData.parentGroup = finalObject;
      finalObject.add(hitBox);
      ModelRegistry.registerDraggable(hitBox);

      // Create a glowing ring hint on the floor under the chair
      const ringGeo = new THREE.RingGeometry(
        Math.max(dragSize.x, dragSize.z) * 0.4,
        Math.max(dragSize.x, dragSize.z) * 0.6,
        32
      );
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00ffcc,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const glowRing = new THREE.Mesh(ringGeo, ringMat);
      glowRing.rotation.x = -Math.PI / 2; // Lay flat on floor
      glowRing.position.y = 0.02; // Slightly above floor to avoid z-fighting
      glowRing.userData.isDragHint = true;
      finalObject.add(glowRing);
      finalObject.userData.dragHintRing = glowRing;
    }

    // Transfer children from placeholder to model (important for hierarchy)
    while (placeholder.children.length > 0) {
      finalObject.add(placeholder.children[0]);
    }

    // Register in Model Registry
    ModelRegistry.registerModel(name, finalObject);
    registerModelAnimations(model); // animations play on the inner geometry

    // Swap in scene context directly
    scene.add(finalObject);
    scene.remove(placeholder);

    placeholder.geometry.dispose();
    placeholder.material.dispose();

    return finalObject;
  } catch (error) {
    console.warn(`Keeping placeholder for ${name} due to loading error.`);
    // Keep placeholder, maybe change its color to indicate error
    placeholder.material.color.setHex(0xff0000);
    return placeholder;
  }
}
