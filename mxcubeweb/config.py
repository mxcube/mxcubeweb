import logging
import os
import sys

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
        return ConfigLoader().load(path=fpath, schema=schema)
