# --------------------------------------------
# MIZIZZI E-COMMERCE BACKEND DOCKERFILE
# Optimized for production (Python 3.12 / Ubuntu)
# --------------------------------------------

# Use a lightweight Python base image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir gunicorn psycopg2-binary

# Copy application code
COPY . .

EXPOSE 8080

CMD exec gunicorn wsgi:app --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 0
