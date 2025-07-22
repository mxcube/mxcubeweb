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

    try:
        # Python >= 3.11 standard library
        from tomllib import load as load_toml  # pyright: ignore[reportMissingImports]
    except ImportError:
        # Python <= 3.10 predecessor library
        from tomli import load as load_toml  # pyright: ignore[reportMissingImports]

    try:
        with open(Path(__file__).resolve().parents[1] / "pyproject.toml", "rb") as f:
            pyproject = load_toml(f)
            __version__ = pyproject["tool"]["poetry"]["version"]
    except OSError:
        # File IO error
        __version__ = "local"
