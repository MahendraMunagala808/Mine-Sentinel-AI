import pandas as pd
import numpy as np
import os

# Set random seed for reproducibility
np.random.seed(42)

def sigmoid(x, k=1.0, x0=0.0):
    """Numerically stable sigmoid transfer function."""
    z = np.clip(-k * (x - x0), -50, 50)
    return 1.0 / (1.0 + np.exp(z))

def compute_continuous_hazard_index(gas, co, temp, hum, flame):
    """
    Continuous Multi-Factor Hazard Scoring (0.0 to 1.0):
    Combines toxic gas exposure, thermal load, extreme humidity, and flame
    with non-linear sigmoid response curves and synergistic interactions.
    """
    if flame == 1:
        return 1.0

    # Individual normalized hazard signals (sigmoid centered around threshold bands)
    # Gas: baseline <450 normal, 450-850 warning, >850 critical
    gas_hazard = sigmoid(gas, k=0.008, x0=550)
    
    # CO: baseline <50 normal, 50-120 warning, >120 critical
    co_hazard = sigmoid(co, k=0.055, x0=70)
    
    # Temperature: <40 normal, 40-50 warning, >50 critical
    temp_hazard = sigmoid(temp, k=0.18, x0=43)
    
    # Humidity: non-linear effect at high humidity (>75%)
    hum_hazard = sigmoid(hum, k=0.12, x0=82) * 0.35
    
    # Multi-factor synergistic interaction (e.g., Gas + High Temp elevates risk exponentially)
    synergy = (gas_hazard * temp_hazard * 0.4) + (co_hazard * temp_hazard * 0.3)
    
    # Weighted composite index
    composite_hazard = (
        0.38 * gas_hazard +
        0.32 * co_hazard +
        0.20 * temp_hazard +
        0.10 * hum_hazard +
        synergy
    )
    
    return float(np.clip(composite_hazard, 0.0, 1.0))

def determine_realistic_risk_level(hazard_index):
    """
    Maps continuous hazard index to discrete risk level with realistic boundary transition noise:
    - 0: Safe (< ~0.35)
    - 1: Warning (~0.35 - ~0.68)
    - 2: Critical (>= ~0.68)
    With subtle transition fuzziness near the decision boundaries.
    """
    # Soft boundary noise (simulates human surveyor & ambient sensor calibration tolerance)
    transition_noise = np.random.normal(0, 0.025)
    adjusted_index = hazard_index + transition_noise
    
    if adjusted_index >= 0.68:
        return 2  # Critical
    elif adjusted_index >= 0.36:
        return 1  # Warning
    else:
        return 0  # Safe

def generate_synthetic_data(num_samples=7500):
    print(f"Generating realistic multi-factor synthetic dataset ({num_samples} samples)...")
    
    data = []
    
    for i in range(num_samples):
        # Sample across a continuous spectrum:
        # 60% nominal/safe, 25% warning/elevated, 15% hazardous/critical
        regime = np.random.rand()
        flame = 0
        
        if regime < 0.60:
            # Nominal mine conditions (smooth continuous distribution)
            gas = np.random.normal(loc=160, scale=80)
            co = np.random.normal(loc=14, scale=9)
            temp = np.random.normal(loc=25, scale=4.5)
            hum = np.random.normal(loc=55, scale=12)
            # Occasional localized ambient humidity peak
            if np.random.rand() < 0.05:
                hum = np.random.uniform(75, 88)
        elif regime < 0.85:
            # Elevated / Warning conditions (ventilation drops, minor gas buildup, elevated heat)
            cluster_type = np.random.choice(['gas_rise', 'co_rise', 'thermal_rise', 'damp_air', 'multi_factor'])
            if cluster_type == 'gas_rise':
                gas = np.random.normal(loc=540, scale=90)
                co = np.random.normal(loc=35, scale=12)
                temp = np.random.normal(loc=32, scale=5)
                hum = np.random.normal(loc=60, scale=10)
            elif cluster_type == 'co_rise':
                gas = np.random.normal(loc=280, scale=60)
                co = np.random.normal(loc=72, scale=18)
                temp = np.random.normal(loc=30, scale=5)
                hum = np.random.normal(loc=58, scale=10)
            elif cluster_type == 'thermal_rise':
                gas = np.random.normal(loc=320, scale=70)
                co = np.random.normal(loc=28, scale=10)
                temp = np.random.normal(loc=44, scale=3.5)
                hum = np.random.normal(loc=65, scale=12)
            elif cluster_type == 'damp_air':
                gas = np.random.normal(loc=220, scale=60)
                co = np.random.normal(loc=20, scale=8)
                temp = np.random.normal(loc=28, scale=4)
                hum = np.random.normal(loc=86, scale=6)
            else: # multi_factor synergy
                gas = np.random.normal(loc=420, scale=50)
                co = np.random.normal(loc=45, scale=10)
                temp = np.random.normal(loc=38, scale=3)
                hum = np.random.normal(loc=76, scale=8)
        else:
            # Critical / Severe conditions
            crit_type = np.random.choice(['methane_spike', 'co_toxic', 'heat_exhaustion', 'fire_event', 'explosive_mixture'])
            if crit_type == 'fire_event':
                flame = 1
                gas = np.random.normal(loc=750, scale=150)
                co = np.random.normal(loc=130, scale=40)
                temp = np.random.normal(loc=55, scale=8)
                hum = np.random.normal(loc=40, scale=15)
            elif crit_type == 'methane_spike':
                gas = np.random.normal(loc=980, scale=180)
                co = np.random.normal(loc=65, scale=25)
                temp = np.random.normal(loc=35, scale=6)
                hum = np.random.normal(loc=60, scale=12)
            elif crit_type == 'co_toxic':
                gas = np.random.normal(loc=450, scale=100)
                co = np.random.normal(loc=165, scale=35)
                temp = np.random.normal(loc=34, scale=5)
                hum = np.random.normal(loc=55, scale=10)
            elif crit_type == 'heat_exhaustion':
                gas = np.random.normal(loc=350, scale=80)
                co = np.random.normal(loc=40, scale=15)
                temp = np.random.normal(loc=53, scale=4)
                hum = np.random.normal(loc=78, scale=10)
            else: # explosive mixture
                gas = np.random.normal(loc=920, scale=120)
                co = np.random.normal(loc=140, scale=30)
                temp = np.random.normal(loc=48, scale=5)
                hum = np.random.normal(loc=68, scale=10)
        
        # Physical constraints
        gas = max(5.0, min(2000.0, gas))
        co = max(0.5, min(500.0, co))
        temp = max(10.0, min(75.0, temp))
        hum = max(15.0, min(100.0, hum))
        
        # Calculate continuous hazard index & risk label
        hazard_index = compute_continuous_hazard_index(gas, co, temp, hum, flame)
        risk_level = determine_realistic_risk_level(hazard_index)
        
        # Add realistic sensor measurement noise & ADC drift to the recorded features
        sensor_gas = float(np.clip(gas + np.random.normal(0, 4.5), 0, 2000))
        sensor_co = float(np.clip(co + np.random.normal(0, 1.8), 0, 500))
        sensor_temp = float(np.clip(temp + np.random.normal(0, 0.6), -10, 80))
        sensor_hum = float(np.clip(hum + np.random.normal(0, 1.2), 10, 100))
        
        row = {
            'Gas': round(sensor_gas, 2),
            'CO': round(sensor_co, 2),
            'Temperature': round(sensor_temp, 2),
            'Humidity': round(sensor_hum, 2),
            'Flame': int(flame),
            'HazardIndex': round(hazard_index, 4),
            'RiskLevel': int(risk_level)
        }
        data.append(row)

    df = pd.DataFrame(data)
    
    # Save to CSV
    dataset_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(dataset_dir, 'raw', 'synthetic')
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, 'synthetic_mine_data.csv')
    df.to_csv(output_file, index=False)
    
    legacy_file = os.path.join(dataset_dir, 'synthetic_mine_data.csv')
    df.to_csv(legacy_file, index=False)
    
    print(f"Dataset generated with {len(df)} samples.")
    print(f"Saved to: {output_file}")
    print("\nClass distribution:")
    print(df['RiskLevel'].value_counts(normalize=True) * 100)

if __name__ == "__main__":
    generate_synthetic_data()

