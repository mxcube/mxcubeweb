# -*- coding: utf-8 -*-
import importlib
import logging

class Component():
    def __init__(self, app, server, config):
        self.app = app
        self.config = config
        self.server = server

def import_component(config, package="", module=""):
    _module = "mxcube3.core"

    if package:
        _module = ".".join([_module, package])

    if not module:
        module = config["class"].lower()

    _module = ".".join([_module, module])
    mod = importlib.import_module(_module)
    _cls = getattr(mod, config["class"])

    logging.getLogger("MX3").info(f"Using UserManager {_cls.__module__}.{_cls.__name__}")

    return _cls