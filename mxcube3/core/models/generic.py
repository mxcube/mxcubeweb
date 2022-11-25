import pathlib

from pydantic import BaseModel, Field


class VersionModel(BaseModel):
    version: str = Field("", description="Version")

class PathModel(BaseModel):
    path: pathlib.Path = Field("", description="Path")
