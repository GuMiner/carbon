
from dataclasses import dataclass
from flask import Blueprint, render_template

attributions = Blueprint('attributions', __name__, url_prefix='/attributions', template_folder='../templates/attributions')


@dataclass
class Attribution:
    name: str
    link: str
    details: str

attributionSet = {
    "javaScript": [
        Attribution("esbuild", "https://esbuild.github.io/", "JavaScript bundling & minification"),
        Attribution("htmx", "https://htmx.org/", "Client/Server HTML attribute-based"),
        Attribution("Pico CSS", "https://picocss.com/", "Small CSS styling library"),
        Attribution("sass", "https://sass-lang.com/", "CSS extension language to more easily generate CSS"),
        Attribution("Socket.IO", "https://socket.io/", "Client/Server realtime communication"),
        Attribution("TypeScript", "https://www.typescriptlang.org/", "Language built on JavaScript to more easily generate JavaScript"),
    ],
    "python": [
        Attribution("Flask", "https://flask.palletsprojects.com/en/3.0.x/", "General backend"),
        Attribution("Jinja2", "https://jinja.palletsprojects.com/en/3.0.x/", "Server-side HTML page templates"),
        Attribution("Flask-Compress", "https://pypi.org/project/Flask-Compress/", "Flask support for page / asset compressiond"),
        Attribution("Flask-SocketIO", "https://flask-socketio.readthedocs.io/en/latest/", "Flask support for Socket IO"),
        Attribution("Gunicorn", "https://gunicorn.org/", "WSGI HTTP server to run Flask on Debian")
    ]
}

@attributions.route("/")
def index():
    return render_template("attributions.html", attributions=attributionSet)