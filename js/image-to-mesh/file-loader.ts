const dropArea = document.getElementById('drop-area')!;
const fileElem = document.getElementById('fileElem') as HTMLInputElement;
const fileLabel = document.querySelector('.file-label')!;

let imageLoadCallback: ((img: HTMLImageElement) => void) | null = null;

// Function to set the callback
export function setImageLoadCallback(callback: (img: HTMLImageElement) => void) {
  imageLoadCallback = callback;
}

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
        imageLoadCallback(img);
    };
    img.src = e.target?.result as string;
  };
  
  reader.readAsDataURL(file);
}