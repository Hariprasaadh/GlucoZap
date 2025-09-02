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

class VoiceFaceMeshApp:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Voice & Face Mesh Analysis")
        self.root.geometry("800x600")
        
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=3,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.mp_draw = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        self.cap = None
        self.recording = False
        self.fs = 44100
        self.seconds = 10
        self.audio_data = None
        self.audio_queue = queue.Queue()
        
        self.reading_text = """
        Please read the following text clearly and at a normal pace:
        
        "Managing daily activities while maintaining a healthy lifestyle can be challenging.
        Sometimes we face unexpected obstacles that test our resilience and determination.
        It's important to remember that small consistent changes lead to significant improvements.
        Taking care of our physical and mental health requires dedication and self-compassion.
        Every step forward, no matter how small, is progress worth celebrating."
        """
        
        self.setup_ui()
        
    def setup_ui(self):
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        title_label = ttk.Label(main_frame, text="Voice & Face Mesh Analysis", font=("Arial", 16, "bold"))
        title_label.grid(row=0, column=0, columnspan=2, pady=10)
        
        text_frame = ttk.LabelFrame(main_frame, text="Reading Task", padding="10")
        text_frame.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=10)
        
        text_widget = tk.Text(text_frame, height=8, width=70, wrap=tk.WORD, font=("Arial", 11))
        text_widget.insert("1.0", self.reading_text)
        text_widget.config(state=tk.DISABLED)
        text_widget.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        scrollbar = ttk.Scrollbar(text_frame, orient="vertical", command=text_widget.yview)
        scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S))
        text_widget.configure(yscrollcommand=scrollbar.set)
        
        control_frame = ttk.Frame(main_frame)
        control_frame.grid(row=2, column=0, columnspan=2, pady=20)
        
        self.start_button = ttk.Button(control_frame, text="Start Analysis", command=self.start_analysis, style="Accent.TButton")
        self.start_button.grid(row=0, column=0, padx=10)
        
        self.stop_button = ttk.Button(control_frame, text="Stop Analysis", command=self.stop_analysis, state="disabled")
        self.stop_button.grid(row=0, column=1, padx=10)
        
        self.status_label = ttk.Label(main_frame, text="Ready to start analysis", font=("Arial", 10))
        self.status_label.grid(row=3, column=0, columnspan=2, pady=10)
        
        results_frame = ttk.LabelFrame(main_frame, text="Analysis Results", padding="10")
        results_frame.grid(row=4, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=10)
        
        self.results_text = tk.Text(results_frame, height=8, width=70, font=("Courier", 9))
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
            self.status_label.config(text="Recording voice and analyzing face mesh...")
            
            self.audio_thread = threading.Thread(target=self.record_audio)
            self.audio_thread.start()
            
            self.video_thread = threading.Thread(target=self.process_video)
            self.video_thread.start()
            
        except Exception as e:
            self.status_label.config(text=f"Error starting analysis: {str(e)}")
            
    def stop_analysis(self):
        self.recording = False
        self.start_button.config(state="normal")
        self.stop_button.config(state="disabled")
        self.status_label.config(text="Analysis stopped")
        
        if self.cap:
            self.cap.release()
        cv2.destroyAllWindows()
        
    def record_audio(self):
        try:
            self.audio_data = sd.rec(int(self.seconds * self.fs), samplerate=self.fs, channels=1)
            sd.wait()
            
            if self.recording:
                write("voice_sample.wav", self.fs, self.audio_data)
                self.analyze_audio()
                
        except Exception as e:
            self.audio_queue.put(f"Audio error: {str(e)}")
            
    def analyze_audio(self):
        try:
            y, sr = librosa.load("voice_sample.wav", sr=None)
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            
            snd = parselmouth.Sound("voice_sample.wav")
            pitch = snd.to_pitch()
            mean_pitch = parselmouth.praat.call(pitch, "Get mean", 0, 0, "Hertz")
            
            point_process = parselmouth.praat.call(snd, "To PointProcess (periodic, cc)", 75, 600)
            jitter = parselmouth.praat.call(point_process, "Get jitter (local)", 0, 0, 0.0001, 0.02, 1.3)
            shimmer = parselmouth.praat.call([snd, point_process], "Get shimmer (local)", 0, 0, 0.0001, 0.02, 1.3, 1.6)
            
            results = f"""Voice Analysis Results:
========================
MFCCs Shape: {mfccs.shape}
Mean Pitch (Hz): {mean_pitch:.2f}
Jitter: {jitter:.6f}
Shimmer: {shimmer:.6f}
MFCC Means: {np.mean(mfccs, axis=1)[:5]}

Analysis completed at: {time.strftime("%Y-%m-%d %H:%M:%S")}
"""
            
            self.root.after(0, lambda: self.update_results(results))
            
            if os.path.exists("voice_sample.wav"):
                os.remove("voice_sample.wav")
                
        except Exception as e:
            self.root.after(0, lambda: self.update_results(f"Audio analysis error: {str(e)}"))
            
    def update_results(self, text):
        self.results_text.delete(1.0, tk.END)
        self.results_text.insert(1.0, text)
        
    def process_video(self):
        face_detected = False
        
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
                            self.mp_face_mesh.FACEMESH_CONTOURS,
                            None,
                            self.mp_drawing_styles.get_default_face_mesh_contours_style()
                        )
                
                status_text = "Face Detected" if face_detected else "No Face Detected"
                cv2.putText(frame, status_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0) if face_detected else (0, 0, 255), 2)
                
                time_remaining = max(0, self.seconds - int(time.time() - getattr(self, 'start_time', time.time())))
                cv2.putText(frame, f"Recording: {time_remaining}s", (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                
                cv2.imshow("Face Mesh Analysis", frame)
                
                if cv2.waitKey(1) & 0xFF == 27:
                    self.recording = False
                    break
                    
            except Exception as e:
                print(f"Video processing error: {str(e)}")
                break
                
        if hasattr(self, 'start_time'):
            delattr(self, 'start_time')
            
    def run(self):
        try:
            self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
            self.root.mainloop()
        except Exception as e:
            print(f"Application error: {str(e)}")
            
    def on_closing(self):
        self.recording = False
        if self.cap:
            self.cap.release()
        cv2.destroyAllWindows()
        self.root.destroy()

if __name__ == "__main__":
    app = VoiceFaceMeshApp()
    app.run()