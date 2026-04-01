import logging
import os
import pathlib
import sys
import time

import ruamel.yaml
from pydantic import (
    BaseModel,
    ValidationError,
)

from mxcubeweb.core.models.configmodels import (
    AppConfigModel,
    BraggyConfigModel,
    FlaskConfigModel,
    MXCUBEAppConfigModel,
    SSOConfigModel,
    UIPropertiesListModel,
)


class ConfigLoader:
    @staticmethod
    def resolve_env(value):
        if isinstance(value, str) and value.startswith("_ENV_"):
            env_value = os.getenv(value)
            if env_value is None:
                error_msg = f"{value} starts with _ENV_ but was not set in environment"
                raise RuntimeError(error_msg)
            logging.getLogger("HWR").debug(f"Environment variable {value} has been set")
            return env_value
        return value

    @staticmethod
    def walk_and_resolve(data):
        if isinstance(data, dict):
            return {
                k: ConfigLoader.walk_and_resolve(ConfigLoader.resolve_env(v))
                for k, v in data.items()
            }
        if isinstance(data, list):
            return [
                ConfigLoader.walk_and_resolve(ConfigLoader.resolve_env(x)) for x in data
            ]
        return ConfigLoader.resolve_env(data)

    @staticmethod
    def load(path: str, schema: BaseModel):
        with open(os.path.join(path), encoding="utf-8") as f:
            config = ruamel.yaml.YAML().load(f.read())
            config = ConfigLoader.walk_and_resolve(config)
            try:
                model = schema.parse_obj(config)
            except ValidationError:
                logging.getLogger("HWR").error(f"Validation error in {path}:")
                logging.getLogger("HWR").exception("")
                sys.exit(-1)

        return model

    @staticmethod
    def load_ui_index(index_path: str) -> dict:
        """Load an ui.yaml and merge the referenced "module" files."""
        yaml = ruamel.yaml.YAML()
        with open(index_path) as f:
            ui_index = yaml.load(f)

        merged: dict = {}

        if not isinstance(ui_index, dict):
            return merged

        # New format (version 1.0.0) uses a top-level 'modules' mapping
        # while the legacy format (version 0) has no modules section
        modules = ui_index.get("modules")

        # If modules are defined (version 1.0.0 and greater), load and merge
        # them into the ui_index.
        if modules is not None:
            base_dir = pathlib.Path(index_path).parent

            for rel in modules.values():
                module_path = base_dir / rel

                if not pathlib.Path(module_path).exists():
                    logging.getLogger("HWR").warning(
                        f"Module file not found: {module_path}"
                    )
                    continue

                with open(module_path) as mf:
                    data = yaml.load(mf)

                    if isinstance(data, dict):
                        merged.update(data)

            return merged

        # Legacy format, the ui.yaml already contains module directly in the
        # ui.yaml file.
        logging.getLogger("HWR").warning(
            "ui.yaml appears to be in legacy format. "
            "The new version 1 format (with 'modules') is preferred. "
            "Loading legacy file for compatibility. "
            "The script in demo/mxcube-web/scripts/convert_ui_yaml.py can be used to "
            "convert to the new format."
        )

        for i in range(3, 0, -1):
            print(f"Sleeping for {i} seconds")
            time.sleep(1)

        return ui_index


class Config:
    CONFIG_ROOT_PATH: str = ""

    flask: FlaskConfigModel
    app: MXCUBEAppConfigModel
    sso: SSOConfigModel
    braggy: BraggyConfigModel

    def __init__(self, fpath):
        Config.CONFIG_ROOT_PATH = fpath
        app_config = self.load_config("server", AppConfigModel)
        uiprop = self.load_config("ui", UIPropertiesListModel)

        self.flask = app_config.server
        self.app = app_config.mxcube
        self.app.ui_properties = uiprop
        self.sso = app_config.sso
        self.braggy = app_config.braggy

    def load_config(self, component_name, schema):
        fpath = os.path.join(Config.CONFIG_ROOT_PATH, f"{component_name}.yaml")
        index_path = os.path.join(Config.CONFIG_ROOT_PATH, "ui.yaml")
        if component_name == "ui" and pathlib.Path(index_path).exists():
            data = ConfigLoader.load_ui_index(index_path)
            data = ConfigLoader.walk_and_resolve(data)

            try:
                model = schema.parse_obj(data)
            except ValidationError:
                logging.getLogger("HWR").error(f"Validation error in {index_path}:")
                logging.getLogger("HWR").exception("")
                sys.exit(-1)

            return model

        return ConfigLoader().load(path=fpath, schema=schema)
