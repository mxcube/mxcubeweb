import importlib
import logging

from mxcubeweb.core.server.resource_handler import (
    ResourceHandlerFactory,
)


class ComponentBase:
    def __init__(self, app, config, resource_handler_config=None):
        self.app = app
        self.config = config

        if resource_handler_config:
            cls_name = self.__class__.__name__.lower()

            ResourceHandlerFactory.create_or_get(
                name=cls_name,
                url_prefix="/mxcube/api/v0.1/" + cls_name,
                handler_dict={cls_name: self},
                app=self.app,
                exports=resource_handler_config.exports,
                commands=resource_handler_config.commands,
                attributes=resource_handler_config.attributes,
                handler_type="component",
            )


def import_component(config, package="", module=""):
    _module = "mxcubeweb.core"

    if package:
        _module = f"{_module}.{package}"

    if not module:
        module = config.class_name.lower()

    _module = f"{_module}.{module}"
    mod = importlib.import_module(_module)
    _cls = getattr(mod, config.class_name)

    logging.getLogger("MX3").info(
        f"Using UserManager {_cls.__module__}.{_cls.__name__}"
    )

    return _cls
