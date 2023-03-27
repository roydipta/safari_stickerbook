document.addEventListener('DOMContentLoaded', function () {
    const imageInput = document.getElementById('image-input');
    const canvas = document.getElementById('image-canvas');
    const ctx = canvas.getContext('2d');

    function resizeCanvas(image) {
        const maxWidth = window.innerWidth * 0.9;
        const maxHeight = window.innerHeight * 0.8;

        if (image.width > maxWidth || image.height > maxHeight) {
            const aspectRatio = image.width / image.height;
            if (maxWidth / maxHeight > aspectRatio) {
                canvas.width = maxHeight * aspectRatio;
                canvas.height = maxHeight;
            } else {
                canvas.width = maxWidth;
                canvas.height = maxWidth / aspectRatio;
            }
        } else {
            canvas.width = image.width;
            canvas.height = image.height;
        }
    }

    imageInput.addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            const image = new Image();
            image.src = e.target.result;

            image.onload = function () {
                resizeCanvas(image);
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            };
        };

        reader.readAsDataURL(file);
    });
});
