from pydantic import BaseModel, Field
from typing import List, Dict, Optional


class FlaskConfigModel(BaseModel):
    SECRET_KEY: str = Field(b"o`\xb5\xa5\xc2\x8c\xb2\x8c-?\xe0,/i#c", description="Flask secret key")
    SESSION_TYPE: str = Field("redis", description="Flask session type")
    SESSION_KEY_PREFIX: str = Field("mxcube:session:", description="Session prefix")
    DEBUG: bool = Field(False, description="")
    STREAMED_VIDEO: bool = Field(True, description="")
    ALLOWED_CORS_ORIGINS: List[str] = Field(["*"], description="")
    SECURITY_PASSWORD_SALT: str = Field("ASALT", description="")
    SECURITY_TRACKABLE: bool = Field(True, description="")


class UIComponentModel(BaseModel):
    label: str
    attribute: str
    role: Optional[str]
    step: Optional[float]
    precision: Optional[int]
    suffix: Optional[str]

    # Set internaly not to be set through configuration
    value_type: Optional[str]
    object_type: Optional[str]


class UIPropertiesModel(BaseModel):
    id: str
    components: List[UIComponentModel]


class UIPropertiesListModel(BaseModel):
    __root__: Dict[str, UIPropertiesModel]


class MXCUBEAppConfigModel(BaseModel):
    VIDEO_FORMAT: str = Field("MPEG1", description="Video format MPEG1 or MJPEG")
    usermanager: dict = Field({"class": "UserManager"}, description="")
    ui_properties: Dict[str, UIPropertiesModel] = {}
    adapter_properties: List = []


class AppConfigModel(BaseModel):
    server: FlaskConfigModel
    mxcube: MXCUBEAppConfigModel
