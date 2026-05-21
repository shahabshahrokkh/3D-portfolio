import * as THREE from 'three';
import { createObjectWithPlaceholder } from '../utils/helpers_v2.js';
import { glitchMeshes } from '../scene/environment.js';
import { ShaderGlitchManager } from '../scene/shaderGlitch.js';

function createPhotoCanvasTexture(imgSrc) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Use portrait canvas to match the vertical frame
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Draw image directly without rotation (portrait orientation)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      resolve(tex);
    };
    img.onerror = () => resolve(null);
    img.src = imgSrc;
  });
}

const SPINE_STYLES = [
  { bg: '#0d1117', text: '#00f2fe', accent: '#00f2fe' },
  { bg: '#0f1923', text: '#4facfe', accent: '#4facfe' },
  { bg: '#0a1628', text: '#00ffcc', accent: '#00ffcc' },
  { bg: '#130d2e', text: '#a78bfa', accent: '#a78bfa' },
  { bg: '#1c0a1a', text: '#f472b6', accent: '#f472b6' },
  { bg: '#1c1200', text: '#fbbf24', accent: '#fbbf24' },
];

// Creates a plane mesh with canvas-rendered spine text - stays FIXED in 3D
function createSpineMesh(title, style, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = style.bg;
  ctx.fillRect(0, 0, 64, 256);

  // Accent borders
  ctx.fillStyle = style.accent;
  ctx.fillRect(0, 0, 2, 256);   // left border
  ctx.fillRect(62, 0, 2, 256);  // right border
  ctx.fillRect(0, 0, 64, 2);    // top border
  ctx.fillRect(0, 254, 64, 2);  // bottom border

  // Title text – rotated 90° so it reads along the spine
  ctx.save();
  ctx.translate(32, 128);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = style.text;
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 0, 0);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const geo = new THREE.PlaneGeometry(1, 1);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    side: THREE.DoubleSide,
    transparent: false,
    depthWrite: true
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.scale.set(width, height, 1);
  return mesh;
}

export async function initShelves(scene) {
  const shelves = await createObjectWithPlaceholder('shelves', scene);

  if (shelves) {
    const photoGlitch = new ShaderGlitchManager(512, 512);
    const userTexture = await createPhotoCanvasTexture('/assets/_Generated_Image.webp');

    let booksMesh = null;

    shelves.traverse((child) => {
      if (!child.isMesh) return;

      if (child.name === 'Frame_Frame_0') {
        // Hide the original mesh's weird texture mapping by making it black
        child.material = new THREE.MeshBasicMaterial({ color: 0x010101 });

        // Compute bounding box to know the size of the picture area
        child.geometry.computeBoundingBox();
        const box = child.geometry.boundingBox;
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);

        // --- MANUALLY TUNED ALIGNMENT ---
        // Local coordinates: Z = UP, Y = DEPTH (Wall to Room), X = Lateral.
        const planeGeo = new THREE.PlaneGeometry(1, 1);
        const planeMat = new THREE.MeshBasicMaterial({
          map: userTexture,
          side: THREE.DoubleSide
        });
        const photoMesh = new THREE.Mesh(planeGeo, planeMat);

        // =======================
        // ALIGN TO FRAME (INHERITED TILT)
        // =======================
        // The frame's tilt is handled by the parent hierarchy.
        // We only need to face the local front (-Y direction)

        // swingAngle: Negative pushes LEFT side back (+Y) and RIGHT side forward (-Y).
        // Positive pushes LEFT side forward (-Y) and RIGHT side back (+Y).
        const swingAngle = -0.25; // Tweak this value to push the left side back

        // Order 'ZXY': Swing around vertical (Z) first, then pitch around lateral (X)
        photoMesh.rotation.set(Math.PI / 2, 0, swingAngle, 'ZXY');

        // Scale to fit the frame
        photoMesh.scale.set(size.x * 0.9, size.z * 0.9, 1);

        // depthOffset: Positive pushes the whole photo BACK (towards the frame/wall)
        // Negative pushes it FORWARD (towards the room)
        const depthOffset = 0.02; // Tweak this value to push the whole photo back

        // Position: The local bounding box is axis-aligned, so box.min.y is the entire front face
        photoMesh.position.set(center.x, box.min.y + depthOffset, center.z);

        // Add photo to frame (glitch overlay removed for cleaner look)
        child.add(photoMesh);

        child.userData.glitchManager = photoGlitch;
        glitchMeshes.push(child);
      }

      if (child.name === 'Books_Books_0') {
        booksMesh = child;
      }
    });

    if (booksMesh) {
      booksMesh.geometry.computeBoundingBox();
      const lb = booksMesh.geometry.boundingBox;

      const size = new THREE.Vector3();
      lb.getSize(size);
      const center = new THREE.Vector3();
      lb.getCenter(center);

      const titles = ['Django', 'Next.js', 'React', 'Python', 'FullStack', 'SaaS'];
      const count = titles.length;

      // Try X axis first (books arranged side by side along X)
      const spineW = size.x / count;
      const spineH = size.z; // Books' height is along Z in local geometry

      titles.forEach((title, i) => {
        const spineMesh = createSpineMesh(title, SPINE_STYLES[i], spineW * 0.85, spineH * 0.85);

        // Position on the room-facing Y face (spine of books)
        // Local geometry: X = books arranged side-by-side, Z = height, Y = depth (wall→room)
        spineMesh.position.set(
          lb.min.x + spineW * i + spineW / 2, // centered per book along X
          lb.min.y - 0.002,                   // front/room-facing face (-Y direction)
          center.z                             // vertical center of books
        );

        // Rotate plane to face -Y (toward room)
        spineMesh.rotation.x = Math.PI / 2;

        booksMesh.add(spineMesh);
      });
    }
  }

  return shelves;
}
