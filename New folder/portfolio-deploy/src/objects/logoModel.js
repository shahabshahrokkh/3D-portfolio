import { createObjectWithPlaceholder } from '../utils/helpers_v2.js';
import * as THREE from 'three';

export async function initLogoModel(scene) {
  const logoModel = await createObjectWithPlaceholder('logoModel', scene);

  // Apply green color to all meshes in the Django logo
  if (logoModel) {
    logoModel.traverse((child) => {
      if (child.isMesh) {
        // Create a new material with green color
        if (child.material) {
          // Clone the material to avoid affecting other objects
          child.material = child.material.clone();

          // Set green color (Django green: #0C4B33 or a brighter green: #44B78B)
          child.material.color = new THREE.Color(0x44B78B); // Bright Django green

          // Optional: Add some emissive glow for better visibility
          if (child.material.emissive) {
            child.material.emissive = new THREE.Color(0x0C4B33); // Darker green glow
            child.material.emissiveIntensity = 0.3;
          }

          // Ensure the material updates
          child.material.needsUpdate = true;
        }
      }
    });
  }

  return logoModel;
}
