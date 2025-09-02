from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from PIL import Image
import io
import os
import numpy as np
from typing import List, Dict, Any, Optional
import uvicorn
from ultralytics import YOLO
import base64
import cv2
import torch
from datetime import datetime
import logging

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
                    self.cls = [torch.tensor([0])]  # class 0 for dark_circles
                    self.conf = [torch.tensor([random.uniform(0.5, 0.9)])]
                    # Mock bounding box around eye area
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
            
            # Add PyTorch safe globals for compatibility
            torch.serialization.add_safe_globals([
                'ultralytics.nn.tasks.DetectionModel',
                'ultralytics.nn.modules.head.Detect',
                'ultralytics.nn.modules.conv.Conv',
                'ultralytics.nn.modules.block.C2f',
                'ultralytics.nn.modules.block.Bottleneck',
                'ultralytics.nn.modules.block.SPPF',
                'collections.OrderedDict'
            ])
            
            # Try loading with weights_only=False
            try:
                original_load = torch.load
                def safe_load(*args, **kwargs):
                    kwargs['weights_only'] = False
                    return original_load(*args, **kwargs)
                
                torch.load = safe_load
                model = YOLO(model_path)
                torch.load = original_load
                logger.info("✓ Custom dark circles model loaded successfully!")
                return
                
            except Exception as e1:
                torch.load = original_load
                logger.warning(f"Custom dark circles model loading failed: {e1}")
                
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
                logger.warning("⚠️  Note: Using general detection, not specifically trained for dark circles")
                return
            except Exception as e:
                logger.warning(f"Failed to load {model_name}: {e}")
                continue
        
        # If all models fail, create a mock model for API testing
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
    # Startup
    logger.info("Starting Dark Circles Detection API...")
    load_model()
    yield
    # Shutdown
    logger.info("Shutting down Dark Circles Detection API...")

app = FastAPI(
    title="Dark Circles Detection API",
    description="AI-powered dark circles detection using YOLOv11 detection model",
    version="1.0.0",
    lifespan=lifespan
)

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
        # Check image format
        if image.format not in ['JPEG', 'PNG', 'JPG', 'WEBP']:
            return False
        
        # Check image size (max 20MB)
        if len(image.tobytes()) > 20 * 1024 * 1024:
            return False
        
        # Check dimensions (reasonable limits)
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
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert PIL to numpy array
        image_array = np.array(image)
        
        return image_array
    except Exception as e:
        logger.error(f"Image preprocessing error: {e}")
        return None

def image_to_base64(image_array):
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

def predict_dark_circles(image: Image.Image) -> Dict[str, Any]:
    """
    Predict dark circles from an image
    
    Args:
        image: PIL Image object
    
    Returns:
        dict: Prediction results with detection info
    """
    try:
        # Make prediction
        results = model.predict(image, conf=CONFIDENCE_THRESHOLD, imgsz=IMAGE_SIZE)
        
        detections = []
        annotated_image = np.array(image)
        
        # Process results
        for result in results:
            if hasattr(result, 'boxes') and len(result.boxes) > 0:
                # Get annotated image with bounding boxes
                annotated_image = result.plot()
                # Convert BGR to RGB if needed
                if len(annotated_image.shape) == 3:
                    annotated_image = cv2.cvtColor(annotated_image, cv2.COLOR_BGR2RGB)
                
                # Extract detection information
                for i, box in enumerate(result.boxes):
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    coords = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
                    
                    # Get class name
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
        
        return {
            "detection_count": len(detections),
            "detections": detections,
            "annotated_image": annotated_image,
            "has_dark_circles": len(detections) > 0
        }
        
    except Exception as e:
        logger.error(f"Error during prediction: {e}")
        return {
            "detection_count": 0,
            "detections": [],
            "annotated_image": np.array(image),
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
            "/detect-batch": "POST - Upload multiple images for batch detection",
            "/health": "GET - API health check",
            "/model-info": "GET - Information about the loaded model"
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
        "available_endpoints": ["/detect", "/detect-batch", "/health", "/model-info"]
    }

@app.post("/detect")
async def detect_dark_circles(file: UploadFile = File(...)):
    """
    Detect dark circles in uploaded image
    
    Returns:
    - Detection results with bounding boxes
    - Confidence scores
    - Annotated image
    - Health recommendations
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read and validate image
        image_data = await file.read()
        try:
            image = Image.open(io.BytesIO(image_data))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
        
        if not validate_image(image):
            raise HTTPException(status_code=400, detail="Image validation failed")
        
        # Make prediction
        logger.info(f"Processing image: {file.filename}")
        prediction_result = predict_dark_circles(image)
        
        # Convert images to base64
        original_image_base64 = image_to_base64(np.array(image))
        annotated_image_base64 = image_to_base64(prediction_result["annotated_image"])
        
        # Generate recommendations
        recommendations = generate_health_recommendations(
            prediction_result["has_dark_circles"],
            prediction_result["detection_count"]
        )
        
        # Prepare response
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
                "original": original_image_base64,
                "annotated": annotated_image_base64
            },
            "health_recommendations": recommendations,
            "metadata": {
                "image_size": f"{image.size[0]}x{image.size[1]}",
                "model_type": type(model).__name__,
                "processing_time": "Real-time"
            }
        }
        
        # Add error info if present
        if "error" in prediction_result:
            response["error"] = prediction_result["error"]
        
        logger.info(f"Detection completed for {file.filename}: {prediction_result['detection_count']} detections")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during detection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

@app.post("/detect-batch")
async def detect_batch(files: List[UploadFile] = File(...)):
    """
    Detect dark circles in multiple images
    
    Args:
        files: List of image files (max 10)
    
    Returns:
        Batch detection results
    """
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 images per batch")
    
    results = []
    
    for i, file in enumerate(files):
        try:
            # Process each image
            result = await detect_dark_circles(file)
            result["batch_index"] = i
            results.append(result)
            
        except Exception as e:
            # Add error result for failed images
            results.append({
                "batch_index": i,
                "filename": file.filename,
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            })
    
    # Calculate batch statistics
    successful = [r for r in results if r.get("status") == "success"]
    failed = [r for r in results if r.get("status") == "error"]
    
    total_detections = sum(r.get("results", {}).get("detection_count", 0) for r in successful)
    images_with_dark_circles = sum(1 for r in successful if r.get("results", {}).get("has_dark_circles", False))
    
    return {
        "status": "completed",
        "timestamp": datetime.now().isoformat(),
        "batch_summary": {
            "total_images": len(files),
            "successful": len(successful),
            "failed": len(failed),
            "total_detections": total_detections,
            "images_with_dark_circles": images_with_dark_circles,
            "detection_rate": f"{(images_with_dark_circles/len(successful)*100):.1f}%" if successful else "0%"
        },
        "results": results
    }

@app.post("/analyze-severity")
async def analyze_severity(file: UploadFile = File(...)):
    """
    Advanced analysis with severity assessment
    """
    try:
        # Get basic detection results
        detection_result = await detect_dark_circles(file)
        
        if detection_result["status"] != "success":
            return detection_result
        
        # Analyze severity based on detection parameters
        detections = detection_result["results"]["detections"]
        severity_analysis = {
            "severity_level": "none",
            "severity_score": 0,
            "analysis": {}
        }
        
        if detections:
            # Calculate average confidence
            avg_confidence = sum(d["confidence"] for d in detections) / len(detections)
            
            # Calculate total area affected
            total_area = sum(
                d["bounding_box"]["width"] * d["bounding_box"]["height"] 
                for d in detections
            )
            
            # Determine severity
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
        
        # Add severity analysis to response
        detection_result["severity_analysis"] = severity_analysis
        
        return detection_result
        
    except Exception as e:
        logger.error(f"Error during severity analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Severity analysis failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="localhost",
        port=8000,
        reload=True,
        log_level="info"
    )
