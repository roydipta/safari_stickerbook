from flask import Flask, request, send_file
from PIL import Image
import numpy as np
import io
import segmentation
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
ALLOWED_EXTENSIONS = set(['jpg', 'jpeg', 'png'])

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

@app.route('/process_image', methods=['POST'])
def process_image():

    # file = request.files['image']
    # image = Image.open(file.stream) 
    # image_np = np.array(image)  
    # return image
    
    file = request.files['image']
    if not file or not allowed_file(file.filename):
        return "Invalid file type", 400
    image = Image.open(file.stream)
    image_np = np.array(image)   
    
    # byte_io = io.BytesIO()
    # image.save(byte_io, 'PNG')
    # byte_io.seek(0)
    # print(byte_io)
    # return send_file(byte_io, mimetype='image/png')


    mask = segmentation.segment(image_np)
    processed_image_np = segmentation.cutout(image_np, mask)
    
    # Convert numpy image back to PIL image
    processed_image = Image.fromarray(processed_image_np)
    
    # Save image to a BytesIO object
    byte_io = io.BytesIO()
    processed_image.save(byte_io, 'PNG')
    byte_io.seek(0)
    
    # Return image file
    return send_file(byte_io, mimetype='image/png')

if __name__ == "__main__":
    app.run()
