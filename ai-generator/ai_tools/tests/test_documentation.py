import pytest
import ast
import inspect

from ai_tools import tools

# All AI tools should have decent documentation, because that's what ollama uses 
def test_all_methods_have_docs():
    # Qwen3 30B FP16 assistance
    functions = [getattr(tools, attr) for attr in dir(tools) 
                if callable(getattr(tools, attr)) and not attr.startswith('_')]

    for function in functions:
        function_docs = inspect.getdoc(function) 
        assert function_docs is not "" and function_docs is not None

