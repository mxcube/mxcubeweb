from pydantic.v1 import (
    BaseModel,
    Field,
)


class HOModel(BaseModel):
    name: str = Field("", description="name of the hardware object")
    state: str = Field("", description="hardware object state")
    msg: str = Field("", description="additional message to display")
    type: str = Field("", description="type of data the object contains")
    available: bool = Field(True, description="True if the object avilable/enabled")
    readonly: bool = Field(
        True,
        description="True if the object can only be read (not manipluated)",
    )
    attributes: dict = Field({}, description="Data attributes")
    commands: dict | list = Field({}, description="Available methods")

    # pyflakes are a bit picky with F821 (Undefined name),
    # not even sure "forbid" should ba considered as an undefined name
    class Config:
        extra: "forbid"  # noqa: F821


class HOActuatorModel(HOModel):
    value: float = Field(0, description="Value of actuator (position)")
    limits: tuple[float | None, float | None] = Field(
        (-1, -1), description="Limits (min max)"
    )


class NStateModel(HOActuatorModel):
    value: str = Field("", description="Value of nstate object")


class HOMachineInfoModel(HOActuatorModel):
    value: dict = Field(description="Value of machine info")


class HOActuatorValueChangeModel(BaseModel):
    name: str = Field("", description="Name of the hardware object to change")
    value: str = Field("", description="New value of actuator (position)")


class HOBeamRawValueModel(BaseModel):
    apertureList: list[str] = Field([0], description="List of available apertures")
    currentAperture: str = Field(0, description="Current aperture label")
    position: tuple[float, float] = Field((0, 0), description="Beam position on OAV")
    shape: str = Field("ellipse", descrption="Beam shape")
    size_x: float = Field(
        0.01,
        description="Current beam x size (width) in millimieters",
    )
    size_y: float = Field(
        0.01,
        description="Current beam y size (height) in millimieters",
    )

    class Config:
        extra: "forbid"  # noqa: F821


class HOBeamModel(HOActuatorModel):
    value: HOBeamRawValueModel


class HOBeamValueModel(BaseModel):
    value: HOBeamRawValueModel


class FloatValueModel(BaseModel):
    value: float = Field(0, description="Value of actuator (position)")


class StrValueModel(BaseModel):
    value: str = Field("", description="Value of actuator (position)")
