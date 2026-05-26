import pathlib
import os
import subprocess
import time
import typing

from .tool_output import ToolOutput

SASS_PATH = r"C:\Users\gusgr\AppData\Roaming\npm\sass.cmd"
ESBUILD_PATH = r"C:\Users\gusgr\AppData\Roaming\npm\esbuild.cmd"


# i.e., sass('project', 'index.scss')
def sass(project_path: str, file_name: str):
    SCSS_FOLDER = 'scss'

    output_file_name = f"{pathlib.Path(file_name).stem}.css"
    output = _run(project_path, SASS_PATH, [
        os.path.join(project_path, SCSS_FOLDER, file_name),
        os.path.join(project_path, SCSS_FOLDER, 'gen', output_file_name),
        '--no-color', '--silence-deprecation', 'if-function'])
    
    #TODO parse in more detail than just returning the errors
    return output

# i.e., esbuild('project', 'index.ts')
def esbuild(project_path: str, file_name: str):
    TS_FOLDER = 'js'
    STATIC_FOLDER = 'static'

    output = _run(project_path, ESBUILD_PATH, [
        '--bundle',
        os.path.join(project_path, TS_FOLDER, file_name),
        f"--outdir={os.path.join(project_path, STATIC_FOLDER, 'gen')}",
        '--sourcemap'])

    #TODO parse in more detail than just returning the errors
    return output
    

def _run(working_directory: str, path: str, args: typing.List[str]) -> ToolOutput:
    duration = -1

    try:
        # Combine the sass path with the postfix arguments
        cmd = [path] + args
        start_time = time.time()
        _ = subprocess.run(cmd, capture_output=True, text=True, check=True, encoding='utf-8', cwd=working_directory)
        duration = time.time() - start_time

        return ToolOutput(success=True, duration=duration, errors=[])
    except subprocess.CalledProcessError as e:
        return ToolOutput(success=False, duration=duration, errors=[e.stderr.strip() if e.stderr else "Unknown error"])
    except FileNotFoundError:
        return ToolOutput(success=False, duration=duration, errors=[f"{path} executable not found"])