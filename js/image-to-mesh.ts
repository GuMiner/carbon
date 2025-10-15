import "../scss/gen/image-to-mesh.css";
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// DOM Elements
const dropArea = document.getElementById('drop-area')!;
const fileElem = document.getElementById('fileElem') as HTMLInputElement;
const fileLabel = document.querySelector('.file-label')!;
const previewContainer = document.getElementById('preview-container')!;
const imageContainer = document.getElementById('image-container')!;
const pointsInfo = document.getElementById('points-info')!;
const resultContainer = document.getElementById('result-container')!;
const gltfContainer = document.getElementById('gltf-container')!;
const submitBtn = document.getElementById('submit-btn')!;

// State variables
let currentImage: HTMLImageElement | null = null;
let points: {x: number, y: number}[] = [];
let selectedPoints: {x: number, y: number}[] = [];
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let mesh: THREE.Mesh | null = null;
let controls: THREE.OrbitControls;

// Event Listeners
dropArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropArea.classList.add('drag-over');
});

dropArea.addEventListener('dragleave', () => {
  dropArea.classList.remove('drag-over');
});

dropArea.addEventListener('drop', (e) => {
  e.preventDefault();
  dropArea.classList.remove('drag-over');
  
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    handleFile(e.dataTransfer.files[0]);
  }
});

fileElem.addEventListener('change', () => {
  if (fileElem.files && fileElem.files[0]) {
    handleFile(fileElem.files[0]);
  }
});

fileLabel.addEventListener('click', () => {
  fileElem.click();
});

imageContainer.addEventListener('click', (e) => {
  if (!currentImage) return;
  
  const rect = imageContainer.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // Scale coordinates to image dimensions
  const scaledX = (x / rect.width) * currentImage.naturalWidth;
  const scaledY = (y / rect.height) * currentImage.naturalHeight;
  
  selectedPoints.push({x: scaledX, y: scaledY});
  updatePointsDisplay();
  drawPoints();
});

imageContainer.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (!currentImage) return;
  
  const rect = imageContainer.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // Scale coordinates to image dimensions
  const scaledX = (x / rect.width) * currentImage.naturalWidth;
  const scaledY = (y / rect.height) * currentImage.naturalHeight;
  
  // Remove closest point
  const closestPoint = selectedPoints.reduce((closest, point) => {
    const distance = Math.sqrt(Math.pow(point.x - scaledX, 2) + Math.pow(point.y - scaledY, 2));
    if (distance < closest.distance) {
      return { point, distance };
    }
    return closest;
  }, { point: null, distance: Infinity });
  
  if (closestPoint.point) {
    selectedPoints = selectedPoints.filter(p => p !== closestPoint.point);
    updatePointsDisplay();
    drawPoints();
  }
});

submitBtn.addEventListener('click', processImage);

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

// Handle file upload
function handleFile(file: File) {
  if (!file.type.match('image.*')) {
    alert('Please select an image file');
    return;
  }
  
  const reader = new FileReader();
  
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      displayImage();
      selectedPoints = [];
      updatePointsDisplay();
      drawPoints();
    };
    img.src = e.target?.result as string;
  };
  
  reader.readAsDataURL(file);
}

// Display the image
function displayImage() {
  if (!currentImage) return;
  
  // Clear previous content
  imageContainer.innerHTML = '';
  previewContainer.innerHTML = '';
  
  // Create preview
  const preview = document.createElement('img');
  preview.src = currentImage.src;
  preview.style.maxWidth = '100%';
  preview.style.maxHeight = '200px';
  previewContainer.appendChild(preview);
  
  // Create image container with the image
  const imgContainer = document.createElement('div');
  imgContainer.style.position = 'relative';
  imgContainer.style.width = '100%';
  imgContainer.style.height = '400px';
  imgContainer.style.overflow = 'hidden';
  
  const img = document.createElement('img');
  img.src = currentImage.src;
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'contain';
  img.style.cursor = 'crosshair';
  
  imgContainer.appendChild(img);
  imageContainer.appendChild(imgContainer);
  
  // Add event listener to container for point selection
  imgContainer.addEventListener('click', (e) => {
    const rect = imgContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Scale coordinates to image dimensions
    const scaledX = (x / rect.width) * currentImage!.naturalWidth;
    const scaledY = (y / rect.height) * currentImage!.naturalHeight;
    
    selectedPoints.push({x: scaledX, y: scaledY});
    updatePointsDisplay();
    drawPoints();
  });
  
  imgContainer.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const rect = imgContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Scale coordinates to image dimensions
    const scaledX = (x / rect.width) * currentImage!.naturalWidth;
    const scaledY = (y / rect.height) * currentImage!.naturalHeight;
    
    // Remove closest point
    const closestPoint = selectedPoints.reduce((closest, point) => {
      const distance = Math.sqrt(Math.pow(point.x - scaledX, 2) + Math.pow(point.y - scaledY, 2));
      if (distance < closest.distance) {
        return { point, distance };
      }
      return closest;
    }, { point: null, distance: Infinity });
    
    if (closestPoint.point) {
      selectedPoints = selectedPoints.filter(p => p !== closestPoint.point);
      updatePointsDisplay();
      drawPoints();
    }
  });
}

// Update points display
function updatePointsDisplay() {
  pointsInfo.innerHTML = '';
  if (selectedPoints.length === 0) {
    pointsInfo.innerHTML = '<p>No points selected</p>';
  } else {
    pointsInfo.innerHTML = `<p>Selected points: ${selectedPoints.length}</p>`;
    const pointsList = document.createElement('ul');
    selectedPoints.forEach((point, index) => {
      const li = document.createElement('li');
      li.textContent = `Point ${index + 1}: (${Math.round(point.x)}, ${Math.round(point.y)})`;
      pointsList.appendChild(li);
    });
    pointsInfo.appendChild(pointsList);
  }
}

// Draw points on image
function drawPoints() {
  if (!currentImage || !imageContainer) return;
  
  // Remove previous points
  const existingPoints = imageContainer.querySelectorAll('.point');
  existingPoints.forEach(point => point.remove());
  
  // Draw new points
  selectedPoints.forEach((point, index) => {
    const pointElement = document.createElement('div');
    pointElement.className = 'point';
    pointElement.textContent = `${index + 1}`;
    
    // Position the point
    const rect = imageContainer.getBoundingClientRect();
    const x = (point.x / currentImage.naturalWidth) * rect.width;
    const y = (point.y / currentImage.naturalHeight) * rect.height;
    
    pointElement.style.position = 'absolute';
    pointElement.style.left = `${x}px`;
    pointElement.style.top = `${y}px`;
    pointElement.style.transform = 'translate(-50%, -50%)';
    pointElement.style.width = '20px';
    pointElement.style.height = '20px';
    pointElement.style.backgroundColor = '#ff0000';
    pointElement.style.borderRadius = '50%';
    pointElement.style.display = 'flex';
    pointElement.style.alignItems = 'center';
    pointElement.style.justifyContent = 'center';
    pointElement.style.color = 'white';
    pointElement.style.fontWeight = 'bold';
    pointElement.style.zIndex = '10';
    
    imageContainer.appendChild(pointElement);
  });
}

// Process image with background removal
function processImage() {
  if (!currentImage) {
    alert('Please upload an image first');
    return;
  }
  
  if (selectedPoints.length < 3) {
    alert('Please select at least 3 points');
    return;
  }
  
  // In a real implementation, this would use a background removal library
  // For this example, we'll simulate the result
  resultContainer.innerHTML = '<p>Background removed image would appear here</p>';
  
  // Create a canvas to simulate the result
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    canvas.width = currentImage.naturalWidth;
    canvas.height = currentImage.naturalHeight;
    
    // Draw the image
    ctx.drawImage(currentImage, 0, 0);
    
    // Simulate background removal by drawing a colored rectangle
    ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Create a preview image
    const resultImg = document.createElement('img');
    resultImg.src = canvas.toDataURL('image/png');
    resultImg.style.maxWidth = '100%';
    resultContainer.innerHTML = '';
    resultContainer.appendChild(resultImg);
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  initScene();
});