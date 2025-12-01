from app.configuration.extensions import db
from datetime import datetime
import json

class FooterSettings(db.Model):
    """Model for managing footer content and styling"""
    __tablename__ = 'footer_settings'

    id = db.Column(db.Integer, primary_key=True)
    
    background_color = db.Column(db.String(7), nullable=False, default='#2D2D2D')
    newsletter_bg_color = db.Column(db.String(7), nullable=False, default='#1F1F1F')
    text_color = db.Column(db.String(7), nullable=False, default='#FFFFFF')
    secondary_text_color = db.Column(db.String(7), nullable=False, default='#9CA3AF')
    accent_color = db.Column(db.String(7), nullable=False, default='#F97316')
    link_color = db.Column(db.String(7), nullable=False, default='#E5E7EB')
    link_hover_color = db.Column(db.String(7), nullable=False, default='#F97316')
    
    newsletter_title = db.Column(db.String(255), default='NEW TO MIZIZZI?')
    newsletter_description = db.Column(db.Text, default='Subscribe to our newsletter to get updates on our latest offers!')
    
    # Footer Content
    company_name = db.Column(db.String(255), nullable=False, default='Mizizzi')
    company_description = db.Column(db.Text, default='Discover our curated collection of fashion and jewelry pieces. Where style meets elegance.')
    tagline = db.Column(db.String(500), default='Show via Mizizzi - Become a vendor today!')
    
    # Contact Information
    address = db.Column(db.String(255), default='123 Fashion Street, Nairobi, Kenya')
    phone = db.Column(db.String(20), default='+254 700 000 000')
    email = db.Column(db.String(255), default='support@mizizzi.com')
    business_hours = db.Column(db.String(255), default='Mon - Fri: 9AM - 6PM')
    
    # Social Links
    facebook_url = db.Column(db.String(500), default='https://facebook.com')
    instagram_url = db.Column(db.String(500), default='https://instagram.com')
    twitter_url = db.Column(db.String(500), default='https://twitter.com')
    youtube_url = db.Column(db.String(500), default='https://youtube.com')
    tiktok_url = db.Column(db.String(500), default='')
    linkedin_url = db.Column(db.String(500), default='')
    
    need_help_links = db.Column(db.JSON, default=['Chat with us', 'Help Center', 'Contact Us'])
    about_links = db.Column(db.JSON, default=['About us', 'Returns and Refunds Policy', 'Mizizzi Careers', 'Mizizzi Express', 'Terms and Conditions', 'Privacy Notice', 'Cookies Notice', 'Flash Sales'])
    categories = db.Column(db.JSON, default=['Accessories', 'Activewear', 'Baby Backpacks & Carriers', 'Bags', 'Beauty & Personal Care', 'Clothing', 'Electronics', 'Jewelry'])
    useful_links = db.Column(db.JSON, default=['Track Your Order', 'Shipping and delivery', 'Report a Product', 'Return Policy', 'How to Order', 'Corporate and Bulk Purchase'])
    resources_links = db.Column(db.JSON, default=['Size Guide', 'Shipping Info', 'Gift Cards', 'FAQ', 'Store Locator'])
    
    payment_methods = db.Column(db.JSON, default=['Pesapal', 'M-Pesa', 'Card Payment', 'Airtel Money', 'Cash on Delivery'])
    
    # Copyright
    copyright_text = db.Column(db.String(500), default='© 2025 Mizizzi. All rights reserved.')
    
    # Meta
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'colors': {
                'background': self.background_color,
                'newsletterBg': self.newsletter_bg_color,
                'text': self.text_color,
                'secondaryText': self.secondary_text_color,
                'accent': self.accent_color,
                'link': self.link_color,
                'linkHover': self.link_hover_color,
            },
            'newsletter': {
                'title': self.newsletter_title,
                'description': self.newsletter_description,
            },
            'company': {
                'name': self.company_name,
                'description': self.company_description,
                'tagline': self.tagline,
            },
            'contact': {
                'address': self.address,
                'phone': self.phone,
                'email': self.email,
                'businessHours': self.business_hours,
            },
            'social': {
                'facebook': self.facebook_url,
                'instagram': self.instagram_url,
                'twitter': self.twitter_url,
                'youtube': self.youtube_url,
                'tiktok': self.tiktok_url,
                'linkedin': self.linkedin_url,
            },
            'sections': {
                'needHelp': self.need_help_links,
                'about': self.about_links,
                'categories': self.categories,
                'usefulLinks': self.useful_links,
                'resources': self.resources_links,
            },
            'paymentMethods': self.payment_methods,
            'copyright': self.copyright_text,
            'isActive': self.is_active,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat(),
        }
    
    def to_css_variables(self):
        """Generate CSS variables string for footer styling"""
        return f"""
--color-footer-bg: {self.background_color};
--color-footer-newsletter-bg: {self.newsletter_bg_color};
--color-footer-text: {self.text_color};
--color-footer-secondary-text: {self.secondary_text_color};
--color-footer-accent: {self.accent_color};
--color-footer-link: {self.link_color};
--color-footer-link-hover: {self.link_hover_color};
"""
    
    @staticmethod
    def get_active_settings():
        """Get the active footer settings"""
        return FooterSettings.query.filter_by(is_active=True).first()
    
    @staticmethod
    def get_or_create_default():
        """Get existing settings or create default ones"""
        settings = FooterSettings.query.filter_by(is_active=True).first()
        if not settings:
            settings = FooterSettings()
            db.session.add(settings)
            db.session.commit()
        return settings
