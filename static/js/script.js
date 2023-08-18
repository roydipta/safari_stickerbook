const imageUpload = document.getElementById('imageUpload');
const backgroundUpload = document.getElementById('backgroundUpload');
const downloadBtn = document.getElementById('downloadBtn');
const imageContainer = document.getElementById('imageContainer');
const stickerContainer = document.getElementById('stickerContainer');
const errorContainer = document.getElementById('errorContainer');


const loadingImg = new Image();
loadingImg.src = '/static/images/loading.gif'; 
// loadingImg.src = "{{ url_for('static', filename='images/loading.gif') }}";


const canvasWidth = window.innerWidth * 0.6;
const canvasHeight = window.innerHeight * 0.5;

// Add event listener for window resize
window.addEventListener('resize', adjustCanvasSize);

function adjustCanvasSize() {
    const canvasWidth = window.innerWidth * 0.6;
    const canvasHeight = window.innerHeight * 0.5;
    
    // Adjust your konva stages and layers as needed:
    stickerStage.width(canvasWidth);
    stickerStage.height(canvasHeight);
    // Do the same for the main stage if it exists
    if (stage) {
        stage.width(canvasWidth);
        stage.height(canvasHeight);
    }
}


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
        if (stage != null){
            deleteImageStage();
    }
        processFile(file);
    }
});

//this is so we can clear the stage so that the loading gif could show
function deleteImageStage(){
    stage = undefined;
    layer = undefined;
    drawing = false;
    img = undefined;
    imageContainer.innerHTML = "";
}


function processFile(file){
    if (file) {

        while (errorContainer.firstChild) {//this is for the errorDiv so we can clear the error div 
            errorContainer.removeChild(errorContainer.firstChild);
        }
        console.log(typeof file);

        imageContainer.appendChild(loadingImg);

        img = new Image();
        let formData= new FormData();
        let fetch_string;
        // formData.append('image', file);

        if (typeof file === 'string' || file instanceof String){
            formData.append('dataURL', file);
            fetch_string = '/segment_box';
            fetch(fetch_string, {
                method: 'POST',
                body: formData,
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.blob();
            })
            .then(blob => {
                // show the segment on the background image
                imageContainer.removeChild(loadingImg);
                const url = URL.createObjectURL(blob);
                img.src = url;
                // displayImage(img);
                segmentToBackgroundImage(img);
            })
            .then(
                blob => {
                    // now we want to show what we uploaded
                    const url = URL.createObjectURL(file);
                    img.src = url;
                    // displayImage(img);
                    displayImage(file);
                })
            .catch(error => {
                imageContainer.removeChild(loadingImg);
                displayImage(file);

                let errorDiv = document.createElement('errorDiv');
                errorDiv.innerHTML = "I can't quite recognize that animal yet, can you show me where it is? You can create a box around the animal";
                errorDiv.style.color = "red"; // Choose any color you like
                errorDiv.style.textAlign = "center"; // If you want the text centered
                errorContainer.appendChild(errorDiv);
            });
        }
        else{
            formData.append('image', file);

            // First, let's classify the animal
            fetch('/classify_animal', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to classify the image');
                }
                return response.text();  
            })
            .then(data => {
                console.log("Classification result:", data);
            
                if (data.startsWith("I found a ")) {
                    let textNode = document.createTextNode(data);
                    imageContainer.appendChild(textNode);
                }
                // Now, send the image for further processing
                return fetch('/process_image', {
                    method: 'POST',
                    body: formData,
                });
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.blob();
            })
            .then(blob => {
                // Show the segment on the background image
                imageContainer.removeChild(loadingImg);
                const url = URL.createObjectURL(blob);
                img.src = url;
                segmentToBackgroundImage(img);
            
                // Now display what was uploaded
                const uploadedUrl = URL.createObjectURL(file);
                img.src = uploadedUrl;
                displayImage(file);
            })
            .catch(error => {
                if (imageContainer.hasChildNodes()) {
                    imageContainer.removeChild(loadingImg);
                }
                displayImage(file);
            
                let errorDiv = document.createElement('div');
                errorDiv.innerHTML = "I can't quite recognize that animal yet, can you show me where it is? You can create a box around the animal";
                errorDiv.style.color = "red"; 
                errorDiv.style.textAlign = "center"; 
                errorContainer.appendChild(errorDiv);
            });
            
        }


        console.log(fetch_string);
        // fetch(fetch_string, {
        //         method: 'POST',
        //         body: formData,
        //     })
        //     .then(response => {
        //         if (!response.ok) {
        //             throw new Error('Network response was not ok');
        //         }
        //         return response.blob();
        //     })
        //     .then(blob => {
        //         // show the segment on the background image
        //         imageContainer.removeChild(loadingImg);
        //         const url = URL.createObjectURL(blob);
        //         img.src = url;
        //         // displayImage(img);
        //         segmentToBackgroundImage(img);
        //     })
        //     .then(
        //         blob => {
        //             // now we want to show what we uploaded
        //             const url = URL.createObjectURL(file);
        //             img.src = url;
        //             // displayImage(img);
        //             displayImage(file);
        //         })
        //     .catch(error => {
        //         imageContainer.removeChild(loadingImg);
        //         displayImage(file);

        //         let errorDiv = document.createElement('errorDiv');
        //         errorDiv.innerHTML = "I can't quite recognize that animal yet, can you show me where it is? You can create a box around the animal";
        //         errorDiv.style.color = "red"; // Choose any color you like
        //         errorDiv.style.textAlign = "center"; // If you want the text centered
        //         errorContainer.appendChild(errorDiv);
        //     });
    }
}
backgroundUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        displayBackgroundImage(file);
    }
});

function displayImage(file) {
    // return new Promise((resolve, reject) =>{
    img = new Image();
    img.src = URL.createObjectURL(file);

    // // Check if input is a File or Blob
    // if (file instanceof Blob || file instanceof File) {
    //     img.src = URL.createObjectURL(file);
    // } 
    // // Check if input is an Image element
    // else if (file instanceof HTMLImageElement) {
    //     img.src = file.src;
    // }
    // else {
    //     console.error("Invalid input to displayImage:", file);
    //     return;
    // }

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
                // segmentToBackgroundImage(rectangle);
            }
            rectangle.visible(false);
        });
    };
//     resolve('Success!');
// });//return promise
}


function displayBackgroundImage(file) {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
        const imgWidth = img.width;
        const imgHeight = img.height;

        // maintain aspect ratio - or was looking weird
        let scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);
        // let scale = 1;

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
        let scale = 1; 
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
            width: rect.width() * scale, 
            height: rect.height() * scale, 
            draggable: true,
        });
        // stickerLayer.add(stickerImage);
        // stickerLayer.draw();


        let dataURL = stickerImage.toDataURL('image/png');
        let blob = dataURLtoBlob(dataURL);  // Convert dataURL to blob or else segmentToBackgroundImage not reading!
        // segmentToBackgroundImage(blob);
        processFile(dataURL);

    };
    imageObj.src = stageToDataURL; // was not working if I put before onload

}

function dataURLtoBlob(dataurl) { //stack overflow
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}

function segmentToBackgroundImage(file) {
    const img = new Image();

    if (file instanceof Blob || file instanceof File) {
        img.src = URL.createObjectURL(file);
    } 
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

        let scale = 0.5; //maybe change? because it looks like losing clarity when bounding box

        const konvaImg = new Konva.Image({
            x: 0,
            y: 0,
            image: img,
            width: imgWidth * scale,
            height: imgHeight * scale,
            draggable: true,
        });

        stickerLayer.add(konvaImg);
        //creating a transformer that will let us resize the image
        const transformer = new Konva.Transformer({
            node: konvaImg,
            enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
            rotateAnchorOffset: 0,
            rotationSnaps: [0, 90, 180, 270],
            visible: false 
        });

        stickerLayer.add(transformer);

        // Show the transformer when the image is clicked
        konvaImg.on('click', (e) => {
            e.cancelBubble = true;//important cause it will allow us to not click immediately - so someone really need to actually want to click on it
            transformer.visible(true);
            transformer.nodes([konvaImg]);
            stickerLayer.draw();
        });

        // Hide transformer if you click outside the image
        stickerLayer.getStage().on('click', (e) => {
            if (e.target === konvaImg) {
                return; // Don't hide if the image itself was clicked
            }
            transformer.visible(false);
            stickerLayer.draw();
        });

        stickerLayer.draw();
    };
}


downloadBtn.addEventListener('click', () => {
    let link = document.createElement('a');
    link.download = 'stickerCanvas.png';
    link.href = stickerStage.toDataURL({ pixelRatio: 5 });
    link.click();
});

window.addEventListener('beforeunload', function (e) {
    e.preventDefault();
    e.returnValue = '';
});
