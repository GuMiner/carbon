import pytest
from ai_tools.tools import calculator

# Tests implemented by Qwen3 30B FP16, with minor modifications
def test_basic_arithmetic():
    """Test basic arithmetic operations"""
    assert calculator("2 + 2") == "4"
    assert calculator("10 - 3") == "7"
    assert calculator("5 * 6") == "30"
    assert calculator("15 / 3") == "5.0"
    assert calculator("2 ** 3") == "8"

def test_complex_expressions():
    """Test more complex mathematical expressions"""
    assert calculator("2 + 3 * 4") == "14"
    assert calculator("(2 + 3) * 4") == "20"
    assert calculator("10 / 2 + 3") == "8.0"
    assert calculator("2 * (3 + 4)") == "14"

def test_math_functions():
    """Test mathematical functions"""
    assert calculator("sqrt(16)") == "4.0"
    assert calculator("sin(0)") == "0.0"
    assert calculator("cos(0)") == "1.0"
    assert calculator("exp(0)") == "1.0"
    assert calculator("log(1)") == "0.0"

def test_invalid_expressions():
    """Test handling of invalid expressions"""
    assert "Failed to parse math expression" in calculator("invalid")
    assert "Failed to parse math expression" in calculator("2 + ")

def test_special_values():
    """Test special mathematical values"""
    assert calculator("pi") == "3.141592653589793"
    assert calculator("e") == "2.718281828459045"
