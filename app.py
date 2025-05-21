import datetime
from werkzeug import exceptions
from flask import Flask, render_template
from flask_socketio import SocketIO
from flask_compress import Compress
from pages import base

app = Flask(__name__)
base.APP = app  # Allows for blueprints to access and use the app instance.

app.config['SECRET_KEY'] = {'UNUSED'}
app.config['EXPLAIN_TEMPLATE_LOADING'] = False # Enable if pages render odd
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


if __name__ == "__main__":
    socketio.run(app)
    