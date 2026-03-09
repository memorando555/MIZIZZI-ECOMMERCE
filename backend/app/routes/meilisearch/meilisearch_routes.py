"""
Meilisearch routes for public search and admin sync operations.
Configured for FREE self-hosted Meilisearch (Open Source version).

Setup Instructions:
1. Start Meilisearch with Docker:
   docker run -d --name meilisearch -p 7700:7700 -v meili_data:/meili_data --restart unless-stopped getmeili/meilisearch:v1.10

2. Set environment variable (optional if using default):
   export MEILISEARCH_HOST=http://localhost:7700

3. Setup indexes:
   POST /api/admin/meilisearch/setup

4. Sync products:
   POST /api/admin/meilisearch/sync-products

5. Search:
   GET /api/search?q=your+query
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import logging
import json

from app.configuration.extensions import db, limiter
from app.models.models import Product, Category, User, UserRole
from .meilisearch_client import get_meilisearch_client, reset_meilisearch_client

logger = logging.getLogger(__name__)

# Public search routes
meilisearch_routes = Blueprint('meilisearch_routes', __name__, url_prefix='/api/search')

# Admin sync routes  
admin_meilisearch_routes = Blueprint('admin_meilisearch_routes', __name__, url_prefix='/api/admin/meilisearch')


# ----------------------
# Helper Functions
# ----------------------

def is_admin_user():
    """Check if the current user is an admin."""
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return False
        user = db.session.get(User, current_user_id)
        return user and user.role == UserRole.ADMIN
    except Exception:
        return False


def serialize_product_for_meilisearch(product):
    """Serialize a product for Meilisearch indexing."""
    try:
        # Get image URLs
        image_urls = []
        if hasattr(product, 'get_image_urls') and callable(product.get_image_urls):
            try:
                image_urls = product.get_image_urls()
            except Exception:
                image_urls = []
        
        if not image_urls and product.image_urls:
            try:
                image_urls = json.loads(product.image_urls) if isinstance(product.image_urls, str) else product.image_urls
            except (json.JSONDecodeError, TypeError):
                image_urls = []
        
        if not isinstance(image_urls, list):
            image_urls = []
        
        # Get category info
        category_info = None
        if product.category:
            category_info = {
                'id': product.category.id,
                'name': product.category.name,
                'slug': getattr(product.category, 'slug', '')
            }
        
        # Get brand info
        brand_info = None
        if hasattr(product, 'brand') and product.brand:
            brand_info = {
                'id': product.brand.id,
                'name': product.brand.name,
                'slug': getattr(product.brand, 'slug', '')
            }
        
        return {
            'id': product.id,
            'name': product.name or '',
            'title': product.name or '',  # Alias for compatibility
            'description': product.description or '',
            'short_description': getattr(product, 'short_description', '') or '',
            'price': float(product.price) if product.price else 0,
            'sale_price': float(product.sale_price) if product.sale_price else None,
            'image': image_urls[0] if image_urls else (getattr(product, 'thumbnail_url', '') or ''),
            'thumbnail_url': getattr(product, 'thumbnail_url', '') or '',
            'image_urls': image_urls,
            'category_id': product.category_id,
            'category': category_info,
            'brand_id': getattr(product, 'brand_id', None),
            'brand': brand_info,
            'sku': getattr(product, 'sku', '') or '',
            'slug': getattr(product, 'slug', '') or '',
            'stock': getattr(product, 'stock', 0) or 0,
            'is_featured': getattr(product, 'is_featured', False) or False,
            'is_new': getattr(product, 'is_new', False) or False,
            'is_sale': getattr(product, 'is_sale', False) or False,
            'is_flash_sale': getattr(product, 'is_flash_sale', False) or False,
            'is_luxury_deal': getattr(product, 'is_luxury_deal', False) or False,
            'is_active': getattr(product, 'is_active', True) if hasattr(product, 'is_active') else True,
            'is_visible': getattr(product, 'is_visible', True) if hasattr(product, 'is_visible') else True,
            'meta_title': getattr(product, 'meta_title', '') or '',
            'meta_description': getattr(product, 'meta_description', '') or '',
            'created_at': product.created_at.isoformat() if product.created_at else None,
            'updated_at': product.updated_at.isoformat() if hasattr(product, 'updated_at') and product.updated_at else None
        }
    except Exception as e:
        logger.error(f"Error serializing product {product.id}: {str(e)}")
        return None


def serialize_category_for_meilisearch(category):
    """Serialize a category for Meilisearch indexing."""
    try:
        return {
            'id': category.id,
            'name': category.name or '',
            'slug': getattr(category, 'slug', '') or '',
            'description': getattr(category, 'description', '') or '',
            'parent_id': getattr(category, 'parent_id', None),
            'is_active': getattr(category, 'is_active', True) if hasattr(category, 'is_active') else True
        }
    except Exception as e:
        logger.error(f"Error serializing category {category.id}: {str(e)}")
        return None


# ----------------------
# Public Search Routes
# ----------------------

@meilisearch_routes.route('/', methods=['GET'])
@meilisearch_routes.route('', methods=['GET'])
@limiter.limit("100 per minute")
def search_products():
    """
    Search products using Meilisearch.
    
    Query Parameters:
        - q: Search query (required)
        - limit: Maximum results (default: 20, max: 100)
        - offset: Pagination offset (default: 0)
        - page: Page number (alternative to offset)
        - category_id: Filter by category ID
        - category: Filter by category name
        - brand_id: Filter by brand ID
        - brand: Filter by brand name
        - min_price: Minimum price filter
        - max_price: Maximum price filter
        - is_featured: Filter featured products
        - is_sale: Filter sale products
        - is_new: Filter new products
        - sort: Sort field (price_asc, price_desc, name_asc, name_desc, newest, oldest)
        - includeCategories: Include category search results
    
    Returns:
        JSON with results, total, and search metadata
    """
    try:
        # Get query parameters
        query = request.args.get('q', '').strip()
        limit = min(request.args.get('limit', 20, type=int), 100)
        offset = request.args.get('offset', 0, type=int)
        page = request.args.get('page', type=int)
        include_categories = request.args.get('includeCategories', 'false').lower() == 'true'
        
        # Support page-based pagination
        if page is not None and page > 0:
            offset = (page - 1) * limit
        
        # Filter parameters
        category_id = request.args.get('category_id', type=int)
        category_name = request.args.get('category', '').strip()
        brand_id = request.args.get('brand_id', type=int)
        brand_name = request.args.get('brand', '').strip()
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        is_featured = request.args.get('is_featured', '').lower()
        is_sale = request.args.get('is_sale', '').lower()
        is_new = request.args.get('is_new', '').lower()
        in_stock = request.args.get('in_stock', '').lower()
        
        # Sort parameter
        sort_param = request.args.get('sort', '').strip()
        
        if not query:
            return jsonify({
                'error': 'Search query is required',
                'message': 'Please provide a search query using the q parameter',
                'results': [],
                'items': [],
                'total': 0
            }), 400
        
        # Get Meilisearch client
        client = get_meilisearch_client()
        
        if not client.is_available():
            logger.info("[v0] Meilisearch not available - using database fallback for search")
            return fallback_database_search(query, limit, offset, category_id, min_price, max_price)
        
        # Build filter array
        filters = []
        filters.append('is_active = true')
        filters.append('is_visible = true')
        
        if category_id:
            filters.append(f'category_id = {category_id}')
        if category_name:
            filters.append(f'category_name = "{category_name}"')
        if brand_id:
            filters.append(f'brand_id = {brand_id}')
        if brand_name:
            filters.append(f'brand_name = "{brand_name}"')
        if min_price is not None:
            filters.append(f'price >= {min_price}')
        if max_price is not None:
            filters.append(f'price <= {max_price}')
        if is_featured == 'true':
            filters.append('is_featured = true')
        if is_sale == 'true':
            filters.append('is_sale = true')
        if is_new == 'true':
            filters.append('is_new = true')
        if in_stock == 'true':
            filters.append('stock > 0')
        
        filter_string = ' AND '.join(filters) if filters else None
        
        # Build sort array
        sort = None
        if sort_param:
            sort_map = {
                'price_asc': ['price:asc'],
                'price_desc': ['price:desc'],
                'name_asc': ['name:asc'],
                'name_desc': ['name:desc'],
                'newest': ['created_at:desc'],
                'oldest': ['created_at:asc'],
                'stock_asc': ['stock:asc'],
                'stock_desc': ['stock:desc']
            }
            sort = sort_map.get(sort_param)
        
        # Perform search
        result = client.search_products(
            query=query,
            limit=limit,
            offset=offset,
            filters=filter_string,
            sort=sort
        )
        
        if 'error' in result and not result.get('hits'):
            logger.info(f"[v0] Meilisearch search returned error, using database fallback: {result.get('error')}")
            return fallback_database_search(query, limit, offset, category_id, min_price, max_price)
        
        # Transform results to match frontend expectations
        transformed_results = []
        for hit in result.get('hits', []):
            transformed_results.append({
                'id': hit.get('id'),
                'name': hit.get('name', ''),
                'title': hit.get('name', ''),  # Alias
                'description': hit.get('description', ''),
                'short_description': hit.get('short_description', ''),
                'price': hit.get('price', 0),
                'sale_price': hit.get('sale_price'),
                'image': hit.get('image') or hit.get('thumbnail_url', ''),
                'thumbnail_url': hit.get('thumbnail_url') or hit.get('image', ''),
                'image_urls': hit.get('image_urls', []),
                'slug': hit.get('slug') or f"/product/{hit.get('id')}",
                'sku': hit.get('sku', ''),
                'category': hit.get('category_name', ''),
                'category_id': hit.get('category_id'),
                'category_name': hit.get('category_name', ''),
                'brand': hit.get('brand_name', ''),
                'brand_id': hit.get('brand_id'),
                'brand_name': hit.get('brand_name', ''),
                'is_featured': hit.get('is_featured', False),
                'is_sale': hit.get('is_sale', False),
                'is_new': hit.get('is_new', False),
                'is_flash_sale': hit.get('is_flash_sale', False),
                'is_luxury_deal': hit.get('is_luxury_deal', False),
                'stock': hit.get('stock', 0),
                'in_stock': (hit.get('stock', 0) or 0) > 0
            })
        
        total = result.get('total', 0)
        total_pages = (total + limit - 1) // limit if limit > 0 else 0
        current_page = (offset // limit) + 1 if limit > 0 else 1
        
        response = {
            'success': True,
            'results': transformed_results,
            'items': transformed_results,  # Alias for compatibility
            'products': transformed_results,  # Another alias
            'total': total,
            'query': query,
            'search_time': result.get('processingTimeMs', 0) / 1000,  # Convert to seconds
            'processing_time_ms': result.get('processingTimeMs', 0),
            'limit': limit,
            'offset': offset,
            'page': current_page,
            'total_pages': total_pages,
            'has_more': offset + limit < total
        }
        
        # Include category results if requested
        if include_categories:
            category_result = client.search_categories(query, limit=5)
            response['categories'] = category_result.get('hits', [])
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        return jsonify({
            'error': 'Search failed',
            'message': str(e),
            'results': [],
            'items': [],
            'total': 0
        }), 500


@meilisearch_routes.route('/suggestions', methods=['GET'])
@limiter.limit("200 per minute")
def get_search_suggestions():
    """
    Get search suggestions/autocomplete results.
    
    Query Parameters:
        - q: Search query (required)
        - limit: Maximum suggestions (default: 5, max: 10)
    
    Returns:
        JSON with suggestion list
    """
    try:
        query = request.args.get('q', '').strip()
        limit = min(request.args.get('limit', 5, type=int), 10)
        
        if not query or len(query) < 2:
            return jsonify({'suggestions': [], 'query': query}), 200
        
        client = get_meilisearch_client()
        
        if not client.is_available():
            logger.info("[v0] Meilisearch not available for suggestions - using database fallback")
            return fallback_suggestions_search(query, limit)
        
        result = client.search_products(query=query, limit=limit)
        
        suggestions = []
        seen_names = set()
        
        for hit in result.get('hits', []):
            name = hit.get('name', '')
            if name and name.lower() not in seen_names:
                suggestions.append({
                    'id': hit.get('id'),
                    'name': name,
                    'image': hit.get('image') or hit.get('thumbnail_url', ''),
                    'price': hit.get('price', 0),
                    'slug': hit.get('slug', '')
                })
                seen_names.add(name.lower())
        
        # If no results, try database fallback
        if not suggestions:
            return fallback_suggestions_search(query, limit)
        
        return jsonify({
            'suggestions': suggestions,
            'query': query
        }), 200
        
    except Exception as e:
        logger.error(f"Suggestions error: {str(e)}")
        return jsonify({'suggestions': [], 'query': query, 'error': str(e)}), 200


@meilisearch_routes.route('/categories', methods=['GET'])
@limiter.limit("100 per minute")
def search_categories():
    """
    Search categories using Meilisearch.
    
    Query Parameters:
        - q: Search query (required)
        - limit: Maximum results (default: 10)
    
    Returns:
        JSON with category results
    """
    try:
        query = request.args.get('q', '').strip()
        limit = min(request.args.get('limit', 10, type=int), 50)
        
        if not query:
            return jsonify({
                'error': 'Search query is required',
                'results': [],
                'total': 0
            }), 400
        
        client = get_meilisearch_client()
        
        if not client.is_available():
            # Fallback to database
            logger.info("[v0] Meilisearch not available for category search - using database fallback")
            return fallback_category_search(query, limit)
        
        result = client.search_categories(query, limit=limit)
        
        # If no results, try database fallback
        if not result.get('hits'):
            return fallback_category_search(query, limit)
        
        return jsonify({
            'success': True,
            'results': result.get('hits', []),
            'categories': result.get('hits', []),
            'total': result.get('total', 0),
            'query': query,
            'processing_time_ms': result.get('processingTimeMs', 0)
        }), 200
        
    except Exception as e:
        logger.error(f"Category search error: {str(e)}")
        return jsonify({
            'error': 'Category search failed',
            'message': str(e),
            'results': [],
            'total': 0
        }), 500


def fallback_suggestions_search(query: str, limit: int):
    """Fallback to database for suggestions if Meilisearch is unavailable."""
    try:
        from sqlalchemy import or_
        
        search_term = f"%{query}%"
        
        # Search for products by name
        products = Product.query.filter(
            Product.is_active == True,
            Product.name.ilike(search_term)
        ).limit(limit).all()
        
        suggestions = []
        seen_names = set()
        
        for product in products:
            if product.name and product.name.lower() not in seen_names:
                suggestions.append({
                    'id': product.id,
                    'name': product.name,
                    'image': getattr(product, 'thumbnail_url', '') or '',
                    'price': float(product.price) if product.price else 0,
                    'slug': getattr(product, 'slug', '') or f'/product/{product.id}'
                })
                seen_names.add(product.name.lower())
        
        return jsonify({
            'suggestions': suggestions,
            'query': query,
            'fallback': True
        }), 200
        
    except Exception as e:
        logger.error(f"Fallback suggestions error: {str(e)}")
        return jsonify({'suggestions': [], 'query': query, 'error': str(e)}), 200


def fallback_database_search(query: str, limit: int, offset: int, category_id=None, min_price=None, max_price=None):
    """Fallback to database search if Meilisearch is unavailable."""
    try:
        from sqlalchemy import or_
        
        search_term = f"%{query}%"
        
        base_query = Product.query.filter(
            Product.is_active == True,
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term)
            )
        )
        
        # Apply additional filters
        if category_id:
            base_query = base_query.filter(Product.category_id == category_id)
        if min_price is not None:
            base_query = base_query.filter(Product.price >= min_price)
        if max_price is not None:
            base_query = base_query.filter(Product.price <= max_price)
        
        # Get total count
        total = base_query.count()
        
        # Get paginated results
        products = base_query.offset(offset).limit(limit).all()
        
        results = []
        for product in products:
            serialized = serialize_product_for_meilisearch(product)
            if serialized:
                results.append({
                    'id': serialized['id'],
                    'name': serialized['name'],
                    'title': serialized['name'],
                    'description': serialized['description'],
                    'price': serialized['price'],
                    'sale_price': serialized.get('sale_price'),
                    'image': serialized['image'],
                    'thumbnail_url': serialized['thumbnail_url'],
                    'image_urls': serialized.get('image_urls', []),
                    'slug': serialized['slug'] or f"/product/{serialized['id']}",
                    'category': serialized['category']['name'] if serialized.get('category') else '',
                    'category_id': serialized.get('category_id'),
                    'brand': serialized['brand']['name'] if serialized.get('brand') else '',
                    'brand_id': serialized.get('brand_id'),
                    'stock': serialized.get('stock', 0),
                    'is_featured': serialized.get('is_featured', False),
                    'is_sale': serialized.get('is_sale', False)
                })
        
        total_pages = (total + limit - 1) // limit if limit > 0 else 0
        current_page = (offset // limit) + 1 if limit > 0 else 1
        
        return jsonify({
            'success': True,
            'results': results,
            'items': results,
            'products': results,
            'total': total,
            'query': query,
            'search_time': 0,
            'limit': limit,
            'offset': offset,
            'page': current_page,
            'total_pages': total_pages,
            'has_more': offset + limit < total,
            'fallback': True,
            'fallback_reason': 'Meilisearch unavailable'
        }), 200
        
    except Exception as e:
        logger.error(f"Fallback search error: {str(e)}")
        return jsonify({
            'error': 'Search failed',
            'message': str(e),
            'results': [],
            'items': [],
            'total': 0
        }), 500


def fallback_category_search(query: str, limit: int):
    """Fallback to database category search."""
    try:
        search_term = f"%{query}%"
        categories = Category.query.filter(
            Category.name.ilike(search_term)
        ).limit(limit).all()
        
        results = []
        for cat in categories:
            serialized = serialize_category_for_meilisearch(cat)
            if serialized:
                results.append(serialized)
        
        return jsonify({
            'success': True,
            'results': results,
            'categories': results,
            'total': len(results),
            'query': query,
            'fallback': True
        }), 200
        
    except Exception as e:
        logger.error(f"Fallback category search error: {str(e)}")
        return jsonify({
            'error': 'Category search failed',
            'results': [],
            'total': 0
        }), 500


@meilisearch_routes.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for Meilisearch service."""
    client = get_meilisearch_client()
    is_available = client.is_available()
    
    response = {
        'status': 'ok' if is_available else 'degraded',
        'service': 'meilisearch',
        'available': is_available,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    if is_available:
        try:
            response['connection'] = client.get_connection_info()
        except Exception:
            pass
    else:
        response['help'] = 'Start Meilisearch with: docker run -d --name meilisearch -p 7700:7700 -v meili_data:/meili_data --restart unless-stopped getmeili/meilisearch:v1.10'
    
    return jsonify(response), 200


# ----------------------
# Admin Sync Routes
# ----------------------

@admin_meilisearch_routes.route('/sync-products', methods=['POST'])
@jwt_required()
def sync_products():
    """
    Sync all products from the database to Meilisearch.
    Admin only endpoint.
    
    Request Body (optional):
        - batch_size: Number of products per batch (default: 1000)
        - include_inactive: Include inactive products (default: false)
    
    Returns:
        JSON with sync status and count of indexed products
    """
    if not is_admin_user():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        client = get_meilisearch_client()
        
        if not client.is_available():
            return jsonify({
                'success': False,
                'error': 'Meilisearch is not available',
                'message': 'Please check MEILISEARCH_HOST environment variable',
                'help': 'Start Meilisearch with: docker run -d --name meilisearch -p 7700:7700 -v meili_data:/meili_data --restart unless-stopped getmeili/meilisearch:v1.10'
            }), 503
        
        # Get request options
        data = request.get_json(silent=True) or {}
        batch_size = data.get('batch_size', 1000)
        include_inactive = data.get('include_inactive', False)
        
        # Configure the index first
        client.configure_products_index()
        
        # Get products from database
        if include_inactive:
            products = Product.query.all()
        else:
            products = Product.query.filter_by(is_active=True).all()
        
        if not products:
            return jsonify({
                'success': True,
                'message': 'No products to sync',
                'indexed': 0
            }), 200
        
        # Serialize products
        product_dicts = []
        errors = []
        for product in products:
            serialized = serialize_product_for_meilisearch(product)
            if serialized:
                product_dicts.append(serialized)
            else:
                errors.append(f"Failed to serialize product {product.id}")
        
        if not product_dicts:
            return jsonify({
                'success': False,
                'error': 'No products could be serialized',
                'errors': errors[:10]  # Limit error messages
            }), 500
        
        # Index products in batches
        total_indexed = 0
        task_uids = []
        
        for i in range(0, len(product_dicts), batch_size):
            batch = product_dicts[i:i + batch_size]
            result = client.index_products(batch)
            
            if result.get('success'):
                total_indexed += result.get('indexed', 0)
                if result.get('task_uid'):
                    task_uids.append(result['task_uid'])
            else:
                logger.error(f"Batch indexing error: {result.get('error')}")
        
        current_app.logger.info(f"Synced {total_indexed} products to Meilisearch")
        
        return jsonify({
            'success': True,
            'message': f"Successfully synced {total_indexed} products",
            'indexed': total_indexed,
            'total_products': len(products),
            'task_uids': task_uids,
            'serialization_errors': len(errors),
            'errors': errors[:5] if errors else []  # Show first 5 errors
        }), 200
        
    except Exception as e:
        logger.error(f"Error syncing products: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to sync products',
            'message': str(e)
        }), 500


@admin_meilisearch_routes.route('/sync-products', methods=['GET'])
@jwt_required()
def get_sync_status():
    """Get the current sync status and index statistics."""
    if not is_admin_user():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        client = get_meilisearch_client()
        
        if not client.is_available():
            return jsonify({
                'status': 'unavailable',
                'message': 'Meilisearch is not connected',
                'help': 'Start Meilisearch with: docker run -d --name meilisearch -p 7700:7700 -v meili_data:/meili_data --restart unless-stopped getmeili/meilisearch:v1.10'
            }), 200
        
        stats = client.get_index_stats()
        
        products_stats = stats.get('indexes', {}).get('products', {})
        categories_stats = stats.get('indexes', {}).get('categories', {})
        
        # Get database counts for comparison
        db_product_count = Product.query.filter_by(is_active=True).count()
        db_category_count = Category.query.count()
        
        products_indexed = products_stats.get('numberOfDocuments', 0) if isinstance(products_stats, dict) else getattr(products_stats, 'number_of_documents', 0)
        categories_indexed = categories_stats.get('numberOfDocuments', 0) if isinstance(categories_stats, dict) else getattr(categories_stats, 'number_of_documents', 0)
        
        return jsonify({
            'status': 'connected',
            'meilisearch': {
                'database_size': stats.get('database_size', 0),
                'products_indexed': products_indexed,
                'categories_indexed': categories_indexed
            },
            'database': {
                'products_count': db_product_count,
                'categories_count': db_category_count
            },
            'sync_needed': {
                'products': db_product_count != products_indexed,
                'categories': db_category_count != categories_indexed
            },
            'connection': client.get_connection_info()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting sync status: {str(e)}")
        return jsonify({
            'error': 'Failed to get sync status',
            'message': str(e)
        }), 500


@admin_meilisearch_routes.route('/sync-categories', methods=['POST'])
@jwt_required()
def sync_categories():
    """Sync all categories from the database to Meilisearch."""
    if not is_admin_user():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        client = get_meilisearch_client()
        
        if not client.is_available():
            return jsonify({
                'success': False,
                'error': 'Meilisearch is not available'
            }), 503
        
        # Configure the index first
        client.configure_categories_index()
        
        # Get all categories from database
        categories = Category.query.all()
        
        if not categories:
            return jsonify({
                'success': True,
                'message': 'No categories to sync',
                'indexed': 0
            }), 200
        
        # Serialize categories
        category_dicts = []
        for category in categories:
            serialized = serialize_category_for_meilisearch(category)
            if serialized:
                category_dicts.append(serialized)
        
        # Index categories
        result = client.index_categories(category_dicts)
        
        if not result.get('success'):
            return jsonify({
                'success': False,
                'error': 'Failed to index categories',
                'message': result.get('error')
            }), 500
        
        return jsonify({
            'success': True,
            'message': f"Successfully synced {result.get('indexed', 0)} categories",
            'indexed': result.get('indexed', 0),
            'task_uid': result.get('task_uid')
        }), 200
        
    except Exception as e:
        logger.error(f"Error syncing categories: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to sync categories',
            'message': str(e)
        }), 500


@admin_meilisearch_routes.route('/sync-single-product/<int:product_id>', methods=['POST'])
@jwt_required()
def sync_single_product(product_id):
    """Sync a single product to Meilisearch (for real-time updates)."""
    if not is_admin_user():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        client = get_meilisearch_client()
        
        if not client.is_available():
            return jsonify({
                'success': False,
                'error': 'Meilisearch is not available'
            }), 503
        
        product = db.session.get(Product, product_id)
        if not product:
            return jsonify({
                'success': False,
                'error': 'Product not found'
            }), 404
        
        serialized = serialize_product_for_meilisearch(product)
        if not serialized:
            return jsonify({
                'success': False,
                'error': 'Failed to serialize product'
            }), 500
        
        result = client.update_product(serialized)
        
        return jsonify({
            'success': result.get('success', False),
            'message': f"Product {product_id} synced to Meilisearch",
            'task_uid': result.get('task_uid')
        }), 200 if result.get('success') else 500
        
    except Exception as e:
        logger.error(f"Error syncing product {product_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to sync product',
            'message': str(e)
        }), 500


@admin_meilisearch_routes.route('/delete-product/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product_from_index(product_id):
    """Delete a product from the Meilisearch index."""
    if not is_admin_user():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        client = get_meilisearch_client()
        
        if not client.is_available():
            return jsonify({
                'success': False,
                'error': 'Meilisearch is not available'
            }), 503
        
        success = client.delete_product(product_id)
        
        return jsonify({
            'success': success,
            'message': f"Product {product_id} {'deleted from' if success else 'could not be deleted from'} Meilisearch index"
        }), 200 if success else 500
        
    except Exception as e:
        logger.error(f"Error deleting product {product_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to delete product',
            'message': str(e)
        }), 500


@admin_meilisearch_routes.route('/clear-index', methods=['POST'])
@jwt_required()
def clear_index():
    """Clear all documents from the products index."""
    if not is_admin_user():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        client = get_meilisearch_client()
        
        if not client.is_available():
            return jsonify({
                'success': False,
                'error': 'Meilisearch is not available'
            }), 503
        
        # Get which index to clear
        data = request.get_json(silent=True) or {}
        index_name = data.get('index', 'products')
        
        if index_name == 'products':
            success = client.clear_products_index()
        elif index_name == 'categories':
            success = client.clear_categories_index()
        elif index_name == 'all':
            success = client.clear_products_index() and client.clear_categories_index()
        else:
            return jsonify({
                'success': False,
                'error': f"Unknown index: {index_name}"
            }), 400
        
        return jsonify({
            'success': success,
            'message': f"{'Cleared' if success else 'Failed to clear'} {index_name} index"
        }), 200 if success else 500
            
    except Exception as e:
        logger.error(f"Error clearing index: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to clear index',
            'message': str(e)
        }), 500


@admin_meilisearch_routes.route('/task/<int:task_uid>', methods=['GET'])
@jwt_required()
def get_task_status(task_uid):
    """Get the status of an indexing task."""
    if not is_admin_user():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        client = get_meilisearch_client()
        
        if not client.is_available():
            return jsonify({
                'success': False,
                'error': 'Meilisearch is not available'
            }), 503
        
        task_info = client.get_task_status(task_uid)
        
        return jsonify({
            'success': 'error' not in task_info,
            'task': task_info
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting task status: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get task status',
            'message': str(e)
        }), 500


@admin_meilisearch_routes.route('/health', methods=['GET'])
def admin_health_check():
    """Health check for admin Meilisearch routes."""
    return jsonify({
        'status': 'ok',
        'service': 'admin_meilisearch_routes',
        'timestamp': datetime.utcnow().isoformat()
    }), 200


# ----------------------
# Setup & Configuration Routes
# ----------------------

@admin_meilisearch_routes.route('/setup', methods=['POST'])
@jwt_required()
def setup_meilisearch():
    """
    Initialize Meilisearch indexes with proper configuration.
    Run this once after starting Meilisearch for the first time.
    """
    if not is_admin_user():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        client = get_meilisearch_client()
        
        if not client.is_available():
            return jsonify({
                'success': False,
                'error': 'Meilisearch is not available',
                'help': 'Start Meilisearch with: docker run -d --name meilisearch -p 7700:7700 -v meili_data:/meili_data --restart unless-stopped getmeili/meilisearch:v1.10'
            }), 503
        
        # Configure both indexes
        products_configured = client.configure_products_index()
        categories_configured = client.configure_categories_index()
        
        return jsonify({
            'success': True,
            'message': 'Meilisearch indexes configured successfully',
            'products_index': products_configured,
            'categories_index': categories_configured,
            'connection_info': client.get_connection_info()
        }), 200
        
    except Exception as e:
        logger.error(f"Error setting up Meilisearch: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to setup Meilisearch',
            'message': str(e)
        }), 500


@admin_meilisearch_routes.route('/reconnect', methods=['POST'])
@jwt_required()
def reconnect_meilisearch():
    """Force reconnection to Meilisearch (useful after configuration changes)."""
    if not is_admin_user():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        reset_meilisearch_client()
        client = get_meilisearch_client()
        
        return jsonify({
            'success': client.is_available(),
            'message': 'Reconnected to Meilisearch' if client.is_available() else 'Failed to reconnect',
            'connection_info': client.get_connection_info()
        }), 200 if client.is_available() else 503
        
    except Exception as e:
        logger.error(f"Error reconnecting to Meilisearch: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to reconnect',
            'message': str(e)
        }), 500


@admin_meilisearch_routes.route('/connection-info', methods=['GET'])
def get_connection_info():
    """Get Meilisearch connection information for debugging."""
    client = get_meilisearch_client()
    
    info = {
        'service': 'meilisearch',
        'version': 'free_self_hosted',
        'is_available': client.is_available(),
        'timestamp': datetime.utcnow().isoformat()
    }
    
    if client.is_available():
        info.update(client.get_connection_info())
        try:
            stats = client.get_index_stats()
            info['stats'] = stats
        except Exception:
            pass
    else:
        info['help'] = 'Start Meilisearch with: docker run -d --name meilisearch -p 7700:7700 -v meili_data:/meili_data --restart unless-stopped getmeili/meilisearch:v1.10'
    
    return jsonify(info), 200


@admin_meilisearch_routes.route('/stats', methods=['GET'])
def get_stats():
    """Get detailed Meilisearch statistics."""
    client = get_meilisearch_client()
    
    if not client.is_available():
        return jsonify({
            'success': False,
            'error': 'Meilisearch is not available'
        }), 503
    
    try:
        stats = client.get_index_stats()
        
        return jsonify({
            'success': True,
            'stats': stats,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get stats',
            'message': str(e)
        }), 500
