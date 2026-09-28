@echo off
title MineSentinel AI - Telemetry Simulator
echo ===================================================================
echo             MineSentinel AI - Hardware Telemetry Simulator
echo ===================================================================
echo [1/2] Activating Python virtual environment...
cd /d "%~dp0"

if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    echo [WARNING] venv not found. Using system python.
)

echo [2/2] Starting telemetry data stream...
echo.
python simulator\simulator.py
pause
