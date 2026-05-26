import "../scss/gen/image-to-mesh.css";
import "./image-to-mesh/file-loader.ts"
import { setImageLoadCallback } from "./image-to-mesh/file-loader";
import "./image-to-mesh/mesh-renderer.ts"
import { removeBackground } from "@imgly/background-removal";

// DOM Elements
const imageContainer = document.getElementById('image-container')!;
const pointsInfo = document.getElementById('points-info')!;
const resultContainer = document.getElementById('result-container')!;
const submitBtn = document.getElementById('submit-btn')!;
const bgRemovalBtn = document.getElementById('remove-bg-btn')!;
const skipBgRemoval = document.getElementById('skip-bg-removal')! as HTMLInputElement;

// State variables
let currentImage: HTMLImageElement | null = null;
let selectedPoints: {x: number, y: number}[] = [];

setImageLoadCallback((image) => {
    currentImage = image;
    selectedPoints = [];

    displayImage();
    updatePointsDisplay();
    drawPoints();
});

skipBgRemoval.addEventListener('change', () => {
  if (skipBgRemoval.checked) {
    resultContainer.style.display = 'none';
  } else {
    resultContainer.style.display = 'block';
  }
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
bgRemovalBtn.addEventListener('click', removeImageBg);

// Display the image
function displayImage() {
  if (!currentImage) return;
  
  // Clear previous content
  imageContainer.innerHTML = '';
  
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

function removeImageBg() {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Set canvas dimensions to match the image
  canvas.width = currentImage.width;
  canvas.height = currentImage.height;

  // Draw the image onto the canvas
  ctx.drawImage(currentImage, 0, 0);

  // Get ImageData from the canvas
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  removeBackground(imageData).then((blob: Blob) => {
    // The result is a blob encoded as PNG. It can be converted to an URL to be used as HTMLImage.src
    const url = URL.createObjectURL(blob);
      // Create a new HTML image element and put it in 'resultContainer'
    const img = document.createElement('img');
    img.src = url;
    resultContainer.appendChild(img);
  });
}

// Process image with background removal
function processImage() {
  if (!currentImage) {
    alert('Please upload an image first');
    return;
  }

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