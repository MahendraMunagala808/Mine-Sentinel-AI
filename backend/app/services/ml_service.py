import os
import joblib
import pandas as pd
import warnings
from typing import Dict, Any

class RiskPredictor:
    def __init__(self):
        self.model = None
        self._load_model()

    def _load_model(self):
        try:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            model_path = os.getenv('ML_MODEL_PATH', 'ml/models/random_forest_model.joblib')
            full_path = os.path.join(base_dir, model_path)
            
            if os.path.exists(full_path):
                with warnings.catch_warnings():
                    warnings.filterwarnings("ignore", category=DeprecationWarning)
                    self.model = joblib.load(full_path)
                print("ML Model loaded successfully.")
            else:
                print(f"Warning: ML model not found at {full_path}. Will use fallback rules.")
        except Exception as e:
            print(f"Error loading model: {e}")

    def predict_risk(self, data: Dict[str, Any]) -> int:
        gas = float(data.get('gas', 0.0) or 0.0)
        co = float(data.get('co', 0.0) or 0.0)
        temp = float(data.get('temperature', 0.0) or 0.0)
        hum = float(data.get('humidity', 0.0) or 0.0)
        flame = int(data.get('flame', 0) or 0)

        # Immediate physical critical check overrides everything
        if flame == 1 or gas > 850 or co > 120 or temp > 50:
            return 2 # Critical

        # Deterministic Safe Guardrail: Clean normal baseline conditions are always Safe
        if gas <= 450 and co <= 50 and temp <= 40 and hum <= 80:
            return 0 # Safe

        # Use ML model if available for complex / warning states
        if self.model:
            try:
                # Prepare data for model prediction
                df = pd.DataFrame([{
                    'Gas': gas,
                    'CO': co,
                    'Temperature': temp,
                    'Humidity': hum,
                    'Flame': flame
                }])
                
                prediction = int(self.model.predict(df)[0])
                return prediction
            except Exception as e:
                print(f"Prediction error: {e}")
        
        # Fallback to calibrated rules if model fails or isn't loaded
        if gas > 850 or co > 120 or temp > 50:
            return 2
        if gas > 450 or co > 50 or temp > 40 or hum > 80:
            return 1
            
        return 0

predictor = RiskPredictor()

def get_risk_label(risk_level: int) -> str:
    labels = {0: "Safe", 1: "Warning", 2: "Critical"}
    return labels.get(risk_level, "Unknown")
