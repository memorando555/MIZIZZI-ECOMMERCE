"""
Simple ColorValidator for the Mizizzi project.
This file is a lightweight compatibility shim to satisfy imports
that expect `app.validations.color_validator.ColorValidator`.
It provides basic hex and CSS color name validation.
"""
import re
from typing import Optional

CSS_COLOR_NAMES = {
    'black','silver','gray','white','maroon','red','purple','fuchsia',
    'green','lime','olive','yellow','navy','blue','teal','aqua'
}

HEX_COLOR_RE = re.compile(r'^#(?:[0-9a-fA-F]{3}){1,2}$')
RGBA_COLOR_RE = re.compile(r'^rgba?\s*\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*[\d.]+\s*)?\)$', re.IGNORECASE)

class ColorValidator:
    """Lightweight validator for color strings.

    Methods
    -------
    is_valid(color: str) -> bool
        Returns True if the provided color is a valid hex color (#rgb or #rrggbb)
        or one of a small set of CSS color names.
    """
    def __init__(self, color: Optional[str]=None):
        self.color = color

    @classmethod
    def is_valid(cls, color: Optional[str]) -> bool:
        if color is None:
            return False
        if not isinstance(color, str):
            return False
        color = color.strip()
        if not color:
            return False
        # Hex color
        if HEX_COLOR_RE.match(color):
            return True
        # RGBA/RGB color
        if RGBA_COLOR_RE.match(color):
            return True
        # Named color (basic set)
        if color.lower() in CSS_COLOR_NAMES:
            return True
        return False

    def validate(self) -> bool:
        """Validate the instance color value."""
        return self.is_valid(self.color)

    def normalize(self) -> Optional[str]:
        """Return a normalized color string (lowercased name or hex in lowercase) or None."""
        if not self.is_valid(self.color):
            return None
        c = self.color.strip()
        if c.startswith('#'):
            return c.lower()
        return c.lower()
