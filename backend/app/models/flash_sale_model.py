"""
Flash Sale Event Model for Mizizzi E-commerce platform.
Manages flash sale events with countdown timers and stock tracking.
"""
from datetime import datetime, timedelta
from app.configuration.extensions import db


class FlashSaleEvent(db.Model):
    """
    Flash Sale Event model.
    Controls the overall flash sale timing and settings.
    """
    __tablename__ = 'flash_sale_events'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    # Timing
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    is_featured = db.Column(db.Boolean, default=False)
    
    # Display settings
    banner_image = db.Column(db.String(500), nullable=True)
    banner_color = db.Column(db.String(20), default='#8B1538')
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def is_live(self):
        """Check if the flash sale is currently live."""
        now = datetime.utcnow()
        return self.is_active and self.start_time <= now <= self.end_time
    
    def time_remaining(self):
        """Get time remaining in seconds."""
        now = datetime.utcnow()
        if now > self.end_time:
            return 0
        return int((self.end_time - now).total_seconds())
    
    def to_dict(self):
        """Serialize flash sale event."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'is_active': self.is_active,
            'is_featured': self.is_featured,
            'is_live': self.is_live(),
            'time_remaining': self.time_remaining(),
            'banner_image': self.banner_image,
            'banner_color': self.banner_color,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def get_active_event(cls):
        """Get the currently active flash sale event."""
        now = datetime.utcnow()
        return cls.query.filter(
            cls.is_active == True,
            cls.start_time <= now,
            cls.end_time >= now
        ).order_by(cls.end_time.asc()).first()
    
    @classmethod
    def get_upcoming_event(cls):
        """Get the next upcoming flash sale event."""
        now = datetime.utcnow()
        return cls.query.filter(
            cls.is_active == True,
            cls.start_time > now
        ).order_by(cls.start_time.asc()).first()
