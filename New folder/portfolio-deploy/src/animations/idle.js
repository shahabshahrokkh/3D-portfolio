import * as THREE from 'three';
import { ModelRegistry } from '../utils/registry.js';

const mixers = [];
const clock = new THREE.Clock();
let catTriggeredTime = 0;

export function setupAnimations(scene) {
  // We can scan models from the registry for animations
  // and set up idle logic here
  
  // Custom event listener for cat interaction
  window.addEventListener('triggerCatAction', () => {
    catTriggeredTime = 0.5; // seconds of active animation
  });
}

export function updateAnimations() {
  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  // Update GLB animations
  for (const mixer of mixers) {
    mixer.update(delta);
  }

  // Custom procedural idle animations
  const laptop = ModelRegistry.getModel('laptop');
  if (laptop && !laptop.userData.isPlaceholder) {
    if (laptop.userData.baseY === undefined) laptop.userData.baseY = laptop.position.y;
    // Subtle float
    laptop.position.y = laptop.userData.baseY + Math.sin(time * 2) * 0.01;
  }

  const cat = ModelRegistry.getModel('cat');
  if (cat && !cat.userData.isPlaceholder) {
    if (cat.userData.baseScale === undefined) cat.userData.baseScale = cat.scale.x;
    
    // Cat breathing or moving when clicked
    if (catTriggeredTime > 0) {
      cat.rotation.z = Math.sin(time * 20) * 0.1; // wiggle
      catTriggeredTime -= delta;
    } else {
      cat.rotation.z = 0;
      // Gentle breathing based on base scale
      const breath = 1 + Math.sin(time * 3) * 0.02;
      cat.scale.setScalar(cat.userData.baseScale * breath);
    }
  }

  // Pulsing glow for drag hint rings
  const chair = ModelRegistry.getModel('chair');
  if (chair && chair.userData.dragHintRing) {
    const ring = chair.userData.dragHintRing;
    // Pulse opacity between 0.15 and 0.6
    ring.material.opacity = 0.15 + Math.abs(Math.sin(time * 2)) * 0.45;
    // Subtle scale pulse
    const pulseScale = 1 + Math.sin(time * 2.5) * 0.1;
    ring.scale.set(pulseScale, pulseScale, 1);
  }
}

// Called after a model is loaded if it has animations
export function registerModelAnimations(model) {
  if (model.name !== 'cat') return; // Only play cat animation by default to prevent scale explosions from rogue GLB tracks
  
  if (model.userData.animations && model.userData.animations.length > 0) {
    const mixer = new THREE.AnimationMixer(model);
    // Play first animation as idle
    const action = mixer.clipAction(model.userData.animations[0]);
    action.play();
    mixers.push(mixer);
  }
}
