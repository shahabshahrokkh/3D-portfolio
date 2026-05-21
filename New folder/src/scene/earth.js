import * as THREE from 'three';

let earthMesh, atmosphereMesh, earthMaterial, atmosphereMaterial;
let sunLight;

export function setupEarth(scene) {
  // Load real Earth textures from reliable CDN
  const textureLoader = new THREE.TextureLoader();
  const baseURL = 'https://unpkg.com/three-globe@2.34.0/example/img/';

  const earthTexture = textureLoader.load(baseURL + 'earth-blue-marble.jpg');
  const earthBumpMap = textureLoader.load(baseURL + 'earth-topology.png');
  const earthNightTexture = textureLoader.load(baseURL + 'earth-night.jpg');

  // Remove green tint from the earth day texture
  earthTexture.colorSpace = THREE.SRGBColorSpace;
  earthNightTexture.colorSpace = THREE.SRGBColorSpace;

  // Layer 1 is used for the cosmic background (Earth + its lights)
  const EARTH_LAYER = 1;

  // ─── Lighting (Isolated to Layer 1) ───
  // Subtle sunlight from behind/side for dramatic rim lighting
  sunLight = new THREE.DirectionalLight(0xffffff, 5.0);
  // Scale light position to match the large earth
  sunLight.position.set(-200, 50, -150);
  sunLight.layers.set(EARTH_LAYER);
  scene.add(sunLight);

  // Very faint cool fill from front to see surface detail
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
  fillLight.position.set(100, 50, 200);
  fillLight.layers.set(EARTH_LAYER);
  scene.add(fillLight);

  // Subtle ambient to see dark side slightly
  const ambientLight = new THREE.AmbientLight(0x111122, 0.5);
  ambientLight.layers.set(EARTH_LAYER);
  scene.add(ambientLight);

  // ─── Earth Mesh ───
  // Massive scale: radius 150
  const earthRadius = 150;
  const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);
  
  earthMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      bumpMap: earthBumpMap,
      bumpScale: 0.04 * (earthRadius / 2), // scale bump appropriately
      roughness: 1.0,
      metalness: 0.0,
      emissiveMap: earthNightTexture,
      emissive: new THREE.Color(0xffcc66),
      emissiveIntensity: 0.8,
  });

  earthMaterial.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
          '#include <map_fragment>',
          `
      #include <map_fragment>
      // Desaturate the texture
      float grey = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
      diffuseColor.rgb = mix(vec3(grey), diffuseColor.rgb, 0.35);
      // Cool blue-ish tint, suppress green, darken land
      diffuseColor.rgb *= vec3(0.6, 0.55, 0.85);
      diffuseColor.rgb = pow(diffuseColor.rgb, vec3(1.0, 1.2, 0.9));
      `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
          '#include <emissivemap_fragment>',
          `
      #include <emissivemap_fragment>
      // Warm city lights, suppress green
      totalEmissiveRadiance.g *= 0.55;
      totalEmissiveRadiance.b *= 0.4;
      totalEmissiveRadiance.r *= 1.2;
      `
      );
  };
  
  earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
  earthMesh.layers.set(EARTH_LAYER);
  
  // Position it far behind the room
  // Room is centered near 0,0,0. Let's put earth far back and slightly to the right.
  earthMesh.position.set(100, -20, -350); 
  scene.add(earthMesh);

  // ─── Atmosphere Glow ───
  const atmRadius = earthRadius * (2.15 / 2.0); // Maintain same proportion
  const atmosphereGeometry = new THREE.SphereGeometry(atmRadius, 64, 64);
  atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
      fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      uniform vec3 uSunDirection;
      void main() {
        float viewDot = dot(vNormal, vec3(0.0, 0.0, 1.0));
        float intensity = pow(0.7 - viewDot, 2.5);
        float sunFacing = max(0.0, dot(normalize(vNormal), uSunDirection));
        float rimSun = pow(max(0.0, dot(normalize(vNormal), -uSunDirection)), 1.5);
        vec3 atmosphereColor = mix(
          vec3(0.05, 0.12, 0.35),
          vec3(0.35, 0.6, 1.0),
          rimSun * 0.7 + sunFacing * 0.3
        );
        float alpha = intensity * (0.3 + rimSun * 0.8 + sunFacing * 0.2);
        gl_FragColor = vec4(atmosphereColor, alpha);
      }
    `,
      uniforms: {
          uSunDirection: { value: new THREE.Vector3() }
      },
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
  });
  
  atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  atmosphereMesh.layers.set(EARTH_LAYER);
  earthMesh.add(atmosphereMesh);

  return earthMesh;
}

export function updateEarth(elapsed) {
  if (earthMesh) {
    // Earth rotation - slow and dramatic
    earthMesh.rotation.y = elapsed * 0.05; // Slightly slower for giant scale

    // Update atmosphere sun direction
    if (sunLight && atmosphereMaterial) {
      const sunDir = new THREE.Vector3().copy(sunLight.position).normalize();
      atmosphereMaterial.uniforms.uSunDirection.value.copy(sunDir);
    }
  }
}
