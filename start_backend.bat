@echo off
title MineSentinel AI - Backend & Web Dashboard Server
echo ===================================================================
echo             MineSentinel AI - Backend & Web Dashboard
echo ===================================================================
echo [1/2] Activating Python virtual environment...
cd /d "%~dp0"

if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    echo [WARNING] venv not found. Using system python.
)

echo [2/2] Launching FastAPI backend server on http://127.0.0.1:8000 ...
echo.
python backend\main.py
pause
