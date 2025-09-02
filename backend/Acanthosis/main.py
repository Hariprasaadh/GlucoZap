from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from PIL import Image
from ultralytics import YOLO
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLO model
model = YOLO("../../ml/Acanthosis_Nigricans_Detection/runs/detect/train2/weights/best.pt")

@app.get("/")
def read_root():
    return {"message": "YOLO Detection API is running!"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Read the uploaded image
    img_bytes = await file.read()
    img = Image.open(io.BytesIO(img_bytes))

    # Run YOLO prediction
    results = model(img)

    detections = []
    for r in results:
        for box in r.boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            detections.append({"class": model.names[cls], "confidence": conf})

    # Draw bounding boxes on the image
    annotated_img = results[0].plot()
    annotated_pil = Image.fromarray(annotated_img)

    # Convert image to byte stream
    buf = io.BytesIO()
    annotated_pil.save(buf, format="JPEG")
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/jpeg", headers={"detections": str(detections)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("yolo_fastapi:app", host="127.0.0.1", port=8000, reload=True)
