import * as THREE from 'three';
import { createObjectWithPlaceholder } from '../utils/helpers_v2.js';

export async function initThreejsIcon(scene) {
    const threejsIcon = await createObjectWithPlaceholder('threejsIcon', scene);

    // Apply Three.js green color to the model
    if (threejsIcon) {
        threejsIcon.traverse((child) => {
            if (child.isMesh) {
                // Three.js official green color: #049ef4 (light blue) and #8cc84b (green)
                // Using the green from the logo
                child.material = new THREE.MeshStandardMaterial({
                    color: 0x8cc84b, // Three.js green
                    metalness: 0.3,
                    roughness: 0.6,
                    emissive: 0x8cc84b,
                    emissiveIntensity: 0.2, // Slight glow
                });
            }
        });
    }

    return threejsIcon;
}
