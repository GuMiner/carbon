

from flask import Blueprint, render_template

blog = Blueprint('blog', __name__, url_prefix='/blog', template_folder='../templates/blog')


@blog.route("/")
def index():
    return render_template("blog.html")