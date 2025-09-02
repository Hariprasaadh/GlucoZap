import subprocess
import sys

'''def install_packages():
    packages = [
        'opencv-python',
        'mediapipe',
        'sounddevice',
        'scipy',
        'librosa',
        'praat-parselmouth',
        'numpy'
    ]
    
    for package in packages:
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
        except subprocess.CalledProcessError:
            print(f"Failed to install {package}")

install_packages()'''

import cv2
import mediapipe as mp
import sounddevice as sd
from scipy.io.wavfile import write
import librosa
import parselmouth
import numpy as np

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1)
mp_draw = mp.solutions.drawing_utils
cap = cv2.VideoCapture(0)

fs = 44100
seconds = 5

print("Recording voice for 5 seconds...")
audio = sd.rec(int(seconds * fs), samplerate=fs, channels=1)
sd.wait()
write("voice_sample.wav", fs, audio)

y, sr = librosa.load("voice_sample.wav", sr=None)
mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)

snd = parselmouth.Sound("voice_sample.wav")
pitch = snd.to_pitch()
mean_pitch = parselmouth.praat.call(pitch, "Get mean", 0, 0, "Hertz")
point_process = parselmouth.praat.call(snd, "To PointProcess (periodic, cc)", 75, 600)
jitter = parselmouth.praat.call(point_process, "Get jitter (local)", 0, 0, 0.0001, 0.02, 1.3)
shimmer = parselmouth.praat.call([snd, point_process], "Get shimmer (local)", 0, 0, 0.0001, 0.02, 1.3, 1.6)

print("MFCCs shape:", mfccs.shape)
print("Mean pitch (Hz):", mean_pitch)
print("Jitter:", jitter)
print("Shimmer:", shimmer)

while True:
    ret, frame = cap.read()
    if not ret:
        break
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb_frame)
    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            mp_draw.draw_landmarks(frame, face_landmarks, mp_face_mesh.FACEMESH_TESSELATION)
    cv2.imshow("Face Mesh", frame)
    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()