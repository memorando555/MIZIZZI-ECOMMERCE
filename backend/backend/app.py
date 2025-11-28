"""
Forwarder so `import backend.backend.app` resolves to the real application
located at backend.app.

This module exposes:
- create_app (factory) - guaranteed to return a Flask app or raise informative error
- create_app_with_search (if available)
- setup_app_environment (if available)
- app (module-level Flask app when safely creatable)
"""
from typing import Any, Optional
from importlib import import_module

real_app_pkg = None
# Try multiple import locations in order of preference
for candidate in ('backend.app', 'app', 'backend.app.__init__', 'app.__init__'):
    try:
        real_app_pkg = import_module(candidate)
        break
    except Exception:
        real_app_pkg = None

# Grab helpers if available
_create_app_fn = getattr(real_app_pkg, 'create_app', None)
create_app_with_search = getattr(real_app_pkg, 'create_app_with_search', None)
setup_app_environment = getattr(real_app_pkg, 'setup_app_environment', None)

# Wrapper factory that ensures a Flask app instance is returned (or raises clear error)
def create_app(*args: Any, **kwargs: Any):
    """
    Wrapper around the real create_app function that tries to return a Flask app.
    If the underlying package/function is missing or returns a non-Flask object,
    this raises an informative ImportError/TypeError so Flask CLI shows a clearer message.
    """
    if not callable(_create_app_fn):
        raise ImportError(
            "Could not find a callable 'create_app' in backend.app or fallback packages. "
            "Ensure backend/app/__init__.py defines create_app or set FLASK_APP to a valid target."
        )

    app_obj = _create_app_fn(*args, **kwargs)

    # Lazy import here to avoid importing Flask at module import time when not needed
    try:
        from flask import Flask
    except Exception:
        Flask = None

    # If returned object is a Flask app, return it
    if Flask is not None and isinstance(app_obj, Flask):
        return app_obj

    # If the module itself exposes a module-level 'app', try that
    if hasattr(real_app_pkg, 'app'):
        candidate = getattr(real_app_pkg, 'app')
        if Flask is not None and isinstance(candidate, Flask):
            return candidate

    # Try create_app_with_search if available and differs
    if callable(create_app_with_search):
        alt = create_app_with_search(*args, **kwargs)
        if Flask is not None and isinstance(alt, Flask):
            return alt
        if hasattr(alt, 'app') and Flask is not None and isinstance(alt.app, Flask):
            return alt.app

    # Nothing valid found — raise a clear error
    raise TypeError(
        "The 'create_app' factory did not return a Flask application instance. "
        "Returned object type: {}".format(type(app_obj))
    )

# Try to create a module-level 'app' for CLI tools when safe, but do not raise during import
app: Optional[Any] = None
try:
    # Attempt without args so default config_name is used
    app_candidate = create_app()
    app = app_candidate
except Exception:
    app = getattr(real_app_pkg, 'app', None)

__all__ = ['create_app', 'create_app_with_search', 'setup_app_environment', 'app']
