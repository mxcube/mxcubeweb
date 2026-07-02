from pydantic import (
    BaseModel,
    Field,
    field_validator,
)

from mxcubeweb.core.models.configmodels import ModeEnum

ALLOWED_APP_SETTINGS = {
    "AUTO_ADD_DIFFPLAN",
    "REMEMBER_PARAMETERS_BETWEEN_SAMPLES",
    "AUTO_MOUNT_SAMPLE",
    "ALLOW_REMOTE",
}


def setting_name_to_constant(name: str) -> str:
    return "".join(
        f"_{char}" if char.isupper() else char.upper() for char in name
    ).lstrip("_")


class SimpleNameValue(BaseModel):
    name: str
    # It's important to have str before bool, to avoid issue with bool being casted to string
    value: bool | str | int

class SettingNameValue(BaseModel):
    name: str
    # It's important to have str before bool, to avoid issue with bool being casted to string
    value: bool | str | int

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        if setting_name_to_constant(value) not in ALLOWED_APP_SETTINGS:
            raise ValueError(f"Setting {value!r} is not allowed")

        return value


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
    click_centring_num_clicks: int = Field(
        3,
        description="Number of clicks used for the manual click centring",
    )

    class Config:
        extra: "forbid"  # noqa: F821
