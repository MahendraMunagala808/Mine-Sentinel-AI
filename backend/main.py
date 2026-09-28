import sys
import os

# Ensure running inside project virtual environment if available
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
venv_python = os.path.join(project_root, "venv", "Scripts", "python.exe")
if os.path.exists(venv_python) and os.path.normcase(os.path.abspath(sys.executable)) != os.path.normcase(os.path.abspath(venv_python)):
    import subprocess
    sys.exit(subprocess.call([venv_python, os.path.abspath(__file__)] + sys.argv[1:]))

import uvicorn
from contextlib import asynccontextmanager

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import api
from app.services.mqtt_service import mqtt_client
from dotenv import load_dotenv

load_dotenv()

# Create DB tables
Base.metadata.create_all(bind=engine)

def auto_migrate_db():
    import sqlite3
    db_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "minesentinel.db")
    if os.path.exists(db_file):
        try:
            conn = sqlite3.connect(db_file)
            cur = conn.cursor()
            cols = [
                ("sector_id", "VARCHAR", "'SEC-01'"),
                ("sector_name", "VARCHAR", "'Level -100m Main Adit'"),
                ("level", "VARCHAR", "'Level -100m'"),
                ("battery_level", "FLOAT", "94.0"),
                ("rssi_dbm", "INTEGER", "-62"),
                ("firmware_ver", "VARCHAR", "'v2.4.1-ESP32-ADC16'"),
                ("packet_drop_pct", "FLOAT", "0.2"),
                ("uptime_mins", "INTEGER", "1420")
            ]
            for col_name, col_type, default_val in cols:
                try:
                    cur.execute(f"ALTER TABLE devices ADD COLUMN {col_name} {col_type} DEFAULT {default_val}")
                except Exception:
                    pass
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Auto-migration note: {e}")

auto_migrate_db()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start background MQTT client
    mqtt_client.start()
    yield
    # Shutdown logic if needed

app = FastAPI(title="MineSentinel AI Backend API", lifespan=lifespan)

# Configure CORS for Dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app.include_router(api.router, prefix="/api")

# Static assets and dashboard frontend serving
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dashboard_dir = os.path.join(project_root, "dashboard")

# Mount /templates/static first so requests from /templates/dashboard.html resolve cleanly
static_dir = os.path.join(dashboard_dir, "static")
if os.path.exists(static_dir):
    app.mount("/templates/static", StaticFiles(directory=static_dir), name="templates_static")

# Mount subfolders if they exist
for folder in ["static", "assets", "templates"]:
    f_path = os.path.join(dashboard_dir, folder)
    if os.path.exists(f_path):
        app.mount(f"/{folder}", StaticFiles(directory=f_path), name=folder)

# Direct routes for core root assets to guarantee 100% reliable delivery
styles_css_path = os.path.join(dashboard_dir, "styles.css")
main_js_path = os.path.join(dashboard_dir, "main.js")
sw_js_path = os.path.join(dashboard_dir, "sw.js")
dashboard_html_path = os.path.join(dashboard_dir, "dashboard.html")
index_html_path = os.path.join(dashboard_dir, "index.html")
templates_dashboard_html_path = os.path.join(dashboard_dir, "templates", "dashboard.html")

@app.api_route("/styles.css", methods=["GET", "HEAD"])
def get_styles_css():
    if os.path.exists(styles_css_path):
        return FileResponse(styles_css_path, media_type="text/css")
    return {"error": "styles.css not found"}

@app.api_route("/main.js", methods=["GET", "HEAD"])
def get_main_js():
    if os.path.exists(main_js_path):
        return FileResponse(main_js_path, media_type="application/javascript")
    return {"error": "main.js not found"}

@app.api_route("/sw.js", methods=["GET", "HEAD"])
def get_sw_js():
    if os.path.exists(sw_js_path):
        return FileResponse(sw_js_path, media_type="application/javascript")
    return {"error": "sw.js not found"}

@app.api_route("/", methods=["GET", "HEAD"])
@app.api_route("/index.html", methods=["GET", "HEAD"])
def get_index():
    if os.path.exists(index_html_path):
        return FileResponse(index_html_path, media_type="text/html")
    return {"message": "MineSentinel AI Backend is running"}

@app.api_route("/dashboard", methods=["GET", "HEAD"])
@app.api_route("/dashboard.html", methods=["GET", "HEAD"])
def get_dashboard():
    if os.path.exists(dashboard_html_path):
        return FileResponse(dashboard_html_path, media_type="text/html")
    elif os.path.exists(templates_dashboard_html_path):
        return FileResponse(templates_dashboard_html_path, media_type="text/html")
    return {"error": "dashboard.html not found"}

@app.api_route("/templates/dashboard.html", methods=["GET", "HEAD"])
@app.api_route("/templates/dashboard", methods=["GET", "HEAD"])
def get_templates_dashboard():
    if os.path.exists(templates_dashboard_html_path):
        return FileResponse(templates_dashboard_html_path, media_type="text/html")
    elif os.path.exists(dashboard_html_path):
        return FileResponse(dashboard_html_path, media_type="text/html")
    return {"error": "dashboard.html not found"}

# Mount entire dashboard directory as fallback static provider
if os.path.exists(dashboard_dir):
    app.mount("/", StaticFiles(directory=dashboard_dir, html=True), name="dashboard_root")

if __name__ == "__main__":
    import sys
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if base_dir not in sys.path:
        sys.path.insert(0, base_dir)
    port = int(os.getenv("API_PORT", 8000))
    host = os.getenv("API_HOST", "0.0.0.0")
    print("\n" + "=" * 64)
    print("   MineSentinel AI - Industrial Safety & Telemetry Server")
    print(f"   * Landing / Index Page:   http://127.0.0.1:{port}")
    print(f"   * Operations Dashboard:   http://127.0.0.1:{port}/dashboard.html")
    print(f"   * REST API Documentation: http://127.0.0.1:{port}/docs")
    print("=" * 64 + "\n")
    uvicorn.run("main:app", host=host, port=port, reload=True, app_dir=base_dir)
