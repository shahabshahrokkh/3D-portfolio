import * as THREE from 'three';
import { createObjectWithPlaceholder } from '../utils/helpers_v2.js';
import { ModelRegistry } from '../utils/registry.js';

let astronautModel = null;
const basePosition = new THREE.Vector3(-12, 3, -10);

export async function initAstronaut(scene) {
  const obj = await createObjectWithPlaceholder('astronaut', scene);
  if (obj) {
    astronautModel = obj;
    // We update base position if config position changes
    basePosition.copy(obj.position);
  }
  return obj;
}

let initialInnerPos = new THREE.Vector3();
let initialized = false;

export function updateAstronaut(time) {
  if (!astronautModel || !astronautModel.position) return;
  
  // Find the inner GLTF scene group
  const innerModel = astronautModel.children.find(c => c.type === 'Group' && !c.userData.draggable && !c.userData.isDragHint) || astronautModel.children[0];

  if (!innerModel) return;

  if (!initialized) {
    initialInnerPos.copy(innerModel.position);
    initialized = true;
  }

  // Drift up and down, and rotate slightly (inner model only)
  innerModel.position.y = initialInnerPos.y + Math.sin(time * 0.5) * 0.5;
  innerModel.position.x = initialInnerPos.x + Math.sin(time * 0.3) * 0.2;
  innerModel.position.z = initialInnerPos.z + Math.cos(time * 0.4) * 0.2;
  
  innerModel.rotation.y = time * 0.1;
  innerModel.rotation.z = Math.sin(time * 0.2) * 0.1;
  innerModel.rotation.x = Math.cos(time * 0.3) * 0.1;
}
