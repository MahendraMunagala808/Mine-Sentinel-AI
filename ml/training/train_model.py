import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import json

import argparse

def train_and_evaluate(mode="auto", custom_path=None):
    print("Starting ML Model Training for MineSentinel AI...")
    
    # Paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_dir = os.path.join(base_dir, 'models')
    eval_dir = os.path.join(base_dir, 'evaluation')
    
    # Reorganized dataset paths
    synthetic_path = os.path.join(base_dir, 'dataset', 'raw', 'synthetic', 'synthetic_mine_data.csv')
    legacy_synthetic_path = os.path.join(base_dir, 'dataset', 'synthetic_mine_data.csv')
    hardware_path = os.path.join(base_dir, 'dataset', 'raw', 'hardware_live', 'live_hardware_telemetry.csv')
    combined_path = os.path.join(base_dir, 'dataset', 'processed', 'training_combined.csv')
    
    # Determine dataset path based on mode
    if custom_path:
        dataset_path = custom_path
    elif mode == "synthetic":
        dataset_path = synthetic_path if os.path.exists(synthetic_path) else legacy_synthetic_path
    elif mode == "hardware":
        dataset_path = hardware_path
    elif mode == "combined":
        dataset_path = combined_path
    else:  # auto mode
        if os.path.exists(combined_path):
            dataset_path = combined_path
            mode = "combined"
        elif os.path.exists(synthetic_path):
            dataset_path = synthetic_path
            mode = "synthetic"
        else:
            dataset_path = legacy_synthetic_path
            mode = "synthetic (legacy)"
            
    print(f"Data Mode: [{mode.upper()}] | Loading dataset from: {dataset_path}")
    
    # Ensure directories exist
    os.makedirs(model_dir, exist_ok=True)
    os.makedirs(eval_dir, exist_ok=True)
    
    # Load dataset
    if not os.path.exists(dataset_path):
        print(f"Error: Dataset not found at {dataset_path}")
        print("Please run generate_dataset.py or export_live_dataset.py first.")
        return
        
    df = pd.read_csv(dataset_path)
    print(f"Loaded dataset with {len(df)} records.")
    
    # Inject realistic industrial sensor noise & boundary ADC jitter (prevents artificial 100% overfitting)
    np.random.seed(42)
    df_noisy = df.copy()
    df_noisy['Gas'] = np.clip(df_noisy['Gas'] + np.random.normal(0, 3.2, size=len(df)), 0, 2000).round(2)
    df_noisy['CO'] = np.clip(df_noisy['CO'] + np.random.normal(0, 1.5, size=len(df)), 0, 300).round(2)
    df_noisy['Temperature'] = np.clip(df_noisy['Temperature'] + np.random.normal(0, 0.5, size=len(df)), -10, 80).round(2)
    df_noisy['Humidity'] = np.clip(df_noisy['Humidity'] + np.random.normal(0, 1.0, size=len(df)), 10, 100).round(2)

    # Features and Target
    X = df_noisy[['Gas', 'CO', 'Temperature', 'Humidity', 'Flame']]
    y = df['RiskLevel'] # 0: Safe, 1: Warning, 2: Critical
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    print(f"Training on {len(X_train)} samples, testing on {len(X_test)} samples.")
    
    # Initialize Random Forest
    rf_classifier = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10)
    
    # Train
    print("Training Random Forest model...")
    rf_classifier.fit(X_train, y_train)
    
    # Predict
    print("Evaluating model...")
    y_pred = rf_classifier.predict(X_test)
    
    # Evaluation Metrics
    accuracy = accuracy_score(y_test, y_pred)
    conf_matrix = confusion_matrix(y_test, y_pred)
    class_report = classification_report(y_test, y_pred, target_names=['Safe', 'Warning', 'Critical'], output_dict=True)
    
    print(f"\nModel Accuracy: {accuracy * 100:.2f}%")
    print("\nConfusion Matrix:")
    print(conf_matrix)
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Safe', 'Warning', 'Critical']))
    
    # Save model
    model_path = os.path.join(model_dir, 'random_forest_model.joblib')
    joblib.dump(rf_classifier, model_path)
    print(f"\nModel saved successfully to: {model_path}")
    
    # Save evaluation results
    eval_path = os.path.join(eval_dir, 'evaluation_metrics.json')
    with open(eval_path, 'w') as f:
        json.dump({
            'accuracy': accuracy,
            'confusion_matrix': conf_matrix.tolist(),
            'classification_report': class_report
        }, f, indent=4)
    print(f"Evaluation metrics saved to: {eval_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train MineSentinel AI Risk Prediction Model")
    parser.add_argument("--mode", type=str, default="auto", choices=["auto", "synthetic", "hardware", "combined"],
                        help="Data source mode: 'synthetic', 'hardware', 'combined', or 'auto'")
    parser.add_argument("--path", type=str, default=None, help="Custom path to CSV dataset")
    args = parser.parse_args()
    
    train_and_evaluate(mode=args.mode, custom_path=args.path)
