from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import joblib
import uvicorn

# Load trained pipeline
pipeline = joblib.load(r"C:\Users\Asus\OneDrive\Documents\Diabetes_Pred\diabetes_risk_model.pkl")

app = FastAPI(title="Diabetes Risk Predictor API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace "*" with specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict")
def predict(data: dict):
    input_data = pd.DataFrame([{
        "Age": data["Age"],
        "Gender": data["Gender"],
        "Height": int(data["Height"]),
        "Weight": int(data["Weight"]),
        "Waist Circumference": int(data["Waist Circumference"]),
        "Hip Circumference": int(data["Hip Circumference"]),
        "Family History": data["Family History"],
        "Hypertension": data["Hypertension"],
        "Heart Disease": data["Heart Disease"],
        "Smoking": data["Smoking"],
        "Physical Activity": data["Physical Activity"],
        "Diet": data["Diet"],
        "Alcohol": data["Alcohol"],
        "Sleep": data["Sleep"],
        "Stress": data["Stress"],
        "Skin/Neck Features": data["Skin/Neck Features"],
        "Foot Health": data["Foot Health"],
        "Facial/Skin": data["Facial/Skin"],
        "Breathing Patterns": data["Breathing Patterns"],
        "Blood Glucose": int(data["Blood Glucose"]),
        "HbA1c": float(data["HbA1c"]),
    }])

    prediction = pipeline.predict(input_data)[0]
    return {"Diabetes Risk Confidence Score": round(float(prediction), 2)}

if __name__ == "__main__":
    uvicorn.run("main:app", host="localhost", port=8000, reload=True)
