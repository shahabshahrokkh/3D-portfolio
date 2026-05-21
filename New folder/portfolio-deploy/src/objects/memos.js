import * as THREE from 'three';
import { ModelRegistry } from '../utils/registry.js';

// Global texture cache for images
const textureLoader = new THREE.TextureLoader();
const textureCache = {};

function getTexture(url) {
  if (!textureCache[url]) {
    textureCache[url] = textureLoader.load(url);
  }
  return textureCache[url];
}

async function createMemoCanvas(config) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (config.style === 'polaroid') {
    // Polaroid Style
    // White background
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(0, 0, 512, 512);

    // Slight shadow border
    ctx.strokeStyle = '#dddddd';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 508, 508);

    // Draw Image
    if (config.imageUrl) {
      try {
        const img = await new Promise((resolve, reject) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = reject;
          i.src = config.imageUrl;
        });
        // Polaroid image area: top 32px padding, left/right 32px padding. 
        // Image size: 448x384
        ctx.drawImage(img, 32, 32, 448, 384);
      } catch (e) {
        // Fallback dark box
        ctx.fillStyle = '#333';
        ctx.fillRect(32, 32, 448, 384);
      }
    } else {
      ctx.fillStyle = '#333';
      ctx.fillRect(32, 32, 448, 384);
    }

    // Caption
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 42px "Kalam", "Caveat", cursive, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.text, 256, 460);

  } else {
    // Default Sticky Note Style
    ctx.fillStyle = config.color || '#ffeb3b';
    ctx.fillRect(0, 0, 512, 512);

    // Text
    ctx.fillStyle = '#222222';
    const fontFamily = config.font || '"Kalam", "Caveat", cursive, sans-serif';
    ctx.font = `bold ${config.fontSize || 54}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lines = config.text.split('\n');
    const lineHeight = config.fontSize ? config.fontSize * 1.2 : 64;
    const startY = 256 - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, i) => {
      ctx.fillText(line, 256, startY + (i * lineHeight));
    });
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 16;
  return tex;
}

export async function createMemo(config) {
  const group = new THREE.Group();

  const width = config.style === 'polaroid' ? 0.35 : 0.3;
  const height = config.style === 'polaroid' ? 0.42 : 0.3;

  let geometry;
  if (config.style === 'sticky-curved') {
    geometry = new THREE.PlaneGeometry(width, height, 4, 4);
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      // Curve bottom part outwards (more pronounced)
      if (y < 0) {
        // If y goes down to -0.15, y^2 is ~0.022. Multiply by 0.8 to get ~1.8cm pop-out.
        const z = Math.pow(-y, 2) * 0.8;
        pos.setZ(i, z);
      }
    }
    geometry.computeVertexNormals();
  } else {
    geometry = new THREE.PlaneGeometry(width, height);
  }

  const texture = await createMemoCanvas(config);

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: config.style === 'polaroid' ? 0.4 : 0.9,
    metalness: 0.1,
    side: THREE.DoubleSide
  });

  const plane = new THREE.Mesh(geometry, material);
  plane.receiveShadow = true;
  plane.castShadow = true;
  group.add(plane);

  // Set group userData FIRST before copying to children
  group.userData = {
    action: 'openLink',
    url: config.url,
    isPlaceholder: false,
    isInteractableGroup: true
  };

  const fastenerType = config.fastener || 'pin';

  if (fastenerType === 'pin') {
    const pinColor = config.pinColor || 0xff3333;
    const pinMaterial = new THREE.MeshStandardMaterial({ color: pinColor, roughness: 0.4 });
    const pinSphere = new THREE.Mesh(new THREE.SphereGeometry(0.012, 16, 16), pinMaterial);
    pinSphere.position.set(0, height / 2 - 0.03, 0.015);
    group.add(pinSphere);

    const pinCone = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.001, 0.02, 8), pinMaterial);
    pinCone.position.set(0, height / 2 - 0.03, 0.005);
    pinCone.rotation.x = Math.PI / 2;
    group.add(pinCone);

    pinSphere.userData = { ...group.userData, parentGroup: group };
    pinCone.userData = { ...group.userData, parentGroup: group };
    ModelRegistry.registerInteractable(pinSphere);
    ModelRegistry.registerInteractable(pinCone);
  }
  else if (fastenerType === 'tape') {
    // Use BoxGeometry for depth instead of flat Plane
    const tapeGeo = new THREE.BoxGeometry(0.13, 0.035, 0.002);
    const tapeMat = new THREE.MeshStandardMaterial({
      color: 0xeeddcc,
      transparent: true,
      opacity: 0.9, // less transparent so depth is visible
      roughness: 1.0,
      depthWrite: true
    });
    const tape = new THREE.Mesh(tapeGeo, tapeMat);
    tape.castShadow = true;
    tape.receiveShadow = true;
    // Position slightly in front of the paper
    tape.position.set(0, height / 2 - 0.01, 0.002);
    tape.rotation.z = (Math.random() - 0.5) * 0.2;
    // Slight bend in X axis to look like it's pressing down on edges
    tape.rotation.x = -0.05;
    group.add(tape);

    tape.userData = { ...group.userData, parentGroup: group };
    ModelRegistry.registerInteractable(tape);
  }
  else if (fastenerType === 'magnet') {
    const magMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });
    // Made the magnet thicker (radius 0.025, thickness 0.012)
    const magMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.012, 16), magMat);
    magMesh.castShadow = true;
    magMesh.receiveShadow = true;
    magMesh.rotation.x = Math.PI / 2;
    magMesh.position.set(0, height / 2 - 0.03, 0.008);
    group.add(magMesh);

    magMesh.userData = { ...group.userData, parentGroup: group };
    ModelRegistry.registerInteractable(magMesh);
  }

  group.position.set(...config.pos);
  if (config.rot) {
    group.rotation.set(...config.rot);
  }

  plane.userData = { ...group.userData, parentGroup: group };
  ModelRegistry.registerInteractable(plane);

  return group;
}

export async function initMemos(scene) {
  const Z_POS = -7.185;
  const memosData = [
    {
      style: 'sticky-curved', fastener: 'magnet',
      text: 'My Skills:\nReact\nThree.js', color: '#ffeb3b', font: '"Caveat", cursive', fontSize: 60,
      pos: [-0.6, 2.6, Z_POS], rot: [0, 0, -0.05], url: 'https://reactjs.org'
    },
    {
      style: 'sticky-curved', fastener: 'tape',
      text: 'GitHub\n@testuser', color: '#81c784', font: '"Kalam", cursive', fontSize: 54,
      pos: [0.4, 2.6, Z_POS], rot: [0, 0, 0.05], url: 'https://github.com'
    },
    {
      style: 'polaroid', fastener: 'tape',
      text: 'My Workspace', imageUrl: '/assets/polaroid_art.webp',
      pos: [0.75, 2.15, Z_POS], rot: [0, 0, -0.08], url: 'https://linkedin.com'
    },
    {
      style: 'sticky-curved', fastener: 'pin', pinColor: 0x2196f3,
      text: 'Contact Me\nShahabshahrokhh\n@gmail.com', color: '#ffb74d', font: '"Caveat", cursive', fontSize: 36,
      pos: [-0.1, 2.65, Z_POS], rot: [0, 0, 0.04], url: 'mailto:Shahabshahrokhh@gmail.com'
    },
    {
      style: 'sticky-curved', fastener: 'pin', pinColor: 0xff3333,
      text: 'Welcome to\nMy Brain', color: '#ffffff', font: '"Kalam", cursive', fontSize: 48,
      pos: [-0.95, 1.95, Z_POS], rot: [0, 0, -0.03], url: '#'
    }
  ];

  const memoObjects = [];
  for (const m of memosData) {
    const memo = await createMemo(m);
    scene.add(memo);
    memoObjects.push(memo);
  }

  // Return the memo objects for navigation registration
  return memoObjects;
}
