import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import fs from 'fs';

// Mocking some browser environment stuff for GLTFLoader
const globalObj = globalThis;
globalObj.self = globalObj;
globalObj.window = globalObj;
Object.defineProperty(globalObj, 'navigator', {
    value: { userAgent: '' },
    writable: true,
    configurable: true
});
globalObj.document = {
    createElement: () => ({
        getContext: () => ({}),
        style: {}
    })
};

const loader = new GLTFLoader();
const glbData = fs.readFileSync('./public/assets/models/modern_wall_shelves.glb');
const arrayBuffer = glbData.buffer.slice(glbData.byteOffset, glbData.byteOffset + glbData.byteLength);

loader.parse(arrayBuffer, '', (gltf) => {
    let frameMesh = null;
    gltf.scene.traverse((child) => {
        if (child.isMesh && child.name === 'Frame_Frame_0') {
            frameMesh = child;
        }
    });

    if (frameMesh) {
        console.log('Found Mesh:', frameMesh.name);
        const geo = frameMesh.geometry;
        const posAttr = geo.getAttribute('position');
        const normalAttr = geo.getAttribute('normal');
        
        // Let's find the average normal of all vertices
        const avgNormal = new THREE.Vector3();
        for (let i = 0; i < normalAttr.count; i++) {
            avgNormal.x += normalAttr.getX(i);
            avgNormal.y += normalAttr.getY(i);
            avgNormal.z += normalAttr.getZ(i);
        }
        avgNormal.divideScalar(normalAttr.count).normalize();
        console.log('Average Normal (Local):', avgNormal);

        // However, most vertices might be back-facing or side-facing.
        // Let's find the normal of vertices that point mostly towards -Y (forward in the scene)
        const frontNormal = new THREE.Vector3();
        let frontCount = 0;
        for (let i = 0; i < normalAttr.count; i++) {
            const nx = normalAttr.getX(i);
            const ny = normalAttr.getY(i);
            const nz = normalAttr.getZ(i);
            if (ny < -0.5) { // Facing mostly -Y
                frontNormal.x += nx;
                frontNormal.y += ny;
                frontNormal.z += nz;
                frontCount++;
            }
        }
        if (frontCount > 0) {
            frontNormal.divideScalar(frontCount).normalize();
            console.log('Front-facing Normal (Local):', frontNormal);
            
            // To align a plane (default normal +Z) to this frontNormal:
            // We want to find Euler angles (X, Y, Z) such that:
            // Plane normal (0, 0, 1) -> frontNormal
            
            // frontNormal = (nx, ny, nz)
            // If we use order 'YXZ' (Intrinsic ZXY):
            // 1. Rotate Y by yaw
            // 2. Rotate X by pitch
            
            // (sin yaw * cos pitch, -sin pitch, cos yaw * cos pitch) = (nx, ny, nz)
            // -sin pitch = ny  => pitch = -asin(ny)
            // sin yaw * cos pitch = nx => sin yaw = nx / cos pitch => yaw = asin(nx / cos pitch)
            
            const pitch = -Math.asin(frontNormal.y);
            const yaw = Math.asin(frontNormal.x / Math.cos(pitch));
            
            console.log('Calculated Pitch (rad):', pitch);
            console.log('Calculated Yaw (rad):', yaw);
            console.log('Pitch (deg):', pitch * 180 / Math.PI);
            console.log('Yaw (deg):', yaw * 180 / Math.PI);
            
            // Note: Our plane's default pitch is 90 deg (Math.PI/2) to face -Y.
            // If the frontNormal is exactly (0, -1, 0), then pitch = -asin(-1) = 90 deg.
            // So tiltX would be 0.
            
            const tiltX = pitch - Math.PI / 2;
            const tiltY = yaw;
            
            console.log('Final tiltX (for code):', tiltX);
            console.log('Final tiltY (for code):', tiltY);
        } else {
            console.log('No front-facing normals found.');
        }
    } else {
        console.log('Mesh Frame_Frame_0 not found.');
    }
}, (err) => {
    console.error('Error parsing GLB:', err);
});
