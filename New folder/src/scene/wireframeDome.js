import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

/**
 * Room dimensions (from environment.js)
 * Floor: 11.5 x 11.5
 * Height: 5
 * Center: (-1.75, 0, -1.75)
 */
const ROOM_CONFIG = {
    width: 11.5,   // X axis
    depth: 11.5,   // Z axis  
    height: 5,     // Y axis
    floorY: 0,
    centerX: -1.75,
    centerZ: -1.75
};

/**
 * Helper: Add edge to set (avoiding duplicates)
 */
function addEdge(edges, i1, i2) {
    const edge = i1 < i2 ? `${i1}-${i2}` : `${i2}-${i1}`;
    edges.add(edge);
}

/**
 * Create perimeter line at the base where floor meets walls
 */
export function createFloorPerimeter(parentGroup) {
    const { width, depth } = ROOM_CONFIG;

    // Use LineMaterial for thick lines (same as wireframe)
    const material = new LineMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.15,
        linewidth: 4,
        resolution: new THREE.Vector2(window.innerWidth, window.innerHeight)
    });

    // Calculate radius based on room diagonal
    const radius = Math.sqrt((width / 2) ** 2 + (depth / 2) ** 2);

    // Create geodesic dome using IcosahedronGeometry (same as wireframe)
    const domeGeometry = new THREE.IcosahedronGeometry(radius, 1);
    const positions = domeGeometry.attributes.position.array;

    // Collect all vertices that are at ground level and their connections
    const groundVertices = [];
    const vertexMap = new Map();

    for (let i = 0; i < positions.length / 3; i++) {
        const y = positions[i * 3 + 1];

        // Include vertices at or very close to ground level
        if (Math.abs(y) <= 0.01) {
            const x = positions[i * 3];
            const z = positions[i * 3 + 2];

            groundVertices.push({ index: i, x, z });
            vertexMap.set(i, groundVertices.length - 1);
        }
    }

    // Get indices
    let indices;
    if (domeGeometry.index) {
        indices = domeGeometry.index.array;
    } else {
        indices = [];
        for (let i = 0; i < positions.length / 3; i++) {
            indices.push(i);
        }
    }

    // Find edges that connect ground vertices (perimeter edges)
    const perimeterEdges = new Set();

    for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i];
        const b = indices[i + 1];
        const c = indices[i + 2];

        const ay = positions[a * 3 + 1];
        const by = positions[b * 3 + 1];
        const cy = positions[c * 3 + 1];

        // Check each edge of the triangle
        const edges = [
            [a, b, ay, by],
            [b, c, by, cy],
            [c, a, cy, ay]
        ];

        edges.forEach(([v1, v2, y1, y2]) => {
            // If both vertices are at ground level, this is a perimeter edge
            if (Math.abs(y1) <= 0.01 && Math.abs(y2) <= 0.01) {
                const edgeKey = v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`;
                perimeterEdges.add(edgeKey);
            }
        });
    }

    // Draw perimeter edges
    perimeterEdges.forEach(edge => {
        const [i1, i2] = edge.split('-').map(Number);

        const x1 = positions[i1 * 3];
        const z1 = positions[i1 * 3 + 2];

        const x2 = positions[i2 * 3];
        const z2 = positions[i2 * 3 + 2];

        // Create LineGeometry for perimeter edge
        const lineGeometry = new LineGeometry();
        lineGeometry.setPositions([
            x1, 0.0, z1,
            x2, 0.0, z2
        ]);

        const line = new Line2(lineGeometry, material);
        line.computeLineDistances();
        parentGroup.add(line);
    });

    return material;
}

/**
 * Create geodesic dome wireframe (icosahedron-based triangular structure)
 */
export function createRoomDome(parentGroup) {
    const { width, depth } = ROOM_CONFIG;

    // Use LineMaterial for thick lines (works in all browsers)
    const material = new LineMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.15,
        linewidth: 4, // in pixels - much thicker like reference
        resolution: new THREE.Vector2(window.innerWidth, window.innerHeight)
    });

    // Update resolution on window resize
    window.addEventListener('resize', () => {
        material.resolution.set(window.innerWidth, window.innerHeight);
    });

    // Calculate radius based on room diagonal
    const radius = Math.sqrt((width / 2) ** 2 + (depth / 2) ** 2);

    // Create geodesic dome using IcosahedronGeometry
    // subdivisions = 1 for larger, clearer triangles (like reference)
    const domeGeometry = new THREE.IcosahedronGeometry(radius, 1);

    // Remove bottom half vertices (keep only hemisphere)
    const positions = domeGeometry.attributes.position.array;

    // Get indices - handle both indexed and non-indexed geometry
    let indices;
    if (domeGeometry.index) {
        indices = domeGeometry.index.array;
    } else {
        // Create indices for non-indexed geometry
        indices = [];
        for (let i = 0; i < positions.length / 3; i++) {
            indices.push(i);
        }
    }

    // Create edges from the geometry
    const edges = new Set();

    for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i];
        const b = indices[i + 1];
        const c = indices[i + 2];

        // Get vertex positions
        const ay = positions[a * 3 + 1];
        const by = positions[b * 3 + 1];
        const cy = positions[c * 3 + 1];

        // Only include triangles that have at least one vertex above ground
        // Use a small threshold to include triangles at ground level
        if (ay >= -0.01 || by >= -0.01 || cy >= -0.01) {
            // Add edges (use sorted indices to avoid duplicates)
            addEdge(edges, a, b);
            addEdge(edges, b, c);
            addEdge(edges, c, a);
        }
    }

    // Draw all edges using Line2 for thick lines
    edges.forEach(edge => {
        const [i1, i2] = edge.split('-').map(Number);

        const x1 = positions[i1 * 3];
        const y1 = positions[i1 * 3 + 1];
        const z1 = positions[i1 * 3 + 2];

        const x2 = positions[i2 * 3];
        const y2 = positions[i2 * 3 + 1];
        const z2 = positions[i2 * 3 + 2];

        // Clamp vertices to ground level if below (exactly at 0)
        const clampedY1 = Math.max(y1, 0.0);
        const clampedY2 = Math.max(y2, 0.0);

        // Skip lines that are completely on the ground (both vertices at y=0)
        // These are the floor edges and should not be visible
        if (clampedY1 === 0.0 && clampedY2 === 0.0) {
            return; // Skip this edge
        }

        // Create LineGeometry with positions array
        const lineGeometry = new LineGeometry();
        lineGeometry.setPositions([
            x1, clampedY1, z1,
            x2, clampedY2, z2
        ]);

        const line = new Line2(lineGeometry, material);
        line.computeLineDistances();
        parentGroup.add(line);
    });

    return material;
}

/**
 * Create glass panels that match the geodesic dome triangles exactly
 */
export function createGlassPanels(parentGroup) {
    const { width, depth } = ROOM_CONFIG;

    // Premium Frosted Glass Material
    const glassMaterial = new THREE.MeshStandardMaterial({
        color: 0x8ab4d4,       // Slight blue-gray tint
        metalness: 0.05,
        roughness: 0.6,        // Frosted / matte
        transparent: true,
        opacity: 0.18,         // Very subtle presence
        depthWrite: false,
        side: THREE.DoubleSide,
    });

    // Calculate radius based on room diagonal
    const radius = Math.sqrt((width / 2) ** 2 + (depth / 2) ** 2);

    // Create geodesic dome using IcosahedronGeometry (same as wireframe)
    const domeGeometry = new THREE.IcosahedronGeometry(radius, 1);
    const positions = domeGeometry.attributes.position.array;

    // Get indices
    let indices;
    if (domeGeometry.index) {
        indices = domeGeometry.index.array;
    } else {
        indices = [];
        for (let i = 0; i < positions.length / 3; i++) {
            indices.push(i);
        }
    }

    // Create glass triangles
    for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i];
        const b = indices[i + 1];
        const c = indices[i + 2];

        // Get vertex positions
        const ax = positions[a * 3];
        const ay = positions[a * 3 + 1];
        const az = positions[a * 3 + 2];

        const bx = positions[b * 3];
        const by = positions[b * 3 + 1];
        const bz = positions[b * 3 + 2];

        const cx = positions[c * 3];
        const cy = positions[c * 3 + 1];
        const cz = positions[c * 3 + 2];

        // Only include triangles that have at least one vertex above ground
        // Use a small threshold to include triangles at ground level
        if (ay >= -0.01 || by >= -0.01 || cy >= -0.01) {
            // Clamp vertices to ground level if below (exactly at 0, not above)
            const clampedAy = Math.max(ay, 0.0);
            const clampedBy = Math.max(by, 0.0);
            const clampedCy = Math.max(cy, 0.0);

            // Skip degenerate triangles (all vertices at same point after clamping)
            if (clampedAy === 0 && clampedBy === 0 && clampedCy === 0) {
                continue;
            }

            // Create triangle geometry
            const triangleGeometry = new THREE.BufferGeometry();
            const vertices = new Float32Array([
                ax, clampedAy, az,
                bx, clampedBy, bz,
                cx, clampedCy, cz
            ]);

            triangleGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            triangleGeometry.setIndex([0, 1, 2]);
            triangleGeometry.computeVertexNormals();

            const triangle = new THREE.Mesh(triangleGeometry, glassMaterial);
            parentGroup.add(triangle);
        }
    }
}

/**
 * Create geodesic floor that matches the dome base exactly
 * Uses the same vertices as the dome bottom edge for perfect alignment
 */
export function createGeodesicFloor(scene) {
    const { width, depth, centerX, centerZ, floorY } = ROOM_CONFIG;

    // Calculate radius based on room diagonal (same as dome)
    const radius = Math.sqrt((width / 2) ** 2 + (depth / 2) ** 2);

    // Create geodesic dome using IcosahedronGeometry (same as wireframe)
    const domeGeometry = new THREE.IcosahedronGeometry(radius, 1);
    const positions = domeGeometry.attributes.position.array;

    // Get indices
    let indices;
    if (domeGeometry.index) {
        indices = domeGeometry.index.array;
    } else {
        indices = [];
        for (let i = 0; i < positions.length / 3; i++) {
            indices.push(i);
        }
    }

    // Collect all vertices that are at or below ground level
    const floorVertices = [];
    const vertexMap = new Map(); // Map original index to new index

    for (let i = 0; i < positions.length / 3; i++) {
        const y = positions[i * 3 + 1];

        // Include vertices at or below ground level
        if (y <= 0.01) {
            const x = positions[i * 3];
            const z = positions[i * 3 + 2];

            vertexMap.set(i, floorVertices.length / 3);
            floorVertices.push(x, 0, z); // Clamp to ground level
        }
    }

    // Create triangles for the floor using only ground-level vertices
    const floorIndices = [];

    for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i];
        const b = indices[i + 1];
        const c = indices[i + 2];

        const ay = positions[a * 3 + 1];
        const by = positions[b * 3 + 1];
        const cy = positions[c * 3 + 1];

        // Only include triangles where all vertices are at ground level
        if (ay <= 0.01 && by <= 0.01 && cy <= 0.01) {
            if (vertexMap.has(a) && vertexMap.has(b) && vertexMap.has(c)) {
                floorIndices.push(
                    vertexMap.get(a),
                    vertexMap.get(b),
                    vertexMap.get(c)
                );
            }
        }
    }

    // Create floor geometry
    const floorGeometry = new THREE.BufferGeometry();
    floorGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(floorVertices), 3));
    floorGeometry.setIndex(floorIndices);
    floorGeometry.computeVertexNormals();

    // Floor material - semi-transparent to see space below
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a24,
        roughness: 0.8,
        metalness: 0.2,
        transparent: true,
        opacity: 0.7, // Semi-transparent to see cosmic background
        emissive: new THREE.Color(0x000000),
        side: THREE.DoubleSide, // Visible from both sides
    });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.set(centerX, floorY, centerZ);
    floor.receiveShadow = true;

    scene.add(floor);

    return floor;
}
/**
 * Create complete room wireframe (dome + glass panels in one synchronized group)
 * Both wireframe and glass rotate together as one unit
 */
export function createCompleteRoomWireframe(scene) {
    const { centerX, centerZ, floorY } = ROOM_CONFIG;

    // Create geodesic floor first (matches dome base)
    const floor = createGeodesicFloor(scene);

    // Create a single group for both wireframe and glass
    const unifiedGroup = new THREE.Group();

    // Add perimeter line at floor/wall intersection
    const perimeterMaterial = createFloorPerimeter(unifiedGroup);

    // Add wireframe lines to the group
    const wireframeMaterial = createRoomDome(unifiedGroup);

    // Add glass panels to the same group
    createGlassPanels(unifiedGroup);

    // Position the entire group at room center
    unifiedGroup.position.set(centerX, floorY, centerZ);

    // Add to scene
    scene.add(unifiedGroup);

    // Animation - both wireframe and glass rotate together
    let time = 0;
    const animate = () => {
        time += 0.01;
        wireframeMaterial.opacity = 0.12 + Math.sin(time) * 0.03;
        perimeterMaterial.opacity = 0.12 + Math.sin(time) * 0.03; // Sync with wireframe
        unifiedGroup.rotation.y += 0.0002; // Rotate the entire group
    };

    return { dome: unifiedGroup, glass: unifiedGroup, floor, animate };
}
