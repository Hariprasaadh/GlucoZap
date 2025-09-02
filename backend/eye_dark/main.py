from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from PIL import Image
import io
import os
import numpy as np
from typing import Dict, Any, List
import uvicorn
from ultralytics import YOLO
import cv2
import torch
from datetime import datetime
import logging
import uuid
import shutil

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global model variable
model = None

# Model configuration
CONFIDENCE_THRESHOLD = 0.5
IMAGE_SIZE = 640

# Model paths to search for
MODEL_PATHS = [
    "../../ml/eye_dark_circles/runs/detect/dark_circles_yolov11/weights/best.pt",
    "../eye_dark_circles/runs/detect/dark_circles_yolov11/weights/best.pt",
    "runs/detect/dark_circles_yolov11/weights/best.pt",
    "../../ml/eye_dark_circles/yolo11s.pt",
    "yolo11s.pt"
]

# Static directory for serving images
STATIC_DIR = "static"
os.makedirs(STATIC_DIR, exist_ok=True)

class MockModel:
    """Mock model for testing when real model loading fails"""
    def __init__(self):
        self.names = {0: "dark_circles"}
    
    def predict(self, image, **kwargs):
        """Mock prediction that returns random results for testing"""
        import random
        
        class MockResults:
            def __init__(self):
                self.boxes = MockBoxes()
            
            def plot(self):
                # Return the original image as numpy array
                if isinstance(image, str):
                    img = cv2.imread(image)
                    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                elif isinstance(image, Image.Image):
                    return np.array(image)
                else:
                    return np.array(image)
        
        class MockBoxes:
            def __init__(self):
                # Simulate detection with random confidence
                if random.random() > 0.3:  # 70% chance of detection
                    self.cls = [torch.tensor([0])]
                    self.conf = [torch.tensor([random.uniform(0.5, 0.9)])]
                    self.xyxy = [torch.tensor([[100, 100, 200, 150]])]
                else:
                    self.cls = []
                    self.conf = []
                    self.xyxy = []
        
        return [MockResults()]

def find_model_path():
    """Find the best available dark circles model path"""
    logger.info("Searching for trained dark circles model...")
    for path in MODEL_PATHS:
        if os.path.exists(path):
            logger.info(f"✓ Found dark circles model at: {path}")
            return path
        else:
            logger.debug(f"✗ Not found: {path}")
    
    logger.warning("No trained dark circles model found")
    return None

def load_model():
    """Load the trained dark circles detection model with fallback methods"""
    global model
    
    model_path = find_model_path()
    
    if model_path:
        try:
            logger.info(f"Loading dark circles model from: {model_path}")
            model = YOLO(model_path)
            logger.info("✓ Custom dark circles model loaded successfully!")
            return
        except Exception as e:
            logger.error(f"Error with custom dark circles model: {e}")
    
    # Fallback to pretrained detection model
    try:
        logger.info("Loading pretrained detection model...")
        model_names = ['yolo11n.pt', 'yolov8n.pt', 'yolo11s.pt']
        
        for model_name in model_names:
            try:
                logger.info(f"Attempting to load {model_name}...")
                model = YOLO(model_name)
                logger.info(f"✓ Pretrained model {model_name} loaded successfully!")
                logger.warning("⚠️ Note: Using general detection, not specifically trained for dark circles")
                return
            except Exception as e:
                logger.warning(f"Failed to load {model_name}: {e}")
                continue
        
        logger.warning("All model loading attempts failed. Creating mock model for testing...")
        model = MockModel()
        logger.info("✓ Mock model created for testing purposes")
        
    except Exception as e:
        logger.error(f"✗ Failed to load any model: {e}")
        model = MockModel()
        logger.info("Using mock model for testing")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    logger.info("Starting Dark Circles Detection API...")
    load_model()
    yield
    logger.info("Shutting down Dark Circles Detection API...")
    if os.path.exists(STATIC_DIR):
        shutil.rmtree(STATIC_DIR)
        logger.info("Cleaned up static directory")

app = FastAPI(
    title="Dark Circles Detection API",
    description="AI-powered dark circles detection using YOLOv11 detection model",
    version="1.0.0",
    lifespan=lifespan
)

# Mount static directory
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly in production
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
        width, height = image.size
        if width > 4000 or height > 4000 or width < 50 or height < 50:
            return False
        return True
    except Exception as e:
        logger.error(f"Image validation error: {e}")
        return False

def preprocess_image(image: Image.Image) -> np.ndarray:
    """Preprocess image for model inference"""
    try:
        if image.mode != 'RGB':
            logger.info(f"Converting image from mode {image.mode} to RGB")
            image = image.convert('RGB')
        image_array = np.array(image)
        return image_array
    except Exception as e:
        logger.error(f"Image preprocessing error: {e}")
        return None

def save_image(image: Image.Image, filename: str) -> str:
    """Save image to static directory and return its URL"""
    try:
        # Convert RGBA to RGB if necessary
        if image.mode == 'RGBA':
            logger.info(f"Converting RGBA image to RGB for JPEG saving")
            image = image.convert('RGB')
        
        filepath = os.path.join(STATIC_DIR, filename)
        image.save(filepath, format="JPEG", quality=95)  # Use quality=95 for better JPEG output
        logger.info(f"Saved image to {filepath}")
        return f"/static/{filename}"
    except Exception as e:
        logger.error(f"Error saving image {filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save image: {str(e)}")

def predict_dark_circles(image: Image.Image, filename: str) -> Dict[str, Any]:
    """Predict dark circles from an image"""
    try:
        results = model.predict(image, conf=CONFIDENCE_THRESHOLD, imgsz=IMAGE_SIZE)
        
        detections = []
        annotated_image = np.array(image)
        
        for result in results:
            if hasattr(result, 'boxes') and len(result.boxes) > 0:
                annotated_image = result.plot()
                if len(annotated_image.shape) == 3:
                    # Ensure annotated image is in RGB
                    annotated_image = cv2.cvtColor(annotated_image, cv2.COLOR_BGR2RGB)
                else:
                    logger.warning("Annotated image has unexpected shape, using original image")
                
                for i, box in enumerate(result.boxes):
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    coords = box.xyxy[0].tolist()
                    class_name = model.names.get(cls, f"class_{cls}")
                    
                    detections.append({
                        "detection_id": i + 1,
                        "class": class_name,
                        "confidence": round(conf, 4),
                        "bounding_box": {
                            "x1": round(coords[0], 2),
                            "y1": round(coords[1], 2),
                            "x2": round(coords[2], 2),
                            "y2": round(coords[3], 2),
                            "width": round(coords[2] - coords[0], 2),
                            "height": round(coords[3] - coords[1], 2)
                        }
                    })
        
        # Convert annotated image to PIL and ensure RGB
        annotated_pil = Image.fromarray(annotated_image)
        if annotated_pil.mode == 'RGBA':
            logger.info("Converting annotated image from RGBA to RGB")
            annotated_pil = annotated_pil.convert('RGB')
        
        annotated_url = save_image(annotated_pil, f"annotated_{filename}")
        
        return {
            "detection_count": len(detections),
            "detections": detections,
            "annotated_image_url": annotated_url,
            "has_dark_circles": len(detections) > 0
        }
        
    except Exception as e:
        logger.error(f"Error during prediction: {e}")
        # Save original image as fallback for annotated image
        if image.mode == 'RGBA':
            image = image.convert('RGB')
        annotated_url = save_image(image, f"annotated_{filename}")
        return {
            "detection_count": 0,
            "detections": [],
            "annotated_image_url": annotated_url,
            "has_dark_circles": False,
            "error": str(e)
        }

def generate_health_recommendations(has_dark_circles: bool, detection_count: int) -> List[str]:
    """Generate health recommendations based on detection results"""
    recommendations = []
    if has_dark_circles:
        recommendations.extend([
            "🛌 Ensure you get 7-9 hours of quality sleep each night",
            "💧 Stay well-hydrated by drinking plenty of water throughout the day",
            "🥗 Maintain a balanced diet rich in vitamins C, E, and K",
            "😎 Use sunscreen and sunglasses to protect the delicate eye area",
            "🧴 Consider using eye creams with ingredients like vitamin C, retinol, or hyaluronic acid",
            "🧘 Practice stress management techniques like meditation or yoga",
            "❄️ Apply cold compresses to reduce puffiness and improve circulation"
        ])
        if detection_count > 1:
            recommendations.append("👨‍⚕️ Consider consulting a dermatologist for persistent dark circles")
    else:
        recommendations.extend([
            "✅ Great! No dark circles detected",
            "🛌 Continue maintaining good sleep habits",
            "💧 Keep staying hydrated",
            "😎 Continue protecting your eye area from sun damage"
        ])
    return recommendations

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Dark Circles Detection API",
        "description": "Upload an image to detect dark circles around the eyes",
        "endpoints": {
            "/detect": "POST - Upload image for dark circles detection",
            "/health": "GET - API health check",
            "/model-info": "GET - Information about the loaded model",
            "/analyze-severity": "POST - Analyze dark circles severity"
        },
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model_type": type(model).__name__,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/model-info")
async def model_info():
    """Get information about the loaded model"""
    return {
        "model_loaded": model is not None,
        "model_type": type(model).__name__,
        "classes": getattr(model, 'names', {}),
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "image_size": IMAGE_SIZE,
        "available_endpoints": ["/detect", "/health", "/model-info", "/analyze-severity"]
    }

@app.post("/detect")
async def detect_dark_circles(file: UploadFile = File(...)):
    """Detect dark circles in uploaded image"""
    try:
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        image_data = await file.read()
        try:
            image = Image.open(io.BytesIO(image_data))
            logger.info(f"Uploaded image mode: {image.mode}")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
        
        if not validate_image(image):
            raise HTTPException(status_code=400, detail="Image validation failed")
        
        # Generate unique filename
        filename = f"{uuid.uuid4()}_{file.filename.replace('.png', '.jpg')}"
        # Convert to RGB before saving if necessary
        if image.mode == 'RGBA':
            logger.info("Converting uploaded image from RGBA to RGB")
            image = image.convert('RGB')
        original_url = save_image(image, f"original_{filename}")
        
        logger.info(f"Processing image: {file.filename}")
        prediction_result = predict_dark_circles(image, filename)
        
        recommendations = generate_health_recommendations(
            prediction_result["has_dark_circles"],
            prediction_result["detection_count"]
        )
        
        response = {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "filename": file.filename,
            "results": {
                "detection_count": prediction_result["detection_count"],
                "has_dark_circles": prediction_result["has_dark_circles"],
                "detections": prediction_result["detections"],
                "confidence_threshold": CONFIDENCE_THRESHOLD
            },
            "images": {
                "original_url": f"{original_url}",
                "annotated_url": f"{prediction_result['annotated_image_url']}"
            },
            "health_recommendations": recommendations,
            "metadata": {
                "image_size": f"{image.size[0]}x{image.size[1]}",
                "model_type": type(model).__name__,
                "processing_time": "Real-time"
            }
        }
        
        if "error" in prediction_result:
            response["error"] = prediction_result["error"]
        
        logger.info(f"Detection completed for {file.filename}: {prediction_result['detection_count']} detections")
        return JSONResponse(content=response)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during detection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

@app.post("/analyze-severity")
async def analyze_severity(file: UploadFile = File(...)):
    """Advanced analysis with severity assessment"""
    try:
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        image_data = await file.read()
        try:
            image = Image.open(io.BytesIO(image_data))
            logger.info(f"Uploaded image mode: {image.mode}")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
        
        if not validate_image(image):
            raise HTTPException(status_code=400, detail="Image validation failed")
        
        filename = f"{uuid.uuid4()}_{file.filename.replace('.png', '.jpg')}"
        if image.mode == 'RGBA':
            logger.info("Converting uploaded image from RGBA to RGB")
            image = image.convert('RGB')
        original_url = save_image(image, f"original_{filename}")
        
        prediction_result = predict_dark_circles(image, filename)
        
        detections = prediction_result["detections"]
        severity_analysis = {
            "severity_level": "none",
            "severity_score": 0,
            "analysis": {}
        }
        
        if detections:
            avg_confidence = sum(d["confidence"] for d in detections) / len(detections)
            total_area = sum(
                d["bounding_box"]["width"] * d["bounding_box"]["height"] 
                for d in detections
            )
            
            if avg_confidence >= 0.8 and total_area > 1000:
                severity_analysis["severity_level"] = "severe"
                severity_analysis["severity_score"] = 90
            elif avg_confidence >= 0.7 and total_area > 500:
                severity_analysis["severity_level"] = "moderate"
                severity_analysis["severity_score"] = 70
            elif avg_confidence >= 0.5:
                severity_analysis["severity_level"] = "mild"
                severity_analysis["severity_score"] = 50
            
            severity_analysis["analysis"] = {
                "average_confidence": round(avg_confidence, 3),
                "total_affected_area": round(total_area, 2),
                "detection_count": len(detections)
            }
        
        recommendations = generate_health_recommendations(
            prediction_result["has_dark_circles"],
            prediction_result["detection_count"]
        )
        
        response = {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "filename": file.filename,
            "results": {
                "detection_count": prediction_result["detection_count"],
                "has_dark_circles": prediction_result["has_dark_circles"],
                "detections": prediction_result["detections"],
                "confidence_threshold": CONFIDENCE_THRESHOLD
            },
            "images": {
                "original_url": f"{original_url}",
                "annotated_url": f"{prediction_result['annotated_image_url']}"
            },
            "health_recommendations": recommendations,
            "severity_analysis": severity_analysis,
            "metadata": {
                "image_size": f"{image.size[0]}x{image.size[1]}",
                "model_type": type(model).__name__,
                "processing_time": "Real-time"
            }
        }
        
        if "error" in prediction_result:
            response["error"] = prediction_result["error"]
        
        logger.info(f"Severity analysis completed for {file.filename}: {prediction_result['detection_count']} detections")
        return JSONResponse(content=response)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during severity analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Severity analysis failed: {str(e)}")

@app.get("/image/{image_type}/{filename}")
async def get_image(image_type: str, filename: str):
    """Stream the original or annotated image"""
    if image_type not in ["original", "annotated"]:
        raise HTTPException(status_code=400, detail="Invalid image type")
    filepath = os.path.join(STATIC_DIR, f"{image_type}_{filename}")
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Image not found")
    
    img = Image.open(filepath)
    if img.mode == 'RGBA':
        img = img.convert('RGB')
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=95)
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/jpeg")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="localhost",
        port=8000,
        reload=True,
        log_level="info"
    )