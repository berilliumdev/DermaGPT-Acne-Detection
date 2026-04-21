# DermaGPT - AI-Powered Acne Detection & Analysis

## Overview
DermaGPT is a deep learning-based system for precise facial acne detection and analysis, using YOLO object detection to segment faces into 9 anatomical regions and detect acne lesions.

## Features
- **9 Region Face Segmentation**: Forehead, eyes, cheeks, nose, mouth, chin, between-eyes
- **Acne Lesion Detection**: Identifies individual acne lesions with bounding boxes
- **Per-Region Severity**: Healthy / Mild / Moderate / Severe
- **Live Webcam Capture**: Real-time analysis
- **AI Reports**: Automated dermatology analysis

## Tech Stack
- Backend: Flask (Python)
- Models: YOLOv26
- Frontend: HTML5, CSS3, JavaScript (ES6)
- Computer Vision: OpenCV

## Installation

### Prerequisites
- Python 3.8 or higher
- pip package manager