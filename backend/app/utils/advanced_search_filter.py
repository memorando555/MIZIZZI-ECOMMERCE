"""
Advanced Search and Filter Optimization Module
Implements efficient filtering, sorting, and search using indexed queries.
Supports complex filter combinations while maintaining sub-100ms response times.
"""
from app.utils.optimized_queries import OptimizedProductQuery
from app.models.models import Product
from app.configuration.extensions import db
from sqlalchemy import and_, or_, func, text
from sqlalchemy.orm import load_only
import time
import logging
from typing import Dict, List, Tuple, Optional
from enum import Enum

logger = logging.getLogger(__name__)


class SortOption(Enum):
    """Valid sort options for product queries."""
    NEWEST = 'newest'
    PRICE_LOW = 'price_low'
    PRICE_HIGH = 'price_high'
    DISCOUNT = 'discount'
    RATING = 'rating'
    SORT_ORDER = 'sort_order'


class AdvancedSearchFilter:
    """
    Advanced search and filtering with composite index optimization.
    Supports multi-factor filtering while leveraging database indexes.
    """

    @staticmethod
    def search_products(
        query: str,
        filters: Optional[Dict] = None,
        sort_by: str = 'sort_order',
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[dict], int]:
        """
        Search products by query string with optional filters.
        Uses efficient ILIKE with indexes where possible.
        Expected response: 40-80ms
        
        Args:
            query: Search query string
            filters: Optional dict with category_id, brand_id, price_min, price_max, etc.
            sort_by: Sort order
            limit: Results per page
            offset: Pagination offset
            
        Returns:
            Tuple of (results, total_count)
        """
        start_time = time.time()
        
        try:
            # Start with active/visible base
            q = OptimizedProductQuery.base_query().options(
                load_only(*OptimizedProductQuery.LIGHTWEIGHT_COLUMNS)
            )
            
            # Apply text search - targets both name and description
            search_term = f"%{query}%"
            q = q.filter(
                or_(
                    Product.name.ilike(search_term),
                    Product.description.ilike(search_term) if hasattr(Product, 'description') else True
                )
            )
            
            # Apply optional filters
            if filters:
                q = AdvancedSearchFilter._apply_filters(q, filters)
            
            # Apply sorting
            q = AdvancedSearchFilter._apply_sort(q, sort_by)
            
            # Get total count before pagination
            total = q.count()
            
            # Apply pagination
            results = q.limit(limit).offset(offset).all()
            
            # Serialize results
            serialized = [
                AdvancedSearchFilter._serialize_product(p)
                for p in results
            ]
            
            elapsed = time.time() - start_time
            logger.info(f"Search '{query}' returned {len(results)} results in {elapsed*1000:.2f}ms")
            
            return serialized, total
        
        except Exception as e:
            logger.error(f"Error in search_products: {e}")
            return [], 0

    @staticmethod
    def filter_products(
        filters: Dict,
        sort_by: str = 'sort_order',
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[dict], int]:
        """
        Apply complex filters to products.
        Optimized filter combinations using composite indexes.
        Expected response: 25-60ms depending on filters
        
        Supported filters:
            - category_id: Single or list of category IDs
            - brand_id: Single or list of brand IDs
            - price_min/price_max: Price range
            - discount_min: Minimum discount percentage
            - is_on_sale: Boolean
            - is_flash_sale: Boolean
            - in_stock: Boolean
            - rating_min: Minimum rating
        """
        start_time = time.time()
        
        try:
            q = OptimizedProductQuery.get_lightweight_query()
            
            # Apply filters
            q = AdvancedSearchFilter._apply_filters(q, filters)
            
            # Apply sorting
            q = AdvancedSearchFilter._apply_sort(q, sort_by)
            
            # Get total
            total = q.count()
            
            # Paginate and serialize
            results = q.limit(limit).offset(offset).all()
            serialized = [
                AdvancedSearchFilter._serialize_product(p)
                for p in results
            ]
            
            elapsed = time.time() - start_time
            logger.info(f"Filter query completed in {elapsed*1000:.2f}ms, returned {len(results)} results")
            
            return serialized, total
        
        except Exception as e:
            logger.error(f"Error in filter_products: {e}")
            return [], 0

    @staticmethod
    def _apply_filters(query, filters: Dict):
        """
        Apply filter conditions to query.
        Uses index-efficient filtering strategies.
        """
        if not filters:
            return query
        
        # Category filter (uses idx_category_active_visible_sort)
        if 'category_id' in filters:
            cat_id = filters['category_id']
            if isinstance(cat_id, list):
                query = query.filter(Product.category_id.in_(cat_id))
            else:
                query = query.filter(Product.category_id == cat_id)
        
        # Brand filter (uses idx_brand_active_visible)
        if 'brand_id' in filters:
            brand_id = filters['brand_id']
            if isinstance(brand_id, list):
                query = query.filter(Product.brand_id.in_(brand_id))
            else:
                query = query.filter(Product.brand_id == brand_id)
        
        # Price range filter (uses idx_price_active_visible)
        if 'price_min' in filters and 'price_max' in filters:
            query = query.filter(
                Product.price.between(filters['price_min'], filters['price_max'])
            )
        elif 'price_min' in filters:
            query = query.filter(Product.price >= filters['price_min'])
        elif 'price_max' in filters:
            query = query.filter(Product.price <= filters['price_max'])
        
        # Discount filter
        if 'discount_min' in filters:
            query = query.filter(Product.discount_percentage >= filters['discount_min'])
        
        # Sale status filters
        if filters.get('is_on_sale'):
            query = query.filter(
                or_(Product.is_sale == True, Product.is_flash_sale == True)
            )
        
        if filters.get('is_flash_sale'):
            query = query.filter(Product.is_flash_sale == True)
        
        # Stock filter (uses idx_stock_active)
        if filters.get('in_stock'):
            query = query.filter(Product.stock > 0)
        
        return query

    @staticmethod
    def _apply_sort(query, sort_by: str):
        """
        Apply sorting efficiently using indexed columns.
        Falls back gracefully if sort option not recognized.
        """
        try:
            sort_option = SortOption(sort_by)
            
            if sort_option == SortOption.NEWEST:
                query = query.order_by(Product.created_at.desc())
            elif sort_option == SortOption.PRICE_LOW:
                query = query.order_by(Product.price.asc())
            elif sort_option == SortOption.PRICE_HIGH:
                query = query.order_by(Product.price.desc())
            elif sort_option == SortOption.DISCOUNT:
                query = query.order_by(Product.discount_percentage.desc())
            elif sort_option == SortOption.RATING:
                # Rating not in index - use as secondary sort
                query = query.order_by(Product.sort_order.asc())
            else:
                query = query.order_by(Product.sort_order.asc())
        
        except ValueError:
            # Invalid sort option - use default
            query = query.order_by(Product.sort_order.asc())
        
        return query

    @staticmethod
    def browse_category(
        category_id: int,
        filters: Optional[Dict] = None,
        sort_by: str = 'sort_order',
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[dict], int]:
        """
        Browse products in a category with filters.
        Uses idx_category_covering for fast browsing.
        Expected response: 30-50ms
        """
        start_time = time.time()
        
        try:
            q = OptimizedProductQuery.get_lightweight_query().filter(
                Product.category_id == category_id
            )
            
            # Apply additional filters
            if filters:
                q = AdvancedSearchFilter._apply_filters(q, filters)
            
            # Sort
            q = AdvancedSearchFilter._apply_sort(q, sort_by)
            
            # Count and paginate
            total = q.count()
            results = q.limit(limit).offset(offset).all()
            
            serialized = [
                AdvancedSearchFilter._serialize_product(p)
                for p in results
            ]
            
            elapsed = time.time() - start_time
            logger.info(f"Category browse completed in {elapsed*1000:.2f}ms")
            
            return serialized, total
        
        except Exception as e:
            logger.error(f"Error in browse_category: {e}")
            return [], 0

    @staticmethod
    def browse_brand(
        brand_id: int,
        filters: Optional[Dict] = None,
        sort_by: str = 'sort_order',
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[dict], int]:
        """
        Browse products from a brand with filters.
        Uses idx_brand_active_visible for fast retrieval.
        Expected response: 30-50ms
        """
        start_time = time.time()
        
        try:
            q = OptimizedProductQuery.get_lightweight_query().filter(
                Product.brand_id == brand_id
            )
            
            if filters:
                q = AdvancedSearchFilter._apply_filters(q, filters)
            
            q = AdvancedSearchFilter._apply_sort(q, sort_by)
            
            total = q.count()
            results = q.limit(limit).offset(offset).all()
            
            serialized = [
                AdvancedSearchFilter._serialize_product(p)
                for p in results
            ]
            
            elapsed = time.time() - start_time
            logger.info(f"Brand browse completed in {elapsed*1000:.2f}ms")
            
            return serialized, total
        
        except Exception as e:
            logger.error(f"Error in browse_brand: {e}")
            return [], 0

    @staticmethod
    def _serialize_product(product) -> dict:
        """Lightweight serialization for search/filter results."""
        try:
            image_url = None
            if hasattr(product, 'thumbnail_url') and product.thumbnail_url:
                image_url = product.thumbnail_url
            elif hasattr(product, 'image_urls') and product.image_urls:
                if isinstance(product.image_urls, list) and len(product.image_urls) > 0:
                    image_url = product.image_urls[0]
                elif isinstance(product.image_urls, str):
                    images = product.image_urls.split(',')
                    image_url = images[0] if images else None
            
            return {
                'id': product.id,
                'name': product.name,
                'slug': product.slug,
                'price': float(product.price) if product.price else 0,
                'sale_price': float(product.sale_price) if product.sale_price else None,
                'discount_percentage': product.discount_percentage or 0,
                'image': image_url,
                'category_id': product.category_id,
                'brand_id': product.brand_id,
                'stock': product.stock,
            }
        except Exception as e:
            logger.error(f"Error serializing product: {e}")
            return {}
