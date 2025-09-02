# Dark Circles Detection API

A FastAPI-based REST API for detecting dark circles around the eyes using YOLOv11 deep learning model.

## Features

- 🔍 **Dark Circles Detection**: Detects dark circles around the eyes with bounding boxes
- 📊 **Confidence Scoring**: Provides confidence scores for each detection
- 🖼️ **Image Annotation**: Returns annotated images with bounding boxes
- 📈 **Severity Analysis**: Analyzes the severity of dark circles
- 🏥 **Health Recommendations**: Provides personalized health recommendations
- 📦 **Batch Processing**: Process multiple images at once
- 🔄 **Real-time Processing**: Fast inference with optimized model loading

## Installation

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Ensure Model is Available**:
   The API will automatically search for trained models in these locations:
   - `../../ml/eye_dark_circles/runs/detect/dark_circles_yolov11/weights/best.pt`
   - `../eye_dark_circles/runs/detect/dark_circles_yolov11/weights/best.pt`
   - `runs/detect/dark_circles_yolov11/weights/best.pt`

## Usage

### Start the Server

```bash
python main.py
```

The API will be available at `http://localhost:8000`

### API Endpoints

#### 1. Health Check
```bash
GET /health
```

#### 2. Model Information
```bash
GET /model-info
```

#### 3. Detect Dark Circles
```bash
POST /detect
Content-Type: multipart/form-data
Body: file (image file)
```

#### 4. Batch Detection
```bash
POST /detect-batch
Content-Type: multipart/form-data
Body: files (multiple image files, max 10)
```

#### 5. Severity Analysis
```bash
POST /analyze-severity
Content-Type: multipart/form-data
Body: file (image file)
```

### Example Usage with curl

```bash
# Health check
curl http://localhost:8000/health

# Detect dark circles
curl -X POST "http://localhost:8000/detect" \
     -F "file=@your_image.jpg"

# Severity analysis
curl -X POST "http://localhost:8000/analyze-severity" \
     -F "file=@your_image.jpg"
```

### Example Usage with Python

```python
import requests

# Detect dark circles
with open('your_image.jpg', 'rb') as f:
    files = {'file': ('image.jpg', f, 'image/jpeg')}
    response = requests.post('http://localhost:8000/detect', files=files)
    result = response.json()
    
print(f"Detections: {result['results']['detection_count']}")
print(f"Has dark circles: {result['results']['has_dark_circles']}")
```

## Response Format

### Successful Detection Response

```json
{
  "status": "success",
  "timestamp": "2025-09-02T10:30:00",
  "filename": "test_image.jpg",
  "results": {
    "detection_count": 2,
    "has_dark_circles": true,
    "detections": [
      {
        "detection_id": 1,
        "class": "dark_circles",
        "confidence": 0.8547,
        "bounding_box": {
          "x1": 120.5,
          "y1": 145.2,
          "x2": 180.3,
          "y2": 165.8,
          "width": 59.8,
          "height": 20.6
        }
      }
    ],
    "confidence_threshold": 0.5
  },
  "images": {
    "original": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "annotated": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  },
  "health_recommendations": [
    "🛌 Ensure you get 7-9 hours of quality sleep each night",
    "💧 Stay well-hydrated by drinking plenty of water throughout the day",
    "🥗 Maintain a balanced diet rich in vitamins C, E, and K"
  ],
  "metadata": {
    "image_size": "640x480",
    "model_type": "YOLO",
    "processing_time": "Real-time"
  }
}
```

## Model Information

- **Architecture**: YOLOv11 Object Detection
- **Input Size**: 640x640 pixels
- **Classes**: dark_circles
- **Confidence Threshold**: 0.5 (configurable)

## Health Recommendations

The API provides personalized health recommendations based on detection results:

**If dark circles detected**:
- Sleep hygiene advice
- Hydration recommendations
- Dietary suggestions
- Skincare tips
- Stress management advice

**If no dark circles detected**:
- Maintenance tips
- Prevention advice

## Error Handling

The API includes comprehensive error handling:

- **400 Bad Request**: Invalid file format or validation failure
- **500 Internal Server Error**: Model inference or processing errors
- **422 Unprocessable Entity**: Invalid request parameters

## Testing

Run the test script to verify API functionality:

```bash
python test_api.py
```

## Configuration

Key configuration options in `main.py`:

- `CONFIDENCE_THRESHOLD`: Detection confidence threshold (default: 0.5)
- `IMAGE_SIZE`: Model input image size (default: 640)
- `MODEL_PATHS`: List of paths to search for trained models

## Production Deployment

For production deployment:

1. Update CORS settings in `main.py`
2. Configure proper logging
3. Set up reverse proxy (nginx)
4. Use production WSGI server (gunicorn)
5. Implement rate limiting
6. Add authentication if needed

```bash
# Production deployment with gunicorn
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## API Documentation

Once the server is running, visit:
- Interactive API docs: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

## Support

For issues or questions:
1. Check the logs for error messages
2. Verify model files are present
3. Ensure all dependencies are installed
4. Test with the provided test script
