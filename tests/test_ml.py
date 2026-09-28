import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))
from app.services.ml_service import predictor, get_risk_label

def test_ml_safe_prediction():
    # Normal safe conditions
    data = {
        'gas': 150,
        'co': 10,
        'temperature': 25,
        'humidity': 50,
        'flame': 0
    }
    risk = predictor.predict_risk(data)
    # Could be 0 depending on the model, but fallback logic ensures it
    assert risk == 0
    assert get_risk_label(risk) == "Safe"

def test_ml_flame_critical_override():
    # Normal conditions but flame detected
    data = {
        'gas': 150,
        'co': 10,
        'temperature': 25,
        'humidity': 50,
        'flame': 1
    }
    risk = predictor.predict_risk(data)
    # Flame always overrides to 2 (Critical)
    assert risk == 2
    assert get_risk_label(risk) == "Critical"

def test_ml_gas_critical():
    # Very high gas
    data = {
        'gas': 900,
        'co': 10,
        'temperature': 25,
        'humidity': 50,
        'flame': 0
    }
    risk = predictor.predict_risk(data)
    assert risk == 2
    assert get_risk_label(risk) == "Critical"
