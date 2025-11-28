# ########################################
# # MIZIZZI E-COMMERCE BACKEND DEPENDENCIES
# # Compatible with Python 3.12 / Ubuntu 22.04+
# ########################################

# # --------------------------------------
# # Alembic & Migrations
# # --------------------------------------
# alembic
# Flask-Migrate
# Mako

# # --------------------------------------
# # Authentication & Security
# # --------------------------------------
# bcrypt
# email_validator
# Flask-Bcrypt
# Flask-JWT-Extended
# passlib
# PyJWT
# itsdangerous
# phonenumbers
# cryptography

# # --------------------------------------
# # Background Tasks & Workers
# # --------------------------------------
# celery
# flower
# eventlet
# amqp
# billiard
# kombu
# vine

# # --------------------------------------
# # Caching, Rate Limiting & Redis
# # --------------------------------------
# Flask-Caching
# cachelib
# cachetools
# Flask-Limiter
# redis
# limits

# # --------------------------------------
# # Core Flask & Extensions
# # --------------------------------------
# Flask
# Flask-Cors
# Flask-Mail
# Flask-RESTful
# flask-restx
# Flask-SocketIO
# Flask-SQLAlchemy
# Flask-WTF
# flasgger

# # --------------------------------------
# # Database & ORM
# # --------------------------------------
# SQLAlchemy
# psycopg2-binary
# PyMySQL

# # --------------------------------------
# # Data Serialization & Validation
# # --------------------------------------
# marshmallow
# marshmallow-sqlalchemy
# flask-marshmallow
# aniso8601

# # --------------------------------------
# # Pydantic (for advanced validation)
# # --------------------------------------
# pydantic
# pydantic_core
# annotated-types

# # --------------------------------------
# # Google Auth & OAuth
# # ------------------------
# oauthlib
# requests-oauthlib

# # --------------------------------------
# # Web & HTTP
# # --------------------------------------
# requests
# urllib3
# idna
# certifi
# charset-normalizer

# # --------------------------------------
# # Utility & Helpers
# # --------------------------------------
# python-dotenv
# python-dateutil
# python-slugify
# humanize
# text-unidecode
# wrapt
# attrs
# six
# ordered-set
# bidict
# Deprecated

# # --------------------------------------
# # Jinja, Templates & Markdown
# # --------------------------------------
# Jinja2
# MarkupSafe
# markdown-it-py
# mdurl
# mistune

# # --------------------------------------
# # WebSocket Support
# # --------------------------------------
# python-engineio
# python-socketio
# simple-websocket
# tornado
# wsproto

# # --------------------------------------
# # Logging & Monitoring
# # --------------------------------------
# sentry-sdk
# prometheus_client

# # --------------------------------------
# # CLI & Developer Tools
# # --------------------------------------
# click
# click-didyoumean
# click-plugins
# click-repl
# pytest
# pytest-flask

# # --------------------------------------
# # Rich Output & Prompt Tools
# # --------------------------------------
# rich
# prompt_toolkit
# wcwidth
# Pygments

# # --------------------------------------
# # JSON & Schema
# # --------------------------------------
# jsonschema
# jsonschema-specifications
# referencing
# rpds-py

# # --------------------------------------
# # RSA & ASN1
# # --------------------------------------
# rsa
# pyasn1
# pyasn1_modules

# # --------------------------------------
# # Gunicorn (Production Server)
# # --------------------------------------
# gunicorn

# # --------------------------------------
# # Typing & Packaging
# # --------------------------------------
# typing_extensions
# packaging
# importlib_resources
# pluggy

# # --------------------------------------
# numpy
# pandas
# nltk
# fuzzywuzzy
# Pillow
# pytz
# cloudinary

# from flask import Flask, jsonify

# def create_app():
# 	app = Flask(__name__)
# 	# minimal health route for flask routes / quick checks
# 	@app.route("/")
# 	def _index():
# 		return jsonify({"status": "ok"})
# 	return app

# # expose an app object so `flask` can import backend.app
# app = create_app()