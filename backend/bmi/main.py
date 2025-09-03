from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from contextlib import asynccontextmanager
from PIL import Image
import io
import os
import numpy as np
from typing import List, Dict, Any
import uvicorn
from ultralytics import YOLO
import torch
import cv2
import mediapipe as mp
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

model = None

CLASS_NAMES = ["Normal-weight", "Overweight", "Mild-obesity", "Moderate-obesity", "Severe-obesity"]
CONFIDENCE_THRESHOLD = 0.3
IMAGE_SIZE = 224

mp_face_mesh = mp.solutions.face_mesh
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

MODEL_PATHS = [
    "../../ml/bmi/bmi_classification/yolov8_bmi_5class_v2/weights/best.pt",
    "../../ml/bmi/bmi_classification/yolov8_bmi_5class/weights/best.pt",
    "../bmi/bmi_classification/yolov8_bmi_5class_v2/weights/best.pt",
    "bmi_classification/yolov8_bmi_5class_v2/weights/best.pt",
    "runs/classify/train/weights/best.pt"
]

class MockModel:
    def __init__(self):
        self.names = {i: name for i, name in enumerate(CLASS_NAMES)}
    def predict(self, image, **kwargs):
        import random
        class MockResults:
            def __init__(self):
                self.probs = self.MockProbs()
            class MockProbs:
                def __init__(self):
                    probs = [random.random() for _ in range(5)]
                    total = sum(probs)
                    self.data = torch.tensor([p / total for p in probs])
                    self.top1 = int(torch.argmax(self.data))
                    self.top1conf = self.data[self.top1]
        return [MockResults()]

def find_model_path():
    logger.info("Searching for trained BMI model...")
    for path in MODEL_PATHS:
        if os.path.exists(path):
            logger.info(f"✓ Found BMI model at: {path}")
            return path
        else:
            logger.debug(f"✗ Not found: {path}")
    logger.warning("No trained BMI model found")
    return None

def load_model():
    global model
    model_path = find_model_path()
    if model_path:
        try:
            logger.info(f"Loading BMI model from: {model_path}")
            torch.serialization.add_safe_globals([
                'ultralytics.nn.tasks.ClassificationModel',
                'ultralytics.nn.modules.head.Classify',
                'ultralytics.nn.modules.conv.Conv',
                'ultralytics.nn.modules.block.C2f',
                'ultralytics.nn.modules.block.Bottleneck',
                'ultralytics.nn.modules.block.SPPF',
                'collections.OrderedDict'
            ])
            try:
                original_load = torch.load
                def safe_load(*args, **kwargs):
                    kwargs['weights_only'] = False
                    return original_load(*args, **kwargs)
                torch.load = safe_load
                model = YOLO(model_path)
                torch.load = original_load
                logger.info("✓ Custom BMI model loaded successfully!")
                return
            except Exception as e1:
                torch.load = original_load
                logger.warning(f"Custom BMI model loading failed: {e1}")
        except Exception as e:
            logger.error(f"Error with custom BMI model: {e}")
    try:
        logger.info("Loading pretrained classification model...")
        model_names = ['yolov8n-cls.pt', 'yolov8s-cls.pt']
        for model_name in model_names:
            try:
                logger.info(f"Attempting to load {model_name}...")
                model = YOLO(model_name)
                logger.info(f"✓ Pretrained model {model_name} loaded successfully!")
                logger.warning("⚠️  Note: Using general classification, not specifically trained for BMI")
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
    logger.info("Starting BMI Classification API...")
    load_model()
    yield
    logger.info("Shutting down BMI Classification API...")

app = FastAPI(
    title="BMI Classification API",
    description="AI-powered BMI classification using YOLOv8 classification model",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def validate_image(image: Image.Image) -> bool:
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
    try:
        if image.mode != 'RGB':
            image = image.convert('RGB')
        image.thumbnail((IMAGE_SIZE, IMAGE_SIZE), Image.Resampling.LANCZOS)
        return np.array(image)
    except Exception as e:
        logger.error(f"Image preprocessing error: {e}")
        raise HTTPException(status_code=400, detail="Image preprocessing failed")

def create_face_mesh_image(image_array):
    try:
        if len(image_array.shape) == 3 and image_array.shape[2] == 3:
            image_rgb = image_array
        else:
            image_rgb = cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB)
        with mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5) as face_mesh:
            results = face_mesh.process(image_rgb)
            annotated_image = image_rgb.copy()
            face_detected = False
            if results.multi_face_landmarks:
                face_detected = True
                for face_landmarks in results.multi_face_landmarks:
                    mp_drawing.draw_landmarks(
                        image=annotated_image,
                        landmark_list=face_landmarks,
                        connections=mp_face_mesh.FACEMESH_CONTOURS,
                        landmark_drawing_spec=None,
                        connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_contours_style())
                    mp_drawing.draw_landmarks(
                        image=annotated_image,
                        landmark_list=face_landmarks,
                        connections=mp_face_mesh.FACEMESH_TESSELATION,
                        landmark_drawing_spec=None,
                        connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_tesselation_style())
            return annotated_image, face_detected
    except Exception as e:
        logger.error(f"Error creating face mesh: {e}")
        return image_array, False

def postprocess_results(results, image_shape: tuple) -> Dict[str, Any]:
    try:
        for result in results:
            if hasattr(result, 'probs') and result.probs is not None:
                probs = result.probs
                top_class_idx = int(probs.top1)
                confidence = float(probs.top1conf.item())
                predicted_class = CLASS_NAMES[top_class_idx] if top_class_idx < len(CLASS_NAMES) else f"class_{top_class_idx}"
                all_probs = probs.data.cpu().numpy()
                class_probabilities = {}
                for i, (class_name, prob) in enumerate(zip(CLASS_NAMES, all_probs[:len(CLASS_NAMES)])):
                    class_probabilities[class_name] = float(prob)
                health_status = get_health_status(predicted_class, confidence)
                return {
                    "prediction": {
                        "bmi_category": predicted_class,
                        "confidence": round(confidence, 4),
                        "health_status": health_status
                    },
                    "probabilities": class_probabilities,
                    "analysis": {
                        "most_likely": predicted_class,
                        "confidence_level": get_confidence_level(confidence),
                        "recommendations": get_health_recommendations(predicted_class)
                    },
                    "image_info": {
                        "processed_size": f"{image_shape[1]}x{image_shape[0]}",
                        "channels": image_shape[2] if len(image_shape) > 2 else 1
                    },
                    "timestamp": datetime.now().isoformat()
                }
        # In case no valid result:
        return {
            "prediction": {
                "bmi_category": "Unknown",
                "confidence": 0.0,
                "health_status": "Unable to determine"
            },
            "probabilities": {class_name: 0.0 for class_name in CLASS_NAMES},
            "analysis": {
                "most_likely": "Unknown",
                "confidence_level": "Very Low",
                "recommendations": ["Please consult with a healthcare professional for accurate BMI assessment"]
            },
            "image_info": {
                "processed_size": f"{image_shape[1]}x{image_shape[0]}",
                "channels": image_shape[2] if len(image_shape) > 2 else 1
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Result postprocessing error: {e}")
        raise HTTPException(status_code=500, detail="Result processing failed")

def get_health_status(bmi_category: str, confidence: float) -> str:
    if confidence < 0.5:
        return "Low confidence prediction - consult healthcare provider"
    status_map = {
        "Normal-weight": "Healthy weight range",
        "Overweight": "Above normal weight - consider lifestyle changes",
        "Mild-obesity": "Mild obesity - health monitoring recommended",
        "Moderate-obesity": "Moderate obesity - medical consultation advised",
        "Severe-obesity": "Severe obesity - immediate medical attention recommended"
    }
    return status_map.get(bmi_category, "Unknown BMI category")

def get_confidence_level(confidence: float) -> str:
    if confidence >= 0.9:
        return "Very High"
    elif confidence >= 0.7:
        return "High"
    elif confidence >= 0.5:
        return "Moderate"
    elif confidence >= 0.3:
        return "Low"
    else:
        return "Very Low"

def get_health_recommendations(bmi_category: str) -> List[str]:
    recommendations_map = {
        "Normal-weight": [
            "Maintain current healthy lifestyle",
            "Continue balanced diet and regular exercise",
            "Monitor weight regularly"
        ],
        "Overweight": [
            "Increase physical activity to 150+ minutes per week",
            "Focus on balanced, calorie-controlled diet",
            "Consider consulting a nutritionist",
            "Monitor progress regularly"
        ],
        "Mild-obesity": [
            "Consult healthcare provider for weight management plan",
            "Implement structured diet and exercise program",
            "Consider professional nutritional counseling",
            "Regular health monitoring recommended"
        ],
        "Moderate-obesity": [
            "Seek medical consultation for comprehensive evaluation",
            "Consider medically supervised weight loss program",
            "Regular monitoring of blood pressure, diabetes risk",
            "Professional dietary and exercise guidance essential"
        ],
        "Severe-obesity": [
            "Immediate medical consultation strongly recommended",
            "Comprehensive health assessment required",
            "Consider medical weight loss interventions",
            "Regular monitoring of obesity-related health conditions"
        ]
    }
    return recommendations_map.get(bmi_category, [
        "Consult with healthcare professional for personalized advice"
    ])

@app.get("/")
async def root():
    return {
        "message": "BMI Classification API",
        "version": "1.0.0",
        "description": "AI-powered BMI classification using computer vision",
        "endpoints": {
            "health": "/health",
            "predict": "/predict",
            "analyze": "/analyze",
            "analyze-simple": "/analyze-simple",
            "model_info": "/model-info"
        },
        "supported_classes": CLASS_NAMES
    }

@app.get("/health")
async def health_check():
    model_status = "loaded" if model is not None else "not loaded"
    model_type = "custom" if hasattr(model, 'model') else "mock"
    return {
        "status": "healthy",
        "model_status": model_status,
        "model_type": model_type,
        "supported_classes": CLASS_NAMES,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/model-info")
async def model_info():
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    model_type = "custom_trained" if hasattr(model, 'model') else "mock_testing"
    return {
        "model_type": model_type,
        "classes": CLASS_NAMES,
        "image_size": IMAGE_SIZE,
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "model_loaded": model is not None
    }

@app.post("/predict")
async def predict_bmi(file: UploadFile = File(...)):
    try:
        if model is None:
            raise HTTPException(status_code=503, detail="Model not available")
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
        if not validate_image(image):
            raise HTTPException(status_code=400, detail="Image validation failed")
        if image.mode != 'RGB':
            image = image.convert('RGB')
        image_array = np.array(image)
        image_np = preprocess_image(image)
        results = model.predict(image_np, verbose=False)
        bmi_data = postprocess_results(results, image_np.shape)
        face_mesh_image, face_detected = create_face_mesh_image(image_array)
        face_mesh_pil = Image.fromarray(face_mesh_image)
        buf = io.BytesIO()
        face_mesh_pil.save(buf, format="JPEG")
        buf.seek(0)
        prediction_data = {
            "status": "success",
            "filename": file.filename,
            "bmi_prediction": bmi_data["prediction"],
            "probabilities": bmi_data["probabilities"],
            "analysis": bmi_data["analysis"],
            "face_mesh": {
                "face_detected": face_detected,
                "landmarks_drawn": face_detected
            },
            "image_info": {
                "original_size": f"{image.size[0]}x{image.size[1]}",
                "processed_for_bmi": bmi_data["image_info"]["processed_size"]
            }
        }
        logger.info(f"Prediction: {bmi_data['prediction']['bmi_category']} (confidence {bmi_data['prediction']['confidence']:.3f}), Face detected: {face_detected}")
        return StreamingResponse(
            buf,
            media_type="image/jpeg",
            headers={
                "bmi-prediction": str(prediction_data),
                "Content-Disposition": f"inline; filename=face_mesh_bmi_{file.filename}"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[predict] Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/analyze")
async def analyze_bmi(file: UploadFile = File(...)):
    try:
        if model is None:
            raise HTTPException(status_code=503, detail="Model not available")
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
        if not validate_image(image):
            raise HTTPException(status_code=400, detail="Image validation failed")
        if image.mode != 'RGB':
            image = image.convert('RGB')
        image_np = preprocess_image(image)
        results = model.predict(image_np, verbose=False)
        bmi_data = postprocess_results(results, image_np.shape)
        return JSONResponse(content=bmi_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[analyze] Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/analyze-simple")
async def analyze_simple_bmi(file: UploadFile = File(...)):
    """
    Upload image, predict BMI, return only class with highest probability,
    its probability, and the recommendations.
    """
    try:
        if model is None:
            raise HTTPException(status_code=503, detail="Model not available")
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
        if not validate_image(image):
            raise HTTPException(status_code=400, detail="Image validation failed")
        if image.mode != 'RGB':
            image = image.convert('RGB')
        image_np = preprocess_image(image)
        results = model.predict(image_np, verbose=False)
        bmi_data = postprocess_results(results, image_np.shape)

        probabilities = bmi_data.get("probabilities", {})
        recommendations = bmi_data.get("analysis", {}).get("recommendations", ["Consult with healthcare professional for personalized advice"])

        if not probabilities:
            raise HTTPException(status_code=500, detail="Probabilities missing from model output")

        highest_class = max(probabilities, key=probabilities.get)
        highest_prob = probabilities[highest_class]

        return JSONResponse(
            content={
                "class_with_highest_probability": highest_class,
                "probability": highest_prob,
                "recommendations": recommendations
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[analyze-simple] Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    print("Starting BMI Classification API server...")
    print("API endpoints:")
    print(" - GET /health")
    print(" - GET /model-info")
    print(" - POST /predict    (upload image, get annotated image)")
    print(" - POST /analyze    (upload image, get full prediction JSON)")
    print(" - POST /analyze-simple (upload image, get simplified JSON)")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
