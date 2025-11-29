from flask_sqlalchemy import SQLAlchemy
# ...add other extensions you use (e.g., Migrate, JWTManager, Cache) as needed...

db = SQLAlchemy()
# migrate = Migrate()
# jwt = JWTManager()
# cache = Cache()

def init_extensions(app):
	"""
	Initialize extensions with the Flask app.
	Call this once from create_app so all extensions share the same app/instance.
	"""
	db.init_app(app)
	# migrate.init_app(app, db)
	# jwt.init_app(app)
	# cache.init_app(app)
