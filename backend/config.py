import os

class Config:
	# Flask configuration
	SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-here')

	# Database configuration
	DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://mizizzi:junior2020@localhost:5432/mizizzi')
	# Use the single DATABASE_URL value for SQLAlchemy (fallback to sqlite)
	SQLALCHEMY_DATABASE_URI = DATABASE_URL or ('sqlite:///' + os.path.join(os.path.dirname(__file__), 'app.db'))
	# Ensure a default False value (prevents warnings and the error path)
	SQLALCHEMY_TRACK_MODIFICATIONS = os.environ.get('SQLALCHEMY_TRACK_MODIFICATIONS', 'False') == 'True'

	# JWT configuration
	JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-jwt-secret-key-here')

	GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '114775886111-eeboja3q4dff66t6dfro4v15diduodm8.apps.googleusercontent.com')
	GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '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')

	# Twilio configuration
	TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')
	TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', 'your_twilio_auth_token')
	TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER', '+1234567890')

	# Brevo (formerly Sendinblue) configuration
	BREVO_API_KEY = os.environ.get('BREVO_API_KEY', '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')
	BREVO_SENDER_EMAIL = os.environ.get('BREVO_SENDER_EMAIL', 'info.contactgilbertdev@gmail.com')
	BREVO_SENDER_NAME = os.environ.get('BREVO_SENDER_NAME', 'MIZIZZI')


	# ===========================================
	# AWS Lambda Specific (only needed for Lambda)
	# ===========================================
	AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')
	S3_BUCKET = os.environ.get('S3_BUCKET', 'mizizzi-uploads-dev')
	SECRETS_ARN = os.environ.get('SECRETS_ARN', 'arn:aws:secretsmanager:us-east-1:123456789:secret:mizizzi/dev/secrets')


	NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = os.environ.get('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'da35rsdl0')
	NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = os.environ.get('NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET', 'mizizzi_products')
	NEXT_PUBLIC_CLOUDINARY_API_KEY = os.environ.get('NEXT_PUBLIC_CLOUDINARY_API_KEY', '192958788917765')
	NEXT_PUBLIC_CLOUDINARY_API_SECRET = os.environ.get('NEXT_PUBLIC_CLOUDINARY_API_SECRET', 'rXJtH3p6qsXnQ_Nb5XQ-l1ywaKc')



	# Flask-Mail configuration (Brevo SMTP) - kept for backward compatibility
	MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp-relay.brevo.com')
	MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
	MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'True') == 'True'
	MAIL_USE_SSL = os.environ.get('MAIL_USE_SSL', 'False') == 'True'
	MAIL_USERNAME = os.environ.get('MAIL_USERNAME', '8b0ea2003@smtp-brevo.com')
	MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD', 'gFI5YV4CQtpbWRSL')
	MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', 'info.contactgilbertdev@gmail.com')

	# Flask-Caching configuration
	CACHE_TYPE = os.environ.get('CACHE_TYPE', 'simple')
	CACHE_DEFAULT_TIMEOUT = int(os.environ.get('CACHE_DEFAULT_TIMEOUT', 300))

	# Frontend URL
	FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

	# Site URL
	SITE_URL = os.environ.get('SITE_URL', 'http://localhost:5000')

	MEILISEARCH_HOST = os.environ.get('MEILISEARCH_HOST', 'http://localhost:7700')
	MEILISEARCH_API_KEY = os.environ.get('MEILISEARCH_API_KEY', 'your_api_key_here')

	# Flask CLI / env settings
	FLASK_APP = os.environ.get('FLASK_APP', 'wsgi:app')
	FLASK_ENV = os.environ.get('FLASK_ENV', 'development')
	FLASK_DEBUG=1