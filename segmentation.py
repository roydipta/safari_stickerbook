import numpy as np
import torch
import cv2
from ultralytics import YOLO
import boto3
from segment_anything import sam_model_registry, SamPredictor

#https://github.com/facebookresearch/segment-anything/blob/main/notebooks/onnx_model_example.ipynb

# model = YOLO('./Model Training/yolov8n.pt')
# sam_checkpoint = './Model Training/sam_vit_h_4b8939.pth'

# s3 = boto3.client('s3',
#                     aws_access_key_id = 'AKIAY4EAL4LP5TJGF6UZ',
#                     aws_secret_access_key = '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'
#                 )
                
# BUCKET_NAME = 'sam-pth-capstone'
# MODEL_FILE_NAME = 'sam_vit_h_4b8939.pth'

# def load_model():
#     obj = s3.get_object(Bucket=BUCKET_NAME, Key=MODEL_FILE_NAME)
#     bytestream = obj['Body'].read()
    
#     # Load your model here
#     model = torch.nn.Module()  # Replace with your model class
#     model.load_state_dict(torch.load(bytestream))
#     model.eval()  # Set to evaluation mode
#     return model

# sam_checkpoint = load_model()

def segment(image, model, predictor):
    
    objects = model(image, save = False, classes=[15, 16])
    
    if len(objects[0].boxes.cls) > 0 and int(objects[0].boxes.cls[0]) in (15, 16):
        # sam_checkpoint = './Model Training/sam_vit_h_4b8939.pth'

        # model_type = 'vit_h'
        # # model_type = 'vit_b'
        # device = 'cpu' #can use cpu, mps, or cuda - looks like cpu works fastest on m2

        # sam = sam_model_registry[model_type](checkpoint=sam_checkpoint)
        # sam.to(device=device)

        # predictor = SamPredictor(sam)
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


def segment_box(image, model, predictor):
    # sam_checkpoint = './Model Training/sam_vit_h_4b8939.pth'

    # model_type = 'vit_h'
    # # model_type = 'vit_b'

    # device = 'cpu' #can use cpu, mps, or cuda - looks like cpu works fastest on m2

    # sam = sam_model_registry[model_type](checkpoint=sam_checkpoint)
    # sam.to(device=device)

    # predictor = SamPredictor(sam)
    predictor.set_image(image)
    # input_box = np.array(objects[0].boxes.data[0][:4].tolist())

    masks, scores, _ = predictor.predict(point_coords=None, point_labels=None,
                                multimask_output = True,)
    
    original_image = image
    max_score_index = np.argmax(scores)
    mask = masks[max_score_index]

    binary_mask = mask #mask is already in 0's and 1's so no need to convert

    original_image_rgba = cv2.cvtColor(original_image, cv2.COLOR_RGB2RGBA) #to introduce a alpha channel but since javascript sends it as RGB instead of GBA you need to use RGB2RGBA

    # mask the alpha channel to make non-mask parts transparent
    original_image_rgba[:, :, 3] = binary_mask * 255

    return original_image_rgba
