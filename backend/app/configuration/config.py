"""
Configuration settings for the Mizizzi E-commerce application.
"""
import os
from datetime import timedelta


class Config:
    """Base configuration class."""

    # Basic Flask configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'

    # Database configuration
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL', 'postgresql://neondb_owner:npg_0gMwASZYo9pJ@ep-shiny-term-adlossxs-pooler.c-2.us-east-1.aws.neon.tech/mizizzi_project?sslmode=require&channel_binding=require'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-jwt-secret-key-here')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ['headers', 'cookies']
    JWT_COOKIE_CSRF_PROTECT = True
    JWT_CSRF_IN_COOKIES = True
    JWT_CSRF_CHECK_FORM = False
    # Make cookie secure configurable via env; override in ProductionConfig below
    JWT_COOKIE_SECURE = os.environ.get('JWT_COOKIE_SECURE', 'false').lower() in ['true', '1', 'on']
    JWT_COOKIE_SAMESITE = "Lax"  # Set to "None" in production with Secure=True
    JWT_BLACKLIST_ENABLED = True
    JWT_BLACKLIST_TOKEN_CHECKS = ['access', 'refresh']

    # Base project directory (single definition)
    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

    # Upload folder configuration (single canonical absolute path)
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER') or os.path.join(BASE_DIR, 'uploads')
    CATEGORIES_UPLOAD_FOLDER = os.path.join(UPLOAD_FOLDER, 'categories')
    # URL prefix used by the API to serve uploaded files (route should use this)
    UPLOAD_URL_PREFIX = os.environ.get('UPLOAD_URL_PREFIX', '/api/uploads')

    # File upload configuration
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16MB default

    # CORS configuration (single canonical set)
    _frontend_env = os.environ.get('FRONTEND_URL', '')
    _frontend_list = [u.strip() for u in _frontend_env.split(',') if u.strip()]

    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "https://mizizzi-ecommerce-1.onrender.com",
    ] + _frontend_list

    # Add a permissive regex for vercel.app preview/deploy domains
    CORS_VERSEL_REGEX = r"^https?:\/\/([a-z0-9\-]+?\.)*vercel\.app(:\d+)?$"
    CORS_ORIGINS += [CORS_VERSEL_REGEX]

    CORS_METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
    CORS_ALLOW_HEADERS = ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "X-CSRF-TOKEN"]
    CORS_EXPOSE_HEADERS = ["Content-Range", "X-Content-Range", "X-Cache", "X-Cache-Key", "X-Fast-Cache"]
    CORS_SUPPORTS_CREDENTIALS = True
    CORS_MAX_AGE = 600  # Cache preflight requests for 10 minutes

    # Socket.IO / engineio allowed origins (useful when creating SocketIO instance)
    SOCKET_IO_ALLOWED_ORIGINS = CORS_ORIGINS

    # Add debug logging for database connection and ensure upload folders exist
    @staticmethod
    def init_app(app):
        app.logger.info(f"Using database: {app.config.get('SQLALCHEMY_DATABASE_URI')}")
        app.logger.info(f"Uploads folder: {app.config.get('UPLOAD_FOLDER')}")
        # Log effective CORS origins to aid debugging of "not an accepted origin" errors
        try:
            app.logger.info(f"CORS_ORIGINS: {app.config.get('CORS_ORIGINS')}")
            app.logger.info(f"SOCKET_IO_ALLOWED_ORIGINS: {app.config.get('SOCKET_IO_ALLOWED_ORIGINS')}")
        except Exception:
            # defensive: don't let logging break startup
            pass

        # Ensure upload directories exist to avoid 404 when backend serves files from disk
        try:
            os.makedirs(app.config.get('UPLOAD_FOLDER'), exist_ok=True)
            os.makedirs(app.config.get('CATEGORIES_UPLOAD_FOLDER'), exist_ok=True)
            app.logger.info("Upload directories verified/created.")
        except Exception as e:
            app.logger.error(f"Failed to create upload directories: {e}")

        # Attempt a lightweight DB connection check to log any issues.
        # This is non-fatal: it helps make the real DB error visible in logs (useful for diagnosing
        # '{"error":"Database error occurred"}' responses).
        # Requires SQLAlchemy to be installed; if not available we log a hint.
        try:
            Config.verify_database_connection(app)
        except Exception as e:
            # verify_database_connection already logs details; don't raise here
            app.logger.debug(f"Database verification raised (non-fatal): {e}")

    @staticmethod
    def verify_database_connection(app, timeout=5):
        """
        Attempt a short test connection to the configured SQLALCHEMY_DATABASE_URI and log any issues.
        This is non-fatal: it helps make the real DB error visible in logs (useful for diagnosing
        '{"error":"Database error occurred"}' responses).
        Requires SQLAlchemy to be installed; if not available just log hint.
        """
        db_uri = app.config.get('SQLALCHEMY_DATABASE_URI')
        if not db_uri:
            app.logger.warning("No SQLALCHEMY_DATABASE_URI configured; skipping DB verification.")
            return

        try:
            # Import here to avoid hard dependency until runtime; if not available just log hint.
            from sqlalchemy import create_engine
            # Create engine with short connect_args where supported
            connect_args = {}
            # For psycopg2-based URLs we can pass connect_timeout via connect_args
            connect_args.update({"connect_timeout": int(timeout)})
            engine = create_engine(db_uri, connect_args=connect_args, pool_pre_ping=True)
            with engine.connect() as conn:
                # simple statement to ensure DB responds
                conn.execute("SELECT 1")
            app.logger.info("Database verification succeeded.")
        except ImportError:
            app.logger.warning("SQLAlchemy not installed; cannot perform DB verification. Install sqlalchemy to get detailed DB error logs.")
        except Exception as e:
            # Explicitly log the exception details to help debugging the runtime DB error.
            # DO NOT include sensitive secrets in logs in production; the URI is printed above for quick diagnosis in dev.
            app.logger.error(f"Database verification failed: {e}", exc_info=True)

    # Cache configuration - using short cache type names supported by Flask-Caching
    CACHE_TYPE = 'SimpleCache'
    CACHE_DEFAULT_TIMEOUT = 300

    # Rate limiting configuration - normalized env names and sane defaults
    RATELIMIT_STORAGE_URI = os.environ.get('RATELIMIT_STORAGE_URI') or os.environ.get('REDIS_URL') or 'memory://'
    RATELIMIT_DEFAULT = os.environ.get('RATELIMIT_DEFAULT', '1000 per hour')
    RATELIMIT_HEADERS_ENABLED = True
    RATELIMIT_IN_MEMORY_FALLBACK_ENABLED = True

    # Email configuration - SMTP (Brevo)
    MAIL_SERVER = os.environ.get('MAIL_SERVER') or 'smtp-relay.brevo.com'
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', 'on', '1']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME') or os.environ.get('BREVO_SMTP_LOGIN')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD') or os.environ.get('BREVO_SMTP_PASSWORD')
    
    # Brevo email sender configuration
    BREVO_SENDER_EMAIL = os.environ.get('BREVO_SENDER_EMAIL') or 'info.contactgilbertdev@gmail.com'
    BREVO_SENDER_NAME = os.environ.get('BREVO_SENDER_NAME') or 'MIZIZZI'
    MAIL_DEFAULT_SENDER = (os.environ.get('BREVO_SENDER_NAME') or 'MIZIZZI', os.environ.get('BREVO_SENDER_EMAIL') or 'info.contactgilbertdev@gmail.com')

    # Pagination
    POSTS_PER_PAGE = 20

    # Security
    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = None

    # Logging
    LOG_TO_STDOUT = os.environ.get('LOG_TO_STDOUT')

    # Google OAuth configuration
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    CACHE_TYPE = 'SimpleCache'
    RATELIMIT_STORAGE_URI = 'memory://'


class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    CACHE_TYPE = 'NullCache'
    RATELIMIT_STORAGE_URI = 'memory://'
    RATELIMIT_ENABLED = False


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    CACHE_TYPE = 'RedisCache'
    CACHE_REDIS_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379/0'
    RATELIMIT_STORAGE_URI = os.environ.get('REDIS_URL') or 'redis://localhost:6379/1'
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    # Ensure JWT cookies are secure in production
    JWT_COOKIE_SECURE = True


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
