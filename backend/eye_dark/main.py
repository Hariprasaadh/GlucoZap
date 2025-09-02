from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from PIL import Image
import io
import os
import numpy as np
from typing import Dict, Any
import uvicorn
from ultralytics import YOLO
import cv2
from datetime import datetime
import logging
import uuid
import base64

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global model variable
model = None

# Config
CONFIDENCE_THRESHOLD = 0.5
IMAGE_SIZE = 640

# Static files directory
STATIC_DIR = "static"

# Store images temporarily in memory
image_store = {}

# Ensure static dir exists before mounting
if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR)

# Mount static directory


MODEL_PATHS = [
    "../../ml/eye_dark_circles/runs/detect/dark_circles_yolov11/weights/best.pt",
    "../eye_dark_circles/runs/detect/dark_circles_yolov11/weights/best.pt",
    "runs/detect/dark_circles_yolov11/weights/best.pt",
    "../../ml/eye_dark_circles/yolo11s.pt",
    "yolo11s.pt"
]

def find_model_path():
    """Find available model path"""
    for path in MODEL_PATHS:
        if os.path.exists(path):
            logger.info(f"✓ Found model: {path}")
            return path
    logger.warning("No trained model found")
    return None

def load_model():
    """Load trained model or fallback to pretrained"""
    global model
    model_path = find_model_path()

    if model_path:
        try:
            logger.info(f"Loading custom model: {model_path}")
            model = YOLO(model_path)
            logger.info("✓ Custom model loaded successfully")
            return
        except Exception as e:
            logger.error(f"Error loading custom model: {e}")

    # fallback to pretrained
    for name in ['yolo11n.pt', 'yolov8n.pt', 'yolo11s.pt']:
        try:
            logger.info(f"Loading pretrained model: {name}")
            model = YOLO(name)
            logger.info(f"✓ Pretrained model {name} loaded successfully")
            return
        except Exception as e:
            logger.warning(f"Failed: {name} → {e}")

    raise RuntimeError("No valid YOLO model could be loaded")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup & shutdown events"""
    logger.info("Starting Dark Circles Detection API...")
    if not os.path.exists(STATIC_DIR):
        os.makedirs(STATIC_DIR)
    load_model()
    yield
    logger.info("Shutting down Dark Circles Detection API...")

app = FastAPI(
    title="Dark Circles Detection API",
    description="YOLOv11-powered dark circles detection",
    version="1.0.0",
    lifespan=lifespan
)

# Mount static directory
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def validate_image(image: Image.Image) -> bool:
    """Validate uploaded image"""
    try:
        if image.format not in ['JPEG', 'PNG', 'JPG', 'WEBP']:
            return False
        if len(image.tobytes()) > 20 * 1024 * 1024:
            return False
        w, h = image.size
        return 50 <= w <= 4000 and 50 <= h <= 4000
    except:
        return False

def save_image(image: Image.Image, filename: str) -> str:
    """Save image to static directory"""
    if image.mode == 'RGBA':
        image = image.convert('RGB')
    filepath = os.path.join(STATIC_DIR, filename)
    image.save(filepath, format="JPEG", quality=95)
    return f"/static/{filename}"

def image_to_base64(image_array: np.ndarray) -> str:
    """Convert numpy array to base64 string"""
    try:
        # Ensure the image is in the correct format
        if image_array.dtype != np.uint8:
            image_array = (image_array * 255).astype(np.uint8)
        
        # Convert to PIL Image
        pil_image = Image.fromarray(image_array)
        
        # Convert to base64
        buffer = io.BytesIO()
        pil_image.save(buffer, format='PNG')
        image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return f"data:image/png;base64,{image_base64}"
    except Exception as e:
        logger.error(f"Error converting image to base64: {e}")
        return None

def predict_dark_circles(image: Image.Image, filename: str) -> Dict[str, Any]:
    """Run YOLO detection and return bounding boxes with confidence"""
    results = model.predict(image, conf=CONFIDENCE_THRESHOLD, imgsz=IMAGE_SIZE)

    detections = []
    annotated_image = np.array(image)

    for result in results:
        if hasattr(result, 'boxes') and len(result.boxes) > 0:
            # Start with original image
            annotated_image = np.array(image)
            
            for i, box in enumerate(result.boxes):
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                coords = box.xyxy[0].tolist()
                class_name = model.names.get(cls, f"class_{cls}")

                # Draw bounding box manually with only confidence score
                x1, y1, x2, y2 = int(coords[0]), int(coords[1]), int(coords[2]), int(coords[3])
                
                # Draw rectangle
                cv2.rectangle(annotated_image, (x1, y1), (x2, y2), (0, 255, 0), 2)
                
                # Draw only confidence score (no class label)
                label = f"{conf:.2f}"
                label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
                
                # Draw label background
                cv2.rectangle(annotated_image, 
                            (x1, y1 - label_size[1] - 10), 
                            (x1 + label_size[0], y1), 
                            (0, 255, 0), -1)
                
                # Draw confidence text
                cv2.putText(annotated_image, label, 
                          (x1, y1 - 5), 
                          cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)

                detections.append({
                    "detection_id": i + 1,
                    "class": class_name,
                    "confidence": round(conf, 4),
                    "bounding_box": {
                        "x1": round(coords[0], 2),
                        "y1": round(coords[1], 2),
                        "x2": round(coords[2], 2),
                        "y2": round(coords[3], 2)
                    }
                })

    return {
        "detection_count": len(detections),
        "detections": detections,
        "annotated_image": annotated_image,
        "has_dark_circles": len(detections) > 0
    }


@app.get("/")
async def root():
    return {
        "message": "Dark Circles Detection API",
        "version": "1.0.0",
        "endpoints": ["/detect", "/health", "/model-info"]
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model_type": type(model).__name__,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/model-info")
async def model_info():
    return {
        "model_loaded": model is not None,
        "model_type": type(model).__name__,
        "classes": getattr(model, 'names', {}),
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "image_size": IMAGE_SIZE
    }

@app.post("/detect")
async def detect_dark_circles(file: UploadFile = File(...)):
    """Detect dark circles in uploaded image and return annotated image"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_data = await file.read()
    try:
        image = Image.open(io.BytesIO(image_data))
    except:
        raise HTTPException(status_code=400, detail="Invalid image file")

    if not validate_image(image):
        raise HTTPException(status_code=400, detail="Image validation failed")

    filename = f"{uuid.uuid4()}_{file.filename}"
    if image.mode == 'RGBA':
        image = image.convert('RGB')

    # Run prediction
    prediction_result = predict_dark_circles(image, filename)
    
    # Convert annotated image to PIL and then to bytes
    annotated_image = prediction_result["annotated_image"]
    annotated_pil = Image.fromarray(annotated_image)
    
    # Convert image to byte stream
    buf = io.BytesIO()
    annotated_pil.save(buf, format="JPEG")
    buf.seek(0)
    
    # Prepare detection data for headers
    detection_data = {
        "status": "success",
        "filename": file.filename,
        "detection_count": prediction_result["detection_count"],
        "has_dark_circles": prediction_result["has_dark_circles"],
        "detections": prediction_result["detections"],
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "image_size": f"{image.size[0]}x{image.size[1]}",
        "model_type": type(model).__name__
    }
    
    return StreamingResponse(
        buf, 
        media_type="image/jpeg",
        headers={
            "detections": str(detection_data),
            "Content-Disposition": f"inline; filename=annotated_{file.filename}"
        }
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="localhost", port=8000, reload=True, log_level="info")
