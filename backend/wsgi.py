"""
WSGI entry point for Mizizzi E-commerce platform.
This file is used by production WSGI servers like Gunicorn and AWS Lambda (via Zappa).
Located in /backend for deployment.
"""
import os

os.environ.setdefault('FLASK_CONFIG', 'production')
os.environ.setdefault('FLASK_ENV', 'production')

from app import create_app

config_name = os.environ.get('FLASK_CONFIG', 'production')

# SocketIO doesn't work well with Lambda's request/response model
# Disable it for serverless deployment
enable_socketio = os.environ.get('ENABLE_SOCKETIO', 'false').lower() == 'true'

app = create_app(config_name, enable_socketio=enable_socketio)

if __name__ == "__main__":
    app.run()
