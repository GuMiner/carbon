
from flask import Blueprint, render_template, request, g
import sqlite3
from . import base

projects = Blueprint('projects', __name__, url_prefix='/projects', template_folder='../templates/projects')


def _get_mc_db():
    db = getattr(g, '_mc_data_db', None)
    if db is None:
        db = g._database = sqlite3.connect("db/mc-data.db")
    return db

@base.APP.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_mc_data_db', None)
    if db is not None:
        db.close()


@projects.route("/")
def index():
    return render_template("projects.html")

@projects.route("/mc_server")
def mc_server():
    return render_template("mc_server.html")

@projects.route("/mc_server/players")
def mc_server_players():
    _get_mc_db().execute(...)
    return f"abc"
