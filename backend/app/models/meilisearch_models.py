from app.configuration.extensions import db

# Lightweight stubs used when real implementation is absent.
# Replace with the real implementation if available.

class MeilisearchConfig:
	"""Configuration for Meilisearch integration."""
	def __init__(self, host: str = "http://localhost:7700", api_key: str = None):
		self.host = host
		self.api_key = api_key

class MeilisearchModel:
	"""Minimal MeilisearchModel shim for imports across the app."""
	pass

class MeilisearchSyncLog(db.Model):
	__tablename__ = "meilisearch_sync_log"
	__table_args__ = {"extend_existing": True}
	id = db.Column(db.Integer, primary_key=True)
	timestamp = db.Column(db.DateTime, server_default=db.func.now())
	details = db.Column(db.Text)

class MeilisearchProductSync(db.Model):
	__tablename__ = "meilisearch_product_sync"
	__table_args__ = {"extend_existing": True}
	id = db.Column(db.Integer, primary_key=True)
	product_id = db.Column(db.Integer, nullable=True)
	synced_at = db.Column(db.DateTime, server_default=db.func.now())
	status = db.Column(db.String(50))

# Minimal SearchSuggestion stub expected by some imports.
class SearchSuggestion(db.Model):
	__tablename__ = "meilisearch_search_suggestions"
	__table_args__ = {"extend_existing": True}
	id = db.Column(db.Integer, primary_key=True)
	text = db.Column(db.String(255))
	created_at = db.Column(db.DateTime, server_default=db.func.now())

# Minimal SearchAnalyticsDaily stub expected by some imports.
class SearchAnalyticsDaily(db.Model):
	__tablename__ = "meilisearch_search_analytics_daily"
	__table_args__ = {"extend_existing": True}
	id = db.Column(db.Integer, primary_key=True)
	term = db.Column(db.String(255))
	count = db.Column(db.Integer, default=0)
	date = db.Column(db.Date, nullable=True)

# Provide expected exports/aliases so imports elsewhere don't fail.
SearchLog = MeilisearchSyncLog

__all__ = [
	"MeilisearchConfig",
	"MeilisearchModel",
	"MeilisearchSyncLog",
	"MeilisearchProductSync",
	"SearchSuggestion",
	"SearchAnalyticsDaily",
	"SearchLog",
]
