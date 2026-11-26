from importlib.metadata import (
    PackageNotFoundError,
    version,
)

__version__: str
try:
    __version__ = version(__package__ or __name__)
except PackageNotFoundError:
    # Could fail to find package when developing locally.
    # Try reading from pyproject.toml as a backup.

    from pathlib import Path
    from tomllib import load as load_toml

    try:
        with open(Path(__file__).resolve().parents[1] / "pyproject.toml", "rb") as f:
            pyproject = load_toml(f)
            __version__ = pyproject["project"]["version"]
    except OSError:
        # File IO error
        __version__ = "local"
