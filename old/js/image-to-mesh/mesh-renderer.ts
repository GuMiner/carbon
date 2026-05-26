
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let mesh: THREE.Mesh | null = null;
let controls: THREE.OrbitControls;

const gltfContainer = document.getElementById('gltf-container')!;

// Initialize 3D scene
function initScene() {
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);
  
  // Create camera
  camera = new THREE.PerspectiveCamera(75, gltfContainer.clientWidth / gltfContainer.clientHeight, 0.1, 1000);
  camera.position.z = 1;
  
  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(gltfContainer.clientWidth, gltfContainer.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  gltfContainer.appendChild(renderer.domElement);
  
  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
  
  // Load GLTF model
  const loader = new GLTFLoader();
  loader.load(
    '../static/mesh.glb',
    (gltf) => {
      // Add the loaded model to the scene
      scene?.add(gltf.scene);
      
      // Store reference to the mesh for rotation
      mesh = gltf.scene;
      
      // Optional: Center the model
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const center = box.getCenter(new THREE.Vector3());
      gltf.scene.position.x += (gltf.scene.position.x - center.x);
      gltf.scene.position.y += (gltf.scene.position.y - center.y);
      gltf.scene.position.z += (gltf.scene.position.z - center.z);
      
      // Initialize orbit controls
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
      console.error('An error occurred while loading the GLTF model:', error);
    }
  );
  
  // Handle window resize
  window.addEventListener('resize', () => {
    if (camera && renderer && gltfContainer) {
      camera.aspect = gltfContainer.clientWidth / gltfContainer.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(gltfContainer.clientWidth, gltfContainer.clientHeight);
    }
  });
  
  // Add mouse event listeners for rotation
  let isDragging = false;
  let previousMousePosition = {
    x: 0,
    y: 0
  };

  gltfContainer.addEventListener('mousedown', (e) => {
    isDragging = true;
  });

  gltfContainer.addEventListener('mousemove', (e) => {
    if (isDragging && mesh) {
      const deltaMove = {
        x: e.offsetX - previousMousePosition.x,
        y: e.offsetY - previousMousePosition.y
      };

      // Rotate the mesh based on mouse movement
      mesh.rotation.y += deltaMove.x * 0.01;
      mesh.rotation.x += deltaMove.y * 0.01;
    }
    
    previousMousePosition = {
      x: e.offsetX,
      y: e.offsetY
    };
  });

  gltfContainer.addEventListener('mouseup', () => {
    isDragging = false;
  });

  gltfContainer.addEventListener('mouseleave', () => {
    isDragging = false;
  });
  
  // Start animation loop
  animate();
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  // Rotate the mesh if it exists
  if (mesh) {
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.01;
  }

  // Update controls for damping effect
  if (controls) {
    controls.update();
  }
  
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  initScene();
});