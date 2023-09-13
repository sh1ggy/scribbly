#!/usr/bin/env python
# coding: utf-8

# In[4]:


import warnings
warnings.filterwarnings('ignore') # to suppress some matplotlib deprecation warnings

import numpy as np # linear algebra
import pandas as pd # data processing, CSV file I/O (e.g. pd.read_csv)
import math

import matplotlib.pyplot as plt
import matplotlib.style as style



import ast
import cv2

import os
import glob
import time
import tqdm


import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader, ConcatDataset

import torchvision
from torchvision import transforms, utils
from torchvision.datasets import ImageFolder

import torch.optim as optim

from collections import OrderedDict


# In[5]:


device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

# Map the categories to a ist of classes
cats = 'categories.txt'

# Load the categories
categories = []
with open(cats) as f:
    categories = f.read().splitlines()



# In[6]:


model = torchvision.models.resnet18(pretrained=True)

def squeeze_weights(m):
        m.weight.data = m.weight.data.sum(dim=1)[:,None]
        m.in_channels = 1
        
model.conv1.apply(squeeze_weights);

# Number of classes in the dataset
num_classes = 340
# Bias is set to True since we arent using BatchNorm, default in tensorflow
model.fc = nn.Linear(in_features=512, out_features=num_classes, bias=True)


checkpoint = torch.load("./checkpoint_resnet18.pth", map_location=device) 

model.load_state_dict(checkpoint)


# This applies softmax to the output of the model going to a normalized "percentage" of each class
model.fc = nn.Sequential(OrderedDict([
          ('fc', model.fc),
          ('softmax', nn.Softmax())
        ]))


# In[7]:


def resample(x, y, spacing=1.0):
    output = []
    n = len(x)
    px = x[0]
    py = y[0]
    cumlen = 0
    pcumlen = 0
    offset = 0
    for i in range(1, n):
        cx = x[i]
        cy = y[i]
        dx = cx - px
        dy = cy - py
        curlen = math.sqrt(dx*dx + dy*dy)
        cumlen += curlen
        while offset < cumlen:
            t = (offset - pcumlen) / curlen
            invt = 1 - t
            tx = px * invt + cx * t
            ty = py * invt + cy * t
            output.append((tx, ty))
            offset += spacing
        pcumlen = cumlen
        px = cx
        py = cy
    output.append((x[-1], y[-1]))
    return output

def normalize_resample_simplify(strokes, epsilon=1.0, resample_spacing=1.0):
    if len(strokes) == 0:
        raise ValueError('empty image')

    # find min and max
    amin = None
    amax = None
    for coords in strokes:
        x,y = coords
        if len(x) == 0:
            continue

        cur_min = [np.min(x), np.min(y)]
        cur_max = [np.max(x), np.max(y)]
        amin = cur_min if amin is None else np.min([amin, cur_min], axis=0)
        amax = cur_max if amax is None else np.max([amax, cur_max], axis=0)

    # drop any drawings that are linear along one axis
    arange = np.array(amax) - np.array(amin)
    if np.min(arange) == 0:
        raise ValueError('bad range of values')

    arange = np.max(arange)
    output = []
    for x, y  in strokes:
        xy = np.array([x, y], dtype=float).T
        xy -= amin
        xy *= 255.
        xy /= arange
        resampled = resample(xy[:, 0], xy[:, 1], resample_spacing)
        simplified = simplify_coords(resampled, epsilon)
        xy = np.around(simplified).astype(np.uint8)
        output.append(xy.T.tolist())

    return output

class CustomDataset(Dataset):
    """Doodles csv dataset."""

    def __init__(self, csv_file, root_dir, nrows=1000, skiprows=None, size=256, transform=None):
        """
        Args:
            csv_file (string): Path to the csv file with annotations.
            root_dir (string): Directory with all the images.
            nrows (int): Number of rows of file to read. Useful for reading pieces of large files.
            skiprows (list-like or integer or callable): 
                    Line numbers to skip (0-indexed) or number of lines to skip (int) at the start of the file.
            size (int): Size of output image.
            transform (callable, optional): Optional transform to be applied
                on a sample.
        """
        self.root_dir = root_dir
        file = os.path.join(self.root_dir, csv_file)
        self.size = size
        self.doodle = pd.read_csv(file, usecols=['drawing', 'key_id', 'votes'], nrows=nrows, skiprows=skiprows)
        self.transform = transform

    @staticmethod
    def _draw(raw_strokes,  size=256, lw=6, time_color=True):
        BASE_SIZE = 256
        img = np.zeros((BASE_SIZE, BASE_SIZE), np.uint8)
        # Here is where the process diverges
        # raw strokes is all strokes in this image so scale all accordingly

        # remove the third dimension
        raw_strokes = [stroke[0:2] for stroke in raw_strokes]

        return normalize_resample_simplify(raw_strokes)
        
    
    def __len__(self):
        return len(self.doodle)

    def __getitem__(self, idx):
        # The ast traversal is important because it is a string being passed in 
        raw_strokes = ast.literal_eval(self.doodle.drawing[idx])
        
        label = self.doodle.key_id[idx].astype(np.int64)
        votes = self.doodle.votes[idx].astype(np.float32)
        sample = self._draw(raw_strokes, size=self.size, lw=2, time_color=True)
        if self.transform:
            sample = self.transform(sample)
        return (sample[None]/255).astype('float32'), label, votes


# In[8]:


SIZE = 224 # for matching to imagenet

# select_nrows = 0
doodles = CustomDataset("results2.csv", "D:/scribbly/server/", size=SIZE)

print('Train set:', len(doodles))
loader = DataLoader(doodles, batch_size=9, shuffle=True, num_workers=0)


# In[9]:


def imshow(img):
  # Invalid shape (1, 224, 224)
  # plt.imshow(img)
  plt.imshow(np.transpose(img, (1, 2, 0)))

plt.figure(figsize=(10, 10))
for  images, label, votes in iter(loader):
  images = images.numpy()
  label = label.numpy()
  for i in range(9):
    ax = plt.subplot(3, 3, i + 1)
    imshow(images[i,...])
    title = "%d %f" % (label[i]+1, votes[i], )
    plt.title(title)
    plt.axis("off")

