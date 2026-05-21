import * as THREE from 'three';
import gsap from 'gsap';
import { createObjectWithPlaceholder } from '../utils/helpers_v2.js';
import { ModelRegistry } from '../utils/registry.js';
import { addMobileHitbox } from '../utils/mobileHitbox.js';

let screenMesh = null;
let originalMaterial = null;
let blinkTween = null;
let isRinging = false;
let phoneLight = null;

function createLockScreenTexture() {
  const canvas = document.createElement('canvas');
  // Doubled resolution for high quality
  canvas.width = 1024;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');

  // Dark abstract background
  const grad = ctx.createLinearGradient(0, 0, 1024, 2048);
  grad.addColorStop(0, '#0f2027');
  grad.addColorStop(0.5, '#203a43');
  grad.addColorStop(1, '#2c5364');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 2048);

  // Time
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 240px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('09:41', 512, 320);

  // Date
  ctx.font = 'normal 60px "Inter", sans-serif';
  ctx.fillText('Monday, January 9', 512, 240);

  // Notification
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.roundRect(80, 800, 864, 200, 40);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Messages', 120, 860);
  ctx.font = 'normal 40px "Inter", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText('You have 3 new messages', 120, 930);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 16;
  return tex;
}

export async function initIphone(scene) {
  const iphone = await createObjectWithPlaceholder('iphone', scene);

  iphone.userData = {
    action: 'openContact',
    isInteractableGroup: true
  };

  const lockTex = createLockScreenTexture();
  const screenMaterial = new THREE.MeshStandardMaterial({
    map: lockTex,
    roughness: 0.1,
    metalness: 0.8,
    emissive: 0xffffff,
    emissiveMap: lockTex,
    emissiveIntensity: 0.6, // glowing screen
    side: THREE.DoubleSide
  });

  // The model is a single mesh, so we can't replace the material of just the screen.
  // Instead, we will add a PlaneGeometry slightly in front of the phone to act as the screen.
  iphone.traverse((child) => {
    if (child.isMesh) {
      child.userData = iphone.userData;
      ModelRegistry.registerInteractable(child);
    }
  });

  // The iPhone model is a single mesh, so we can't just replace the material of the screen.
  // We will float a PlaneGeometry just above the phone's surface to act as the screen.

  // To get the exact bounds, temporarily reset rotation
  const oldRot = iphone.rotation.clone();
  iphone.rotation.set(0, 0, 0);
  iphone.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(iphone);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  // The phone is upright when rotation is 0,0,0. 
  // Screen is facing +Z.
  const screenW = size.x * 0.90;
  const screenH = size.y * 0.96;

  const screenGeo = new THREE.PlaneGeometry(screenW, screenH);

  screenMesh = new THREE.Mesh(screenGeo, screenMaterial);

  // Position it at the center X and Y, and just in front of the max Z (the screen glass)
  // We subtract iphone.position because box is in world space but we are adding to the iphone group
  const screenZ = (box.max.z - iphone.position.z) + 0.0005;
  screenMesh.position.set(
    center.x - iphone.position.x,
    center.y - iphone.position.y,
    screenZ // 0.5mm in front of the glass
  );

  iphone.add(screenMesh);

  // Create an environment light for the flash effect
  phoneLight = new THREE.PointLight(0xffffff, 0, 1.5);
  phoneLight.position.set(center.x - iphone.position.x, center.y - iphone.position.y, screenZ + 0.05); // slightly above screen
  iphone.add(phoneLight);

  // Restore rotation
  iphone.rotation.copy(oldRot);

  // Add mobile hitbox for easier tapping
  addMobileHitbox(iphone, {
    sizeMultiplier: 2.0, // Phone is small, needs larger hitbox
    height: 0.05,
    yOffset: 0.02,
    action: 'openContact'
  });

  return iphone;
}

export function startPhoneRinging() {
  if (!screenMesh || isRinging) return;
  isRinging = true;

  // Flash black and white
  blinkTween = gsap.to(screenMesh.material.emissive, {
    r: 0, g: 0, b: 0,
    duration: 0.3,
    yoyo: true,
    repeat: -1,
    ease: "steps(1)" // sharp flash
  });

  // Also flash emissive intensity
  gsap.to(screenMesh.material, {
    emissiveIntensity: 1.0,
    duration: 0.3,
    yoyo: true,
    repeat: -1,
    ease: "steps(1)"
  });

  // Flash the environment light
  if (phoneLight) {
    gsap.to(phoneLight, {
      intensity: 2.0, // Bright flash on the desk
      duration: 0.3,
      yoyo: true,
      repeat: -1,
      ease: "steps(1)"
    });
  }
}

export function stopPhoneRinging() {
  if (!screenMesh || !isRinging) return;
  isRinging = false;

  if (blinkTween) {
    blinkTween.kill();
    gsap.killTweensOf(screenMesh.material);

    // Reset to normal
    screenMesh.material.emissive.setHex(0xffffff);
    screenMesh.material.emissiveIntensity = 0.6;
  }

  if (phoneLight) {
    gsap.killTweensOf(phoneLight);
    phoneLight.intensity = 0;
  }
}
