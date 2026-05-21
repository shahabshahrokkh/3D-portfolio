// Temporary debug script to inspect arcade model mesh names
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('/assets/models/arcade_machine.glb', (gltf) => {
  console.log('=== ARCADE MODEL STRUCTURE ===');
  gltf.scene.traverse((child) => {
    console.log(`Name: "${child.name}" | Type: ${child.type} | isMesh: ${child.isMesh}`);
    if (child.isMesh) {
      console.log(`  Material: ${child.material?.name || 'unnamed'} | Map: ${!!child.material?.map}`);
      // Check geometry bounds to identify the screen
      child.geometry.computeBoundingBox();
      const bb = child.geometry.boundingBox;
      console.log(`  BBox min: (${bb.min.x.toFixed(3)}, ${bb.min.y.toFixed(3)}, ${bb.min.z.toFixed(3)})`);
      console.log(`  BBox max: (${bb.max.x.toFixed(3)}, ${bb.max.y.toFixed(3)}, ${bb.max.z.toFixed(3)})`);
    }
  });
}, undefined, (err) => console.error('Load error:', err));
