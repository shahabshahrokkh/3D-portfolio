import * as THREE from 'three';
import { ModelRegistry } from './registry.js';

/**
 * Add a larger invisible hitbox for mobile devices
 * Makes small objects easier to tap on touch screens
 */
export function addMobileHitbox(object, config = {}) {
    // Check if mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || window.innerWidth < 768;

    if (!isMobile) {
        return;
    }

    // Default config
    const {
        sizeMultiplier = 1.6,  // 60% larger than object
        height = 0.2,          // Height of hitbox
        yOffset = 0.05,        // Offset above object
        action = null,         // Action name (required)
        debug = false          // Show hitbox for debugging
    } = config;

    if (!action) {
        console.warn('⚠️ [Hitbox] No action provided, skipping hitbox');
        return;
    }

    // Get object bounds
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    box.getSize(size);

    // Calculate hitbox size
    const hitboxWidth = Math.max(size.x, size.z) * sizeMultiplier;
    const hitboxDepth = Math.max(size.x, size.z) * sizeMultiplier;

    // Create hitbox geometry
    const hitboxGeo = new THREE.BoxGeometry(hitboxWidth, height, hitboxDepth);
    const hitboxMat = new THREE.MeshBasicMaterial({
        color: debug ? 0x00ff00 : 0xff0000,
        transparent: true,
        opacity: debug ? 0.3 : 0.0, // Visible if debug mode
        depthWrite: false,
        wireframe: debug
    });

    const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
    hitbox.position.set(0, yOffset, 0);
    hitbox.userData.action = action;
    hitbox.userData.parentGroup = object;
    hitbox.userData.isMobileHitbox = true;

    object.add(hitbox);
    ModelRegistry.registerInteractable(hitbox);

    return hitbox;
}

/**
 * Check if object needs mobile hitbox based on size
 */
export function needsMobileHitbox(object, threshold = 0.3) {
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    box.getSize(size);

    const maxSize = Math.max(size.x, size.y, size.z);
    return maxSize < threshold; // Objects smaller than threshold need hitbox
}
