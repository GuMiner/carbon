# The tools the AI is allowed to call
def calculator(expression: str) -> str:
    """Evalutes a mathemtical expression.
    
    Args:
        str: The mathematical string, using standard Python math operators, i.e. 'cos', 'floor', 'radians', etc.

    Returns:
        The computed result
    """
    # Implemented by Qwen3 30B FP16
    # Allow basic math operations and functions
    allowed_names = {
        "abs": abs, "round": round, "min": min, "max": max,
        "pow": pow, "sum": sum, "len": len,
        "sin": __import__("math").sin, "cos": __import__("math").cos,
        "tan": __import__("math").tan, "sqrt": __import__("math").sqrt,
        "log": __import__("math").log, "exp": __import__("math").exp,
        "pi": __import__("math").pi, "e": __import__("math").e,
        "ceil": __import__("math").ceil, "floor": __import__("math").floor,
        "fabs": __import__("math").fabs, "factorial": __import__("math").factorial,
        "degrees": __import__("math").degrees, "radians": __import__("math").radians,
        "asin": __import__("math").asin, "acos": __import__("math").acos,
        "atan": __import__("math").atan, "atan2": __import__("math").atan2,
        "sinh": __import__("math").sinh, "cosh": __import__("math").cosh,
        "tanh": __import__("math").tanh, "lgamma": __import__("math").lgamma,
        "erf": __import__("math").erf, "erfc": __import__("math").erfc,
        "gamma": __import__("math").gamma
    }
    
    expression = expression.replace("^", "**")
    # Evaluate the expression safely
    try:
        result = eval(expression, {"__builtins__": {}}, allowed_names)
        return str(result)
    except Exception as e:
        return f"Failed to parse math expression: {e}. Expression: {expression}"


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
