#!/usr/bin/env python3
"""
Sync Meilisearch to Production (Render)

This script configures and syncs your Render Meilisearch instance with products from your database.
Run this after deploying Meilisearch to Render.

Usage:
    python scripts/sync_production_meilisearch.py --url https://your-meilisearch.onrender.com --key your-master-key
"""

import sys
import os
import argparse

# Add the backend directory to the path
backend_dir = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_dir)

from meilisearch import Client
from meilisearch.errors import MeilisearchApiError


def setup_production_meilisearch(url, api_key):
    """Configure production Meilisearch with fuzzy search settings"""
    
    print("=" * 60)
    print("  MEILISEARCH PRODUCTION SETUP")
    print("=" * 60)
    print(f"\nConnecting to: {url}")
    
    try:
        # Connect to Meilisearch
        client = Client(url, api_key)
        
        # Check connection
        health = client.health()
        print(f"✓ Connection successful: {health['status']}")
        
        version = client.get_version()
        print(f"✓ Meilisearch version: {version['pkgVersion']}")
        
    except Exception as e:
        print(f"✗ Connection failed: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("  CONFIGURING PRODUCTS INDEX")
    print("=" * 60)
    
    try:
        # Get or create products index
        index = client.index('products')
        
        # Configure searchable attributes
        searchable = [
            'name', 'description', 'short_description',
            'category_name', 'brand_name', 'sku'
        ]
        task = index.update_searchable_attributes(searchable)
        client.wait_for_task(task.task_uid)
        print(f"✓ Configured {len(searchable)} searchable attributes")
        
        # Configure filterable attributes
        filterable = [
            'category_id', 'category_name', 'brand_id', 'brand_name',
            'price', 'sale_price', 'is_featured', 'is_new', 'is_sale',
            'is_flash_sale', 'is_luxury_deal', 'stock'
        ]
        task = index.update_filterable_attributes(filterable)
        client.wait_for_task(task.task_uid)
        print(f"✓ Configured {len(filterable)} filterable attributes")
        
        # Configure sortable attributes
        sortable = ['price', 'sale_price', 'name', 'created_at', 'updated_at']
        task = index.update_sortable_attributes(sortable)
        client.wait_for_task(task.task_uid)
        print(f"✓ Configured {len(sortable)} sortable attributes")
        
        # Configure ranking rules
        ranking_rules = ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness']
        task = index.update_ranking_rules(ranking_rules)
        client.wait_for_task(task.task_uid)
        print(f"✓ Configured ranking rules")
        
        # Configure typo tolerance (Jumia-style fuzzy search)
        typo_config = {
            'enabled': True,
            'minWordSizeForTypos': {
                'oneTypo': 3,  # Allow 1 typo for 3+ character words
                'twoTypos': 6  # Allow 2 typos for 6+ character words
            },
            'disableOnWords': [],
            'disableOnAttributes': []
        }
        task = index.update_typo_tolerance(typo_config)
        client.wait_for_task(task.task_uid)
        print("✓ Enabled Jumia-style fuzzy search with typo tolerance")
        
        print("\n✓ Products index configured successfully!")
        
    except Exception as e:
        print(f"✗ Configuration failed: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("  NEXT STEPS")
    print("=" * 60)
    print("\n1. Update your backend .env file:")
    print(f"   MEILISEARCH_HOST={url}")
    print(f"   MEILISEARCH_API_KEY={api_key[:10]}...")
    print("\n2. Restart your backend server")
    print("\n3. Sync products via API:")
    print("   POST /api/admin/meilisearch/sync-products")
    print("\n4. Test search:")
    print("   GET /api/meilisearch/search?q=itel")
    print("\n" + "=" * 60)
    
    return True


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Setup production Meilisearch on Render')
    parser.add_argument('--url', required=True, help='Render Meilisearch URL (e.g., https://meilisearch-v1-10-67w3.onrender.com)')
    parser.add_argument('--key', required=True, help='Meilisearch master key from Render')
    
    args = parser.parse_args()
    
    success = setup_production_meilisearch(args.url, args.key)
    
    if success:
        print("\n✓ Setup complete! Your production Meilisearch is ready.")
        sys.exit(0)
    else:
        print("\n✗ Setup failed. Please check the errors above.")
        sys.exit(1)
