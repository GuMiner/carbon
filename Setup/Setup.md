# Basics
See `lithium` setup instructions.

Notably, the `nginx` `/carbon/` redirection

# Setup site folder
su lithium
cd ~
mkdir carbon
cd carbon

## Create Python environment
python3 -m venv .venv
source .venv/bin/activate

pip install Flask
pip install Flask-Assets
pip install Flask-Compress
pip install Flask-SocketIO
pip install gunicorn
pip install gevent

# Setup auto-run+boot config
nano /etc/supervisor/conf.d/carbon.conf
...
(see carbon.conf)
...

## Load and verify that carbon is running
supervisorctl reload
supervisorctl status