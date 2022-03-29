from pydantic import BaseModel, Field


class VersionModel(BaseModel):
    version: str = Field("", description="Version")
