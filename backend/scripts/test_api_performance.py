#!/usr/bin/env python3
"""
API Performance Test Script for Mizizzi E-commerce platform.
Tests product API endpoints to verify caching effectiveness.

Run: python scripts/test_api_performance.py

Requires:
  - Flask app running (or use --base-url to specify)
  - requests library
"""
import os
import sys
import time
import json
import argparse
import statistics
from datetime import datetime

try:
    import requests
except ImportError:
    print("Error: 'requests' library required. Install with: pip install requests")
    sys.exit(1)


def print_header(title: str):
    """Print a formatted header."""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def print_result(test_name: str, passed: bool, details: str = ""):
    """Print test result."""
    status = "PASS" if passed else "FAIL"
    symbol = "[OK]" if passed else "[X]"
    print(f"  {symbol} {test_name}: {status}")
    if details:
        print(f"      -> {details}")


def print_info(message: str):
    """Print info message."""
    print(f"  [INFO] {message}")


def print_timing(label: str, times: list):
    """Print timing statistics."""
    if not times:
        print(f"  {label}: No data")
        return
    
    avg = statistics.mean(times)
    median = statistics.median(times)
    min_t = min(times)
    max_t = max(times)
    
    print(f"  {label}:")
    print(f"      Average:  {avg:.2f}ms")
    print(f"      Median:   {median:.2f}ms")
    print(f"      Min:      {min_t:.2f}ms")
    print(f"      Max:      {max_t:.2f}ms")


class APIPerformanceTester:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        
    def _request(self, method: str, endpoint: str, **kwargs) -> tuple:
        """Make a request and return (response, time_ms)."""
        url = f"{self.base_url}{endpoint}"
        start = time.perf_counter()
        try:
            response = self.session.request(method, url, timeout=30, **kwargs)
            elapsed = (time.perf_counter() - start) * 1000
            return response, elapsed
        except Exception as e:
            elapsed = (time.perf_counter() - start) * 1000
            return None, elapsed
    
    def test_cache_status(self) -> bool:
        """Test 1: Check cache status endpoint."""
        print_header("Test 1: Cache Status Check")
        
        response, elapsed = self._request('GET', '/api/products/cache/status')
        
        if response is None:
            print_result("Cache status endpoint", False, "Request failed")
            return False
        
        if response.status_code != 200:
            print_result("Cache status endpoint", False, f"Status: {response.status_code}")
            return False
        
        try:
            data = response.json()
            connected = data.get('connected', False)
            cache_type = data.get('type', 'unknown')
            stats = data.get('stats', {})
            
            print_info(f"Cache connected: {connected}")
            print_info(f"Cache type: {cache_type}")
            print_info(f"Hit rate: {stats.get('hit_rate_percent', 0)}%")
            print_info(f"Response time: {elapsed:.2f}ms")
            
            print_result("Cache status endpoint", True, f"Using {cache_type} cache")
            return connected
        except Exception as e:
            print_result("Cache status endpoint", False, str(e))
            return False
    
    def test_products_list_cold(self, iterations: int = 5) -> list:
        """Test 2: Products list (cold cache)."""
        print_header("Test 2: Products List - Cold Cache")
        
        # Invalidate cache first (if possible)
        self._request('POST', '/api/products/cache/invalidate')
        
        times = []
        for i in range(iterations):
            # Add cache buster to force fresh request
            response, elapsed = self._request(
                'GET', 
                f'/api/products/?_cache_bust={time.time()}&page=1&per_page=20'
            )
            
            if response and response.status_code == 200:
                times.append(elapsed)
                print_info(f"Request {i+1}: {elapsed:.2f}ms")
            else:
                print_info(f"Request {i+1}: FAILED")
        
        if times:
            print_timing("Cold Cache Performance", times)
            avg = statistics.mean(times)
            print_result("Cold cache requests", avg < 2000, f"Avg: {avg:.2f}ms")
        
        return times
    
    def test_products_list_warm(self, iterations: int = 10) -> list:
        """Test 3: Products list (warm cache)."""
        print_header("Test 3: Products List - Warm Cache")
        
        # First request to warm the cache
        self._request('GET', '/api/products/?page=1&per_page=20')
        time.sleep(0.1)  # Small delay
        
        times = []
        for i in range(iterations):
            response, elapsed = self._request(
                'GET', 
                '/api/products/?page=1&per_page=20'
            )
            
            if response and response.status_code == 200:
                times.append(elapsed)
                
                # Check cache headers
                cache_hit = response.headers.get('X-Cache', 'MISS')
                if i < 3:  # Only print first few
                    print_info(f"Request {i+1}: {elapsed:.2f}ms (Cache: {cache_hit})")
            else:
                print_info(f"Request {i+1}: FAILED")
        
        if times:
            print_timing("Warm Cache Performance", times)
            avg = statistics.mean(times)
            # Warm cache should be much faster
            print_result("Warm cache requests", avg < 100, f"Avg: {avg:.2f}ms")
        
        return times
    
    def test_featured_products(self, iterations: int = 10) -> list:
        """Test 4: Featured products endpoint."""
        print_header("Test 4: Featured Products")
        
        # Warm the cache
        self._request('GET', '/api/featured/')
        time.sleep(0.1)
        
        times = []
        for i in range(iterations):
            response, elapsed = self._request('GET', '/api/featured/')
            
            if response and response.status_code == 200:
                times.append(elapsed)
        
        if times:
            print_timing("Featured Products Performance", times)
            avg = statistics.mean(times)
            print_result("Featured products", avg < 100, f"Avg: {avg:.2f}ms")
        
        return times
    
    def test_flash_sales(self, iterations: int = 10) -> list:
        """Test 5: Flash sales endpoint."""
        print_header("Test 5: Flash Sales")
        
        # Warm the cache
        self._request('GET', '/api/featured/flash-sales')
        time.sleep(0.1)
        
        times = []
        for i in range(iterations):
            response, elapsed = self._request('GET', '/api/featured/flash-sales')
            
            if response and response.status_code == 200:
                times.append(elapsed)
        
        if times:
            print_timing("Flash Sales Performance", times)
            avg = statistics.mean(times)
            print_result("Flash sales", avg < 100, f"Avg: {avg:.2f}ms")
        
        return times
    
    def test_product_detail(self, product_id: int = 1, iterations: int = 10) -> list:
        """Test 6: Single product detail."""
        print_header("Test 6: Product Detail")
        
        # First, get a valid product ID
        response, _ = self._request('GET', '/api/products/?page=1&per_page=1')
        if response and response.status_code == 200:
            try:
                data = response.json()
                products = data.get('products', [])
                if products:
                    product_id = products[0].get('id', product_id)
                    print_info(f"Testing with product ID: {product_id}")
            except:
                pass
        
        # Warm the cache
        self._request('GET', f'/api/products/{product_id}')
        time.sleep(0.1)
        
        times = []
        for i in range(iterations):
            response, elapsed = self._request('GET', f'/api/products/{product_id}')
            
            if response and response.status_code == 200:
                times.append(elapsed)
        
        if times:
            print_timing("Product Detail Performance", times)
            avg = statistics.mean(times)
            print_result("Product detail", avg < 100, f"Avg: {avg:.2f}ms")
        
        return times
    
    def test_cache_improvement(self) -> dict:
        """Test 7: Compare cold vs warm cache performance."""
        print_header("Test 7: Cache Performance Improvement")
        
        # Invalidate first
        self._request('POST', '/api/products/cache/invalidate')
        time.sleep(0.2)
        
        # Cold request
        _, cold_time = self._request('GET', '/api/products/?page=1&per_page=50')
        print_info(f"Cold cache request: {cold_time:.2f}ms")
        
        time.sleep(0.1)
        
        # Warm requests
        warm_times = []
        for _ in range(5):
            _, elapsed = self._request('GET', '/api/products/?page=1&per_page=50')
            warm_times.append(elapsed)
        
        avg_warm = statistics.mean(warm_times)
        print_info(f"Warm cache average: {avg_warm:.2f}ms")
        
        if cold_time > 0:
            improvement = ((cold_time - avg_warm) / cold_time) * 100
            speedup = cold_time / avg_warm if avg_warm > 0 else 0
            
            print_info(f"Performance improvement: {improvement:.1f}%")
            print_info(f"Speedup factor: {speedup:.1f}x faster")
            
            print_result(
                "Cache improvement", 
                improvement > 30 or avg_warm < 50,
                f"{speedup:.1f}x faster with cache"
            )
            
            return {
                "cold_time": cold_time,
                "warm_time": avg_warm,
                "improvement_percent": improvement,
                "speedup_factor": speedup
            }
        
        return {}
    
    def run_full_benchmark(self) -> dict:
        """Run complete benchmark suite."""
        print("\n")
        print("*" * 70)
        print("*  MIZIZZI API PERFORMANCE BENCHMARK")
        print("*" * 70)
        print(f"\nBase URL: {self.base_url}")
        print(f"Started at: {datetime.utcnow().isoformat()}")
        
        results = {
            "cache_connected": self.test_cache_status(),
            "cold_cache_times": self.test_products_list_cold(5),
            "warm_cache_times": self.test_products_list_warm(10),
            "featured_times": self.test_featured_products(10),
            "flash_sales_times": self.test_flash_sales(10),
            "product_detail_times": self.test_product_detail(iterations=10),
            "cache_improvement": self.test_cache_improvement(),
        }
        
        # Summary
        print_header("BENCHMARK SUMMARY")
        
        if results["warm_cache_times"]:
            warm_avg = statistics.mean(results["warm_cache_times"])
            print_info(f"Products List (cached): {warm_avg:.2f}ms avg")
        
        if results["featured_times"]:
            feat_avg = statistics.mean(results["featured_times"])
            print_info(f"Featured Products: {feat_avg:.2f}ms avg")
        
        if results["cache_improvement"]:
            print_info(f"Cache speedup: {results['cache_improvement'].get('speedup_factor', 0):.1f}x")
        
        print("\n" + "-" * 70)
        
        if results["cache_connected"]:
            print("  Status: CACHE IS WORKING - Products are being served fast!")
        else:
            print("  Status: CACHE NOT CONNECTED - Using fallback (slower)")
        
        print("-" * 70 + "\n")
        
        return results


def main():
    parser = argparse.ArgumentParser(description='Mizizzi API Performance Tester')
    parser.add_argument(
        '--base-url', 
        default='http://localhost:5000',
        help='Base URL of the API (default: http://localhost:5000)'
    )
    parser.add_argument(
        '--iterations',
        type=int,
        default=10,
        help='Number of iterations per test (default: 10)'
    )
    
    args = parser.parse_args()
    
    tester = APIPerformanceTester(args.base_url)
    results = tester.run_full_benchmark()
    
    # Exit with error if cache not connected
    sys.exit(0 if results.get("cache_connected") else 1)


if __name__ == "__main__":
    main()
