# Carbon — Helium24.net Personal Website

This is a [Hugo](https://gohugo.io) static site powering **helium24.net**, a rewrite of the original Flask-based [lithium](https://github.com/guminer) project.

## Structure

- `content/` — Markdown content pages (projects, recommendations, etc.)
- `layouts/` — Hugo templates; `baseof.html` defines header/main/footer blocks
- `assets/css/` and `assets/ts/` — Stylesheets and TypeScript compiled via Hugo Pipes / SASS
- `config.toml` — Site configuration, menus, and build settings

## Conventions

- Pages extend `baseof.html` by defining the `"main"` block.
- Content data (e.g., recommendation reference sets) lives in YAML frontmatter.
- The header (`layouts/partials/header.html`) is a static nav; menu entries are also registered in `config.toml`.
- Build with `hugo`; preview with `hugo server`.
- Prefer CDNs for TypeScript and JavaScript dependencies. Notably, do not use NPM.