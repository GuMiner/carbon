import 'htmx.org';

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
ctx.imageSmoothingEnabled= false
const image = new Image();
image.onload = () => draw();
image.src = "../static/upload/map.png"

let offsetX = 0;
let offsetY = 0;
let scale = 1;
let isDragging = false;
let lastX = 0;
let lastY = 0;

canvas.addEventListener("mousedown", (e) => {
  isDragging = true;
  lastX = e.offsetX;
  lastY = e.offsetY;
});

canvas.addEventListener("mousemove", (e) => {
  if (isDragging) {
    offsetX += e.offsetX - lastX;
    offsetY += e.offsetY - lastY;
    lastX = e.offsetX;
    lastY = e.offsetY;
    draw();
  }
});

canvas.addEventListener("mouseup", () => (isDragging = false));
canvas.addEventListener("mouseout", () => (isDragging = false));

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 1.1 : 0.9;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  offsetX = mx - (mx - offsetX) * delta;
  offsetY = my - (my - offsetY) * delta;
  scale *= delta;
  draw();
});

canvas.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    isDragging = true;
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
  }
});

canvas.addEventListener("touchmove", (e) => {
  if (e.touches.length === 1 && isDragging) {
    const touch = e.touches[0];
    offsetX += touch.clientX - lastX;
    offsetY += touch.clientY - lastY;
    lastX = touch.clientX;
    lastY = touch.clientY;
    draw();
  } else if (e.touches.length === 2) {
    isDragging = false;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if ((window as any).lastDist) {
      const scaleDelta = distance / (window as any).lastDist;
      scale *= scaleDelta;

      const rect = canvas.getBoundingClientRect();
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

      offsetX = mx - (mx - offsetX) * scaleDelta;
      offsetY = my - (my - offsetY) * scaleDelta;

      draw();
    }

    (window as any).lastDist = distance;
  }
});

canvas.addEventListener("touchend", () => {
  isDragging = false;
  (window as any).lastDist = null;
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
}



function updateImage()
{
  
  // TODO -- auto-update image
}

setTimeout(updateImage, 1000 * 60 * 4); // Update every four minutes