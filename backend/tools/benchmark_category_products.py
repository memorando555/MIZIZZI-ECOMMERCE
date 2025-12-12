import time
import argparse
import requests
from statistics import mean

"""
Simple benchmark script to test Upstash caching for category products endpoint.

Usage:
  python3 tools/benchmark_category_products.py --base http://localhost:5000/api --category 27 --iterations 10 --warm-up

This script prints per-request latency, status code, X-Cache and Cache-Control headers,
and summary statistics (cold vs warm average).
"""

def run_benchmark(base_url: str, category_id: int, iterations: int, warm_up: bool, delay: float):
    endpoint = f"{base_url.rstrip('/')}/categories/{category_id}/products"
    params = {}
    headers = {}

    results = []
    for i in range(iterations):
        if warm_up and i == 0:
            # Warm-up single request to ensure cache population
            print("[warm-up] sending initial request to populate cache...")
        start = time.time()
        try:
            r = requests.get(endpoint, params=params, headers=headers, timeout=30)
            elapsed_ms = (time.time() - start) * 1000.0
            x_cache = r.headers.get('X-Cache', '')
            cache_control = r.headers.get('Cache-Control', '')
            size = len(r.content or b'')
            print(f"[{i+1}/{iterations}] {elapsed_ms:.1f} ms | status={r.status_code} | X-Cache={x_cache} | Cache-Control={cache_control} | bytes={size}")
            results.append({
                'index': i+1,
                'ms': elapsed_ms,
                'status': r.status_code,
                'x_cache': x_cache,
                'cache_control': cache_control,
                'bytes': size
            })
        except Exception as e:
            elapsed_ms = (time.time() - start) * 1000.0
            print(f"[{i+1}/{iterations}] ERROR after {elapsed_ms:.1f} ms: {e}")
            results.append({'index': i+1, 'ms': None, 'status': None, 'x_cache': 'ERROR', 'cache_control': '', 'bytes': 0})
        if delay and i < iterations - 1:
            time.sleep(delay)

    # Summarize
    hit_times = [r['ms'] for r in results if r['x_cache'] and r['x_cache'].upper() == 'HIT' and r['ms'] is not None]
    miss_times = [r['ms'] for r in results if r['x_cache'] and r['x_cache'].upper() == 'MISS' and r['ms'] is not None]

    print("\nSummary:")
    print(f"  Total requests: {len(results)}")
    if miss_times:
        print(f"  MISS count: {len(miss_times)} | avg MISS: {mean(miss_times):.1f} ms")
    else:
        print("  MISS count: 0")
    if hit_times:
        print(f"  HIT count: {len(hit_times)} | avg HIT: {mean(hit_times):.1f} ms")
    else:
        print("  HIT count: 0")
    all_times = [r['ms'] for r in results if r['ms'] is not None]
    if all_times:
        print(f"  Overall avg: {mean(all_times):.1f} ms")

def parse_args():
    p = argparse.ArgumentParser(description="Benchmark category products endpoint caching")
    p.add_argument('--base', '-b', default='http://localhost:5000', help='Base URL of backend (default: http://localhost:5000)')
    p.add_argument('--category', '-c', type=int, required=True, help='Category ID to query')
    p.add_argument('--iterations', '-n', type=int, default=6, help='Number of requests to make')
    p.add_argument('--warm-up', action='store_true', help='Do an explicit warm-up request first')
    p.add_argument('--delay', type=float, default=0.2, help='Delay (seconds) between requests')
    return p.parse_args()

if __name__ == '__main__':
    args = parse_args()
    # If warm-up flag is set, first request is considered warm-up (still counted).
    run_benchmark(base_url=args.base, category_id=args.category, iterations=args.iterations, warm_up=args.warm_up, delay=args.delay)
