const imageUpload = document.getElementById('imageUpload');
const backgroundUpload = document.getElementById('backgroundUpload');
const downloadBtn = document.getElementById('downloadBtn');
const imageContainer = document.getElementById('imageContainer');
const stickerContainer = document.getElementById('stickerContainer');

const canvasWidth = window.innerWidth * 0.6;
const canvasHeight = window.innerHeight * 0.5;

let stage, layer, img, stickerStage, stickerLayer;
let startX, startY, endX, endY;
let drawing = false;

//sticker Stage
stickerStage = new Konva.Stage({
    container: 'stickerContainer',
    width: canvasWidth,
    height: canvasHeight,
});

//adding a layer on top of the stage
stickerLayer = new Konva.Layer();
stickerStage.add(stickerLayer);

//as soon as you upload display that image - will need to change to call Python file
imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        //new code
        img = new Image();
        let formData= new FormData();
        formData.append('image', file);
        // fetch('http://127.0.0.1:5000/process_image', {
        //     method: 'POST',
        //     body: formData
        // })
        // .then(response=> response.blob())
        // .then(blob => {
        //     const url = URL.createObjectURL(blob);
        //     img.src = url;
        //     displayImage(img);
        // })
        fetch('http://127.0.0.1:5000/process_image', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.blob();
            })
            .then(blob => {
                const url = URL.createObjectURL(blob);
                img.src = url;
                displayImage(img);
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error.message);
            });



        // old code
        // displayImage(file);
    }
});

backgroundUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        displayBackgroundImage(file);
    }
});

function displayImage(file) {
    img = new Image();
    // img.src = URL.createObjectURL(file);

    // Check if input is a File or Blob
    if (file instanceof Blob || file instanceof File) {
        img.src = URL.createObjectURL(file);
    } 
    // Check if input is an Image element
    else if (file instanceof HTMLImageElement) {
        img.src = file.src;
    }
    else {
        console.error("Invalid input to displayImage:", file);
        return;
    }

    img.onload = () => {
        const imgWidth = img.width;
        const imgHeight = img.height;

        //calculate scale to maintain aspect ratio
        let scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);

        // stage --> layer --> image
        //create a Konva Stage - here are where all the selection of the image will occur
        stage = new Konva.Stage({
            container: 'imageContainer',
            width: canvasWidth,
            height: canvasHeight,
        });

        layer = new Konva.Layer();
        stage.add(layer); 

        //adding the konva image on top of the konva layer
        const konvaImg = new Konva.Image({
            x: 0,
            y: 0,
            image: img,
            width: imgWidth * scale,
            height: imgHeight * scale,
            draggable: false,
        });
        layer.add(konvaImg);

        //use rect function in konva to create a rectangle and add it to layer
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

        //
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

function displayBackgroundImage(file) {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
        const imgWidth = img.width;
        const imgHeight = img.height;

        // maintain aspect ratio - or was looking funky
        let scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);

        const konvaImg = new Konva.Image({
            x: 0,
            y: 0,
            image: img,
            width: imgWidth * scale,
            height: imgHeight * scale,
            draggable: false,
        });

        // add the image to the stickerLayer and then draw
        stickerLayer.add(konvaImg);
        stickerLayer.draw();
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
    imageObj.src = stageToDataURL; // was not working if I put before onload
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
