"""
Image Optimization Service for Carousel and Admin Content
Generates LQIP (Low Quality Image Placeholders) and optimized images for fast delivery
"""

import cloudinary
import cloudinary.uploader
from PIL import Image
import io
import base64
import logging
from typing import Dict, Optional, Tuple
import requests

logger = logging.getLogger(__name__)


class ImageOptimizationService:
    """Service for optimizing images for carousel display"""

    def __init__(self):
        self.max_lqip_size = (20, 20)  # Tiny placeholder size
        self.target_quality = 70  # Quality for LQIP
        self.carousel_sizes = {
            'mobile': {'width': 600, 'height': 300, 'crop': 'fill'},
            'tablet': {'width': 1000, 'height': 400, 'crop': 'fill'},
            'desktop': {'width': 1400, 'height': 500, 'crop': 'fill'},
        }

    def generate_lqip_from_url(self, image_url: str) -> Optional[str]:
        """
        Generate LQIP (Low Quality Image Placeholder) from image URL
        Returns base64-encoded tiny blurred image
        
        Args:
            image_url: URL of the image
            
        Returns:
            Base64-encoded LQIP data URL or None if failed
        """
        try:
            # Fetch image
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()
            
            # Open and resize
            image = Image.open(io.BytesIO(response.content))
            image.thumbnail(self.max_lqip_size, Image.Resampling.LANCZOS)
            
            # Convert to RGB if needed
            if image.mode in ('RGBA', 'LA', 'P'):
                rgb_image = Image.new('RGB', image.size, (255, 255, 255))
                rgb_image.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                image = rgb_image
            
            # Save as JPEG with low quality
            buffer = io.BytesIO()
            image.save(buffer, format='JPEG', quality=self.target_quality, optimize=True)
            buffer.seek(0)
            
            # Encode as base64 data URL
            base64_data = base64.b64encode(buffer.getvalue()).decode()
            return f"data:image/jpeg;base64,{base64_data}"
            
        except Exception as e:
            logger.error(f"Error generating LQIP for {image_url}: {str(e)}")
            return None

    def generate_cloudinary_lqip(self, public_id: str) -> Optional[str]:
        """
        Generate LQIP using Cloudinary transformation
        More efficient than downloading and processing locally
        
        Args:
            public_id: Cloudinary public ID
            
        Returns:
            Data URL of LQIP or None
        """
        try:
            # Use Cloudinary transformation for LQIP
            # Resize to 20x20, blur 2000, quality 1, and fetch as data URL
            url, _ = cloudinary.utils.cloudinary_url(
                public_id,
                transformation=[
                    {'width': 20, 'height': 20, 'crop': 'fill', 'quality': 1, 'effect': 'blur:2000'}
                ],
                secure=True
            )
            
            # Fetch the tiny image
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            base64_data = base64.b64encode(response.content).decode()
            return f"data:image/jpeg;base64,{base64_data}"
            
        except Exception as e:
            logger.error(f"Error generating Cloudinary LQIP for {public_id}: {str(e)}")
            return None

    def generate_optimized_carousel_urls(self, public_id: str) -> Dict[str, Dict]:
        """
        Generate optimized image URLs for carousel at different breakpoints
        
        Args:
            public_id: Cloudinary public ID
            
        Returns:
            Dict with optimized URLs for mobile, tablet, desktop
        """
        urls = {}
        
        for device, config in self.carousel_sizes.items():
            url, _ = cloudinary.utils.cloudinary_url(
                public_id,
                transformation=[
                    {
                        'width': config['width'],
                        'height': config['height'],
                        'crop': config['crop'],
                        'quality': 'auto',
                        'format': 'auto',
                        'flags': 'progressive'
                    }
                ],
                secure=True
            )
            urls[device] = {
                'url': url,
                'width': config['width'],
                'height': config['height'],
                'srcset': self._generate_srcset(public_id, config)
            }
        
        return urls

    def _generate_srcset(self, public_id: str, config: Dict) -> str:
        """Generate responsive srcset for image tag"""
        srcset_urls = []
        
        # Generate 1x, 2x, 3x versions for high DPI displays
        for multiplier in [1, 2, 3]:
            url, _ = cloudinary.utils.cloudinary_url(
                public_id,
                transformation=[
                    {
                        'width': config['width'] * multiplier,
                        'height': config['height'] * multiplier,
                        'crop': config['crop'],
                        'quality': 'auto',
                        'format': 'auto'
                    }
                ],
                secure=True
            )
            srcset_urls.append(f"{url} {multiplier}x")
        
        return ', '.join(srcset_urls)

    def batch_generate_lqips(self, carousel_items: list) -> list:
        """
        Batch generate LQIPs for multiple carousel items
        
        Args:
            carousel_items: List of carousel banner objects
            
        Returns:
            List of items with LQIP data added
        """
        optimized_items = []
        
        for item in carousel_items:
            optimized_item = item.copy() if isinstance(item, dict) else item.__dict__.copy()
            
            # Generate LQIP
            lqip = self.generate_lqip_from_url(item.get('image_url') or item.get('image'))
            if lqip:
                optimized_item['lqip'] = lqip
            
            # Generate responsive URLs
            if hasattr(item, 'image_url'):
                # Extract public_id from Cloudinary URL if available
                image_url = item.image_url
                if 'cloudinary.com' in image_url:
                    # Extract public ID from Cloudinary URL
                    public_id = image_url.split('/upload/')[-1].split('/')[0]
                    optimized_item['responsive_urls'] = self.generate_optimized_carousel_urls(public_id)
            
            optimized_items.append(optimized_item)
        
        return optimized_items
