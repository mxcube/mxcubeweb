import pathlib

from typing import Union
from pydantic import BaseModel, Field
from spectree import Response


class VersionModel(BaseModel):
    version: str = Field("", description="Version")


class PathModel(BaseModel):
    path: pathlib.Path = Field("", description="Path")


class SimpleNameValue(BaseModel):
    name: str
    value: Union[str, bool, int]
