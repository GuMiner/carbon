# carbon
A website for tracking background processing operations; and a quarantine zone for AI code generation experiments.

# Setup
## Project creation
### Python setup
- Virtual environment
```bash
python -m venv .venv
.venv/Scripts/activate
```

- Dependencies
```bash
pip install Flask Flask-Assets Flask-Compress Flask-SocketIO
pip install watchdog
pip install cssmin jsmin
```

### Node setup
- Install packages
```bash
npm install
npm install -g sass

# Consider running 'npm outdated' and 'npm update' to ensure all dependencies are up-to-date.
```


## Development
```bash
sass scss/index.scss scss/gen/index.css
sass scss/mc.scss scss/gen/mc.css
sass scss/stats.scss scss/gen/stats.css
esbuild js/index.ts --bundle --outdir=static/gen --sourcemap
esbuild js/mc.ts --bundle --outdir=static/gen --sourcemap
esbuild js/stats.ts --bundle --outdir=static/gen --sourcemap

flask --debug run
```

## Production release
```bash
esbuild js/index.ts --bundle --outdir=static/gen --minify
esbuild js/mc.ts --bundle --outdir=static/gen --minify
esbuild js/stats.ts --bundle --outdir=static/gen --minify
```

See `Setup.md` for more details on the production server setup.

# Reference
See `attributions.py` for the listing of components used in this site