const imageUpload = document.getElementById('imageUpload');
const imageCanvas = document.getElementById('imageCanvas');
const canvasContext = imageCanvas.getContext('2d');

const canvasWidth = window.innerWidth * 0.7;

let img;
let startX, startY, endX, endY;
let drawing = false;

imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        displayImage(file);
    }
});

function displayImage(file) {
    img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
        const scaleFactor = canvasWidth / img.width;
        imageCanvas.width = canvasWidth;
        imageCanvas.height = img.height * scaleFactor;
        canvasContext.drawImage(img, 0, 0, imageCanvas.width, imageCanvas.height);
    };
}

imageCanvas.addEventListener('mousedown', (e) => {
    startX = e.clientX - imageCanvas.getBoundingClientRect().left;
    startY = e.clientY - imageCanvas.getBoundingClientRect().top;
    drawing = true;
});

imageCanvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    endX = e.clientX - imageCanvas.getBoundingClientRect().left;
    endY = e.clientY - imageCanvas.getBoundingClientRect().top;
    drawSelection();
});

imageCanvas.addEventListener('mouseup', () => {
    drawing = false;
});

function drawSelection() {
    canvasContext.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
    canvasContext.drawImage(img, 0, 0, imageCanvas.width, imageCanvas.height);
    canvasContext.strokeStyle = 'rgba(0, 0, 255, 0.7)';
    canvasContext.lineWidth = 2;
    canvasContext.strokeRect(startX, startY, endX - startX, endY - startY);

    // Add shading to the selected region
    canvasContext.fillStyle = 'rgba(0, 0, 255, 0.2)';
    canvasContext.fillRect(startX, startY, endX - startX, endY - startY);
}
