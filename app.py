from flask import Flask, request, send_file, render_template
from PIL import Image
import numpy as np
import io
from ultralytics import YOLO
import boto3
import torch
from segment_anything import sam_model_registry, SamPredictor
import cv2
from flask_cors import CORS
import base64
import os
import requests

app = Flask(__name__)
# CORS(app)
ALLOWED_EXTENSIONS = set(['jpg', 'jpeg', 'png'])

model = YOLO('./Model Training/yolov8n.pt')
# sam_checkpoint = './Model Training/sam_vit_h_4b8939.pth'
# model_type = 'vit_h'

# sam_checkpoint = './Model Training/sam_vit_b_01ec64.pth'
# model_type = 'vit_b'
# device = 'cpu' #can use cpu, mps, or cuda - looks like cpu works fastest on m2

# sam = sam_model_registry[model_type](checkpoint=sam_checkpoint)
# sam.to(device=device)

# predictor = SamPredictor(sam)



#get from aws
BUCKET_NAME = 'sam-pth-capstone'
# MODEL_FILE_NAME = 'sam_vit_l_0b3195.pth'
MODEL_FILE_NAME = 'sam_vit_b_01ec64.pth'
file_path = 'sam_vit_b_01ec64.pth'

def load_model():
    if not os.path.exists(file_path):
        url = "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth"
        response = requests.get(url, stream=True)
        local_path = "sam_vit_b_01ec64.pth"
        with open(local_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192): 
                f.write(chunk)
    #     s3.download_file(BUCKET_NAME, 'sam_vit_b_01ec64.pth', file_path)
        # obj = s3.get_object(Bucket=BUCKET_NAME, Key=MODEL_FILE_NAME)
        # sam_pth = obj['Body'].read()


    # model_type = 'vit_l'
    model_type = 'vit_b'
    # device = 'cpu' #can use cpu, mps, or cuda - looks like cpu works fastest on m2
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    sam_checkpoint = file_path
    sam = sam_model_registry[model_type](checkpoint=sam_checkpoint)
    sam.to(device=device)

    predictor = SamPredictor(sam)
    
    return predictor

predictor = load_model()



def segment(image, model, predictor):
    
    objects = model(image, save = False, classes=[14,15,16,17,18,19,20,21,22,23])
    
    if len(objects[0].boxes.cls) > 0 and int(objects[0].boxes.cls[0]) in (14,15,16,17,18,19,20,21,22,23):
        predictor.set_image(image)
        input_box = np.array(objects[0].boxes.data[0][:4].tolist())

        masks, _, _ = predictor.predict(point_coords=None, point_labels=None,
                                   box = input_box[None,:],
                                   multimask_output = False,)
        
        return masks[0]
    
    else:
        return('Not an Animal that I recognize')

def cutout(image, mask):
    original_image = image
    mask = mask
    binary_mask = mask #mask is already in 0's and 1's so no need to convert

    original_image_rgba = cv2.cvtColor(original_image, cv2.COLOR_RGB2RGBA) #to introduce a alpha channel but since javascript sends it as RGB instead of GBA you need to use RGB2RGBA

    # mask the alpha channel to make non-mask parts transparent
    original_image_rgba[:, :, 3] = binary_mask * 255

    return original_image_rgba


def segment_box_process(image, model, predictor):

    predictor.set_image(image)
    middle_y, middle_x = image.shape[0] // 2, image.shape[1] // 2
    points = np.array([middle_y, middle_x])
    point_label = np.ndarray([1])

    masks, scores, _ = predictor.predict(point_coords=points[None,:], point_labels=point_label[:],
                                multimask_output = True,)
    
    # masks, scores, _ = predictor.predict(point_coords=None, point_labels=None,
    #                             multimask_output = True,)

    original_image = image
    max_score_index = np.argmax(scores)
    mask = masks[max_score_index]

    binary_mask = mask #mask is already in 0's and 1's so no need to convert

    original_image_rgba = cv2.cvtColor(original_image, cv2.COLOR_RGB2RGBA) #to introduce a alpha channel but since javascript sends it as RGB instead of GBA you need to use RGB2RGBA

    # mask the alpha channel to make non-mask parts transparent
    original_image_rgba[:, :, 3] = binary_mask * 255

    return original_image_rgba




def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/classify_animal', methods=['POST'])
def classify():
    file = request.files['image']
    if not file or not allowed_file(file.filename):
        return "Invalid file type", 400
    image = Image.open(file.stream)

    image_np = np.array(image)   

    objects = model(image_np, save = False, classes=[14,15,16,17,18,19,20,21,22,23])
    
    if len(objects[0].boxes.cls) > 0 and int(objects[0].boxes.cls[0]) in (14,15,16,17,18,19,20,21,22,23):
        index_classifier = int(objects[0].boxes.cls[0])
        classifiers =  {14: 'bird', 
        15: 'cat', 
        16: 'dog', 
        17: 'horse', 
        18: 'sheep', 
        19: 'cow', 
        20: 'elephant', 
        21: 'bear', 
        22: 'zebra', 
        23: 'giraffe'}

        print_class = 'I found a ' + classifiers[index_classifier] + '. Wait while I try to segment it for you!'
        return print_class
    
    else:
        return('Not an Animal that I recognize')


@app.route('/process_image', methods=['POST'])
def process_image():

    # USE THIS!
    file = request.files['image']
    if not file or not allowed_file(file.filename):
        return "Invalid file type", 400
    image = Image.open(file.stream)

    image_np = np.array(image)   

    mask = segment(image_np, model, predictor)
    processed_image_np = cutout(image_np, mask)
    
    processed_image = Image.fromarray(processed_image_np)
    
    byte_io = io.BytesIO()
    processed_image.save(byte_io, 'PNG')
    byte_io.seek(0)
    
    return send_file(byte_io, mimetype='image/png')

@app.route('/segment_box', methods=['POST'])
def segment_box():
    # file = request.files['image']
    data_url = request.form['dataURL']

    mime, data_string = data_url.split(';base64,')
    data = base64.b64decode(data_string)
    image = Image.open(io.BytesIO(data)).convert('RGB')

    image_np = np.array(image)

    image_cutout_np = segment_box_process(image_np, model, predictor)
    image_cutout = Image.fromarray(image_cutout_np)

    byte_io = io.BytesIO()
    image_cutout.save(byte_io, 'PNG')
    byte_io.seek(0)

    return send_file(byte_io, mimetype='image/png')



if __name__ == "__main__":
    app.run()
