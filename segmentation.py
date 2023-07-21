# I need to incorporate all this python to the app.py

import numpy as np
import torch
import matplotlib.pyplot as plt
import cv2
import sys
from ultralytics import YOLO
import pickle
import matplotlib
# matplotlib.use('TkAgg')
# %matplotlib notebook
# %matplotlib inline
from segment_anything import sam_model_registry, SamPredictor

#https://github.com/facebookresearch/segment-anything/blob/main/notebooks/onnx_model_example.ipynb
def show_mask(mask, ax):
    color = np.array([30/255, 144/255, 255/255, 0.6])
    h, w = mask.shape[-2:]
    mask_image = mask.reshape(h, w, 1) * color.reshape(1, 1, -1)
    ax.imshow(mask_image)
    
def show_points(coords, labels, ax, marker_size=375):
    pos_points = coords[labels==1]
    neg_points = coords[labels==0]
    ax.scatter(pos_points[:, 0], pos_points[:, 1], color='green', marker='*', s=marker_size, edgecolor='white', linewidth=1.25)
    ax.scatter(neg_points[:, 0], neg_points[:, 1], color='red', marker='*', s=marker_size, edgecolor='white', linewidth=1.25)   
    
def show_box(box, ax):
    x0, y0 = box[0], box[1]
    w, h = box[2] - box[0], box[3] - box[1]
    ax.add_patch(plt.Rectangle((x0, y0), w, h, edgecolor='green', facecolor=(0,0,0,0), lw=2))   

model = YOLO('./Model Training/yolov8n.pt')

def segment(image):
    
    objects = model(image, save = False, classes=[15, 16])
    
    if len(objects[0].boxes.cls) > 0 and int(objects[0].boxes.cls[0]) in (15, 16):
        sam_checkpoint = './Model Training/sam_vit_h_4b8939.pth'

        model_type = 'vit_h'
        device = 'cpu' #can use cpu, mps, or cuda - looks like cpu works fastest on m2

        sam = sam_model_registry[model_type](checkpoint=sam_checkpoint)
        sam.to(device=device)

        predictor = SamPredictor(sam)
        predictor.set_image(image)
        input_box = np.array(objects[0].boxes.data[0][:4].tolist())

        masks, _, _ = predictor.predict(point_coords=None, point_labels=None,
                                   box = input_box[None,:],
                                   multimask_output = False,)
        
        return masks[0]
    
    else:
        print('Not an Animal that I recognize')

def cutout(image, mask):
    original_image = image
    mask = mask
    binary_mask = mask #mask is already in 0's and 1's so no need to convert

    original_image_rgba = cv2.cvtColor(original_image, cv2.COLOR_BGR2RGBA) #to introduce a alpha channel

    # mask the alpha channel to make non-mask parts transparent
    original_image_rgba[:, :, 3] = binary_mask * 255

    return original_image_rgba
