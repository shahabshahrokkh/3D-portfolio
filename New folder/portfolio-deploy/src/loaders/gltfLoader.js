import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export const loadingManager = new THREE.LoadingManager(
  // onLoad
  () => {
    // Automatic removal disabled for Progressive Loading Tiers in main.js
  },
  // onProgress
  (itemUrl, itemsLoaded, itemsTotal) => {
    const progress = Math.round((itemsLoaded / itemsTotal) * 100);
    const bar = document.getElementById('loading-bar');
    const text = document.getElementById('loading-text');

    if (bar) bar.style.width = `${progress}%`;
    if (text) text.innerText = `Loading 3D Assets... ${progress}%`;
  },
  // onError
  (url) => {
    console.warn('There was an error loading ' + url);
  }
);

// Instantiate loaders
const gltfLoader = new GLTFLoader(loadingManager);

// Draco loader for compressed geometry
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/'); // Local decoder — no CDN round-trip
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Loads a GLB model asynchronously
 * @param {string} url - Path to the model
 * @returns {Promise<THREE.Group>} - The loaded scene group
 */
export function loadGLTFModel(url) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      url,
      (gltf) => {
        const model = gltf.scene;
        // Enable shadows and high-quality texture filtering for all meshes
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.material) {
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              materials.forEach(mat => {
                // Remove mirror reflection from the carpet
                if (child.name.toLowerCase().includes('carpet') || url.includes('carpet')) {
                  mat.roughness = 1.0;
                  mat.metalness = 0.0;
                }

                // Apply anisotropic filtering to prevent texture blurring at sharp camera angles (vital for the carpet)
                const maps = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap'];
                maps.forEach(mapName => {
                  if (mat[mapName]) {
                    mat[mapName].anisotropy = 16;
                  }
                });
              });
            }
          }
        });

        // Expose animations if any exist
        if (gltf.animations && gltf.animations.length > 0) {
          model.userData.animations = gltf.animations;
        }

        resolve(model);
      },
      undefined, // Progress handled by loadingManager
      (error) => {
        console.error(`Failed to load model from ${url}`, error);
        reject(error);
      }
    );
  });
}
