import { createObjectWithPlaceholder } from '../utils/helpers_v2.js';
import * as THREE from 'three';

export async function initHtmlIcon(scene) {
    const htmlIcon = await createObjectWithPlaceholder('htmlIcon', scene);

    // Apply colors to HTML, CSS, JS logos
    if (htmlIcon) {
        // Get all meshes and sort by X position (left to right: HTML, CSS, JS)
        const meshes = [];
        htmlIcon.traverse((child) => {
            if (child.isMesh) {
                meshes.push(child);
            }
        });

        // Sort meshes by X position (left to right)
        meshes.sort((a, b) => {
            const posA = new THREE.Vector3();
            const posB = new THREE.Vector3();
            a.getWorldPosition(posA);
            b.getWorldPosition(posB);
            return posA.x - posB.x;
        });

        // Define colors for HTML (red), CSS (blue), JS (yellow)
        const colors = [
            { name: 'HTML', color: 0xE34F26, emissive: 0x8B2E16 },  // HTML Orange-Red
            { name: 'CSS', color: 0x1572B6, emissive: 0x0A4275 },   // CSS Blue
            { name: 'JS', color: 0xF7DF1E, emissive: 0x9C8A12 }     // JS Yellow
        ];

        // Apply colors to each mesh
        meshes.forEach((mesh, index) => {
            if (mesh.material && index < colors.length) {
                // Clone material to avoid affecting other objects
                mesh.material = mesh.material.clone();

                // Set color
                mesh.material.color = new THREE.Color(colors[index].color);

                // Add emissive glow
                if (mesh.material.emissive) {
                    mesh.material.emissive = new THREE.Color(colors[index].emissive);
                    mesh.material.emissiveIntensity = 0.3;
                }

                // Ensure material updates
                mesh.material.needsUpdate = true;

                // Add black outline/border around the text
                const edges = new THREE.EdgesGeometry(mesh.geometry, 15); // threshold angle for edges
                const lineMaterial = new THREE.LineBasicMaterial({
                    color: 0x000000, // Black color
                    linewidth: 2
                });
                const outline = new THREE.LineSegments(edges, lineMaterial);

                // Copy the mesh's transformation to the outline
                outline.position.copy(mesh.position);
                outline.rotation.copy(mesh.rotation);
                outline.scale.copy(mesh.scale);

                // Add outline as a child of the mesh's parent
                if (mesh.parent) {
                    mesh.parent.add(outline);
                }

                // Applied color successfully
            }
        });
    }

    return htmlIcon;
}
