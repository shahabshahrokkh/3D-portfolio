import { createObjectWithPlaceholder } from '../utils/helpers_v2.js';
import * as THREE from 'three';

export async function initBookshelf(scene) {
    const bookshelf = await createObjectWithPlaceholder('bookshelf', scene);

    if (bookshelf) {
        // Change shelf color to neutral and keep cyan edges
        bookshelf.traverse((child) => {
            if (child.isMesh) {
                const material = child.material;

                if (material) {
                    // Change the main body color to neutral gray/white
                    if (material.color) {
                        // Change base color to light gray (almost white)
                        material.color.setHex(0x4a4a4a); // Light gray
                    }

                    // Keep or adjust emissive (glowing edges) to cyan
                    if (material.emissive) {
                        const currentEmissive = material.emissive.getHex();

                        // If it has emissive color (glowing edges)
                        if (material.emissiveIntensity > 0 || currentEmissive !== 0x000000) {
                            material.emissive.setHex(0x4a4a4a); // Cyan glow
                            material.emissiveIntensity = 0.3; // Moderate intensity
                        }
                    }
                }
            }
        });
    }

    return bookshelf;
}
