"""
Flask extensions for Mizizzi E-commerce platform.
Initializes and configures all required extensions.
"""
from flask import request
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_caching import Cache
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import logging

# Setup logger
logger = logging.getLogger(__name__)

# Initialize extensions
db = SQLAlchemy()
ma = Marshmallow()
jwt = JWTManager()
mail = Mail()
cache = Cache()
migrate = Migrate()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["1000 per hour"],
    storage_uri="memory://",
    in_memory_fallback_enabled=True
)

def init_extensions(app):
    """Initialize all Flask extensions."""
    # Database
    db.init_app(app)
    
    # Marshmallow
    ma.init_app(app)
    
    # JWT
    jwt.init_app(app)
    
    # Mail
    mail.init_app(app)
    
    # Cache
    cache_config = {
        'CACHE_TYPE': app.config.get('CACHE_TYPE', 'simple'),
        'CACHE_DEFAULT_TIMEOUT': app.config.get('CACHE_DEFAULT_TIMEOUT', 300)
    }
    cache.init_app(app, config=cache_config)
    
    # This prevents duplicate Access-Control-Allow-Origin headers
    
    # Migrations
    migrate.init_app(app, db)
    
    # Rate limiting
    try:
        limiter.init_app(
            app,
            key_func=get_remote_address,
            default_limits=[app.config.get('RATELIMIT_DEFAULT', '1000 per hour')],
            in_memory_fallback_enabled=True
        )
        logger.info(f"Rate limiter initialized with default: {app.config.get('RATELIMIT_DEFAULT', '1000 per hour')}")
    except Exception as e:
        logger.error(f"Error initializing rate limiter: {e}")
    
    logger.info("All extensions initialized successfully")
    
    return app
