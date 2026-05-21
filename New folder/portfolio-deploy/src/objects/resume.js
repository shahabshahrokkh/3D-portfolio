import * as THREE from 'three';
import { createObjectWithPlaceholder } from '../utils/helpers_v2.js';
import { loadImageAsTexture } from '../utils/pdfTextureLoader.js';
import { ModelRegistry } from '../utils/registry.js';

export async function initResume(scene) {
    const result = await createObjectWithPlaceholder('resume', scene);

    // Apply resume image texture to the model
    if (result) {
        try {
            const texture = await loadImageAsTexture('/assets/textures/resume-preview.webp');

            // The trifold brochure has 3 panels, we need to apply texture to all visible surfaces
            result.traverse((child) => {
                if (child.isMesh) {
                    // Create a new material with the resume texture
                    child.material = new THREE.MeshStandardMaterial({
                        map: texture,
                        side: THREE.DoubleSide, // Show texture on both sides
                        metalness: 0.0,
                        roughness: 0.9, // Paper-like surface
                        // Add slight ambient occlusion for depth
                        aoMapIntensity: 0.5,
                    });

                    child.material.needsUpdate = true;

                    // Ensure UV mapping is correct for trifold
                    if (child.geometry && child.geometry.attributes.uv) {
                        // UV mapping exists
                    }
                }
            });

            // Add ambient lighting around the resume (not directly on it)
            // Front light - in front of resume
            const frontLight = new THREE.PointLight(0xffffff, 1.5, 2.0);
            frontLight.position.set(-5.8, 0.8, 0.5); // In front
            scene.add(frontLight);

            // Back light - behind resume
            const backLight = new THREE.PointLight(0xffffee, 1.2, 1.8);
            backLight.position.set(-5.8, 0.8, -1.0); // Behind
            scene.add(backLight);

            // Left side light
            const leftLight = new THREE.PointLight(0xffffff, 1.3, 2.0);
            leftLight.position.set(-5.0, 0.8, -0.3); // Left side
            scene.add(leftLight);

            // Right side light
            const rightLight = new THREE.PointLight(0xffffee, 1.3, 2.0);
            rightLight.position.set(-6.5, 0.8, -0.3); // Right side
            scene.add(rightLight);

            // Add larger invisible hitbox for easier mobile interaction
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                || window.innerWidth < 768;

            if (isMobile) {
                // Create a larger hitbox for touch devices
                const hitboxSize = 0.8; // Larger for easier tapping
                const hitboxGeo = new THREE.BoxGeometry(hitboxSize, 0.1, hitboxSize);
                const hitboxMat = new THREE.MeshBasicMaterial({
                    color: 0xff0000,
                    transparent: true,
                    opacity: 0.0, // Invisible
                    depthWrite: false
                });
                const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
                hitbox.position.set(0, 0.05, 0); // Slightly above the resume
                hitbox.userData.action = 'openResume';
                hitbox.userData.parentGroup = result;
                result.add(hitbox);
                ModelRegistry.registerInteractable(hitbox);
            }
        } catch (error) {
            console.error('❌ [DEBUG] Error applying texture:', error);
        }
    }

    return result;
}
