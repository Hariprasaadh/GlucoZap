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
        self.root.title("Diabetes Risk Analysis - Voice & Face Biomarkers")
        self.root.geometry("950x750")
        
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
                "name": "Voice-Based Blood Glucose Estimation",
                "text": "Managing diabetes requires constant attention to diet, exercise, and medication. Blood sugar levels can fluctuate throughout the day based on what we eat, how active we are, and our stress levels. Regular monitoring helps maintain healthy glucose ranges and prevents complications.",
                "duration": 15,
                "instruction": "Read this text clearly while maintaining steady facial position",
                "type": "voice",
                "description": "Analyzes voice patterns and facial tension for glucose response estimation"
            },
            {
                "name": "Chewing Pattern Simulation",
                "text": "Healthy eating habits include chewing food thoroughly and eating at a steady pace. Good oral health and proper chewing patterns support better digestion and glucose metabolism.",
                "duration": 12,
                "instruction": "Read while simulating chewing motions - move your jaw and lips naturally",
                "type": "voice_chewing",
                "description": "Captures jaw and facial activity patterns linked to glucose metabolism"
            },
            {
                "name": "Breath Holding Test",
                "text": "Take a deep breath and hold it for as long as comfortable. This test measures your cardio-metabolic response. Click 'Finished Breath Hold' when you release your breath.",
                "duration": 60,
                "instruction": "Hold breath as long as possible, keep face visible and steady",
                "type": "breath",
                "description": "Measures cardio-metabolic response via facial metrics during breath holding"
            }
        ]
        
        self.diabetic_baseline = {
            "glucose_estimation": {
                "pitch_mean": 148.0,
                "jitter": 0.028,
                "shimmer": 0.19,
                "hnr": 8.2,
                "spectral_centroid": 1180.0,
                "avg_ear": 0.175,
                "face_ratio": 1.47,
                "mouth_ratio": 0.24
            },
            "chewing_pattern": {
                "pitch_mean": 142.0,
                "jitter": 0.032,
                "shimmer": 0.21,
                "hnr": 7.9,
                "spectral_centroid": 1050.0,
                "avg_ear": 0.168,
                "face_ratio": 1.49,
                "mouth_ratio": 0.31,
                "jaw_movement_variability": 0.15
            },
            "breath_hold": {
                "duration": 22.0,
                "avg_ear": 0.158,
                "face_ratio": 1.52,
                "ear_variability": 0.09,
                "face_tension_increase": 0.12
            }
        }
        
        self.setup_ui()
        
    def setup_ui(self):
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        title_label = ttk.Label(main_frame, text="Diabetes Risk Analysis System", font=("Arial", 18, "bold"))
        title_label.grid(row=0, column=0, columnspan=2, pady=10)
        
        subtitle_label = ttk.Label(main_frame, text="Advanced Voice & Facial Biomarker Assessment", font=("Arial", 12))
        subtitle_label.grid(row=1, column=0, columnspan=2, pady=5)
        
        task_frame = ttk.LabelFrame(main_frame, text="Current Task", padding="10")
        task_frame.grid(row=2, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=10)
        
        self.task_name_label = ttk.Label(task_frame, text="Ready to Start", font=("Arial", 14, "bold"))
        self.task_name_label.grid(row=0, column=0, columnspan=2, pady=5)
        
        self.task_description = ttk.Label(task_frame, text="", font=("Arial", 10, "italic"))
        self.task_description.grid(row=1, column=0, columnspan=2, pady=2)
        
        self.instruction_label = ttk.Label(task_frame, text="Click 'Start Analysis' to begin the first task", font=("Arial", 10))
        self.instruction_label.grid(row=2, column=0, columnspan=2, pady=5)
        
        self.task_text = tk.Text(task_frame, height=4, width=85, wrap=tk.WORD, font=("Arial", 11))
        self.task_text.grid(row=3, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=10)
        
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
        
        self.calculate_risk_button = ttk.Button(control_frame, text="Generate Report", command=self.calculate_diabetes_risk, state="disabled")
        self.calculate_risk_button.grid(row=0, column=4, padx=10)
        
        progress_frame = ttk.Frame(main_frame)
        progress_frame.grid(row=4, column=0, columnspan=2, pady=10)
        
        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(progress_frame, variable=self.progress_var, maximum=100, length=450)
        self.progress_bar.grid(row=0, column=0, padx=10)
        
        self.status_label = ttk.Label(progress_frame, text="Ready to start analysis", font=("Arial", 10))
        self.status_label.grid(row=0, column=1, padx=10)
        
        results_frame = ttk.LabelFrame(main_frame, text="Diabetes Risk Analysis Report", padding="10")
        results_frame.grid(row=5, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=10)
        
        self.results_text = tk.Text(results_frame, height=12, width=85, font=("Courier", 9))
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
            
            if task["type"] in ["voice", "voice_chewing"]:
                self.audio_thread = threading.Thread(target=self.record_audio)
                self.audio_thread.start()
                
                if task["type"] == "voice_chewing":
                    self.video_thread = threading.Thread(target=self.process_video_chewing)
                else:
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
            self.task_description.config(text=task["description"])
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
            self.status_label.config(text="All tasks completed - Ready to generate report")
            
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
            spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)[0]
            
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
                'spectral_bandwidth': np.mean(spectral_bandwidth),
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
            
            upper_lip = points[13]
            lower_lip = points[14]
            lip_distance = math.dist(upper_lip, lower_lip)
            
            left_jaw = points[172]
            right_jaw = points[397]
            jaw_width = math.dist(left_jaw, right_jaw)
            
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
                'face_length': face_length,
                'lip_distance': lip_distance,
                'jaw_width': jaw_width
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
                        
                        if frame_count % 3 == 0:
                            metrics = self.extract_facial_metrics(face_landmarks)
                            if metrics:
                                task_facial_metrics.append(metrics)
                
                status_text = "Voice & Face Analysis" if face_detected else "No Face Detected"
                cv2.putText(frame, status_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0) if face_detected else (0, 0, 255), 2)
                
                if hasattr(self, 'start_time'):
                    elapsed = time.time() - self.start_time
                    time_remaining = max(0, self.seconds - int(elapsed))
                    cv2.putText(frame, f"Task {self.current_task + 1}: {time_remaining}s", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                
                task_name = self.tasks[self.current_task]["name"]
                cv2.putText(frame, "Glucose Estimation", (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
                
                cv2.imshow("Diabetes Risk Analysis - Glucose Estimation", frame)
                
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
            
    def process_video_chewing(self):
        face_detected = False
        frame_count = 0
        task_facial_metrics = []
        jaw_positions = []
        
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
                        
                        if frame_count % 2 == 0:
                            metrics = self.extract_facial_metrics(face_landmarks)
                            if metrics:
                                task_facial_metrics.append(metrics)
                                jaw_positions.append(metrics['jaw_width'])
                
                status_text = "Chewing Analysis" if face_detected else "No Face Detected"
                cv2.putText(frame, status_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0) if face_detected else (0, 0, 255), 2)
                
                if hasattr(self, 'start_time'):
                    elapsed = time.time() - self.start_time
                    time_remaining = max(0, self.seconds - int(elapsed))
                    cv2.putText(frame, f"Task {self.current_task + 1}: {time_remaining}s", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                
                cv2.putText(frame, "Simulate chewing while reading", (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
                
                cv2.imshow("Diabetes Risk Analysis - Chewing Pattern", frame)
                
                if cv2.waitKey(1) & 0xFF == 27:
                    self.recording = False
                    break
                    
                frame_count += 1
                    
            except Exception as e:
                print(f"Video processing error: {str(e)}")
                break
                
        if task_facial_metrics and jaw_positions:
            jaw_movement_variability = np.std(jaw_positions) if len(jaw_positions) > 1 else 0
            for metrics in task_facial_metrics:
                metrics['jaw_movement_variability'] = jaw_movement_variability
            
            self.facial_metrics.append({
                f'task_{self.current_task + 1}': task_facial_metrics
            })
            
    def process_video_breath(self):
        face_detected = False
        frame_count = 0
        task_facial_metrics = []
        initial_metrics = None
        
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
                                if initial_metrics is None:
                                    initial_metrics = metrics.copy()
                                
                                face_tension_increase = abs(metrics['face_ratio'] - initial_metrics['face_ratio'])
                                metrics['face_tension_increase'] = face_tension_increase
                                task_facial_metrics.append(metrics)
                
                status_text = "Breath Hold Analysis" if face_detected else "No Face Detected"
                cv2.putText(frame, status_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0) if face_detected else (0, 0, 255), 2)
                
                if self.breath_start_time:
                    elapsed = time.time() - self.breath_start_time
                    cv2.putText(frame, f"Breath Hold: {int(elapsed)}s", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                
                cv2.putText(frame, "Click 'Finished Breath Hold' when done", (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
                
                cv2.imshow("Diabetes Risk Analysis - Breath Hold Test", frame)
                
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
            results = f"""COMPREHENSIVE DIABETES RISK ANALYSIS REPORT
{'='*70}

BIOMARKER ASSESSMENT BY TASK:
{'='*35}
"""
            
            task_names = ["glucose_estimation", "chewing_pattern", "breath_hold"]
            task_descriptions = [
                "Voice-Based Blood Glucose Estimation",
                "Chewing Pattern & Glucose Metabolism Analysis", 
                "Cardio-Metabolic Breath Hold Response"
            ]
            
            overall_risk = 0
            risk_indicators = []
            
            for i, (task_name, baseline) in enumerate(self.diabetic_baseline.items()):
                task_num = i + 1
                results += f"\nTASK {task_num}: {task_descriptions[i].upper()}\n"
                results += f"{'-'*50}\n"
                
                if task_name == "breath_hold":
                    if f'task_{task_num}' in self.task_results:
                        breath_duration = self.task_results[f'task_{task_num}']['breath_duration']
                        results += f"Breath Hold Duration: {breath_duration:.1f}s\n"
                        results += f"Diabetic Baseline: {baseline['duration']:.1f}s\n"
                        
                        if breath_duration <= baseline['duration']:
                            overall_risk += 3
                            risk_indicators.append("Reduced breath hold capacity indicating cardio-metabolic stress")
                        
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
                                    
                                    results += f"Average Eye Aspect Ratio: {avg_metrics['avg_ear']:.3f}\n"
                                    results += f"Diabetic Baseline: {baseline['avg_ear']:.3f}\n"
                                    results += f"Face Ratio: {avg_metrics['face_ratio']:.3f}\n"
                                    results += f"Diabetic Baseline: {baseline['face_ratio']:.3f}\n"
                                    results += f"Eye Variability: {ear_variability:.3f}\n"
                                    results += f"Diabetic Baseline: {baseline['ear_variability']:.3f}\n"
                                    results += f"Face Tension Increase: {avg_metrics.get('face_tension_increase', 0):.3f}\n"
                                    results += f"Diabetic Baseline: {baseline['face_tension_increase']:.3f}\n"
                                    
                                    if avg_metrics['avg_ear'] <= baseline['avg_ear']:
                                        overall_risk += 2
                                        risk_indicators.append("Reduced eye opening during breath hold")
                                    
                                    if avg_metrics['face_ratio'] >= baseline['face_ratio']:
                                        overall_risk += 2
                                        risk_indicators.append("Altered facial proportions under metabolic stress")
                                    
                                    if ear_variability >= baseline['ear_variability']:
                                        overall_risk += 2
                                        risk_indicators.append("High eye movement variability during breath hold")
                else:
                    if f'task_{task_num}' in self.voice_features:
                        features = self.voice_features[f'task_{task_num}']
                        results += f"VOICE BIOMARKERS:\n"
                        results += f"Pitch Mean: {features['pitch_mean']:.2f} Hz\n"
                        results += f"Diabetic Baseline: {baseline['pitch_mean']:.2f} Hz\n"
                        results += f"Jitter (Voice Stability): {features['jitter']:.4f}\n"
                        results += f"Diabetic Baseline: {baseline['jitter']:.4f}\n"
                        results += f"Shimmer (Amplitude Variation): {features['shimmer']:.4f}\n"
                        results += f"Diabetic Baseline: {baseline['shimmer']:.4f}\n"
                        results += f"HNR (Voice Quality): {features['hnr']:.2f} dB\n"
                        results += f"Diabetic Baseline: {baseline['hnr']:.2f} dB\n"
                        results += f"Spectral Centroid: {features['spectral_centroid']:.2f}\n"
                        results += f"Diabetic Baseline: {baseline['spectral_centroid']:.2f}\n"
                        results += f"MFCC Analysis: {len(features['mfcc_mean'])} coefficients extracted\n\n"
                        
                        if abs(features['pitch_mean'] - baseline['pitch_mean']) > 25:
                            overall_risk += 2
                            risk_indicators.append(f"Abnormal pitch patterns in {task_descriptions[i]}")
                        
                        if features['jitter'] >= baseline['jitter']:
                            overall_risk += 3
                            risk_indicators.append(f"High voice instability in {task_descriptions[i]}")
                        
                        if features['shimmer'] >= baseline['shimmer']:
                            overall_risk += 3
                            risk_indicators.append(f"High amplitude variation in {task_descriptions[i]}")
                        
                        if features['hnr'] <= baseline['hnr']:
                            overall_risk += 2
                            risk_indicators.append(f"Reduced voice quality in {task_descriptions[i]}")
                    
                    for task_data in self.facial_metrics:
                        if f'task_{task_num}' in task_data:
                            metrics_list = task_data[f'task_{task_num}']
                            if metrics_list:
                                avg_metrics = {
                                    key: np.mean([m.get(key, 0) for m in metrics_list]) 
                                    for key in metrics_list[0].keys()
                                }
                                
                                results += f"FACIAL BIOMARKERS:\n"
                                results += f"Eye Aspect Ratio: {avg_metrics['avg_ear']:.3f}\n"
                                results += f"Diabetic Baseline: {baseline['avg_ear']:.3f}\n"
                                results += f"Face Ratio: {avg_metrics['face_ratio']:.3f}\n"
                                results += f"Diabetic Baseline: {baseline['face_ratio']:.3f}\n"
                                results += f"Mouth Mobility Ratio: {avg_metrics['mouth_ratio']:.3f}\n"
                                results += f"Diabetic Baseline: {baseline['mouth_ratio']:.3f}\n"
                                
                                if task_name == "chewing_pattern":
                                    jaw_var = avg_metrics.get('jaw_movement_variability', 0)
                                    results += f"Jaw Movement Variability: {jaw_var:.3f}\n"
                                    results += f"Diabetic Baseline: {baseline['jaw_movement_variability']:.3f}\n"
                                    
                                    if jaw_var >= baseline['jaw_movement_variability']:
                                        overall_risk += 2
                                        risk_indicators.append("Irregular chewing patterns linked to glucose metabolism")
                                
                                if avg_metrics['avg_ear'] <= baseline['avg_ear']:
                                    overall_risk += 1
                                    risk_indicators.append(f"Reduced eye opening in {task_descriptions[i]}")
                                
                                if avg_metrics['face_ratio'] >= baseline['face_ratio']:
                                    overall_risk += 1
                                    risk_indicators.append(f"Altered facial proportions in {task_descriptions[i]}")
                                
                                if avg_metrics['mouth_ratio'] <= baseline['mouth_ratio']:
                                    overall_risk += 1
                                    risk_indicators.append(f"Reduced mouth mobility in {task_descriptions[i]}")
            
            risk_level = "LOW"
            if overall_risk >= 18:
                risk_level = "VERY HIGH"
            elif overall_risk >= 14:
                risk_level = "HIGH"
            elif overall_risk >= 10:
                risk_level = "MODERATE"
            elif overall_risk >= 6:
                risk_level = "MILD"
            
            results += f"\nCOMPREHENSIVE RISK ASSESSMENT:\n"
            results += f"{'='*45}\n"
            results += f"Total Risk Score: {overall_risk}/24\n"
            results += f"Risk Level: {risk_level}\n"
            results += f"Tasks Analyzed: {len(self.tasks)}\n"
            results += f"Biomarkers Evaluated: Voice (Pitch, Jitter, Shimmer, HNR, MFCCs)\n"
            results += f"                     Facial (Eye ratios, Face geometry, Mouth mobility)\n"
            results += f"                     Metabolic (Breath capacity, Stress response)\n\n"
            
            results += f"DETECTED RISK INDICATORS:\n"
            results += f"{'-'*30}\n"
            if risk_indicators:
                for i, indicator in enumerate(risk_indicators, 1):
                    results += f"{i:2d}. {indicator}\n"
            else:
                results += "No significant diabetes risk indicators detected\n"
            
            results += f"\nCLINICAL RECOMMENDATIONS:\n"
            results += f"{'-'*30}\n"
            if risk_level == "VERY HIGH":
                results += "• URGENT: Immediate medical consultation required\n"
                results += "• Comprehensive diabetes screening within 48-72 hours\n"
                results += "• Blood glucose monitoring and HbA1c testing\n"
                results += "• Endocrinologist referral recommended\n"
                results += "• Begin lifestyle modifications immediately\n"
            elif risk_level == "HIGH":
                results += "• Medical consultation within 1-2 weeks\n"
                results += "• Complete diabetes screening panel\n"
                results += "• Monitor blood glucose levels regularly\n"
                results += "• Consider preventive lifestyle changes\n"
                results += "• Follow up with healthcare provider\n"
            elif risk_level == "MODERATE":
                results += "• Schedule diabetes screening within 1-3 months\n"
                results += "• Monitor for diabetes symptoms regularly\n"
                results += "• Implement healthy lifestyle habits\n"
                results += "• Consider dietary consultation\n"
                results += "• Maintain regular physical activity\n"
            elif risk_level == "MILD":
                results += "• Routine diabetes screening within 6 months\n"
                results += "• Monitor health indicators\n"
                results += "• Maintain healthy lifestyle practices\n"
                results += "• Annual health checkups recommended\n"
            else:
                results += "• Continue current healthy lifestyle\n"
                results += "• Annual routine health screenings\n"
                results += "• Stay physically active\n"
                results += "• Maintain balanced diet\n"
            
            results += f"\nTECHNICAL ANALYSIS SUMMARY:\n"
            results += f"{'-'*35}\n"
            results += f"Voice Analysis Completed: {len(self.voice_features)}/2 tasks\n"
            results += f"Facial Analysis Completed: {len(self.facial_metrics)}/{len(self.tasks)} tasks\n"
            results += f"Breath Analysis Completed: {'Yes' if any('task_3' in str(data) for data in self.task_results.values()) else 'No'}\n"
            results += f"Total Biomarkers Analyzed: {sum(len(features) for features in self.voice_features.values()) + sum(len(metrics[list(metrics.keys())[0]]) if metrics else 0 for metrics in self.facial_metrics)}\n"
            
            results += f"\nREPORT GENERATED:\n"
            results += f"{'-'*20}\n"
            results += f"Date/Time: {time.strftime('%Y-%m-%d %H:%M:%S')}\n"
            results += f"Analysis Duration: Approx. {sum(task['duration'] for task in self.tasks)} seconds\n"
            results += f"System Version: Diabetes Risk Analyzer v2.0\n\n"
            
            results += f"IMPORTANT MEDICAL DISCLAIMER:\n"
            results += f"{'-'*35}\n"
            results += "This analysis provides preliminary biomarker assessment and is NOT a\n"
            results += "substitute for professional medical diagnosis. Results should be discussed\n"
            results += "with qualified healthcare professionals. Individual results may vary and\n"
            results += "should be interpreted in context of overall health status, family history,\n"
            results += "and other clinical factors. This tool is designed for screening purposes\n"
            results += "and early detection support only.\n"
            
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