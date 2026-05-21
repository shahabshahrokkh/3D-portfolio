import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export function setupScene() {
  const container = document.getElementById('app');

  // Clear container to prevent duplicate renderers/scenes (fixes the 'doubling' issue)
  if (container) {
    container.innerHTML = '';
  }

  // Detect mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || window.innerWidth < 768;


  // Initialize RectAreaLight
  RectAreaLightUniformsLib.init();

  // Scene setup
  const scene = new THREE.Scene();

  // Camera setup
  const camera = new THREE.PerspectiveCamera(
    isMobile ? 60 : 45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(isMobile ? 5 : 4, isMobile ? 4 : 3, isMobile ? 8 : 6);
  camera.lookAt(0, 0, 0);

  // Renderer setup
  const renderer = new THREE.WebGLRenderer({
    antialias: !isMobile,
    alpha: true,
    powerPreference: isMobile ? 'low-power' : 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));

  // High-end cinematic settings
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.7; // Lowered from 1.0 to prevent blinding

  renderer.shadowMap.enabled = !isMobile;
  if (!isMobile) {
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  container.appendChild(renderer.domElement);

  // CSS2D Renderer for Spatial UI
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0px';
  labelRenderer.domElement.style.pointerEvents = 'none'; // Allow raycasting through labels
  container.appendChild(labelRenderer.domElement);

  // Post-processing setup
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Unreal Bloom Pass - Refined to prevent blinding and ghosting
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.15, // Significantly lowered strength
    0.1,  // Minimal radius to prevent ghosting/doubling
    0.95  // High threshold so only the brightest highlights glow
  );
  composer.addPass(bloomPass);

  // OrbitControls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = isMobile ? 0.1 : 0.05;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.minDistance = isMobile ? 0.5 : 0.3; // Much closer zoom for details
  controls.maxDistance = isMobile ? 15 : 12;

  if (isMobile) {
    controls.rotateSpeed = 0.3; // Slower rotation for better control
    controls.zoomSpeed = 0.6; // Slower zoom
    controls.panSpeed = 0.3; // Slower panning
    controls.enablePan = true;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };
  }

  // Lighting
  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444455, 0.3);
  scene.add(hemisphereLight);

  const directionalLight = new THREE.DirectionalLight(0xffeedd, 0.6); // Lowered intensity
  directionalLight.position.set(8, 12, 4);
  directionalLight.castShadow = !isMobile;

  if (!isMobile) {
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.bias = -0.0005;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
  }
  scene.add(directionalLight);

  // Dramatic Lights
  if (!isMobile) {
    const monitorLight = new THREE.RectAreaLight(0x00ffff, 1.2, 1.3, 0.8); // Lowered from 2.0
    monitorLight.position.set(0.6, 1.2, -6.2);
    monitorLight.lookAt(0.6, 1.2, 0);
    scene.add(monitorLight);

    const shelfLight = new THREE.PointLight(0xffaa44, 0.7, 5); // Lowered from 1.0
    shelfLight.position.set(-3, 1.5, -6.5);
    shelfLight.castShadow = true;
    scene.add(shelfLight);
  }

  // Handle window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      labelRenderer.setSize(width, height);
      composer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.5 : 2));
    }, 100);
  });

  return { scene, camera, renderer, controls, composer, labelRenderer, isMobile };
}

