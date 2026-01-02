import dataclasses
import typing

@dataclasses.dataclass
class ToolOutput:
    success: bool
    duration: float  # In seconds
    errors: typing.List[str]
