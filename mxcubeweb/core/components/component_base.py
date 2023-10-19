# -*- coding: utf-8 -*-
import importlib
import logging


class ComponentBase:
    def __init__(self, app, config):
        self.app = app
        self.config = config


def import_component(config, package="", module=""):
    _module = "mxcubeweb.core"

    if package:
        _module = ".".join([_module, package])

    if not module:
        module = config.class_name.lower()

    _module = ".".join([_module, module])
    mod = importlib.import_module(_module)
    _cls = getattr(mod, config.class_name)

    logging.getLogger("MX3").info(
        f"Using UserManager {_cls.__module__}.{_cls.__name__}"
    )

    return _cls
