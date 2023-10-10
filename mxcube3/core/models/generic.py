import pathlib

from typing import Union
from pydantic import BaseModel, Field
from spectree import Response
from mxcube3.core.models.configmodels import ModeEnum


class VersionModel(BaseModel):
    version: str = Field("", description="Version")


class PathModel(BaseModel):
    path: pathlib.Path = Field("", description="Path")


class SimpleNameValue(BaseModel):
    name: str
    value: Union[str, bool, int]


class AppSettingsModel(BaseModel):
    mode: ModeEnum = Field(ModeEnum.OSC, description="MXCuBE mode SSX or OSC")
    version: str = Field("", description="MXCuBE version")
