from dataclasses import dataclass
import os
from pathlib import Path
from typing import Optional

import ollama

from external_tools import tools
from external_tools.tool_output import ToolOutput

@dataclass
class ValidationResult:
    success: bool
    file_name: str
    tool_output: Optional[ToolOutput]


def run(project: str, steps: int, verbose: bool):
    counter = 1
    while counter <= steps or steps == -1:
        print(f"Iteration {counter} start")
        
        print(f"Validating iteration {counter}...")
        result = _validate_project_structure(project)
        if result.success:
            print(f"Validation passed")
        
        print(f"Iteration {counter} stop")
        if not result.success:
            print(f"  Iteration {counter} failure")
            if verbose:
                print(result.tool_output)

        counter = counter + 1

def _validate_project_structure(project: str) -> ValidationResult:
    # Rules

    ## All SCSS files compile
    for file in Path(os.path.join(project, 'scss')).iterdir():
        if not file.is_file():
            continue

        file_name = os.path.basename(file)
        print(f" Compiling {file_name}", end="", flush=True)
        result = tools.sass(project, file_name)
        if not result.success:
            print(f"\n  Compilation failed.")
            return ValidationResult(False, file_name, result)
        print(f"\r Compiled {file_name}    ")

        
    ## All JS files compile, **and** have refer to the compiled SCSS file in the first line.
    for file in Path(os.path.join(project, 'js')).iterdir():
        if not file.is_file():
            continue

        file_name = os.path.basename(file)
        required_css_import = f"import \"../scss/gen/{file.stem}.css\";"
        if not _read_first_line(file) == required_css_import:
            return ValidationResult(False, file_name, 
                                    ToolOutput(False, 0.1, [
                                        "Missing required CSS import at top of file:",
                                        required_css_import]))


        print(f" Compiling {file_name}", end="", flush=True)
        result = tools.esbuild(project, file_name)
        if not result.success:
            print(f"\n  Compilation failed.")
            return ValidationResult(False, file_name, result)
        print(f"\r Compiled {file_name}    ")
            
            
    return ValidationResult(True, "", None)


def _read_first_line(file_path: Path) -> str:
    with open(file_path, 'r') as file:
        first_line = file.readline()
        return first_line.strip()

        
def stats():
    pass