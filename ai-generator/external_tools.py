import pathlib
import os
import typing

SASS_PATH = r"C:\Users\gusgr\AppData\Roaming\npm\sass"
SASS_POSTFIX = "--no-color --silence-deprecation if-function"

# i.e., sass('project', 'index.scss')
def sass(project_path: str, file_name: str):
    SCSS_FOLDER = 'scss'

    output_file_name = f"{pathlib.Path(file_name).stem}.css"
    output = _run(SASS_PATH, [
        os.path.join(project_path, SCSS_FOLDER, file_name),
        os.path.join(project_path, SCSS_FOLDER, 'gen', output_file_name)])
    
    #todo parse
    return output
    

def _run(path: str, args: typing.List[str]):
    pass