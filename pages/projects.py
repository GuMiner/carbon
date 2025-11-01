from flask import Blueprint, render_template, request, g, jsonify
import flask_login
from datetime import datetime
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

def init_db():
    """Initialize the database with feedback table if it doesn't exist"""
    conn = sqlite3.connect('data/feedback.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            text TEXT NOT NULL,
            user_name TEXT NOT NULL,
            date_submitted TEXT NOT NULL,
            resolved BOOLEAN DEFAULT FALSE
        )
    ''')
    conn.commit()
    conn.close()

@projects.route("/", methods=["GET", "POST"])
@flask_login.login_required # ORDER IMPORTANT
def index():
    init_db()

    if request.method == "POST":
        # Handle feedback submission
        title = request.form.get('title')
        text = request.form.get('text')
        user_name = flask_login.current_user.id 
        
        if title and text:
            conn = sqlite3.connect('data/feedback.db')
            c = conn.cursor()
            c.execute('''
                INSERT INTO feedback (title, text, user_name, date_submitted)
                VALUES (?, ?, ?, ?)
            ''', (title, text, user_name, datetime.now().isoformat()))
            conn.commit()
            conn.close()

    # Fetch feedback from database
    conn = sqlite3.connect('data/feedback.db')
    conn.row_factory = sqlite3.Row  # This allows us to access columns by name
    c = conn.cursor()
    c.execute('SELECT * FROM feedback ORDER BY date_submitted DESC')
    feedback_items = c.fetchall()
    conn.close()

    # Fetch messages from database
    conn = sqlite3.connect('data/users.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT M.Id, M.Message, M.SentAt, U.Name FROM messages M ' \
        'JOIN "users" U on M.UserId = U.Id ' \
        'WHERE U.UserName = ? AND M.Dismissed = False ' \
        'ORDER BY SentAt DESC', (flask_login.current_user.id,))
    messages = c.fetchall()
    conn.close()

    return render_template("projects.html", feedback=feedback_items, messages=messages)


@projects.route("/toggle_message/<int:message_id>", methods=["POST"])
@flask_login.login_required
def toggle_message(message_id):
    conn = sqlite3.connect('data/users.db')
    c = conn.cursor()
    
    # Fetch current resolved status
    c.execute('SELECT Dismissed FROM messages WHERE id = ?', (message_id,))
    result = c.fetchone()
    
    if result:
        # Update the resolved status
        c.execute('UPDATE messages SET Dismissed = True WHERE id = ?', (message_id,))
        conn.commit()
    
    conn.close()
    return "", 204  # No content response


@projects.route("/toggle_feedback/<int:feedback_id>", methods=["POST"])
@flask_login.login_required
def toggle_feedback(feedback_id):
    conn = sqlite3.connect('data/feedback.db')
    c = conn.cursor()
    
    # Fetch current resolved status
    c.execute('SELECT resolved FROM feedback WHERE id = ?', (feedback_id,))
    result = c.fetchone()
    
    if result:
        current_status = result[0]
        new_status = not current_status
        
        # Update the resolved status
        c.execute('UPDATE feedback SET resolved = ? WHERE id = ?', (new_status, feedback_id))
        conn.commit()
    
    conn.close()
    return "", 204  # No content response

@projects.route("/mc_server")
@flask_login.login_required
def mc_server():
    return render_template("mc_server.html")

@projects.route("/image-to-mesh")
@flask_login.login_required
def three_dee():
    return render_template("image-to-mesh.html")

@projects.route("/chat")
@flask_login.login_required
def chat():
    return render_template("chat.html")

@projects.route("/chat/send", methods=["POST"])
@flask_login.login_required
def send_message():
    # Get message from request
    data = request.get_json()
    message = data.get("message", "")
    
    # In a real app, this would be processed by an AI or backend service
    # For now, we'll simulate a response
    response = f"Echo: {message}"
    
    # Return the response
    return jsonify({"response": response})

# Update a player's position in the in-memory dictionary
@projects.route("/mc_server/player", methods=['POST'])
def mc_server_player_update():
    data = request.get_json()
    name = data["name"]
    position = data["position"]

    # Convert position and current time to a friendly string
    time_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    friendly_string = f"Position: {position}, Last Updated: {time_str}"
    with player_pos_lock:
        player_pos_live_map[name] = friendly_string
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
@flask_login.login_required
def mc_server_players():
    player_pos_text = ["<ul>"]
    for player in player_pos_live_map:
        player_pos_text += f"<li><b>{player}</b>: {player_pos_live_map[player]}</li>"
    
    player_pos_text += "</ul>"
    return "".join(player_pos_text)
