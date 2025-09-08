from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from contextlib import asynccontextmanager
from PIL import Image
import io
import os
import numpy as np
from typing import Dict, Any, List
import uvicorn
import torch
import torch.nn as nn
from torchvision import transforms, models
import cv2
from datetime import datetime
import logging
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global model variable
model = None

# Diabetic Retinopathy class configuration
CLASS_NAMES = ["Mild", "Moderate", "No_DR", "Proliferate_DR", "Severe"]
CONFIDENCE_THRESHOLD = 0.5
IMAGE_SIZE = 224

# Model paths to search for
MODEL_PATHS = [
    "../../ml/DiabeticRetinopathy/best_model.pth",
    "../DiabeticRetinopathy/best_model.pth",
    "best_model.pth",
    "models/best_model.pth"
]

# Image preprocessing transforms (same as training)
transform_inference = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

class MockModel:
    """Mock model for testing when real model loading fails"""
    def __init__(self):
        self.eval = lambda: None
        
    def __call__(self, x):
        """Mock prediction that returns random results for testing"""
        import random
        batch_size = x.shape[0]
        num_classes = len(CLASS_NAMES)
        
        # Generate random logits
        logits = torch.randn(batch_size, num_classes)
        return logits

def find_model_path():
    """Find the best available diabetic retinopathy model path"""
    logger.info("Searching for trained diabetic retinopathy model...")
    for path in MODEL_PATHS:
        if os.path.exists(path):
            logger.info(f"✓ Found diabetic retinopathy model at: {path}")
            return path
        else:
            logger.debug(f"✗ Not found: {path}")
    
    logger.warning("No trained diabetic retinopathy model found")
    return None

def load_model():
    """Load the trained diabetic retinopathy classification model"""
    global model
    
    # Check if CUDA is available
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")
    
    model_path = find_model_path()
    
    if model_path:
        try:
            logger.info(f"Loading diabetic retinopathy model from: {model_path}")
            
            # Create ResNet18 model architecture (same as training)
            model = models.resnet18(weights=None)
            model.fc = nn.Linear(model.fc.in_features, len(CLASS_NAMES))
            
            # Load trained weights
            state_dict = torch.load(model_path, map_location=device, weights_only=True)
            model.load_state_dict(state_dict)
            
            model = model.to(device)
            model.eval()
            
            logger.info("✓ Custom diabetic retinopathy model loaded successfully!")
            return
            
        except Exception as e:
            logger.error(f"Error loading custom diabetic retinopathy model: {e}")
    
    # Fallback to mock model for testing
    try:
        logger.warning("Creating mock model for testing...")
        model = MockModel()
        logger.info("✓ Mock model created for testing purposes")
        
    except Exception as e:
        logger.error(f"✗ Failed to create mock model: {e}")
        model = None

def get_device():
    """Get the current device"""
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # Startup
    logger.info("Starting Diabetic Retinopathy Classification API...")
    load_model()
    yield
    # Shutdown
    logger.info("Shutting down Diabetic Retinopathy Classification API...")

app = FastAPI(
    title="Diabetic Retinopathy Classification API",
    description="AI-powered diabetic retinopathy classification using ResNet18 deep learning model",
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

def preprocess_image(image: Image.Image) -> torch.Tensor:
    """Preprocess image for model inference"""
    try:
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Apply the same transforms as training
        image_tensor = transform_inference(image)
        
        # Add batch dimension
        image_tensor = image_tensor.unsqueeze(0)
        
        return image_tensor
    except Exception as e:
        logger.error(f"Image preprocessing error: {e}")
        raise HTTPException(status_code=400, detail="Image preprocessing failed")

def predict_diabetic_retinopathy(image: Image.Image) -> Dict[str, Any]:
    """Predict diabetic retinopathy from image"""
    try:
        device = get_device()
        
        # Preprocess image
        image_tensor = preprocess_image(image)
        image_tensor = image_tensor.to(device)
        
        # Make prediction
        with torch.no_grad():
            outputs = model(image_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence, predicted_class_idx = torch.max(probabilities, 1)
        
        # Convert to Python types
        predicted_class_idx = predicted_class_idx.item()
        confidence = confidence.item()
        all_probabilities = probabilities[0].cpu().numpy()
        
        # Get class name
        predicted_class = CLASS_NAMES[predicted_class_idx]
        
        # Create probability distribution
        class_probabilities = {}
        for i, (class_name, prob) in enumerate(zip(CLASS_NAMES, all_probabilities)):
            class_probabilities[class_name] = float(prob)
        
        return {
            "predicted_class": predicted_class,
            "confidence": float(confidence),
            "class_probabilities": class_probabilities,
            "severity_level": get_severity_level(predicted_class),
            "recommendations": get_health_recommendations(predicted_class)
        }
        
    except Exception as e:
        logger.error(f"Error during prediction: {e}")
        raise HTTPException(status_code=500, detail="Prediction failed")

def get_severity_level(predicted_class: str) -> str:
    """Get severity level based on predicted class"""
    severity_map = {
        "No_DR": "Normal",
        "Mild": "Mild",
        "Moderate": "Moderate", 
        "Severe": "Severe",
        "Proliferate_DR": "Very Severe"
    }
    return severity_map.get(predicted_class, "Unknown")

def get_health_recommendations(predicted_class: str) -> List[str]:
    """Generate health recommendations based on prediction"""
    recommendations = {
        "No_DR": [
            "Great! No signs of diabetic retinopathy detected",
            "Continue regular eye examinations annually",
            "Maintain good blood sugar control",
            "Keep up with regular exercise and healthy diet",
            "Avoid smoking to protect your eyes"
        ],
        "Mild": [
            "Mild diabetic retinopathy detected",
            "Schedule follow-up with an ophthalmologist within 6-12 months",
            "Focus on tighter blood sugar control",
            "Ensure blood pressure and cholesterol are well managed",
            "Monitor for any vision changes"
        ],
        "Moderate": [
            "Moderate diabetic retinopathy detected",
            "See an ophthalmologist within 3-6 months",
            "Urgent need for better diabetes management",
            "Review medications with your doctor",
            "Report any vision changes immediately"
        ],
        "Severe": [
            "Severe diabetic retinopathy detected",
            "URGENT: See an ophthalmologist within 1-2 months",
            "Immediate diabetes management optimization required",
            "Consider laser therapy or other treatments",
            "Monitor vision very closely"
        ],
        "Proliferate_DR": [
            "Proliferative diabetic retinopathy detected",
            "EMERGENCY: See retinal specialist immediately",
            "May require urgent laser treatment or surgery",
            "Critical diabetes management needed",
            "Risk of severe vision loss - immediate action required"
        ]
    }
    
    return recommendations.get(predicted_class, ["Consult with healthcare provider for proper evaluation"])

def create_annotated_image(image: Image.Image, prediction_result: Dict[str, Any]) -> np.ndarray:
    """Create annotated image with prediction results"""
    try:
        # Convert PIL to numpy array
        image_array = np.array(image)
        
        # Add prediction text overlay
        predicted_class = prediction_result["predicted_class"]
        confidence = prediction_result["confidence"]
        severity = prediction_result["severity_level"]
        
        # Create overlay text
        text_lines = [
            f"Prediction: {predicted_class}",
            f"Confidence: {confidence:.3f}",
            f"Severity: {severity}"
        ]
        
        # Add text to image
        y_offset = 30
        for line in text_lines:
            cv2.putText(image_array, line, (10, y_offset), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            cv2.putText(image_array, line, (10, y_offset), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 1)
            y_offset += 35
        
        return image_array
        
    except Exception as e:
        logger.error(f"Error creating annotated image: {e}")
        return np.array(image)

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Diabetic Retinopathy Classification API",
        "description": "Upload a retinal image to detect and classify diabetic retinopathy",
        "endpoints": {
            "/predict": "POST - Upload image for diabetic retinopathy classification",
            "/health": "GET - API health check",
            "/model-info": "GET - Information about the loaded model"
        },
        "version": "1.0.0",
        "classes": CLASS_NAMES,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model_type": type(model).__name__,
        "device": str(get_device()),
        "cuda_available": torch.cuda.is_available(),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/model-info")
async def model_info():
    """Get information about the loaded model"""
    return {
        "model_loaded": model is not None,
        "model_type": type(model).__name__,
        "classes": CLASS_NAMES,
        "num_classes": len(CLASS_NAMES),
        "image_size": IMAGE_SIZE,
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "device": str(get_device()),
        "cuda_available": torch.cuda.is_available()
    }

@app.post("/predict")
async def predict_retinopathy(file: UploadFile = File(...)):
    """
    Predict diabetic retinopathy from uploaded retinal image and return annotated image
    
    Returns:
        StreamingResponse with annotated image and prediction data in headers
    """
    try:
        # Check if model is loaded
        if model is None:
            raise HTTPException(status_code=503, detail="Model not available")
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read and validate image
        try:
            image_data = await file.read()
            image = Image.open(io.BytesIO(image_data))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
        
        if not validate_image(image):
            raise HTTPException(status_code=400, detail="Image validation failed")
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Make prediction
        logger.info(f"Processing retinal image: {file.filename}")
        prediction_result = predict_diabetic_retinopathy(image)
        
        # Create annotated image
        annotated_image = create_annotated_image(image, prediction_result)
        annotated_pil = Image.fromarray(annotated_image)
        
        # Convert image to byte stream
        buf = io.BytesIO()
        annotated_pil.save(buf, format="JPEG")
        buf.seek(0)
        
        # Prepare prediction data for headers
        prediction_data = {
            "status": "success",
            "filename": file.filename,
            "prediction": prediction_result,
            "timestamp": datetime.now().isoformat(),
            "image_info": {
                "original_size": f"{image.size[0]}x{image.size[1]}",
                "processed_size": f"{IMAGE_SIZE}x{IMAGE_SIZE}"
            }
        }
        
        logger.info(f"Diabetic retinopathy prediction completed: {prediction_result['predicted_class']} "
                   f"(confidence: {prediction_result['confidence']:.3f})")
        
        return StreamingResponse(
            buf, 
            media_type="image/jpeg",
            headers={
                "prediction-data": str(prediction_data),
                "Content-Disposition": f"inline; filename=retinopathy_result_{file.filename}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during retinopathy prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/analyze")
async def analyze_retinopathy(file: UploadFile = File(...)):
    """
    Detailed analysis endpoint that returns JSON data instead of image
    """
    try:
        # Check if model is loaded
        if model is None:
            raise HTTPException(status_code=503, detail="Model not available")
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read and validate image
        try:
            image_data = await file.read()
            image = Image.open(io.BytesIO(image_data))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
        
        if not validate_image(image):
            raise HTTPException(status_code=400, detail="Image validation failed")
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Make prediction
        prediction_result = predict_diabetic_retinopathy(image)
        
        # Prepare detailed response
        response_data = {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "filename": file.filename,
            "analysis": {
                "prediction": prediction_result["predicted_class"],
                "confidence": prediction_result["confidence"],
                "severity_level": prediction_result["severity_level"],
                "class_probabilities": prediction_result["class_probabilities"]
            },
            "recommendations": prediction_result["recommendations"],
            "image_info": {
                "original_size": f"{image.size[0]}x{image.size[1]}",
                "processed_size": f"{IMAGE_SIZE}x{IMAGE_SIZE}",
                "format": image.format
            },
            "model_info": {
                "model_type": type(model).__name__,
                "device": str(get_device()),
                "classes": CLASS_NAMES
            }
        }
        
        logger.info(f"Diabetic retinopathy analysis completed: {prediction_result['predicted_class']} "
                   f"(confidence: {prediction_result['confidence']:.3f})")
        
        return JSONResponse(content=response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during retinopathy analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

if __name__ == "__main__":
    print("Starting Diabetic Retinopathy Classification API server...")
    print("Available endpoints:")
    print("  - http://localhost:8000/docs (API documentation)")
    print("  - http://localhost:8000/health (health check)")
    print("  - http://localhost:8000/predict (retinopathy prediction with image)")
    print("  - http://localhost:8000/analyze (retinopathy analysis with JSON)")
    
    uvicorn.run(
        "main:app",
        host="localhost",
        port=8004,
        reload=True,
        log_level="info"
    )
