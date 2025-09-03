from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import cv2
import mediapipe as mp
import numpy as np
import parselmouth
import librosa
import math
import os
from scipy.io.wavfile import write

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class DiabetesRiskAnalyzerAPI:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True, min_detection_confidence=0.7, min_tracking_confidence=0.7)
        self.mp_draw = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles

    def extract_facial_metrics(self, landmarks):
        h, w = 480, 640
        points = [(int(landmark.x * w), int(landmark.y * h)) for landmark in landmarks.landmark]
        left_eye = [points[33], points[160], points[158], points[133], points[153], points[144]]
        right_eye = [points[362], points[385], points[387], points[263], points[373], points[380]]
        def eye_aspect_ratio(eye_points):
            A = math.dist(eye_points[1], eye_points[5])
            B = math.dist(eye_points[2], eye_points[4])
            C = math.dist(eye_points[0], eye_points[3])
            return (A + B) / (2.0 * C)
        left_ear = eye_aspect_ratio(left_eye)
        right_ear = eye_aspect_ratio(right_eye)
        mouth_points = [points[61], points[84], points[17], points[314], points[405], points[320], points[307], points[375]]
        mouth_width = math.dist(mouth_points[0], mouth_points[4])
        mouth_height = math.dist(mouth_points[2], mouth_points[6])
        mouth_ratio = mouth_height / mouth_width if mouth_width > 0 else 0
        nose_tip = points[1]
        chin = points[18]
        face_length = math.dist(nose_tip, chin)
        left_cheek = points[116]
        right_cheek = points[345]
        face_width = math.dist(left_cheek, right_cheek)
        face_ratio = face_length / face_width if face_width > 0 else 0
        return {'avg_ear': (left_ear + right_ear)/2, 'mouth_ratio': mouth_ratio, 'face_ratio': face_ratio}

    def analyze_audio(self, file_path):
        y, sr = librosa.load(file_path, sr=None)
        snd = parselmouth.Sound(file_path)
        pitch = snd.to_pitch()
        mean_pitch = parselmouth.praat.call(pitch, "Get mean", 0, 0, "Hertz")
        point_process = parselmouth.praat.call(snd, "To PointProcess (periodic, cc)", 75, 600)
        jitter = parselmouth.praat.call(point_process, "Get jitter (local)", 0, 0, 0.0001, 0.02, 1.3)
        shimmer = parselmouth.praat.call([snd, point_process], "Get shimmer (local)", 0, 0, 0.0001, 0.02, 1.3, 1.6)
        harmonicity = parselmouth.praat.call(snd, "To Harmonicity (cc)", 0.01, 75, 0.1, 1.0)
        hnr = parselmouth.praat.call(harmonicity, "Get mean", 0, 0)
        return {'pitch_mean': mean_pitch, 'jitter': jitter, 'shimmer': shimmer, 'hnr': hnr}

analyzer = DiabetesRiskAnalyzerAPI()

@app.post("/analyze_audio/")
async def analyze_audio_endpoint(file: UploadFile = File(...)):
    file_path = f"temp_{file.filename}"
    with open(file_path, "wb") as f:
        f.write(await file.read())
    features = analyzer.analyze_audio(file_path)
    os.remove(file_path)
    return {"audio_features": features}

@app.post("/analyze_frame/")
async def analyze_frame_endpoint(file: UploadFile = File(...)):
    file_path = f"temp_{file.filename}"
    with open(file_path, "wb") as f:
        f.write(await file.read())
    frame = cv2.imdecode(np.fromfile(file_path, np.uint8), cv2.IMREAD_COLOR)
    os.remove(file_path)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = analyzer.face_mesh.process(rgb_frame)
    metrics = {}
    if results.multi_face_landmarks:
        metrics = analyzer.extract_facial_metrics(results.multi_face_landmarks[0])
    return {"facial_metrics": metrics}

if __name__ == "__main__":
    uvicorn.run("main:app", host="localhost", port=8000, reload=True)
