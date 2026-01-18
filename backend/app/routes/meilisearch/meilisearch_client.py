"""
Meilisearch client initialization and configuration.
Optimized for FREE self-hosted Meilisearch (Open Source version).

Run Meilisearch locally with Docker:
    docker run -d --name meilisearch -p 7700:7700 -v meili_data:/meili_data --restart unless-stopped getmeili/meilisearch:v1.10

Environment Variables:
    - MEILISEARCH_HOST: The Meilisearch server URL (default: http://localhost:7700)
    - MEILISEARCH_API_KEY: Optional - only needed if you set a master key when starting Meilisearch
"""

import os
import logging
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

# Global client instance
_meilisearch_client: Optional['MeilisearchClient'] = None


class MeilisearchClient:
    """
    Wrapper for Meilisearch client with configuration and helper methods.
    Designed for the FREE self-hosted Meilisearch Open Source version.
    """
    
    PRODUCTS_INDEX = 'products'
    CATEGORIES_INDEX = 'categories'
    
    def __init__(self):
        """Initialize Meilisearch client with environment variables."""
        self.client = None
        self._available = False
        self.host = os.environ.get('MEILISEARCH_HOST', 'http://localhost:7700')
        self.api_key = os.environ.get('MEILISEARCH_API_KEY', '')
        
        try:
            import meilisearch
        except ImportError:
            logger.error("meilisearch package not installed. Run: pip install meilisearch")
            return
        
        logger.info(f"Connecting to Meilisearch at {self.host} (Free self-hosted version)")
        
        try:
            # For free version without master key, pass None or empty string
            if self.api_key:
                self.client = meilisearch.Client(self.host, self.api_key)
            else:
                self.client = meilisearch.Client(self.host)
            
            # Test connection
            health = self.client.health()
            self._available = True
            logger.info(f"Meilisearch connected successfully! Status: {health.get('status', 'unknown')}")
            
            # Log version info
            try:
                version = self.client.get_version()
                logger.info(f"Meilisearch version: {version.get('pkgVersion', 'unknown')}")
            except Exception:
                pass
                
        except Exception as e:
            logger.error(f"Failed to connect to Meilisearch at {self.host}: {str(e)}")
            logger.error("Make sure Meilisearch is running. Start with:")
            logger.error("  docker run -d --name meilisearch -p 7700:7700 -v meili_data:/meili_data --restart unless-stopped getmeili/meilisearch:v1.10")
            self.client = None
            self._available = False
    
    def is_available(self) -> bool:
        """Check if Meilisearch client is available and connected."""
        if not self._available or self.client is None:
            return False
        
        try:
            self.client.health()
            return True
        except Exception:
            self._available = False
            return False
    
    def get_connection_info(self) -> Dict[str, Any]:
        """Get connection information for debugging."""
        info = {
            'host': self.host,
            'has_api_key': bool(self.api_key),
            'is_available': self.is_available(),
            'version': 'free_self_hosted'
        }
        
        if self.is_available():
            try:
                version = self.client.get_version()
                info['meilisearch_version'] = version.get('pkgVersion', 'unknown')
            except Exception:
                pass
        
        return info
    
    def get_products_index(self):
        """Get or create the products index."""
        if not self.is_available():
            return None
            
        try:
            return self.client.index(self.PRODUCTS_INDEX)
        except Exception as e:
            logger.error(f"Error getting products index: {str(e)}")
            return None
    
    def get_categories_index(self):
        """Get or create the categories index."""
        if not self.is_available():
            return None
            
        try:
            return self.client.index(self.CATEGORIES_INDEX)
        except Exception as e:
            logger.error(f"Error getting categories index: {str(e)}")
            return None
    
    def configure_products_index(self) -> bool:
        """Configure the products index with searchable attributes and filters."""
        if not self.is_available():
            return False
            
        try:
            # Create index if it doesn't exist
            try:
                self.client.create_index(self.PRODUCTS_INDEX, {'primaryKey': 'id'})
            except Exception:
                pass  # Index may already exist
            
            index = self.client.index(self.PRODUCTS_INDEX)
            
            # Configure searchable attributes
            index.update_searchable_attributes([
                'name',
                'description',
                'short_description',
                'category_name',
                'brand_name',
                'sku',
                'meta_title',
                'meta_description'
            ])
            
            # Configure filterable attributes
            index.update_filterable_attributes([
                'category_id',
                'category_name',
                'brand_id',
                'brand_name',
                'price',
                'is_featured',
                'is_new',
                'is_sale',
                'is_flash_sale',
                'is_luxury_deal',
                'is_active',
                'is_visible',
                'stock'
            ])
            
            # Configure sortable attributes
            index.update_sortable_attributes([
                'price',
                'name',
                'created_at',
                'updated_at',
                'stock'
            ])
            
            # Configure ranking rules (optimized for fuzzy matching like Jumia)
            index.update_ranking_rules([
                'words',
                'typo',
                'proximity',
                'attribute',
                'sort',
                'exactness'
            ])
            
            # Configure typo tolerance for fuzzy search (Jumia-style)
            index.update_typo_tolerance({
                'enabled': True,
                'minWordSizeForTypos': {
                    'oneTypo': 3,  # Allow 1 typo for words 3+ chars (was 5)
                    'twoTypos': 6  # Allow 2 typos for words 6+ chars (was 8)
                },
                'disableOnWords': [],
                'disableOnAttributes': []
            })
            
            logger.info("Products index configured successfully with fuzzy search")
            return True
            
        except Exception as e:
            logger.error(f"Error configuring products index: {str(e)}")
            return False
    
    def configure_categories_index(self) -> bool:
        """Configure the categories index."""
        if not self.is_available():
            return False
            
        try:
            # Create index if it doesn't exist
            try:
                self.client.create_index(self.CATEGORIES_INDEX, {'primaryKey': 'id'})
            except Exception:
                pass  # Index may already exist
            
            index = self.client.index(self.CATEGORIES_INDEX)
            
            index.update_searchable_attributes([
                'name',
                'description',
                'slug'
            ])
            
            index.update_filterable_attributes([
                'parent_id',
                'is_active'
            ])
            
            logger.info("Categories index configured successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error configuring categories index: {str(e)}")
            return False
    
    def index_products(self, products: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Index products in Meilisearch.
        
        Args:
            products: List of product dictionaries
        
        Returns:
            Dictionary with task info or error
        """
        if not self.is_available():
            return {'error': 'Meilisearch not available', 'indexed': 0, 'success': False}
        
        if not products:
            return {'error': 'No products to index', 'indexed': 0, 'success': False}
        
        try:
            index = self.get_products_index()
            if not index:
                return {'error': 'Could not get products index', 'indexed': 0, 'success': False}
            
            # Transform products to ensure required fields
            documents = []
            for product in products:
                doc = {
                    'id': product.get('id'),
                    'name': product.get('name') or product.get('title', ''),
                    'description': product.get('description', '') or '',
                    'short_description': product.get('short_description', '') or '',
                    'price': float(product.get('price', 0)) if product.get('price') else 0,
                    'sale_price': float(product.get('sale_price')) if product.get('sale_price') else None,
                    'image': self._get_primary_image(product),
                    'thumbnail_url': product.get('thumbnail_url', '') or '',
                    'image_urls': product.get('image_urls', []) or [],
                    'category_id': product.get('category_id'),
                    'category_name': self._get_category_name(product),
                    'brand_id': product.get('brand_id'),
                    'brand_name': self._get_brand_name(product),
                    'sku': product.get('sku', '') or '',
                    'slug': product.get('slug', '') or '',
                    'stock': int(product.get('stock', 0)) if product.get('stock') else 0,
                    'is_featured': bool(product.get('is_featured', False)),
                    'is_new': bool(product.get('is_new', False)),
                    'is_sale': bool(product.get('is_sale', False)),
                    'is_flash_sale': bool(product.get('is_flash_sale', False)),
                    'is_luxury_deal': bool(product.get('is_luxury_deal', False)),
                    'is_active': bool(product.get('is_active', True)),
                    'is_visible': bool(product.get('is_visible', True)),
                    'meta_title': product.get('meta_title', '') or '',
                    'meta_description': product.get('meta_description', '') or '',
                    'created_at': str(product.get('created_at', '')) if product.get('created_at') else '',
                    'updated_at': str(product.get('updated_at', '')) if product.get('updated_at') else ''
                }
                documents.append(doc)
            
            # Add documents to index
            task = index.add_documents(documents)
            task_uid = getattr(task, 'task_uid', None) or task.get('taskUid') if isinstance(task, dict) else None
            
            logger.info(f"Indexed {len(documents)} products, task ID: {task_uid}")
            
            return {
                'success': True,
                'indexed': len(documents),
                'task_uid': task_uid
            }
            
        except Exception as e:
            logger.error(f"Error indexing products: {str(e)}")
            return {'error': str(e), 'indexed': 0, 'success': False}
    
    def index_categories(self, categories: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Index categories in Meilisearch."""
        if not self.is_available():
            return {'error': 'Meilisearch not available', 'indexed': 0, 'success': False}
        
        if not categories:
            return {'error': 'No categories to index', 'indexed': 0, 'success': False}
        
        try:
            index = self.get_categories_index()
            if not index:
                return {'error': 'Could not get categories index', 'indexed': 0, 'success': False}
            
            documents = []
            for category in categories:
                doc = {
                    'id': category.get('id'),
                    'name': category.get('name', '') or '',
                    'slug': category.get('slug', '') or '',
                    'description': category.get('description', '') or '',
                    'parent_id': category.get('parent_id'),
                    'is_active': bool(category.get('is_active', True))
                }
                documents.append(doc)
            
            task = index.add_documents(documents)
            task_uid = getattr(task, 'task_uid', None) or task.get('taskUid') if isinstance(task, dict) else None
            
            logger.info(f"Indexed {len(documents)} categories, task ID: {task_uid}")
            
            return {
                'success': True,
                'indexed': len(documents),
                'task_uid': task_uid
            }
            
        except Exception as e:
            logger.error(f"Error indexing categories: {str(e)}")
            return {'error': str(e), 'indexed': 0, 'success': False}
    
    def search_products(
        self, 
        query: str, 
        limit: int = 20,
        offset: int = 0,
        filters: Optional[str] = None,
        sort: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Search products in Meilisearch.
        
        Args:
            query: Search query string
            limit: Maximum results to return
            offset: Offset for pagination
            filters: Meilisearch filter string (e.g., "category_id = 1")
            sort: List of sort strings (e.g., ["price:asc"])
        
        Returns:
            Dictionary with hits, total, and processing time
        """
        if not self.is_available():
            return {
                'hits': [],
                'total': 0,
                'query': query,
                'error': 'Meilisearch not available'
            }
        
        try:
            index = self.get_products_index()
            if not index:
                return {
                    'hits': [],
                    'total': 0,
                    'query': query,
                    'error': 'Could not get products index'
                }
            
            search_params = {
                'limit': limit,
                'offset': offset,
                'attributesToRetrieve': [
                    'id', 'name', 'description', 'short_description',
                    'price', 'sale_price', 'image', 'thumbnail_url', 'image_urls',
                    'category_id', 'category_name', 'brand_id', 'brand_name',
                    'slug', 'sku', 'stock', 'is_featured', 'is_new', 'is_sale',
                    'is_flash_sale', 'is_luxury_deal'
                ],
                'matchingStrategy': 'last',  # More flexible matching for fuzzy search
                'showMatchesPosition': True,  # Show where matches occur
                'attributesToHighlight': ['name', 'description'],  # Highlight matches
                'highlightPreTag': '<mark>',
                'highlightPostTag': '</mark>'
            }
            
            if filters:
                search_params['filter'] = filters
            
            if sort:
                search_params['sort'] = sort
            
            result = index.search(query, search_params)
            
            # Handle both dict and object responses
            if isinstance(result, dict):
                hits = result.get('hits', [])
                total = result.get('estimatedTotalHits', 0)
                processing_time = result.get('processingTimeMs', 0)
            else:
                hits = getattr(result, 'hits', [])
                total = getattr(result, 'estimated_total_hits', 0)
                processing_time = getattr(result, 'processing_time_ms', 0)
            
            return {
                'hits': hits,
                'total': total,
                'query': query,
                'processingTimeMs': processing_time
            }
            
        except Exception as e:
            logger.error(f"Error searching products: {str(e)}")
            return {
                'hits': [],
                'total': 0,
                'query': query,
                'error': str(e)
            }
    
    def search_categories(self, query: str, limit: int = 10) -> Dict[str, Any]:
        """Search categories in Meilisearch."""
        if not self.is_available():
            return {'hits': [], 'total': 0, 'query': query, 'error': 'Meilisearch not available'}
        
        try:
            index = self.get_categories_index()
            if not index:
                return {'hits': [], 'total': 0, 'query': query, 'error': 'Could not get categories index'}
            
            result = index.search(query, {'limit': limit})
            
            # Handle both dict and object responses
            if isinstance(result, dict):
                hits = result.get('hits', [])
                total = result.get('estimatedTotalHits', 0)
                processing_time = result.get('processingTimeMs', 0)
            else:
                hits = getattr(result, 'hits', [])
                total = getattr(result, 'estimated_total_hits', 0)
                processing_time = getattr(result, 'processing_time_ms', 0)
            
            return {
                'hits': hits,
                'total': total,
                'query': query,
                'processingTimeMs': processing_time
            }
            
        except Exception as e:
            logger.error(f"Error searching categories: {str(e)}")
            return {'hits': [], 'total': 0, 'query': query, 'error': str(e)}
    
    def update_product(self, product: Dict[str, Any]) -> Dict[str, Any]:
        """Update a single product in the index."""
        if not self.is_available():
            return {'error': 'Meilisearch not available', 'success': False}
        
        try:
            index = self.get_products_index()
            if not index:
                return {'error': 'Could not get products index', 'success': False}
            
            doc = {
                'id': product.get('id'),
                'name': product.get('name') or product.get('title', ''),
                'description': product.get('description', '') or '',
                'short_description': product.get('short_description', '') or '',
                'price': float(product.get('price', 0)) if product.get('price') else 0,
                'sale_price': float(product.get('sale_price')) if product.get('sale_price') else None,
                'image': self._get_primary_image(product),
                'thumbnail_url': product.get('thumbnail_url', '') or '',
                'image_urls': product.get('image_urls', []) or [],
                'category_id': product.get('category_id'),
                'category_name': self._get_category_name(product),
                'brand_id': product.get('brand_id'),
                'brand_name': self._get_brand_name(product),
                'sku': product.get('sku', '') or '',
                'slug': product.get('slug', '') or '',
                'stock': int(product.get('stock', 0)) if product.get('stock') else 0,
                'is_featured': bool(product.get('is_featured', False)),
                'is_new': bool(product.get('is_new', False)),
                'is_sale': bool(product.get('is_sale', False)),
                'is_flash_sale': bool(product.get('is_flash_sale', False)),
                'is_luxury_deal': bool(product.get('is_luxury_deal', False)),
                'is_active': bool(product.get('is_active', True)),
                'is_visible': bool(product.get('is_visible', True)),
                'meta_title': product.get('meta_title', '') or '',
                'meta_description': product.get('meta_description', '') or '',
                'created_at': str(product.get('created_at', '')) if product.get('created_at') else '',
                'updated_at': str(product.get('updated_at', '')) if product.get('updated_at') else ''
            }
            
            task = index.update_documents([doc])
            task_uid = getattr(task, 'task_uid', None) or task.get('taskUid') if isinstance(task, dict) else None
            
            return {'success': True, 'task_uid': task_uid}
            
        except Exception as e:
            logger.error(f"Error updating product {product.get('id')}: {str(e)}")
            return {'error': str(e), 'success': False}
    
    def delete_product(self, product_id: int) -> bool:
        """Delete a product from the index."""
        if not self.is_available():
            return False
        
        try:
            index = self.get_products_index()
            if index:
                index.delete_document(product_id)
                logger.info(f"Deleted product {product_id} from Meilisearch")
                return True
        except Exception as e:
            logger.error(f"Error deleting product {product_id}: {str(e)}")
        
        return False
    
    def delete_products(self, product_ids: List[int]) -> bool:
        """Delete multiple products from the index."""
        if not self.is_available():
            return False
        
        try:
            index = self.get_products_index()
            if index:
                index.delete_documents(product_ids)
                logger.info(f"Deleted {len(product_ids)} products from Meilisearch")
                return True
        except Exception as e:
            logger.error(f"Error deleting products: {str(e)}")
        
        return False
    
    def clear_products_index(self) -> bool:
        """Clear all products from the index."""
        if not self.is_available():
            return False
        
        try:
            index = self.get_products_index()
            if index:
                index.delete_all_documents()
                logger.info("Cleared all products from index")
                return True
        except Exception as e:
            logger.error(f"Error clearing products index: {str(e)}")
        
        return False
    
    def clear_categories_index(self) -> bool:
        """Clear all categories from the index."""
        if not self.is_available():
            return False
        
        try:
            index = self.get_categories_index()
            if index:
                index.delete_all_documents()
                logger.info("Cleared all categories from index")
                return True
        except Exception as e:
            logger.error(f"Error clearing categories index: {str(e)}")
        
        return False
    
    def get_index_stats(self) -> Dict[str, Any]:
        """Get statistics about the indexes."""
        if not self.is_available():
            return {'error': 'Meilisearch not available'}
        
        try:
            stats = self.client.get_all_stats()
            
            # Handle both dict and object responses
            if isinstance(stats, dict):
                database_size = stats.get('databaseSize', 0)
                indexes = stats.get('indexes', {})
            else:
                database_size = getattr(stats, 'database_size', 0)
                indexes_raw = getattr(stats, 'indexes', {})
                indexes = {}
                for key, value in indexes_raw.items():
                    if isinstance(value, dict):
                        indexes[key] = value
                    else:
                        indexes[key] = {
                            'numberOfDocuments': getattr(value, 'number_of_documents', 0),
                            'isIndexing': getattr(value, 'is_indexing', False)
                        }
            
            return {
                'database_size': database_size,
                'indexes': indexes
            }
        except Exception as e:
            logger.error(f"Error getting index stats: {str(e)}")
            return {'error': str(e)}
    
    def get_task_status(self, task_uid: int) -> Dict[str, Any]:
        """Get the status of an indexing task."""
        if not self.is_available():
            return {'error': 'Meilisearch not available'}
        
        try:
            task = self.client.get_task(task_uid)
            
            if isinstance(task, dict):
                return task
            else:
                return {
                    'uid': getattr(task, 'uid', task_uid),
                    'status': getattr(task, 'status', 'unknown'),
                    'type': getattr(task, 'type', 'unknown'),
                    'duration': getattr(task, 'duration', None),
                    'enqueuedAt': str(getattr(task, 'enqueued_at', ''))
                }
        except Exception as e:
            logger.error(f"Error getting task status: {str(e)}")
            return {'error': str(e)}
    
    def _get_primary_image(self, product: Dict) -> str:
        """Extract primary image from product data."""
        image_urls = product.get('image_urls', [])
        if isinstance(image_urls, list) and image_urls:
            return image_urls[0]
        
        if product.get('thumbnail_url'):
            return product['thumbnail_url']
        
        if product.get('image'):
            return product['image']
        
        return ''
    
    def _get_category_name(self, product: Dict) -> str:
        """Extract category name from product data."""
        category = product.get('category')
        if isinstance(category, dict):
            return category.get('name', '')
        if isinstance(category, str):
            return category
        return ''
    
    def _get_brand_name(self, product: Dict) -> str:
        """Extract brand name from product data."""
        brand = product.get('brand')
        if isinstance(brand, dict):
            return brand.get('name', '')
        if isinstance(brand, str):
            return brand
        return ''


def get_meilisearch_client() -> MeilisearchClient:
    """Get or create the global Meilisearch client instance."""
    global _meilisearch_client
    
    if _meilisearch_client is None:
        _meilisearch_client = MeilisearchClient()
    
    return _meilisearch_client


def reset_meilisearch_client():
    """Reset the global client instance (useful for testing or reconnection)."""
    global _meilisearch_client
    _meilisearch_client = None
