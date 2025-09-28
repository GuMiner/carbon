import datetime
import os
from werkzeug import exceptions
from flask import Flask, render_template, redirect, request
from flask_socketio import SocketIO
from flask_compress import Compress
import flask_login
from pages import base

app = Flask(__name__)
base.APP = app  # Allows for blueprints to access and use the app instance.

# TODO -- change this before release
app.secret_key = 'super secret strings' 
app.config['SECRET_KEY'] = {'UNUSED'}

app.config['EXPLAIN_TEMPLATE_LOADING'] = False # Enable if pages render odd
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'static', 'upload')
app.config['MAX_CONTENT_LENGTH'] = 50 * 1000 * 1000 # 50 MB
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 180 # 3 minutes for the MC server images

login_manager = flask_login.LoginManager()

login_manager.init_app(app)

class User():
    def is_active(self):
        return True
    def is_authenticated(self):
        return True
    
    def is_anonymous(self):
        return False
    
    def get_id(self):
        return '123'

users = {}

@login_manager.user_loader
def user_loader(user_name):
    if user_name not in users:
        return

    user = User()
    print(user)
    return user


@login_manager.request_loader
def request_loader(request):
    user_name = request.form.get('user_name')
    if user_name not in users:
        return

    user = User()
    print(user)
    return user

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
    if flask_login.current_user and flask_login.current_user.is_authenticated:
        return redirect("/projects")
    return render_template("authenticate.html")

@app.post("/authenticate")
def authenticate_post():
    email = request.form['email']
    if True: # email in users and flask.request.form['password'] == users[email]['password']:
        user = User()
        flask_login.login_user(user)
        return redirect("/projects")

    return render_template("authenticate.html")


if __name__ == "__main__":
    socketio.run(app)
    