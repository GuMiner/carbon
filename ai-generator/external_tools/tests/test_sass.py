import os

from external_tools import tools

test_project_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test_project')

def test_can_pass():
    result = tools.sass(test_project_folder, "index_good.scss")
    assert result.success

def test_detects_failures():
    result = tools.sass(test_project_folder, "index_bad.scss")
    assert not result.success
    assert len(result.errors) > 0
    for error in result.errors:
        print(error)