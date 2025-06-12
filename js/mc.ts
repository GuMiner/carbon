import 'htmx.org';

const container = document.getElementById('container');
  const canvas = document.getElementById('pixelCanvas');
  const ctx = canvas.getContext('2d');
  const gridSizeInput = document.getElementById('gridSize');
  const pixelSizeInput = document.getElementById('pixelSize');

  let gridSize = parseInt(gridSizeInput.value);
  let pixelSize = parseInt(pixelSizeInput.value);
  let gridData = Array(gridSize * gridSize).fill(0);

  let isDragging = false;
  let offsetX, offsetY;

  function updateCanvasSize() {
    canvas.width = gridSize * pixelSize;
    canvas.height = gridSize * pixelSize;
  }

  function drawPixel(row, col, isSet) {
    ctx.fillStyle = isSet ? 'black' : 'white';
    ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
  }

  function drawGrid() {
    gridSize = parseInt(gridSizeInput.value);
    pixelSize = parseInt(pixelSizeInput.value);
    gridData = Array(gridSize * gridSize).fill(0);
    for (let i = 0; i < gridSize * gridSize; i ++) {
        // Randomize gridData
        gridData[i] = Math.random() > 0.5 ? 1 : 0;
    }
    updateCanvasSize();

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        drawPixel(i, j, gridData[i * gridSize + j]);
      }
    }
  }

  function setPixel(row, col, value) {
    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
      gridData[row * gridSize + col] = value;
      drawPixel(row, col, value);
    }
  }

  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    canvas.style.cursor = 'grabbing';
    offsetX = e.clientX - canvas.getBoundingClientRect().left;
    offsetY = e.clientY - canvas.getBoundingClientRect().top;
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    canvas.style.cursor = 'grab';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;

    canvas.style.left = x + 'px';
    canvas.style.top = y + 'px';
    canvas.style.position = 'absolute'; // Ensure it can be positioned freely
  });

  canvas.addEventListener('click', (event) => {
    //if (isDragging) return; // Don't process clicks if dragging

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - parseFloat(canvas.style.left || 0);
    const y = event.clientY - rect.top - parseFloat(canvas.style.top || 0);

    const col = Math.floor(x / pixelSize);
    const row = Math.floor(y / pixelSize);

    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
      const index = row * gridSize + col;
      gridData[index] = gridData[index] === 0 ? 1 : 0;
      drawPixel(row, col, gridData[index]);
    }
  });

  // Initial draw
  drawGrid();

function updateImage()
{
  var map = document.getElementById("map") as HTMLImageElement;
  // TODO -- auto-update image
}

setTimeout(updateImage, 1000 * 60 * 4); // Update every four minutes