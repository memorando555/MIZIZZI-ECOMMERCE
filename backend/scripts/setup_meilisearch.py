#!/usr/bin/env python3
"""
Meilisearch Setup Script for FREE Self-Hosted Version
======================================================

This script initializes Meilisearch indexes and syncs all products from the database.

PREREQUISITES:
1. Install Meilisearch package:
   pip install meilisearch

2. Start Meilisearch with Docker (FREE - no API key needed):
   docker run -it --rm -p 7700:7700 -v meili_data:/meili_data getmeili/meilisearch:v1.10

   Or run in background:
   docker run -d --name meilisearch -p 7700:7700 -v meili_data:/meili_data getmeili/meilisearch:v1.10

3. (Optional) Set environment variables:
   export MEILISEARCH_HOST=http://localhost:7700
   # MEILISEARCH_API_KEY is NOT needed for free version without master key

USAGE:
   cd backend
   python scripts/setup_meilisearch.py
"""

import os
import sys
import time

# This works whether running from backend/ or backend/scripts/
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)  # Go up from scripts/ to backend/
sys.path.insert(0, backend_dir)

# Also add current working directory in case running from backend root
sys.path.insert(0, os.getcwd())

try:
    import meilisearch
except ImportError:
    print("ERROR: meilisearch package not installed")
    print("Run: pip install meilisearch")
    sys.exit(1)

# Load environment variables from .env if available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv is optional


def print_banner():
    """Print setup banner."""
    print("=" * 60)
    print("  MEILISEARCH SETUP - FREE SELF-HOSTED VERSION")
    print("=" * 60)
    print()


def get_meilisearch_client():
    """Initialize and return Meilisearch client for free version."""
    host = os.getenv('MEILISEARCH_HOST', 'http://localhost:7700')
    api_key = os.getenv('MEILISEARCH_API_KEY', '')  # Optional for free version
    
    print(f"Connecting to Meilisearch at: {host}")
    
    if api_key:
        print("Using API key from environment")
        client = meilisearch.Client(host, api_key)
    else:
        print("No API key configured (OK for free self-hosted version)")
        client = meilisearch.Client(host)
    
    return client


def check_connection(client):
    """Check if Meilisearch is running and accessible."""
    print("\n--- Checking Meilisearch Connection ---")
    
    try:
        health = client.health()
        if isinstance(health, dict):
            print(f"Status: {health.get('status', 'unknown')}")
        else:
            print(f"Status: {getattr(health, 'status', 'available')}")
        
        version = client.get_version()
        if isinstance(version, dict):
            print(f"Version: {version.get('pkgVersion', 'unknown')}")
            commit_sha = version.get('commitSha', 'unknown')
        else:
            print(f"Version: {getattr(version, 'pkg_version', 'unknown')}")
            commit_sha = getattr(version, 'commit_sha', 'unknown')
        print(f"Commit SHA: {str(commit_sha)[:8]}")
        
        stats = client.get_all_stats()
        if isinstance(stats, dict):
            print(f"Database size: {stats.get('databaseSize', 0)} bytes")
        else:
            print(f"Database size: {getattr(stats, 'database_size', 0)} bytes")
        
        return True
        
    except Exception as e:
        print(f"\nERROR: Cannot connect to Meilisearch")
        print(f"Details: {str(e)}")
        print()
        print("Make sure Meilisearch is running. Start with:")
        print()
        print("  docker run -it --rm \\")
        print("    -p 7700:7700 \\")
        print("    -v meili_data:/meili_data \\")
        print("    getmeili/meilisearch:v1.10")
        print()
        return False


def setup_products_index(client):
    """Create and configure the products index."""
    print("\n--- Setting up 'products' index ---")
    
    # Create or get the index
    try:
        task = client.create_index('products', {'primaryKey': 'id'})
        client.wait_for_task(task.task_uid)
        print("Created new 'products' index")
    except meilisearch.errors.MeilisearchApiError as e:
        if 'index_already_exists' in str(e):
            print("'products' index already exists")
        else:
            raise e
    
    index = client.index('products')
    
    # Configure searchable attributes
    searchable_attrs = [
        'name', 'title', 'description', 'short_description',
        'category', 'category_name', 'brand', 'brand_name',
        'tags', 'sku', 'meta_title', 'meta_description'
    ]
    task = index.update_searchable_attributes(searchable_attrs)
    client.wait_for_task(task.task_uid)
    print(f"Configured {len(searchable_attrs)} searchable attributes")
    
    # Configure filterable attributes
    filterable_attrs = [
        'category_id', 'category', 'category_name',
        'brand_id', 'brand', 'brand_name',
        'price', 'sale_price',
        'is_active', 'is_visible', 'is_featured', 'is_new', 'is_sale',
        'is_flash_sale', 'is_luxury_deal', 'stock', 'in_stock'
    ]
    task = index.update_filterable_attributes(filterable_attrs)
    client.wait_for_task(task.task_uid)
    print(f"Configured {len(filterable_attrs)} filterable attributes")
    
    # Configure sortable attributes
    sortable_attrs = ['price', 'sale_price', 'name', 'title', 'created_at', 'updated_at', 'stock']
    task = index.update_sortable_attributes(sortable_attrs)
    client.wait_for_task(task.task_uid)
    print(f"Configured {len(sortable_attrs)} sortable attributes")
    
    # Configure ranking rules
    ranking_rules = ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness']
    task = index.update_ranking_rules(ranking_rules)
    client.wait_for_task(task.task_uid)
    print(f"Configured ranking rules: {ranking_rules}")
    
    # Configure typo tolerance for Jumia-style fuzzy search
    task = index.update_typo_tolerance({
        'enabled': True,
        'minWordSizeForTypos': {
            'oneTypo': 3,  # Allow 1 typo for 3+ char words (more lenient)
            'twoTypos': 6  # Allow 2 typos for 6+ char words
        },
        'disableOnWords': [],
        'disableOnAttributes': []
    })
    client.wait_for_task(task.task_uid)
    print("Enabled fuzzy search with typo tolerance (Jumia-style)")
    
    print("Products index setup complete!")
    
    return index


def setup_categories_index(client):
    """Create and configure the categories index."""
    print("\n--- Setting up 'categories' index ---")
    
    try:
        task = client.create_index('categories', {'primaryKey': 'id'})
        client.wait_for_task(task.task_uid)
        print("Created new 'categories' index")
    except meilisearch.errors.MeilisearchApiError as e:
        if 'index_already_exists' in str(e):
            print("'categories' index already exists")
        else:
            raise e
    
    index = client.index('categories')
    
    task = index.update_searchable_attributes(['name', 'description', 'slug'])
    client.wait_for_task(task.task_uid)
    
    task = index.update_filterable_attributes(['parent_id', 'is_active'])
    client.wait_for_task(task.task_uid)
    
    print("Categories index configured")
    return index


def sync_products_from_database(client):
    """Fetch products from database and sync to Meilisearch."""
    print("\n--- Syncing products from database ---")
    
    try:
        from app import create_app
        from app.models.models import Product
        
        app = create_app()
        
        with app.app_context():
            # Fetch all active products
            products = Product.query.filter_by(is_active=True).all()
            print(f"Found {len(products)} active products in database")
            
            if not products:
                print("No products to sync")
                return 0
            
            # Convert products to Meilisearch documents
            documents = []
            for product in products:
                try:
                    # Get image URLs
                    image_urls = []
                    if hasattr(product, 'get_image_urls'):
                        image_urls = product.get_image_urls()
                    
                    doc = {
                        'id': product.id,
                        'name': product.name,
                        'title': product.name,
                        'description': product.description or '',
                        'short_description': product.short_description or '',
                        'price': float(product.price) if product.price else 0,
                        'sale_price': float(product.sale_price) if product.sale_price else None,
                        'image': image_urls[0] if image_urls else (product.thumbnail_url or ''),
                        'thumbnail_url': product.thumbnail_url or '',
                        'image_urls': image_urls,
                        'category_id': product.category_id,
                        'category': product.category.name if product.category else '',
                        'category_name': product.category.name if product.category else '',
                        'brand_id': product.brand_id,
                        'brand': product.brand.name if product.brand else '',
                        'brand_name': product.brand.name if product.brand else '',
                        'sku': product.sku or '',
                        'slug': product.slug or '',
                        'stock': product.stock or 0,
                        'in_stock': (product.stock or 0) > 0,
                        'is_active': product.is_active,
                        'is_visible': product.is_visible if hasattr(product, 'is_visible') else True,
                        'is_featured': product.is_featured or False,
                        'is_new': product.is_new or False,
                        'is_sale': product.is_sale or False,
                        'is_flash_sale': product.is_flash_sale or False,
                        'is_luxury_deal': product.is_luxury_deal or False,
                        'created_at': product.created_at.timestamp() if product.created_at else None,
                        'updated_at': product.updated_at.timestamp() if product.updated_at else None
                    }
                    documents.append(doc)
                except Exception as e:
                    print(f"  Warning: Could not serialize product {product.id}: {e}")
            
            if not documents:
                print("No valid documents to sync")
                return 0
            
            # Add documents to Meilisearch
            index = client.index('products')
            task = index.add_documents(documents)
            print(f"Indexing {len(documents)} products... (Task ID: {task.task_uid})")
            
            # Wait for task to complete
            client.wait_for_task(task.task_uid, timeout_in_ms=60000)
            print("Sync completed successfully!")
            
            return len(documents)
            
    except ImportError as e:
        print(f"Could not import Flask app: {e}")
        print("Skipping database sync - run this from the backend directory")
        return 0
    except Exception as e:
        print(f"Error syncing products: {e}")
        return 0


def print_summary(client):
    """Print final summary."""
    print("\n" + "=" * 60)
    print("  SETUP COMPLETE")
    print("=" * 60)
    
    try:
        stats = client.index('products').get_stats()
        if isinstance(stats, dict):
            products_count = stats.get('numberOfDocuments', 0)
        else:
            products_count = getattr(stats, 'number_of_documents', 0)
        print(f"\nProducts indexed: {products_count}")
        
        cat_stats = client.index('categories').get_stats()
        if isinstance(cat_stats, dict):
            categories_count = cat_stats.get('numberOfDocuments', 0)
        else:
            categories_count = getattr(cat_stats, 'number_of_documents', 0)
        print(f"Categories indexed: {categories_count}")
    except Exception as e:
        print(f"\nNote: Could not retrieve index stats: {e}")
    
    print("\n" + "-" * 60)
    print("NEXT STEPS:")
    print("-" * 60)
    print()
    print("1. Test search in browser:")
    print("   http://localhost:7700")
    print()
    print("2. Search API endpoint:")
    print("   GET /api/search?q=your+query")
    print()
    print("3. Admin sync endpoint:")
    print("   POST /api/admin/meilisearch/sync-products")
    print()
    print("4. Keep Meilisearch running:")
    print("   docker run -d --name meilisearch \\")
    print("     -p 7700:7700 \\")
    print("     -v meili_data:/meili_data \\")
    print("     --restart unless-stopped \\")
    print("     getmeili/meilisearch:v1.10")
    print()


def main():
    """Main setup function."""
    print_banner()
    
    # Initialize client
    client = get_meilisearch_client()
    
    # Check connection
    if not check_connection(client):
        sys.exit(1)
    
    # Setup indexes
    setup_products_index(client)
    setup_categories_index(client)
    
    # Sync products
    sync_products_from_database(client)
    
    # Print summary
    print_summary(client)


if __name__ == '__main__':
    main()
