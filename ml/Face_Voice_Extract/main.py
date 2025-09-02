import cv2
import mediapipe as mp
import sounddevice as sd
from scipy.io.wavfile import write
import librosa
import parselmouth
import numpy as np
import threading
import tkinter as tk
from tkinter import ttk
import time
import queue
import os
import math

class DiabetesRiskAnalyzer:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Diabetes Risk Analysis - Face & Voice Biomarkers")
        self.root.geometry("900x700")
        
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )
        self.mp_draw = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        self.cap = None
        self.recording = False
        self.breath_holding = False
        self.current_task = 0
        self.fs = 44100
        self.seconds = 15
        self.audio_data = None
        self.facial_metrics = []
        self.voice_features = {}
        self.task_results = {}
        self.breath_start_time = None
        
        self.tasks = [
            {
                "name": "Stress Reading Task",
                "text": "Reading under time pressure: Calculate seventeen multiplied by twenty-three, then add forty-nine and subtract twelve. Remember these numbers while reading: 391, 847, 523, 196, 785.",
                "duration": 12,
                "instruction": "Read quickly while remembering the numbers",
                "type": "voice"
            },
            {
                "name": "Sustained Phonation Task",
                "text": "Say 'Ahhhhhh' for as long as possible in one breath. Then repeat 'Pa-ta-ka-pa-ta-ka' rapidly for 10 seconds.",
                "duration": 15,
                "instruction": "Hold your face steady during phonation",
                "type": "voice"
            },
            {
                "name": "Breath Holding Task",
                "text": "Take a deep breath and hold it for as long as comfortable. Click 'Finished Breath Hold' when you release your breath.",
                "duration": 60,
                "instruction": "Keep your face visible and steady while holding breath",
                "type": "breath"
            }
        ]
        
        self.diabetic_baseline = {
            "stress_reading": {
                "pitch_mean": 145.0,
                "jitter": 0.025,
                "shimmer": 0.18,
                "hnr": 8.5,
                "spectral_centroid": 1200.0,
                "avg_ear": 0.18,
                "face_ratio": 1.45,
                "mouth_ratio": 0.25
            },
            "phonation": {
                "pitch_mean": 140.0,
                "jitter": 0.030,
                "shimmer": 0.22,
                "hnr": 7.8,
                "spectral_centroid": 950.0,
                "avg_ear": 0.17,
                "face_ratio": 1.48,
                "mouth_ratio": 0.28
            },
            "breath_hold": {
                "duration": 25.0,
                "avg_ear": 0.16,
                "face_ratio": 1.50,
                "ear_variability": 0.08
            }
        }
        
        self.setup_ui()
        
    def setup_ui(self):
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        title_label = ttk.Label(main_frame, text="Diabetes Risk Analysis System", font=("Arial", 18, "bold"))
        title_label.grid(row=0, column=0, columnspan=2, pady=10)
        
        subtitle_label = ttk.Label(main_frame, text="Voice & Facial Biomarker Assessment", font=("Arial", 12))
        subtitle_label.grid(row=1, column=0, columnspan=2, pady=5)
        
        task_frame = ttk.LabelFrame(main_frame, text="Current Task", padding="10")
        task_frame.grid(row=2, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=10)
        
        self.task_name_label = ttk.Label(task_frame, text="Ready to Start", font=("Arial", 14, "bold"))
        self.task_name_label.grid(row=0, column=0, columnspan=2, pady=5)
        
        self.instruction_label = ttk.Label(task_frame, text="Click 'Start Analysis' to begin the first task", font=("Arial", 10))
        self.instruction_label.grid(row=1, column=0, columnspan=2, pady=5)
        
        self.task_text = tk.Text(task_frame, height=4, width=80, wrap=tk.WORD, font=("Arial", 11))
        self.task_text.grid(row=2, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=10)
        
        control_frame = ttk.Frame(main_frame)
        control_frame.grid(row=3, column=0, columnspan=2, pady=20)
        
        self.start_button = ttk.Button(control_frame, text="Start Analysis", command=self.start_analysis)
        self.start_button.grid(row=0, column=0, padx=10)
        
        self.breath_done_button = ttk.Button(control_frame, text="Finished Breath Hold", command=self.finish_breath_hold, state="disabled")
        self.breath_done_button.grid(row=0, column=1, padx=10)
        
        self.next_task_button = ttk.Button(control_frame, text="Next Task", command=self.next_task, state="disabled")
        self.next_task_button.grid(row=0, column=2, padx=10)
        
        self.stop_button = ttk.Button(control_frame, text="Stop Analysis", command=self.stop_analysis, state="disabled")
        self.stop_button.grid(row=0, column=3, padx=10)
        
        self.calculate_risk_button = ttk.Button(control_frame, text="Calculate Risk", command=self.calculate_diabetes_risk, state="disabled")
        self.calculate_risk_button.grid(row=0, column=4, padx=10)
        
        progress_frame = ttk.Frame(main_frame)
        progress_frame.grid(row=4, column=0, columnspan=2, pady=10)
        
        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(progress_frame, variable=self.progress_var, maximum=100, length=400)
        self.progress_bar.grid(row=0, column=0, padx=10)
        
        self.status_label = ttk.Label(progress_frame, text="Ready to start analysis", font=("Arial", 10))
        self.status_label.grid(row=0, column=1, padx=10)
        
        results_frame = ttk.LabelFrame(main_frame, text="Analysis Results & Risk Assessment", padding="10")
        results_frame.grid(row=5, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=10)
        
        self.results_text = tk.Text(results_frame, height=10, width=80, font=("Courier", 9))
        self.results_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        results_scrollbar = ttk.Scrollbar(results_frame, orient="vertical", command=self.results_text.yview)
        results_scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S))
        self.results_text.configure(yscrollcommand=results_scrollbar.set)
        
    def start_analysis(self):
        try:
            self.cap = cv2.VideoCapture(0)
            if not self.cap.isOpened():
                self.status_label.config(text="Error: Cannot open camera")
                return
                
            self.recording = True
            self.start_button.config(state="disabled")
            self.stop_button.config(state="normal")
            self.update_task_display()
            
            task = self.tasks[self.current_task]
            self.seconds = task["duration"]
            self.status_label.config(text=f"Recording Task {self.current_task + 1}: {task['name']}")
            
            self.start_time = time.time()
            
            if task["type"] == "voice":
                self.audio_thread = threading.Thread(target=self.record_audio)
                self.audio_thread.start()
                
                self.video_thread = threading.Thread(target=self.process_video)
                self.video_thread.start()
                
                self.progress_thread = threading.Thread(target=self.update_progress)
                self.progress_thread.start()
            elif task["type"] == "breath":
                self.breath_holding = True
                self.breath_start_time = time.time()
                self.breath_done_button.config(state="normal")
                self.video_thread = threading.Thread(target=self.process_video_breath)
                self.video_thread.start()
                
        except Exception as e:
            self.status_label.config(text=f"Error starting analysis: {str(e)}")
            
    def update_task_display(self):
        if self.current_task < len(self.tasks):
            task = self.tasks[self.current_task]
            self.task_name_label.config(text=f"Task {self.current_task + 1}: {task['name']}")
            self.instruction_label.config(text=task["instruction"])
            self.task_text.delete(1.0, tk.END)
            self.task_text.insert(1.0, task["text"])
            
    def update_progress(self):
        while self.recording and hasattr(self, 'start_time'):
            elapsed = time.time() - self.start_time
            progress = min((elapsed / self.seconds) * 100, 100)
            self.progress_var.set(progress)
            
            if elapsed >= self.seconds:
                self.recording = False
                self.root.after(0, self.task_completed)
                break
                
            time.sleep(0.1)
            
    def finish_breath_hold(self):
        if self.breath_holding:
            self.breath_holding = False
            breath_duration = time.time() - self.breath_start_time
            self.task_results[f'task_{self.current_task + 1}'] = {'breath_duration': breath_duration}
            self.breath_done_button.config(state="disabled")
            self.recording = False
            self.root.after(0, self.task_completed)
            
    def task_completed(self):
        self.start_button.config(state="normal")
        self.stop_button.config(state="disabled")
        
        if self.current_task < len(self.tasks) - 1:
            self.next_task_button.config(state="normal")
            self.status_label.config(text=f"Task {self.current_task + 1} completed")
        else:
            self.calculate_risk_button.config(state="normal")
            self.status_label.config(text="All tasks completed - Ready for risk calculation")
            
        if self.cap:
            self.cap.release()
        cv2.destroyAllWindows()
        
    def next_task(self):
        self.current_task += 1
        self.next_task_button.config(state="disabled")
        self.update_task_display()
        self.progress_var.set(0)
        
    def stop_analysis(self):
        self.recording = False
        self.breath_holding = False
        self.start_button.config(state="normal")
        self.stop_button.config(state="disabled")
        self.breath_done_button.config(state="disabled")
        self.next_task_button.config(state="normal" if self.current_task < len(self.tasks) - 1 else "disabled")
        self.status_label.config(text="Analysis stopped")
        
        if self.cap:
            self.cap.release()
        cv2.destroyAllWindows()
        
    def record_audio(self):
        try:
            self.audio_data = sd.rec(int(self.seconds * self.fs), samplerate=self.fs, channels=1)
            sd.wait()
            
            if self.recording or not hasattr(self, 'start_time'):
                filename = f"task_{self.current_task + 1}_audio.wav"
                write(filename, self.fs, self.audio_data)
                self.analyze_audio(filename)
                
        except Exception as e:
            print(f"Audio error: {str(e)}")
            
    def analyze_audio(self, filename):
        try:
            y, sr = librosa.load(filename, sr=None)
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            
            spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
            spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
            zero_crossing_rate = librosa.feature.zero_crossing_rate(y)[0]
            
            snd = parselmouth.Sound(filename)
            pitch = snd.to_pitch()
            mean_pitch = parselmouth.praat.call(pitch, "Get mean", 0, 0, "Hertz")
            pitch_std = parselmouth.praat.call(pitch, "Get standard deviation", 0, 0, "Hertz")
            
            point_process = parselmouth.praat.call(snd, "To PointProcess (periodic, cc)", 75, 600)
            jitter = parselmouth.praat.call(point_process, "Get jitter (local)", 0, 0, 0.0001, 0.02, 1.3)
            shimmer = parselmouth.praat.call([snd, point_process], "Get shimmer (local)", 0, 0, 0.0001, 0.02, 1.3, 1.6)
            
            harmonicity = parselmouth.praat.call(snd, "To Harmonicity (cc)", 0.01, 75, 0.1, 1.0)
            hnr = parselmouth.praat.call(harmonicity, "Get mean", 0, 0)
            
            task_features = {
                'mfcc_mean': np.mean(mfccs, axis=1),
                'mfcc_std': np.std(mfccs, axis=1),
                'spectral_centroid': np.mean(spectral_centroid),
                'spectral_rolloff': np.mean(spectral_rolloff),
                'zero_crossing_rate': np.mean(zero_crossing_rate),
                'pitch_mean': mean_pitch if not math.isnan(mean_pitch) else 0,
                'pitch_std': pitch_std if not math.isnan(pitch_std) else 0,
                'jitter': jitter if not math.isnan(jitter) else 0,
                'shimmer': shimmer if not math.isnan(shimmer) else 0,
                'hnr': hnr if not math.isnan(hnr) else 0
            }
            
            self.voice_features[f'task_{self.current_task + 1}'] = task_features
            
            if os.path.exists(filename):
                os.remove(filename)
                
        except Exception as e:
            print(f"Audio analysis error: {str(e)}")
            
    def extract_facial_metrics(self, landmarks):
        try:
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
            
            return {
                'left_ear': left_ear,
                'right_ear': right_ear,
                'avg_ear': (left_ear + right_ear) / 2,
                'mouth_ratio': mouth_ratio,
                'face_ratio': face_ratio,
                'face_width': face_width,
                'face_length': face_length
            }
            
        except Exception as e:
            print(f"Facial metrics error: {str(e)}")
            return {}
            
    def process_video(self):
        face_detected = False
        frame_count = 0
        task_facial_metrics = []
        
        while self.recording:
            try:
                ret, frame = self.cap.read()
                if not ret:
                    break
                    
                frame = cv2.flip(frame, 1)
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = self.face_mesh.process(rgb_frame)
                
                if results.multi_face_landmarks:
                    face_detected = True
                    for face_landmarks in results.multi_face_landmarks:
                        self.mp_draw.draw_landmarks(
                            frame, 
                            face_landmarks, 
                            self.mp_face_mesh.FACEMESH_TESSELATION,
                            None,
                            self.mp_drawing_styles.get_default_face_mesh_tesselation_style()
                        )
                        
                        self.mp_draw.draw_landmarks(
                            frame, 
                            face_landmarks, 
                            self.mp_face_mesh.FACEMESH_CONTOURS,
                            None,
                            self.mp_drawing_styles.get_default_face_mesh_contours_style()
                        )
                        
                        if frame_count % 5 == 0:
                            metrics = self.extract_facial_metrics(face_landmarks)
                            if metrics:
                                task_facial_metrics.append(metrics)
                
                status_text = "Face Detected" if face_detected else "No Face Detected"
                cv2.putText(frame, status_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0) if face_detected else (0, 0, 255), 2)
                
                if hasattr(self, 'start_time'):
                    elapsed = time.time() - self.start_time
                    time_remaining = max(0, self.seconds - int(elapsed))
                    cv2.putText(frame, f"Task {self.current_task + 1}: {time_remaining}s", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                
                task_name = self.tasks[self.current_task]["name"]
                cv2.putText(frame, task_name, (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
                
                cv2.imshow("Diabetes Risk Analysis - Face Mesh", frame)
                
                if cv2.waitKey(1) & 0xFF == 27:
                    self.recording = False
                    break
                    
                frame_count += 1
                    
            except Exception as e:
                print(f"Video processing error: {str(e)}")
                break
                
        if task_facial_metrics:
            self.facial_metrics.append({
                f'task_{self.current_task + 1}': task_facial_metrics
            })
            
    def process_video_breath(self):
        face_detected = False
        frame_count = 0
        task_facial_metrics = []
        
        while self.breath_holding:
            try:
                ret, frame = self.cap.read()
                if not ret:
                    break
                    
                frame = cv2.flip(frame, 1)
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = self.face_mesh.process(rgb_frame)
                
                if results.multi_face_landmarks:
                    face_detected = True
                    for face_landmarks in results.multi_face_landmarks:
                        self.mp_draw.draw_landmarks(
                            frame, 
                            face_landmarks, 
                            self.mp_face_mesh.FACEMESH_TESSELATION,
                            None,
                            self.mp_drawing_styles.get_default_face_mesh_tesselation_style()
                        )
                        
                        self.mp_draw.draw_landmarks(
                            frame, 
                            face_landmarks, 
                            self.mp_face_mesh.FACEMESH_CONTOURS,
                            None,
                            self.mp_drawing_styles.get_default_face_mesh_contours_style()
                        )
                        
                        if frame_count % 5 == 0:
                            metrics = self.extract_facial_metrics(face_landmarks)
                            if metrics:
                                task_facial_metrics.append(metrics)
                
                status_text = "Face Detected - Holding Breath" if face_detected else "No Face Detected"
                cv2.putText(frame, status_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0) if face_detected else (0, 0, 255), 2)
                
                if self.breath_start_time:
                    elapsed = time.time() - self.breath_start_time
                    cv2.putText(frame, f"Breath Hold: {int(elapsed)}s", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                
                cv2.putText(frame, "Click 'Finished Breath Hold' when done", (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
                
                cv2.imshow("Diabetes Risk Analysis - Face Mesh", frame)
                
                if cv2.waitKey(1) & 0xFF == 27:
                    self.breath_holding = False
                    break
                    
                frame_count += 1
                    
            except Exception as e:
                print(f"Video processing error: {str(e)}")
                break
                
        if task_facial_metrics:
            self.facial_metrics.append({
                f'task_{self.current_task + 1}': task_facial_metrics
            })
            
    def calculate_diabetes_risk(self):
        try:
            results = f"""DIABETES RISK ASSESSMENT REPORT
{'='*60}

TASK-BY-TASK ANALYSIS:
{'='*30}
"""
            
            task_names = ["stress_reading", "phonation", "breath_hold"]
            
            for i, (task_name, baseline) in enumerate(self.diabetic_baseline.items()):
                task_num = i + 1
                results += f"\nTASK {task_num}: {task_name.upper().replace('_', ' ')}\n"
                results += f"{'-'*40}\n"
                
                if task_name == "breath_hold":
                    if f'task_{task_num}' in self.task_results:
                        breath_duration = self.task_results[f'task_{task_num}']['breath_duration']
                        results += f"Breath Hold Duration: {breath_duration:.1f}s (Baseline: {baseline['duration']:.1f}s)\n"
                        
                        for task_data in self.facial_metrics:
                            if f'task_{task_num}' in task_data:
                                metrics_list = task_data[f'task_{task_num}']
                                if metrics_list:
                                    avg_metrics = {
                                        key: np.mean([m.get(key, 0) for m in metrics_list]) 
                                        for key in metrics_list[0].keys()
                                    }
                                    ear_values = [m.get('avg_ear', 0) for m in metrics_list]
                                    ear_variability = np.std(ear_values)
                                    
                                    results += f"Eye Aspect Ratio: {avg_metrics['avg_ear']:.3f} (Baseline: {baseline['avg_ear']:.3f})\n"
                                    results += f"Face Ratio: {avg_metrics['face_ratio']:.3f} (Baseline: {baseline['face_ratio']:.3f})\n"
                                    results += f"Eye Variability: {ear_variability:.3f} (Baseline: {baseline['ear_variability']:.3f})\n"
                else:
                    if f'task_{task_num}' in self.voice_features:
                        features = self.voice_features[f'task_{task_num}']
                        results += f"Pitch Mean: {features['pitch_mean']:.2f} Hz (Baseline: {baseline['pitch_mean']:.2f} Hz)\n"
                        results += f"Jitter: {features['jitter']:.4f} (Baseline: {baseline['jitter']:.4f})\n"
                        results += f"Shimmer: {features['shimmer']:.4f} (Baseline: {baseline['shimmer']:.4f})\n"
                        results += f"HNR: {features['hnr']:.2f} dB (Baseline: {baseline['hnr']:.2f} dB)\n"
                        results += f"Spectral Centroid: {features['spectral_centroid']:.2f} (Baseline: {baseline['spectral_centroid']:.2f})\n"
                    
                    for task_data in self.facial_metrics:
                        if f'task_{task_num}' in task_data:
                            metrics_list = task_data[f'task_{task_num}']
                            if metrics_list:
                                avg_metrics = {
                                    key: np.mean([m.get(key, 0) for m in metrics_list]) 
                                    for key in metrics_list[0].keys()
                                }
                                results += f"Eye Aspect Ratio: {avg_metrics['avg_ear']:.3f} (Baseline: {baseline['avg_ear']:.3f})\n"
                                results += f"Face Ratio: {avg_metrics['face_ratio']:.3f} (Baseline: {baseline['face_ratio']:.3f})\n"
                                results += f"Mouth Ratio: {avg_metrics['mouth_ratio']:.3f} (Baseline: {baseline['mouth_ratio']:.3f})\n"
            
            overall_risk = 0
            risk_indicators = []
            
            for i, (task_name, baseline) in enumerate(self.diabetic_baseline.items()):
                task_num = i + 1
                task_risk = 0
                
                if task_name == "breath_hold":
                    if f'task_{task_num}' in self.task_results:
                        breath_duration = self.task_results[f'task_{task_num}']['breath_duration']
                        if breath_duration <= baseline['duration']:
                            task_risk += 2
                            risk_indicators.append(f"Short breath hold duration in Task {task_num}")
                else:
                    if f'task_{task_num}' in self.voice_features:
                        features = self.voice_features[f'task_{task_num}']
                        
                        if abs(features['pitch_mean'] - baseline['pitch_mean']) > 20:
                            task_risk += 1
                            risk_indicators.append(f"Abnormal pitch in Task {task_num}")
                        
                        if features['jitter'] >= baseline['jitter']:
                            task_risk += 2
                            risk_indicators.append(f"High jitter in Task {task_num}")
                        
                        if features['shimmer'] >= baseline['shimmer']:
                            task_risk += 2
                            risk_indicators.append(f"High shimmer in Task {task_num}")
                        
                        if features['hnr'] <= baseline['hnr']:
                            task_risk += 1
                            risk_indicators.append(f"Low voice quality in Task {task_num}")
                
                for task_data in self.facial_metrics:
                    if f'task_{task_num}' in task_data:
                        metrics_list = task_data[f'task_{task_num}']
                        if metrics_list:
                            avg_metrics = {
                                key: np.mean([m.get(key, 0) for m in metrics_list]) 
                                for key in metrics_list[0].keys()
                            }
                            
                            if avg_metrics['avg_ear'] <= baseline['avg_ear']:
                                task_risk += 1
                                risk_indicators.append(f"Reduced eye opening in Task {task_num}")
                            
                            if avg_metrics['face_ratio'] >= baseline['face_ratio']:
                                task_risk += 1
                                risk_indicators.append(f"Altered facial proportions in Task {task_num}")
                
                overall_risk += task_risk
            
            risk_level = "LOW"
            if overall_risk >= 12:
                risk_level = "HIGH"
            elif overall_risk >= 8:
                risk_level = "MODERATE"
            
            results += f"\nOVERALL RISK ASSESSMENT:\n"
            results += f"{'='*40}\n"
            results += f"Total Risk Score: {overall_risk}/18\n"
            results += f"Risk Level: {risk_level}\n\n"
            
            results += f"RISK INDICATORS:\n"
            results += f"{'-'*20}\n"
            if risk_indicators:
                for indicator in risk_indicators:
                    results += f"• {indicator}\n"
            else:
                results += "No significant risk indicators detected\n"
            
            results += f"\nRECOMMENDATIONS:\n"
            results += f"{'-'*20}\n"
            if risk_level == "HIGH":
                results += "• Consult healthcare provider for comprehensive diabetes screening\n"
                results += "• Monitor blood glucose levels regularly\n"
                results += "• Consider immediate lifestyle modifications\n"
                results += "• Follow up with endocrinologist\n"
            elif risk_level == "MODERATE":
                results += "• Schedule routine diabetes screening within 3 months\n"
                results += "• Monitor for diabetes symptoms\n"
                results += "• Maintain healthy lifestyle habits\n"
                results += "• Consider dietary consultation\n"
            else:
                results += "• Continue regular health checkups annually\n"
                results += "• Maintain current healthy habits\n"
                results += "• Stay physically active\n"
            
            results += f"\nREPORT SUMMARY:\n"
            results += f"{'-'*20}\n"
            results += f"Tasks Completed: {len(self.tasks)}\n"
            results += f"Voice Analysis Tasks: 2\n"
            results += f"Breath Hold Analysis: 1\n"
            results += f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}\n\n"
            results += "DISCLAIMER: This is a preliminary assessment tool and not a medical diagnosis.\n"
            results += "Please consult with healthcare professionals for proper medical evaluation.\n"
            
            self.update_results(results)
            self.calculate_risk_button.config(state="disabled")
            
        except Exception as e:
            self.update_results(f"Risk calculation error: {str(e)}")
            
    def update_results(self, text):
        self.results_text.delete(1.0, tk.END)
        self.results_text.insert(1.0, text)
        
    def run(self):
        try:
            self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
            self.root.mainloop()
        except Exception as e:
            print(f"Application error: {str(e)}")
            
    def on_closing(self):
        self.recording = False
        self.breath_holding = False
        if self.cap:
            self.cap.release()
        cv2.destroyAllWindows()
        self.root.destroy()

if __name__ == "__main__":
    app = DiabetesRiskAnalyzer()
    app.run()