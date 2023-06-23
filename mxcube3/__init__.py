import argparse
import mock
import os
import redis
import sys
import traceback


from gevent import monkey
monkey.patch_all(thread=False)

from mxcube3.server import Server
from mxcube3.app import MXCUBEApplication
from mxcube3.config import Config

from mxcubecore import HardwareRepository as HWR

sys.modules["Qub"] = mock.Mock()
sys.modules["Qub.CTools"] = mock.Mock()

mxcube = None
server = None


def parse_args():
    XML_DIR = os.path.join(
        os.path.join(os.path.dirname(__file__), os.pardir),
        "test/HardwareObjectsMockup.xml/",
    )

    opt_parser = argparse.ArgumentParser(
        description="mxcube-web Backend server command line utility."
    )

    opt_parser.add_argument(
        "-r",
        "--repository",
        dest="hwr_directory",
        help="Hardware Repository XML files path",
        default=XML_DIR,
    )

    opt_parser.add_argument(
        "-s",
        "--static-folder",
        dest="static_folder",
        help="Static folder",
        default=f"{os.getcwd()}ui/build",
    )

    opt_parser.add_argument(
        "-l",
        "--log-file",
        dest="log_file",
        help="Log file name",
        default="",
    )

    opt_parser.add_argument(
        "-L",
        "--log-level",
        dest="log_level",
        help="Log level for all loggers ",
        default="",
    )

    opt_parser.add_argument(
        "-el",
        "--enabled-loggers",
        dest="enabled_logger_list",
        help="Which loggers to use, default is to use all loggers ([exception_logger, hwr_logger, mx3_hwr_logger, user_logger, queue_logger])",
        default=[
            "exception_logger",
            "hwr_logger",
            "mx3_hwr_logger",
            "user_logger",
            "queue_logger",
            "mx3_ui_logger",
        ],
    )

    opt_parser.add_argument(
        "-w",
        "--ra",
        action="store_true",
        dest="allow_remote",
        help="Enable remote access",
        default=False,
    )

    opt_parser.add_argument(
        "-t",
        "--ra-timeout",
        action="store_true",
        dest="ra_timeout",
        help="Timeout gives control",
        default=False,
    )

    return opt_parser.parse_args()


def main(test=False):
    global mxcube
    global server

    cmdline_options = parse_args()

    try:
        db = redis.Redis()
        db.ping()
    except redis.RedisError:
        print("No Redis server is running, exiting")
        sys.exit(1)

    try:
        mxcube = MXCUBEApplication()
        server = Server()

        # This refactoring (with other bits) allows you to pass a 'path1:path2' lookup path
        # as the hwr_directory. I need it for sensible managing of a multi-beamline test set-up
        # without continuously editing teh main config files.
        # Note that the machinery was all there in the core alrady. rhfogh.
        HWR.init_hardware_repository(cmdline_options.hwr_directory)
        config_path = HWR.get_hardware_repository().find_in_repository("mxcube-web")

        cfg = Config(config_path)

        if test:
            cfg.flask.USER_DB_PATH = "/tmp/mxcube-test-user.db"

        server.init(cmdline_options, cfg, mxcube)
        mxcube.init(
            server,
            cmdline_options.allow_remote,
            cmdline_options.ra_timeout,
            cmdline_options.log_file,
            cmdline_options.log_level,
            cmdline_options.enabled_logger_list,
            cfg,
        )

        server.register_routes(mxcube)
    except Exception:
        traceback.print_exc()
        raise

    if not test:
        server.run(cfg)
    else:
        return server


if __name__ == "__main__":
    main()
