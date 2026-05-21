import * as THREE from 'three';
import { ShaderGlitchManager } from './shaderGlitch.js';

export const glitchMeshes = [];

export function createEnvironment(scene) {
  // Floor is now created in wireframeDome.js as part of the geodesic structure
  // This ensures perfect alignment between floor edges and dome base

  // Keep a very soft fill light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  // Add Dust Particles — returns updater to be called from main render loop
  return createDustParticles(scene);
}

// Exported so main.js can call it inside the existing render loop
export function updateDustParticles(time) {
  if (_dustParticles) {
    const pos = _dustParticles.geometry.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] -= 0.0015;
      if (pos[i + 1] < 0) pos[i + 1] = 8;
      pos[i] += Math.sin(time + i) * 0.0008;
    }
    _dustParticles.geometry.attributes.position.needsUpdate = true;
  }
}

let _dustParticles = null;

function createDustParticles(scene) {
  const COUNT = 600; // reduced from 1500
  const vertices = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    vertices[i * 3] = Math.random() * 18 - 9;
    vertices[i * 3 + 1] = Math.random() * 8;
    vertices[i * 3 + 2] = Math.random() * 18 - 9;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.02,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    depthWrite: false, // Prevents z-sort issues with transparent objects
  });

  _dustParticles = new THREE.Points(geometry, material);
  scene.add(_dustParticles);
  // No separate requestAnimationFrame — updated from main render loop
}
