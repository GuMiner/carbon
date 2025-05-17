
from flask import Blueprint, render_template

stats = Blueprint('stats', __name__, url_prefix='/stats', template_folder='../templates/stats')


@stats.route("/")
def index():
    return render_template("stats.html")