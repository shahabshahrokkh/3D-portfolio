import * as THREE from 'three';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform float time;
  uniform vec2 mouse;
  uniform vec2 resolution;
  uniform float intensity;
  uniform vec3 color;
  uniform float offsetX;
  uniform float offsetY;
  uniform bool mousePosition;
  
  varying vec2 vUv;

  const int number = 10;
  const float size = 0.04;
  const float minSize = 0.3;

  float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
  }

  float rand(vec2 co, float l) {
    return rand(vec2(rand(co), l));
  }

  float rand(vec2 co, float l, float t) {
    return rand(vec2(rand(co, l), t));
  }

  float wrap(float x, float min) {
    return abs(mod(x, 2.0) - 1.0) + min;
  }

  float particle(vec2 p, float fx, float fy, float ax, float ay) {
    vec2 r;
    if(mousePosition)
      r = vec2(p.x + cos(time * fx) * ax * (mouse.x * offsetX), p.y + sin(time * fy) * ay * (mouse.y * offsetY));
    else
      r = vec2(p.x + cos(time * fx) * ax * offsetX, p.y + sin(time * fy) * ay * offsetY);
      
    return ( size * wrap( time * ax, minSize ) ) / length(r);
  }

  void main() {
    vec2 q = vUv; // Use texture coordinates
    vec2 p = (4.0 * q) - 2.0;                 
    p.x *= resolution.x / resolution.y;       

    float col = 0.0;
    float counter = 0.0;
    
    for(int i = 0; i < number; i++) {
      col += particle(p, rand(vec2(counter)), rand(vec2(counter), 1.0, 10.0), counter, counter);
      counter += 0.1;
    }

    // Multiply by intensity and color
    gl_FragColor = vec4(vec3(col) * color * intensity, 1.0);
  }
`;

export class ShaderGlitchManager {
  constructor(width = 1024, height = 1024) {
    this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType, // For smooth glow ranges
    });

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    this.uniforms = {
      time: { value: 0 },
      mouse: { value: new THREE.Vector2(0, 0) },
      targetMouse: { value: new THREE.Vector2(0, 0) },
      resolution: { value: new THREE.Vector2(width, height) },
      intensity: { value: 0.8 },
      color: { value: new THREE.Color(137/255, 188/255, 222/255) }, // Base color from user
      offsetX: { value: 3.0 },
      offsetY: { value: 3.0 },
      mousePosition: { value: true }
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      depthWrite: false,
      depthTest: false
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
    
    this.texture = this.renderTarget.texture;
    this.texture.wrapS = THREE.RepeatWrapping;
    this.texture.wrapT = THREE.RepeatWrapping;
  }

  setHover(u, v) {
    // Map UV (0 to 1) to Mouse (-1 to 1) and invert Y for correct orientation
    this.uniforms.targetMouse.value.set(u * 2 - 1, (1 - v) * 2 - 1);
  }

  update(renderer, time) {
    this.uniforms.time.value = time * 0.5; // Scale speed down a bit
    
    // Smoothly interpolate mouse to target position for organic feel
    this.uniforms.mouse.value.lerp(this.uniforms.targetMouse.value, 0.05);
    
    // Slowly decay target back to center when mouse stops providing input
    this.uniforms.targetMouse.value.lerp(new THREE.Vector2(0, 0), 0.01);

    const currentRenderTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(currentRenderTarget);
  }
}
