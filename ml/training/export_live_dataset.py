"""
Export Live Hardware Dataset & Prepare Combined Training Data
MineSentinel AI
"""

import os
import sys
import sqlite3
import pandas as pd
import argparse

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

def export_live_data(db_path=None, output_csv=None):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Locate database
    if not db_path:
        possible_paths = [
            os.path.join(os.path.dirname(base_dir), "database", "minesentinel.db"),
            os.path.join(os.path.dirname(base_dir), "minesentinel.db"),
            os.path.join(os.path.dirname(base_dir), "test.db")
        ]
        for p in possible_paths:
            if os.path.exists(p):
                db_path = p
                break
                
    if not db_path or not os.path.exists(db_path):
        print(f"[WARN] No active SQLite database found.")
        return None
        
    print(f"Reading live telemetry from: {db_path}")
    conn = sqlite3.connect(db_path)
    
    try:
        query = """
        SELECT 
            gas AS Gas, 
            co AS CO, 
            temperature AS Temperature, 
            humidity AS Humidity, 
            flame AS Flame, 
            risk_level AS RiskLevel,
            timestamp AS Timestamp
        FROM sensor_readings
        ORDER BY id ASC
        """
        df = pd.read_sql_query(query, conn)
    except Exception as e:
        print(f"Error querying sensor_readings: {e}")
        conn.close()
        return None
    finally:
        conn.close()
        
    if len(df) == 0:
        print("[INFO] sensor_readings table is currently empty.")
        return None
        
    print(f"Retrieved {len(df)} live hardware telemetry records.")

    # Apply continuous multi-factor hazard scoring on exported data
    from ml.dataset.generate_dataset import compute_continuous_hazard_index, determine_realistic_risk_level
    
    risk_levels = []
    for _, r in df.iterrows():
        hz = compute_continuous_hazard_index(
            gas=float(r['Gas']),
            co=float(r['CO']),
            temp=float(r['Temperature']),
            hum=float(r['Humidity']),
            flame=int(r['Flame'])
        )
        risk_levels.append(determine_realistic_risk_level(hz))
    df['RiskLevel'] = risk_levels
    
    # Set default output path in raw/hardware_live
    if not output_csv:
        hw_dir = os.path.join(base_dir, "dataset", "raw", "hardware_live")
        os.makedirs(hw_dir, exist_ok=True)
        output_csv = os.path.join(hw_dir, "live_hardware_telemetry.csv")
    else:
        os.makedirs(os.path.dirname(output_csv), exist_ok=True)
        
    df.to_csv(output_csv, index=False)
    print(f"[SUCCESS] Saved live hardware dataset to: {output_csv}")
    print("\nLive Dataset Risk Level Breakdown:")
    print(df['RiskLevel'].value_counts())
    return output_csv

def build_combined_dataset(synthetic_csv=None, live_csv=None, output_combined=None):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    if not synthetic_csv:
        synthetic_csv = os.path.join(base_dir, "dataset", "raw", "synthetic", "synthetic_mine_data.csv")
    if not live_csv:
        live_csv = os.path.join(base_dir, "dataset", "raw", "hardware_live", "live_hardware_telemetry.csv")
    if not output_combined:
        proc_dir = os.path.join(base_dir, "dataset", "processed")
        os.makedirs(proc_dir, exist_ok=True)
        output_combined = os.path.join(proc_dir, "training_combined.csv")
        
    dfs = []
    
    if os.path.exists(synthetic_csv):
        df_syn = pd.read_csv(synthetic_csv)
        df_syn = df_syn[['Gas', 'CO', 'Temperature', 'Humidity', 'Flame', 'RiskLevel']]
        df_syn['Source'] = 'Synthetic'
        dfs.append(df_syn)
        print(f"Loaded {len(df_syn)} synthetic records.")
        
    if os.path.exists(live_csv):
        df_live = pd.read_csv(live_csv)
        df_live = df_live[['Gas', 'CO', 'Temperature', 'Humidity', 'Flame', 'RiskLevel']]
        df_live['Source'] = 'Hardware_Live'
        dfs.append(df_live)
        print(f"Loaded {len(df_live)} live hardware records.")
        
    if not dfs:
        print("[ERROR] No datasets available to combine.")
        return None
        
    combined_df = pd.concat(dfs, ignore_index=True)
    combined_df.to_csv(output_combined, index=False)
    print(f"[SUCCESS] Combined dataset built ({len(combined_df)} records) -> {output_combined}")
    return output_combined

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export live hardware telemetry and build combined datasets")
    parser.add_argument("--db", type=str, default=None, help="Path to SQLite database")
    parser.add_argument("--combine", action="store_true", help="Merge live telemetry with synthetic dataset")
    args = parser.parse_args()
    
    live_file = export_live_data(db_path=args.db)
    if args.combine and live_file:
        build_combined_dataset(live_csv=live_file)
