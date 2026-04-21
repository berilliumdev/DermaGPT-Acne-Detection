from flask import Flask, render_template, request, jsonify, send_from_directory
from ultralytics import YOLO
import cv2
import numpy as np
import base64
from PIL import Image
import io
import os

app = Flask(__name__)

FACE_MODEL_PATH = r"..\Results-for-Both-Models\Face-Segmentation-2026\runs\detect\weights\best.pt"
ACNE_MODEL_PATH = r"..\Results-for-Both-Models\Acne-Detection-2026\runs\detect\weights\best.pt"


# Load models
print("Loading models...")
face_model = YOLO(FACE_MODEL_PATH)
acne_model = YOLO(ACNE_MODEL_PATH)
print("Models loaded!")

# Region names
REGION_NAMES = {
    0: "forehead", 1: "right-eye", 2: "right-cheek",
    3: "left-eye", 4: "left-cheek", 5: "between-eyes",
    6: "nose", 7: "mouth", 8: "chin"
}

def get_severity(count):
    if count == 0: return "Healthy"
    elif count < 4: return "Mild"
    elif count < 7: return "Moderate"
    else: return "Severe"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/api/detect-acne', methods=['POST'])
def detect_acne():
    try:
        data = request.json
        image_data = data.get('image', '')
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        img_bytes = base64.b64decode(image_data)
        img = Image.open(io.BytesIO(img_bytes))
        img_cv = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        img_height, img_width = img_cv.shape[:2]
        
        # Face detection
        face_results = face_model(img_cv)
        face_regions = []
        if face_results[0].boxes:
            for box in face_results[0].boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                # Ensure coordinates are within image bounds
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(img_width, x2), min(img_height, y2)
                cid = int(box.cls[0])
                face_regions.append({
                    'name': REGION_NAMES.get(cid, f"region_{cid}"),
                    'bbox': [x1, y1, x2, y2]
                })
        
        # Acne detection
        acne_results = acne_model(img_cv, conf=0.25)
        acne_detections = []
        if acne_results[0].boxes:
            for box in acne_results[0].boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                acne_detections.append({'bbox': [x1, y1, x2, y2]})
        
        # Match acne to regions
        region_counts = {r['name']: 0 for r in face_regions}
        for acne in acne_detections:
            cx = (acne['bbox'][0] + acne['bbox'][2]) // 2
            cy = (acne['bbox'][1] + acne['bbox'][3]) // 2
            for region in face_regions:
                if (region['bbox'][0] <= cx <= region['bbox'][2] and 
                    region['bbox'][1] <= cy <= region['bbox'][3]):
                    region_counts[region['name']] += 1
                    break
        
        region_severity = {name: get_severity(count) for name, count in region_counts.items()}
        total_acne = len(acne_detections)
        overall_severity = get_severity(total_acne)
        
        # Draw full annotated image
        annotated = img_cv.copy()
        for r in face_regions:
            x1, y1, x2, y2 = r['bbox']
            cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(annotated, r['name'], (x1, y1-5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        for a in acne_detections:
            x1, y1, x2, y2 = a['bbox']
            cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 0, 255), 2)
        
        _, buffer = cv2.imencode('.jpg', annotated)
        annotated_base64 = base64.b64encode(buffer).decode('utf-8')
        
        # ============================================
        # CREATE CROPPED REGION IMAGES
        # ============================================
        region_images = []
        for region in face_regions:
            x1, y1, x2, y2 = region['bbox']
            # Crop the region
            cropped = img_cv[y1:y2, x1:x2]
            if cropped.size > 0:
                # Draw acne boxes on cropped image
                for acne in acne_detections:
                    ax1, ay1, ax2, ay2 = acne['bbox']
                    # Check if acne is within this region
                    if (ax1 >= x1 and ax2 <= x2 and ay1 >= y1 and ay2 <= y2):
                        # Adjust coordinates to cropped image
                        cx1, cy1 = ax1 - x1, ay1 - y1
                        cx2, cy2 = ax2 - x1, ay2 - y1
                        cv2.rectangle(cropped, (cx1, cy1), (cx2, cy2), (0, 0, 255), 2)
                
                # Encode cropped image
                _, cropped_buffer = cv2.imencode('.jpg', cropped)
                cropped_base64 = base64.b64encode(cropped_buffer).decode('utf-8')
                
                region_images.append({
                    'name': region['name'],
                    'image': f"data:image/jpeg;base64,{cropped_base64}",
                    'acne_count': region_counts.get(region['name'], 0),
                    'severity': region_severity.get(region['name'], 'Unknown')
                })
        
        return jsonify({
            'success': True,
            'annotated_image': f"data:image/jpeg;base64,{annotated_base64}",
            'region_images': region_images,
            'face_regions': face_regions,
            'acne_detections': acne_detections,
            'region_acne_counts': region_counts,
            'region_severity': region_severity,
            'total_acne': total_acne,
            'overall_severity': overall_severity
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/phi3-analyze', methods=['POST'])
def phi3_analyze():
    try:
        data = request.json
        total = data.get('total_acne', 0)
        severity = data.get('overall_severity', 'Unknown')
        region_sev = data.get('region_severity', {})
        
        analysis = f"📋 Dermatology Analysis Report\n\n"
        analysis += f"Total acne: {total}\n"
        analysis += f"Overall severity: {severity}\n\n"
        analysis += "Regional breakdown:\n"
        for region, sev in region_sev.items():
            analysis += f"- {region}: {sev}\n"
        
        if severity == "Healthy":
            analysis += "\nYour skin appears healthy."
        elif severity == "Mild":
            analysis += "\nMild acne detected. Consider OTC treatments."
        elif severity == "Moderate":
            analysis += "\nModerate acne detected. Consult a dermatologist."
        else:
            analysis += "\nSevere acne detected. Please consult a dermatologist."
        
        return jsonify({'success': True, 'analysis': analysis})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    print("\n🚀 Server starting at http://127.0.0.1:5000\n")
    app.run(debug=True, host='127.0.0.1', port=5000)
