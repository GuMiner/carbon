# The tools the AI is allowed to call
def calculator(expression: str) -> float:
    """Evalutes a mathemtical expression.
    
    Args:
        str: The mathematical string, using standard math operators and math.cos,sin,etc.

    Returns:
        The computed result
    """
    # TODO
    return 0.0

def ask(question: str) -> str:
    """Asks the user a clarifying question
    
    Args:
        str: The clarifying question to ask

    Returns:
        The answer to the question
    """
    # TODO. BLOCKING
    return "maybe"

def add_file(name: str) -> str:
    """Adds a new file to the project. Only top-level SCSS, TS, Python, and HTML files can be added.
    
    Args:
        name: The name of the file to add. Valid extensions are .scss, .ts, .py, and .html

    Returns:
        'Added' on success, otherwise an error message.
    """
    return ""

def read_file(name: str) -> str:
    """Reads the contents of a file.
    
    Args:
        name: The name of the file to read.

    Returns:
        TODO need to figure out proper formatting here.
    """
    return ""

def del_file(name: str) -> str:
    """Removes a file from the project.
    
    Args:
        name: The name of the file to remove.

    Returns:
        'Removed' on success, otherwise an error message.
    """
    return ""