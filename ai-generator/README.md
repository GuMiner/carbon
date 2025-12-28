# AI Generation
## About
This folder contains code to automatically generate projects, using a somewhat absurd amount of AI resources to do so.

## Structure
- `main.py` is the entry point to the code generator.
- `docs` defines the project overview. 
- `project` stores the internal grnerated project structure
  - **V1**: The internal project structure matches my standard website design (flask + Typescript)
- `logs` stores the logs and stats of running the code generator

### V1 project setup
```bash
mkdir project
uv init
uv add Flask Flask-Assets Flask-Compress

<copy/define the package.json file>
npm install
npm install -g sass
```
 