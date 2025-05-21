
from flask import Blueprint, render_template

projects = Blueprint('projects', __name__, url_prefix='/projects', template_folder='../templates/projects')


@projects.route("/")
def index():
    return render_template("projects.html")

@projects.route("/mc_server")
def mc_server():
    return render_template("mc_server.html")
