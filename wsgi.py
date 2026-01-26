from gevent import monkey

monkey.patch_all(thread=False)

from mxcubecore import HardwareRepository as HWR  # noqa: E402

from mxcubeweb.app import MXCUBEApplication as mxcube  # noqa: E402, N813
from mxcubeweb.config import Config  # noqa: E402
from mxcubeweb.core.models.configmodels import RuntimeOptions  # noqa: E402
from mxcubeweb.core.server.routes import register_routes  # noqa: E402
from mxcubeweb.core.server.server import create_server  # noqa: E402

runtime_options = RuntimeOptions()


HWR.init_hardware_repository(runtime_options.hwr_directory, None)
config_path = HWR.get_hardware_repository().find_in_repository("mxcube-web")
cfg = Config(config_path)

server = create_server(cfg, cmdline_options=runtime_options)
mxcube.init(
    server,
    runtime_options.allow_remote,
    runtime_options.ra_timeout,
    runtime_options.log_file,
    runtime_options.log_level,
    runtime_options.enabled_logger_list,
    cfg,
)
register_routes(server, mxcube, cfg)

app = server.flask
socketio = server.flask_socketio
