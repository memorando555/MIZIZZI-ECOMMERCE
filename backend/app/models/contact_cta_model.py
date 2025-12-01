"""
Contact CTA Model
"""

from datetime import datetime, timezone
from app.configuration.extensions import db

class ContactCTA(db.Model):
    """Contact CTA model for managing contact slides."""
    
    __tablename__ = 'contact_cta_slides'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    subtitle = db.Column(db.String(100), nullable=False)
    image = db.Column(db.String(255), nullable=False)
    gradient = db.Column(db.String(100), default='from-slate-900 via-slate-800 to-black')
    accent_color = db.Column(db.String(50), default='text-white')
    
    is_active = db.Column(db.Boolean, default=True, index=True)
    sort_order = db.Column(db.Integer, default=0, index=True)
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    
    def __repr__(self):
        return f'<ContactCTA {self.id}: {self.subtitle}>'
    
    def to_dict(self):
        """Convert model to dictionary."""
        return {
            'id': self.id,
            'subtitle': self.subtitle,
            'image': self.image,
            'gradient': self.gradient,
            'accent_color': self.accent_color,
            'is_active': self.is_active,
            'sort_order': self.sort_order,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
