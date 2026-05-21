"""Conftest for live integration tests — no gevent dependency."""


def pytest_addoption(parser):
    parser.addoption("--live-host", default="localhost", help="MXCubeWeb host")
    parser.addoption("--live-port", default="8081", help="MXCubeWeb port")
    parser.addoption("--live-scheme", default="http", help="URL scheme: http or https")
    parser.addoption("--live-ca-cert", default=None,
                     help="Path to CA bundle for self-signed certificates (https only)")
    parser.addoption("--live-no-verify", action="store_true", default=False,
                     help="Disable TLS certificate verification (INSECURE — lab/pentest use only)")
    parser.addoption(
        "--live-count", default="15", help="Requests to send in the hammer test"
    )
