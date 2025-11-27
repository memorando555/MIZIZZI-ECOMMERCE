"""
WSGI entry point for Mizizzi E-commerce platform.
This file is used by production WSGI servers like Gunicorn.
Located in /backend for Render deployment with Root Directory set to 'backend'.
"""
from app import create_app

app = create_app('production')

if __name__ == "__main__":
    app.run()
