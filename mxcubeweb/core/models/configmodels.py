from enum import Enum
from pydantic.v1 import BaseModel, Field
from typing import List, Dict, Optional
import datetime


class FlaskConfigModel(BaseModel):
    SECRET_KEY: str = Field(
        b"o`\xb5\xa5\xc2\x8c\xb2\x8c-?\xe0,/i#c",
        description="Flask secret key",
    )
    DEBUG: bool = Field(False, description="")
    ALLOWED_CORS_ORIGINS: List[str] = Field(["*"], description="")
    SECURITY_PASSWORD_SALT: str = Field("ASALT", description="")
    SECURITY_TRACKABLE: bool = Field(True, description="")
    USER_DB_PATH: str = Field("/tmp/mxcube-user.db", description="")
    PERMANENT_SESSION_LIFETIME: datetime.timedelta
    CERT_KEY: str = Field("", description="Full path to signed certificate key file")
    CERT_PEM: str = Field("", description="Full path to signed certificate pem file")

    # SIGNED for signed certificate on file
    # ADHOC for flask to generate a certificate,
    # NONE for no SSL
    CERT: str = Field(
        "NONE",
        description="One of the strings ['SIGNED', 'ADHOC', NONE]",
    )


class UIComponentModel(BaseModel):
    label: str
    attribute: str
    role: Optional[str]
    step: Optional[float]
    precision: Optional[int]
    suffix: Optional[str]
    description: Optional[str]
    # Set internally not to be set through configuration
    value_type: Optional[str]
    object_type: Optional[str]
    format: Optional[str]


class _UICameraConfigModel(BaseModel):
    label: str
    url: str
    format: Optional[str]
    description: Optional[str]
    width: Optional[int]
    height: Optional[int]


class _UISampleViewVideoControlsModel(BaseModel):
    id: str
    show: bool


class UIPropertiesModel(BaseModel):
    id: str
    components: List[UIComponentModel]


class UICameraConfigModel(UIPropertiesModel):
    components: List[_UICameraConfigModel]


class UISampleViewVideoControlsModel(UIPropertiesModel):
    components: List[_UISampleViewVideoControlsModel]


class UIPropertiesListModel(BaseModel):
    sample_view: UIPropertiesModel
    beamline_setup: UIPropertiesModel
    camera_setup: Optional[UICameraConfigModel]
    sample_view_video_controls: Optional[UISampleViewVideoControlsModel]


class UserManagerUserConfigModel(BaseModel):
    username: str = Field("", description="username")
    role: str = Field("staff", description="Role to give user")


class UserManagerConfigModel(BaseModel):
    class_name: str = Field(
        "UserManager", description="UserManager class", alias="class"
    )
    inhouse_is_staff: bool = Field(
        True,
        description="Treat users defined as inhouse in session.xml as staff",
    )
    users: List[UserManagerUserConfigModel]


class ModeEnum(str, Enum):
    SSX_INJECTOR = "SSX-INJECTOR"
    SSX_CHIP = "SSX-CHIP"
    OSC = "OSC"


class MXCUBEAppConfigModel(BaseModel):
    VIDEO_FORMAT: str = Field("MPEG1", description="Video format MPEG1 or MJPEG")

    # URL from which the client retrieves the video stream (often different from
    # local host when running behind proxy)
    VIDEO_STREAM_URL: str = Field(
        "",
        description="Video stream URL, URL used by client to get video stream",
    )

    # Port from which the video_stream process (https://github.com/mxcube/video-streamer)
    # streams video. The process runs in separate process (on localhost)
    VIDEO_STREAM_PORT: int = Field(8000, description="Video stream PORT")
    USE_EXTERNAL_STREAMER: bool = Field(
        False,
        description=(
            "True to use video stream produced by external software, false otherwise"
        ),
    )
    mode: ModeEnum = Field(
        ModeEnum.OSC, description="MXCuBE mode OSC, SSX-CHIP or SSX-INJECTOR"
    )
    usermanager: UserManagerConfigModel
    ui_properties: Dict[str, UIPropertiesModel] = {}


class AppConfigModel(BaseModel):
    server: FlaskConfigModel
    mxcube: MXCUBEAppConfigModel
