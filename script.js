const imageUpload = document.getElementById('imageUpload');
const downloadBtn = document.getElementById('downloadBtn');
const imageContainer = document.getElementById('imageContainer');
const stickerContainer = document.getElementById('stickerContainer');

const canvasWidth = window.innerWidth * 0.6;
const canvasHeight = window.innerHeight * 0.5;

let stage, layer, img, stickerStage, stickerLayer;
let startX, startY, endX, endY;
let drawing = false;

// Create a static Sticker Stage
stickerStage = new Konva.Stage({
    container: 'stickerContainer',
    width: canvasWidth,
    height: canvasHeight,
});

stickerLayer = new Konva.Layer();
stickerStage.add(stickerLayer);

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
        const imgWidth = img.width;
        const imgHeight = img.height;

        // Calculate scale to maintain aspect ratio
        let scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);

        // Create a Konva Stage
        stage = new Konva.Stage({
            container: 'imageContainer',
            width: canvasWidth,
            height: canvasHeight,
        });

        layer = new Konva.Layer();
        stage.add(layer);

        const konvaImg = new Konva.Image({
            x: 0,
            y: 0,
            image: img,
            width: imgWidth * scale,
            height: imgHeight * scale,
            draggable: false,
        });
        layer.add(konvaImg);

        // Create a rectangle for selection
        const rectangle = new Konva.Rect({
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            stroke: 'blue',
            strokeWidth: 2,
            dash: [10, 10],
            visible: false,
        });
        layer.add(rectangle);

        stage.on('mousedown', function (e) {
            if (e.target === konvaImg) {
                const pos = stage.getPointerPosition();
                startX = pos.x;
                startY = pos.y;
                rectangle.visible(true);
                rectangle.width(0);
                rectangle.height(0);
            }
            drawing = true;
        });

        stage.on('mousemove', function () {
            if (!drawing) return;
            const pos = stage.getPointerPosition();
            rectangle.setAttrs({
                x: Math.min(pos.x, startX),
                y: Math.min(pos.y, startY),
                width: Math.abs(pos.x - startX),
                height: Math.abs(pos.y - startY),
            });
            layer.batchDraw();
        });

        stage.on('mouseup', function () {
            if (!drawing) return;
            drawing = false;
            if (rectangle.width() !== 0 && rectangle.height() !== 0) {
                copyToStickerCanvas(rectangle);
            }
            rectangle.visible(false);
        });
    };
}

function copyToStickerCanvas(rect) {
    const stageToDataURL = stage.toDataURL();
    let imageObj = new Image();
    imageObj.onload = function () {
        let scale = 0.3; // set scale to 30%
        let stickerImage = new Konva.Image({
            x: 0,
            y: 0,
            image: imageObj,
            crop: {
                x: rect.x(),
                y: rect.y(),
                width: rect.width(),
                height: rect.height(),
            },
            width: rect.width() * scale, // set the width to be 30% of the original width
            height: rect.height() * scale, // set the height to be 30% of the original height
            draggable: true,
        });
        stickerLayer.add(stickerImage);
        stickerLayer.draw();
    };
    imageObj.src = stageToDataURL;
}


downloadBtn.addEventListener('click', () => {
    let link = document.createElement('a');
    link.download = 'stickerCanvas.png';
    link.href = stickerStage.toDataURL();
    link.click();
});

window.addEventListener('beforeunload', function (e) {
    e.preventDefault();
    e.returnValue = '';
});