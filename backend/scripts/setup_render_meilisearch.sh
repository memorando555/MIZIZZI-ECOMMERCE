#!/bin/bash

# Meilisearch Render Deployment Helper Script
# This script helps you set up environment variables for Render deployment

echo "=========================================="
echo "Meilisearch Render Deployment Helper"
echo "=========================================="
echo ""

# Generate a secure master key
echo "Generating a secure MEILI_MASTER_KEY..."
MASTER_KEY=$(openssl rand -base64 32)

echo ""
echo "✓ Generated secure master key"
echo ""
echo "=========================================="
echo "COPY THESE VALUES TO RENDER:"
echo "=========================================="
echo ""
echo "Environment Variables for Render:"
echo "-----------------------------------"
echo "MEILI_MASTER_KEY = $MASTER_KEY"
echo "MEILI_ENV = production"
echo "MEILI_HTTP_ADDR = 0.0.0.0:7700"
echo "MEILI_NO_ANALYTICS = true"
echo ""
echo "=========================================="
echo "NEXT STEPS:"
echo "=========================================="
echo ""
echo "1. Go to https://dashboard.render.com"
echo "2. Create a new Web Service"
echo "3. Choose 'Deploy an existing image'"
echo "4. Image URL: getmeili/meilisearch:v1.10"
echo "5. Add the environment variables above"
echo "6. Add a disk: /meili_data (10GB)"
echo "7. Click 'Create Web Service'"
echo ""
echo "After deployment, update your backend .env:"
echo "-----------------------------------"
echo "MEILISEARCH_URL=https://your-service.onrender.com"
echo "MEILISEARCH_MASTER_KEY=$MASTER_KEY"
echo ""
echo "Then run: python scripts/setup_meilisearch.py"
echo ""
