"""
WSGI entry point for Mizizzi E-commerce platform.
This file is used by production WSGI servers like Gunicorn and AWS Lambda (via Zappa).
Located in /backend for deployment.
"""
import os
import sys

# Add a safe import for load_dotenv so flask/wsgi won't crash if python-dotenv isn't installed
try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

# Only attempt to load the .env file if load_dotenv is available
env_path = os.path.join(os.path.dirname(__file__), '.env')
if load_dotenv:
    load_dotenv(env_path)
else:
    sys.stderr.write("Warning: python-dotenv not installed; skipping loading .env\n")

os.environ.setdefault('FLASK_CONFIG', 'production')
os.environ.setdefault('FLASK_ENV', 'production')

try:
    from app import create_app
except ModuleNotFoundError:
    # When Flask imports this as backend.wsgi, the package root is `backend`
    # so import from backend.app instead.
    from backend.app import create_app

config_name = os.environ.get('FLASK_CONFIG', 'production')

# SocketIO doesn't work well with Lambda's request/response model
# Disable it for serverless deployment
enable_socketio = os.environ.get('ENABLE_SOCKETIO', 'false').lower() == 'true'

# Ensure Flask CLI uses the same app instance exposed by this module
os.environ.setdefault('FLASK_APP', 'backend.wsgi:app')

# create the Flask app via factory so the single SQLAlchemy instance is registered
app = create_app()

# Ensure the SQLAlchemy extension instance from the application package is bound to this app.
# This avoids "The current Flask app is not registered with this 'SQLAlchemy' instance"
# when running `flask shell` and doing `from app import db`.
try:
    from app import db as _db
except Exception:
    try:
        # fallback import if CLI pathing requires package prefix
        from backend.app import db as _db
    except Exception:
        _db = None

if _db is not None:
    try:
        _db.init_app(app)
    except Exception:
        # init_app is idempotent; ignore errors here but keep a log if needed
        pass
