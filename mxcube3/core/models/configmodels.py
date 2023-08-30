from enum import Enum
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import datetime


class FlaskConfigModel(BaseModel):
    SECRET_KEY: str = Field(
        b"o`\xb5\xa5\xc2\x8c\xb2\x8c-?\xe0,/i#c", description="Flask secret key"
    )
    SESSION_TYPE: str = Field("redis", description="Flask session type")
    SESSION_KEY_PREFIX: str = Field("mxcube:session:", description="Session prefix")
    DEBUG: bool = Field(False, description="")
    ALLOWED_CORS_ORIGINS: List[str] = Field(["*"], description="")
    SECURITY_PASSWORD_SALT: str = Field("ASALT", description="")
    SECURITY_TRACKABLE: bool = Field(True, description="")
    USER_DB_PATH: str = Field("/tmp/mxcube-user.db", description="")
    PERMANENT_SESSION_LIFETIME: datetime.timedelta
    SESSION_PERMANENT: bool = Field(True, description="")
    CERT_KEY: str = Field("", description="Full path to signed certficate key file")
    CERT_PEM: str = Field("", description="Full path to signed certificate pem file")

    # SIGNED for signed certificate on file
    # ADHOC for flask to generate a certifcate,
    # NONE for no SSL
    CERT: str = Field(
        "NONE", description="One of the strings ['SIGNED', 'ADHOC', NONE]"
    )


class UIComponentModel(BaseModel):
    label: str
    attribute: str
    role: Optional[str]
    step: Optional[float]
    precision: Optional[int]
    suffix: Optional[str]
    format: Optional[str]

    # Set internaly not to be set through configuration
    value_type: Optional[str]
    object_type: Optional[str]


class UIPropertiesModel(BaseModel):
    id: str
    components: List[UIComponentModel]


class UIPropertiesListModel(BaseModel):
    __root__: Dict[str, UIPropertiesModel]


class UserManagerUserConfigModel(BaseModel):
    username: str = Field("", description="username")
    role: str = Field("staff", description="Role to give user")


class UserManagerConfigModel(BaseModel):
    class_name: str = Field(
        "UserManager", description="UserManager class", alias="class"
    )
    inhouse_is_staff: bool = Field(
        True, description="Treat users defined as inhouse in session.xml as staff"
    )
    users: List[UserManagerUserConfigModel]


class ModeEnum(str, Enum):
    SSX_INJECTOR = "SSX-INJECTOR"
    SSX_CHIP = "SSX-CHIP"
    OSC = "OSC"


class MXCUBEAppConfigModel(BaseModel):
    VIDEO_FORMAT: str = Field("MPEG1", description="Video format MPEG1 or MJPEG")

    # URL from which the client retreives the video stream (often different from
    # local host when running behind proxy)
    VIDEO_STREAM_URL: str = Field(
        "", description="Video stream URL, URL used by client to get video stream"
    )

    # Port from which the video_stream process (https://github.com/mxcube/video-streamer)
    # sreams video. The process runs in seperate process (on localhost)
    VIDEO_STREAM_PORT: str = Field("", description="Video stream PORT")
    USE_EXTERNAL_STREAMER: bool = Field(
        False,
        description="True to use video stream produced by external software, false otherwise",
    )
    mode: ModeEnum = Field(ModeEnum.OSC, description="MXCuBE mode SSX or OSC")
    usermanager: UserManagerConfigModel
    ui_properties: Dict[str, UIPropertiesModel] = {}
    adapter_properties: List = []


class ModeEnumModel(BaseModel):
    mode: ModeEnum = Field(ModeEnum.OSC, description="MXCuBE mode SSX or OSC")


class AppConfigModel(BaseModel):
    server: FlaskConfigModel
    mxcube: MXCUBEAppConfigModel
