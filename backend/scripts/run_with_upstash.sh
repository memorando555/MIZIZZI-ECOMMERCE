#!/usr/bin/env bash
# Quick helper: export Upstash creds, start Flask, run benchmark
# Usage: bash scripts/run_with_upstash.sh [category_id] [iterations]

set -euo pipefail

# Defaults
CATEGORY_ID="${1:-1}"
ITERATIONS="${2:-6}"
BASE_URL="${3:-http://localhost:5000}"
VENV_DIR="${VENV_DIR:-venv}"

# Upstash env (from your provided .env)
export UPSTASH_REDIS_REST_URL="https://calm-marmot-36085.upstash.io"
export UPSTASH_REDIS_REST_TOKEN="AYz1AAIncDFhODhkODAyZGM3NTg0YWM4YWU2NzY0ZjM1ZGM5MzY1NnAxMzYwODU"
export KV_REST_API_URL="$UPSTASH_REDIS_REST_URL"
export KV_REST_API_TOKEN="$UPSTASH_REDIS_REST_TOKEN"

# Other necessary env (ensure these match your .env as needed)
export FLASK_APP="${FLASK_APP:-wsgi:app}"
export FLASK_ENV="${FLASK_ENV:-development}"
export FLASK_DEBUG="${FLASK_DEBUG:-1}"

# Activate venv if exists
if [ -f "$VENV_DIR/bin/activate" ]; then
  echo "Activating virtualenv $VENV_DIR"
  # shellcheck source=/dev/null
  source "$VENV_DIR/bin/activate"
fi

# Ensure requirements present
if [ -f "requirements.txt" ]; then
  echo "Installing requirements (pip install -r requirements.txt)..."
  pip install -r requirements.txt >/dev/null 2>&1 || true
fi

# Start Flask in background
echo "Starting Flask on ${BASE_URL} ..."
flask run --host=0.0.0.0 --port=5000 >/tmp/flask_stdout.log 2>/tmp/flask_stderr.log &

FLASK_PID=$!
echo "Flask PID: $FLASK_PID"
sleep 1.5

# Wait for app readiness (simple loop)
echo "Waiting for server to be ready..."
for i in {1..15}; do
  if curl -sSf "${BASE_URL}/api/categories/health" >/dev/null 2>&1; then
    echo "Server is ready."
    break
  fi
  sleep 0.5
done

# Run benchmark script
echo "Running benchmark for category ${CATEGORY_ID} with ${ITERATIONS} iterations..."
python3 tools/benchmark_category_products.py --base "${BASE_URL}" --category "${CATEGORY_ID}" --iterations "${ITERATIONS}" --warm-up

echo "Benchmark finished. Flask logs: /tmp/flask_stdout.log /tmp/flask_stderr.log"

# Optionally stop Flask started by this script
echo "Stopping Flask (pid ${FLASK_PID})..."
kill "$FLASK_PID" || true

# Make executable and run (from backend/):
chmod +x scripts/run_with_upstash.sh
./scripts/run_with_upstash.sh 1 6

# OR run without changing permissions:
bash scripts/run_with_upstash.sh 1 6

# OR use absolute path:
chmod +x /home/info-gillydev/CLIENTS/development/MIZIZZI-ECOMMERCE3/backend/scripts/run_with_upstash.sh
bash /home/info-gillydev/CLIENTS/development/MIZIZZI-ECOMMERCE3/backend/scripts/run_with_upstash.sh 1 6

# Quick checks:
ls -l scripts/run_with_upstash.sh         # confirm file exists and permissions
cat scripts/run_with_upstash.sh | sed -n '1,40p'   # preview script header

# ...script exists in repo...
# Run:
# bash scripts/run_with_upstash.sh 27 6 http://localhost:5000/api
