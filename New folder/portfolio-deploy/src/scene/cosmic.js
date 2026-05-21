import * as THREE from 'three';

let galaxyMaterial;
let points;

// Meteor system
let meteors = [];
const METEOR_COUNT = 12;

export function initCosmicEnvironment(scene) {
  const LAYER = 1; // Put cosmic background on Layer 1

  // ─── GALAXY ───
  const parameters = {
    count: 150000,
    radius: 900, // Slightly smaller radius to condense it
    branches: 5,
    randomness: 0.8,
    randomnessPower: 4,
    insideColor: "#ec5300",
    outsideColor: "#2fb4fc"
  };

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(parameters.count * 3);
  const colors = new Float32Array(parameters.count * 3);
  const scales = new Float32Array(parameters.count);
  const randomness = new Float32Array(parameters.count * 3);

  const insideColor = new THREE.Color(parameters.insideColor);
  const outsideColor = new THREE.Color(parameters.outsideColor);

  for (let i = 0; i < parameters.count; i++) {
    const i3 = i * 3;

    // Position
    const radius = Math.random() * parameters.radius;
    const branchAngle = ((i % parameters.branches) / parameters.branches) * Math.PI * 2;

    const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;
    const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;
    const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;

    positions[i3] = Math.cos(branchAngle) * radius;
    positions[i3 + 1] = 0;
    positions[i3 + 2] = Math.sin(branchAngle) * radius;

    // Randomness
    randomness[i3] = randomX;
    randomness[i3 + 1] = randomY;
    randomness[i3 + 2] = randomZ;

    // Color
    const mixedColor = insideColor.clone();
    mixedColor.lerp(outsideColor, radius / parameters.radius);

    colors[i3] = mixedColor.r;
    colors[i3 + 1] = mixedColor.g;
    colors[i3 + 2] = mixedColor.b;

    // Scales
    scales[i] = Math.random();
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
  geometry.setAttribute("aRandomness", new THREE.BufferAttribute(randomness, 3));

  const textureLoader = new THREE.TextureLoader();
  const starTexture = textureLoader.load("https://assets.codepen.io/22914/star_02.png");

  const vertexShader = `
    uniform float uSize;
    uniform float uTime;
    uniform float uHoleSize;

    attribute float aScale;
    attribute vec3 aRandomness;

    varying vec3 vColor;

    void main() {
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      
      // Spin
      float angle = atan(modelPosition.x, modelPosition.z);
      float distanceToCenter = length(modelPosition.xz) + uHoleSize;
      
      // Adjust spin speed for massive galaxy (multiplied angleOffset by 50.0)
      float uTimeOffset = uTime + (uHoleSize * 30.0);
      float angleOffset = (1.0 / distanceToCenter) * uTimeOffset * 50.0; 
      angle += angleOffset;
      
      modelPosition.x = cos(angle) * distanceToCenter;
      modelPosition.z = sin(angle) * distanceToCenter;  
      modelPosition.xyz += aRandomness; 

      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectedPosition = projectionMatrix * viewPosition;

      gl_Position = projectedPosition; 
      float scale = uSize * aScale;
      
      gl_PointSize = scale;
      gl_PointSize *= ( 1.0 / - viewPosition.z );
      vColor = color;
    }
  `;

  const fragmentShader = `
    varying vec3 vColor;
    uniform sampler2D uTexture;

    void main() {
      gl_FragColor = vec4( vColor, 1.0 );
      gl_FragColor = gl_FragColor * texture2D(uTexture, vec2( gl_PointCoord.x, gl_PointCoord.y ) );
    }
  `;

  galaxyMaterial = new THREE.ShaderMaterial({
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: 1500.0 * Math.min(window.devicePixelRatio, 2) }, // Much larger point size to show colors and details
      uHoleSize: { value: 0.15 },
      uTexture: { value: starTexture }
    }
  });

  points = new THREE.Points(geometry, galaxyMaterial);

  // Position the galaxy closer, but still behind the Earth (Earth is at Z=-350)
  points.position.set(-150, 50, -450);

  // Tilt it majestically
  points.rotation.x = Math.PI / 8;
  points.rotation.z = -Math.PI / 16;

  points.layers.set(LAYER);
  scene.add(points);

  // ─── METEORS ───
  const meteorMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  });

  for (let i = 0; i < METEOR_COUNT; i++) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(6); // Start and end points
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const line = new THREE.Line(geo, meteorMaterial);
    line.layers.set(LAYER);
    scene.add(line);

    meteors.push({
      mesh: line,
      reset: function () {
        this.mesh.visible = false; // Hide while waiting
        // Start high and to the right/back
        this.x = (Math.random() - 0.5) * 800;
        this.y = Math.random() * 400 + 300;
        this.z = (Math.random() - 0.5) * 800 - 200;

        // Fast velocity downwards and to the left
        this.vx = -Math.random() * 200 - 100;
        this.vy = -Math.random() * 300 - 200;
        this.vz = Math.random() * 100 - 50;

        // Meteor trail length
        this.length = Math.random() * 20 + 10;
        this.active = Math.random() > 0.5; // Stagger starts
        this.delay = Math.random() * 5; // Wait seconds before appearing
      }
    });
    meteors[i].reset();
  }
}

export function updateCosmicEnvironment(time) {
  // Update Galaxy
  if (galaxyMaterial) {
    galaxyMaterial.uniforms.uTime.value = time * 0.2; // Smooth slow rotation
  }

  // Update Meteors
  meteors.forEach(m => {
    if (m.delay > 0) {
      m.delay -= 0.016; // approx delta
      return;
    }

    m.mesh.visible = true; // Show meteor once delay is over

    m.x += m.vx * 0.016;
    m.y += m.vy * 0.016;
    m.z += m.vz * 0.016;

    const positions = m.mesh.geometry.attributes.position.array;

    // Head of meteor
    positions[0] = m.x;
    positions[1] = m.y;
    positions[2] = m.z;

    // Tail of meteor (trailing behind)
    const trailFactor = m.length / Math.sqrt(m.vx * m.vx + m.vy * m.vy + m.vz * m.vz);
    positions[3] = m.x - m.vx * trailFactor;
    positions[4] = m.y - m.vy * trailFactor;
    positions[5] = m.z - m.vz * trailFactor;

    m.mesh.geometry.attributes.position.needsUpdate = true;

    // Reset if it goes too low
    if (m.y < -300) {
      m.reset();
    }
  });
}
