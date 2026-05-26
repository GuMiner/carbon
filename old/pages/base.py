from flask import Flask
from flask_socketio import SocketIO
import hashlib
from datetime import datetime

APP: Flask = None
SOCKETIO: SocketIO = None

# Hash password
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# Define the custom date filter
def date_filter(value, format_string):
    if value is None:
        return ""
    if isinstance(value, str):
        # Try to parse string dates
        try:
            value = datetime.strptime(value, "%Y-%m-%dT%H:%M:%S.%f")
        except ValueError:
            try:
                value = datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                return value  # Return original if parsing fails
    return value.strftime(format_string)