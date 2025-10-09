from flask import Flask
from flask_socketio import SocketIO
import hashlib

APP: Flask = None
SOCKETIO: SocketIO = None

# Hash password
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()
