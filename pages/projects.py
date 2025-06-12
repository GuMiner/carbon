
from flask import Blueprint, render_template, request, g
import os
import sqlite3
import threading
from . import base

projects = Blueprint('projects', __name__, url_prefix='/projects', template_folder='../templates/projects')

player_pos_lock = threading.Lock()
player_pos_live_map = {}

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

# Update a player's position in the in-memory dictionary
@projects.route("/mc_server/player", methods=['POST'])
def mc_server_player_update():
    data = request.get_json()
    name = data["name"]
    position = data["position"]
    with player_pos_lock:
        player_pos_live_map[name] = position
    return "Ok"

# Save a map file uploaded 
@projects.route("/mc_server/map", methods=['POST'])
def mc_server_map_update():
    if 'mapFile' in request.files:
        file = request.files['mapFile']
        if file and file.filename == 'map.png':
            file.save(os.path.join(base.APP.config['UPLOAD_FOLDER'], 'map.png'))
    return "Ok"

# HTML: List out where everyone is
@projects.route("/mc_server/players")
def mc_server_players():
    player_pos_text = ["<ul>"]
    for player in player_pos_live_map:
        player_pos_text += f"<li><b>{player}</b>: {player_pos_live_map[player]}</li>"
    
    player_pos_text += "</ul>"
    return "".join(player_pos_text)
