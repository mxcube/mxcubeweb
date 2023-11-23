from typing import Union
from pydantic import BaseModel, Field
from mxcubeweb.core.models.configmodels import ModeEnum


class SimpleNameValue(BaseModel):
    name: str
    value: Union[str, bool, int]


class AppSettingsModel(BaseModel):
    mode: ModeEnum = Field(ModeEnum.OSC, description="MXCuBE mode SSX or OSC")
    version: str = Field("", description="MXCuBE version")
    mesh_result_format: str = Field(
        "PNG", description="Format of mesh result for display"
    )
    use_native_mesh: bool = Field(
        True,
        description=(
            "Usage of native mesh feature, true by default. The native mesh feature can"
            "be dis-activated to not clash with i.e workflow mesh,"
        ),
    )

    enable_2d_points: bool = Field(
        True,
        description=(
            " Enable features to work with points in the plane, called2D-points,"
            " (none centred positions)"
        ),
    )

    class Config:
        extra: "forbid"  # noqa: F821
