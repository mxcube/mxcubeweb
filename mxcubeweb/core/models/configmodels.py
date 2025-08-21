import datetime
from enum import Enum
from pathlib import Path
from typing import (
    Literal,
)

from pydantic.v1 import BaseModel, Field, validator


class FlaskConfigModel(BaseModel):
    SECRET_KEY: str = Field(
        b"o`\xb5\xa5\xc2\x8c\xb2\x8c-?\xe0,/i#c",
        description="Flask secret key",
    )
    DEBUG: bool = Field(False, description="")
    ALLOWED_CORS_ORIGINS: list[str] = Field([], description="")
    SECURITY_PASSWORD_SALT: str = Field("ASALT", description="")
    SECURITY_TRACKABLE: bool = Field(True, description="")
    USER_DB_PATH: str = Field(
        str(Path.home() / ".local" / "share" / "mxcube" / "mxcube-user.db"),
        description="",
    )
    HOST: str = Field("127.0.0.1", description="Host address to bind to")
    PORT: int = Field(8081, description="Port to bind to")
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
    # Rate limiter configuration
    RATE_LIMITER_ENABLED: bool = True
    RATELIMIT_DEFAULT: str = "150000 per day;6000 per hour"
    RATELIMIT_STORAGE_URI: str = "memory://"
    RATELIMIT_HEADERS_ENABLED: bool = True

    CSP_ENABLED: bool = True
    CSP_POLICY: dict[str, list[str]] = {}
    CSP_REPORT_ONLY: bool = Field(
        False,
        description="Set to True to enable report-only mode (won't block content)",
    )
    CSP_REPORT_URI: str = Field(
        "", description="URI for CSP violation reports (empty to disable reporting)"
    )


class SSOConfigModel(BaseModel):
    USE_SSO: bool = Field(False, description="Set to True to use SSO")
    ISSUER: str = Field("", description="OpenIDConnect / OAuth Issuer URI")
    LOGOUT_URI: str = Field("", description="OpenIDConnect / OAuth logout URI")
    CLIENT_SECRET: str = Field("", description="OpenIDConnect / OAuth client secret")
    CLIENT_ID: str = Field("", description="OpenIDConnect / OAuth  client id")
    META_DATA_URI: str = Field(
        "", description="OpenIDConnect / OAuth  .well-known configuration"
    )
    SCOPE: str = Field(
        "openid email profile", description="OpenIDConnect / OAuth scope"
    )
    CODE_CHALLANGE_METHOD: str = Field(
        "S256", description="OpenIDConnect / OAuth Challange"
    )


class UIComponentModel(BaseModel):
    label: str
    attribute: str
    role: str | None
    step: float | None
    precision: int | None
    suffix: str | None
    description: str | None
    # Set internally not to be set through configuration
    value_type: str | None
    object_type: str | None
    format: str | None
    invert_color_semantics: bool | None


class _UICameraConfigModel(BaseModel):
    label: str
    url: str
    format: str | None
    description: str | None
    width: int | None
    height: int | None


class _UISampleViewVideoControlsModel(BaseModel):
    id: str
    show: bool


class _UISampleViewVideoGridSettingsModel(BaseModel):
    id: Literal["draw_grid"]
    show: bool
    show_vspace: bool = False
    show_hspace: bool = False


class UIPropertiesModel(BaseModel):
    id: str
    components: list[UIComponentModel]


class UICameraConfigModel(UIPropertiesModel):
    components: list[_UICameraConfigModel]


class UISampleViewMotorsModel(UIPropertiesModel):
    id: str
    components: list[UIComponentModel]


class _UISampleListViewModesComponentModel(BaseModel):
    id: Literal["table_view", "graphical_view"]
    show: bool = True


class UISampleListViewModesModel(BaseModel):
    id: Literal["sample_list_view_modes"] = "sample_list_view_modes"
    components: list[_UISampleListViewModesComponentModel] = Field(
        default_factory=lambda: [
            _UISampleListViewModesComponentModel(id="table_view", show=True),
            _UISampleListViewModesComponentModel(id="graphical_view", show=True),
        ],
        description="List of components for sample list view modes",
    )

    @validator("components")
    @classmethod
    def check_at_least_one_component_shown(
        cls, components: list[_UISampleListViewModesComponentModel]
    ) -> list[_UISampleListViewModesComponentModel]:
        """
        Validates that at least one component in the list has 'show' set to True.
        """
        if not any(component.show for component in components):
            msg = "At least one component must have 'show' set to True."
            raise ValueError(msg)
        return components


class UISampleViewVideoControlsModel(UIPropertiesModel):
    # It is important to keep the Union elements in that order; from the more specific to the more general.
    components: list[
        _UISampleViewVideoGridSettingsModel | _UISampleViewVideoControlsModel
    ]


class UiSessionPickerTabs(BaseModel):
    active: bool = True
    scheduled: bool = True
    other_beamlines: bool = True
    all_sessions: bool = False


class UISessionPickerModel(BaseModel):
    id: Literal["session_picker"] = "session_picker"
    tabs: UiSessionPickerTabs = UiSessionPickerTabs()


class UIPropertiesListModel(BaseModel):
    sample_view: UIPropertiesModel | None
    beamline_setup: UIPropertiesModel
    camera_setup: UICameraConfigModel | None
    sample_view_motors: UISampleViewMotorsModel
    sample_list_view_modes: UISampleListViewModesModel = UISampleListViewModesModel()
    sample_view_video_controls: UISampleViewVideoControlsModel | None
    session_picker: UISessionPickerModel = UISessionPickerModel()


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
    users: list[UserManagerUserConfigModel]


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
    USE_GET_SAMPLES_FROM_SC: bool = Field(
        True,
        description=(
            "True to acticvate or be able to get samples from the sample changer, false otherwise"
        ),
    )
    mode: ModeEnum = Field(
        ModeEnum.OSC, description="MXCuBE mode OSC, SSX-CHIP or SSX-INJECTOR"
    )
    LOCAL_DOMAINS: list[str] = Field(
        [],
        description="If the connected client's hostname ends with one of these domains"
        ", it will be considered 'local'",
    )
    SESSION_REFRESH_INTERVAL: int = Field(
        9000,
        description="Session refresh interval in milliseconds",
    )
    usermanager: UserManagerConfigModel
    ui_properties: dict[str, UIPropertiesModel] = {}


class AppConfigModel(BaseModel):
    server: FlaskConfigModel
    mxcube: MXCUBEAppConfigModel
    sso: SSOConfigModel | None


class ResourceHandlerConfigModel(BaseModel):
    """
    Used to define  which adapter properties and methods that are
    exported over HTTP. An endpoint for each method and/or property
    is created by the AdapterResourceHandler and attached to the server.

    The exports list defines the methods and properties exported,
    the HTTP verb to use and the decorators to apply to the view
    function,

    The format is:
    [
        {"attr": "get_value", "method": "PUT", "decorators":[]}
    ]

    Where "attr" is the method or property of the adapter, "method"
    is the http verb i.e GET, PUT, POST. and decoratoes are a list
    decroator functions to apply to the resulting view function.

    There are two structures that can be used for convenience, that
    use defualt vlaues for "method" and "decorators". These are
    commands and attributes.

    Commands is list of functions/methods to export.
    A dictionary like the one above:

        ({"attr": "get_value", "method": "PUT", "decorators":[]})

    Will be generated from the commands list. With the values "method" and
    decorators set to defualt values, PUT and [restrict, require_control]

    Example:

        commands = ["set_value", "get_value"]

    Will export the methods as .../set_value with HTTP verb PUT

    In the same way:

    Example:

        attributes = ["data"]

    Will export the property as .../data with HTTP verb GET
    """

    url_prefix: str = Field("", description="URL prefix")
    exports: list[dict[str, str | list]] = Field(
        [],
        description=(
            "List of dictionaires specifying each of the exported attributes or"
            " methods, HTTP method to use and decorators to apply "
        ),
    )
    commands: list[str] = Field(
        [], description="List of exported methods, defualted to HTTP PUT"
    )
    attributes: list[str] = Field(
        [], description="List of exported properties, defaulted to HTTP GET"
    )
