import datetime
import hashlib
import os
import sqlite3
from werkzeug import exceptions
from flask import Flask, render_template, redirect, request, url_for
from flask_socketio import SocketIO
from flask_compress import Compress
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from pages import base

app = Flask(__name__)
base.APP = app  # Allows for blueprints to access and use the app instance.

# TODO -- change this before release
app.secret_key = 'random_secret_key_here' 
app.config['SECRET_KEY'] = app.secret_key
app.config['SESSION_COOKIE_NAME'] = "carbon"


app.config['EXPLAIN_TEMPLATE_LOADING'] = False # Enable if pages render odd
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'static', 'upload')
app.config['MAX_CONTENT_LENGTH'] = 50 * 1000 * 1000 # 50 MB
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 180 # 3 minutes for the MC server images

login_manager = LoginManager()

login_manager.init_app(app)

# User class for Flask-Login
class User(UserMixin):
    def __init__(self, username, name, email):
        self.id = username
        self.name = name
        self.email = email

# User loader for Flask-Login
@login_manager.user_loader
def load_user(user_id):
    conn = sqlite3.connect('data/users.db')
    c = conn.cursor()
    c.execute("SELECT Name, Email, UserName FROM users WHERE UserName = ?", (user_id,))
    result = c.fetchone()
    conn.close()
    
    if result:
        return User(result[2], result[0], result[1])
    return None

# Hash password
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# Verify password
def verify_password(password, hashed_password):
    return hash_password(password) == hashed_password

# Authentication functions
def authenticate_user(username, password):
    conn = sqlite3.connect('data/users.db')
    c = conn.cursor()
    c.execute("SELECT PwdHash FROM users WHERE UserName = ?", (username,))
    result = c.fetchone()
    conn.close()
    
    if result:
        return verify_password(password, result[0])
    return False

def get_user_info(username):
    conn = sqlite3.connect('data/users.db')
    c = conn.cursor()
    c.execute("SELECT name, email, UserName FROM users WHERE UserName = ?", (username,))
    result = c.fetchone()
    conn.close()
    
    if result:
        return {
            'name': result[0],
            'email': result[1],
            'username': result[2]
        }
    return None

@login_manager.unauthorized_handler
def unauthorized_handler():
    return 'Unauthorized', 401

socketio = SocketIO(app)
base.SOCKETIO = socketio

# Must be imported later so that 'base.APP' is not None
from pages import attributions, blog, projects, stats

Compress(app)
app.register_blueprint(attributions.attributions)
app.register_blueprint(blog.blog)
app.register_blueprint(stats.stats)
app.register_blueprint(projects.projects)

# Used by all pages for the ©️ text.
@app.context_processor
def inject_year():
    return {'year': datetime.date.today().year}

@app.errorhandler(exceptions.NotFound)
def handle_not_found(error):
    return render_template("errors/not_found.html"), 404

@app.route("/")
def index():
    return render_template("index.html")

@app.get("/authenticate")
def authenticate():
    if current_user and current_user.is_authenticated:
        return redirect(url_for('projects.index'))
    return render_template("authenticate.html")

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return render_template("index.html")

@app.post("/authenticate")
def authenticate_post():
    username = request.form['username']
    password = request.form['password']

    if authenticate_user(username, password):
        user = load_user(username)
        if user:
            login_user(user)
            # user_info = get_user_info(username)
            return redirect(url_for('projects.index'))
        else:
            return render_template("authenticate.html", error='User not found')
    else:
        return render_template("authenticate.html", error='Invalid username or password')


if __name__ == "__main__":
    socketio.run(app)
    