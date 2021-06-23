# -*- coding: utf-8 -*-
import logging
import math
import importlib
import pprint

from functools import reduce

from mxcubecore.ConvertUtils import make_table

from mxcube3.core.adapter.adapter_base import AdapterBase
from mxcube3.core.adapter.utils import get_adapter_cls_from_hardware_object

from mxcube3.core import utils

BEAMLINE_ADAPTER = None

# Singleton like interface is needed to keep the same referance to the
# adapter object and its corresponding hardware objects, so that the signal
# system wont cleanup signal handlers. (PyDispatcher removes signal handlers
# when a object is garbage collected)


def BeamlineAdapter(*args):
    global BEAMLINE_ADAPTER

    if BEAMLINE_ADAPTER is None:
        BEAMLINE_ADAPTER = _BeamlineAdapter(*args)

    return BEAMLINE_ADAPTER


class _BeamlineAdapter:
    """
    Adapter between Beamline route and Beamline hardware object.
    """

    def __init__(self, beamline_hwobj, app):
        self._application = app
        self._config = app.CONFIG.APP.adapter_properties
        self._bl = beamline_hwobj
        self._ho_dict = {}
        self._configured_adapter_dict = {}

        workflow = self._bl.workflow

        # Role is in config, use configuration to create adapter
        for role in self._config:
            adapter_cls_str = (
                self._config[role]["adapter"]
                if "adapter" in self._config[role]
                else f"{role}_Adapter".title().replace("_", "")
            )
            
            adapter_cls = self._import_adapter_cls(adapter_cls_str)
            adapts = self._config[role]["adapts"] if "adapts" in self._config[role] else None
            
            self._configured_adapter_dict[role] = (
                role,
                adapts,
                adapter_cls,
                self._config[role],
            )

        # Use mxcubecore api for hardware object if "adapter" keyword is missing. 
        # Fallback to a default adapter class <Role>Adpater if no suitable abstract
        # class was found
        for role in self._bl.all_roles:
            if role in self._configured_adapter_dict:
                # Skip roles that are already configured (listed in the configuration)
                continue

            # Try to use the interface exposed by abstract classes in mxcubecore to adapt
            # the object
            adapter_cls = get_adapter_cls_from_hardware_object(getattr(self._bl, role))

            if adapter_cls:
                self._configured_adapter_dict[role] = (
                    role,
                    role,
                    adapter_cls,
                    {},
                )
            #else:
            #    logging.getLogger("MX3.HWR").debug("No adapter for % s" % role)

        print("Adapters used by MXCuBE WEB")
        print(make_table(
            ["Role", "Adapter"],
            ([[name, adapter_cls.__name__] 
             for (name, attr_path, adapter_cls, config) 
             in self._configured_adapter_dict.values()])
        ))
        
        for role, mapping in self._configured_adapter_dict.items():
            name, attr_path, adapter_cls, config = mapping
            attr = None

            try:
                attr = self._getattr_from_path(self._bl, attr_path)
                setattr(self, role, adapter_cls(attr, role, app=self._application, **dict(config)))
                logging.getLogger("MX3.HWR").info("Added adapter for %s" % role)
            except:
                logging.getLogger("MX3.HWR").exception("Could not add adapter for %s" % role)
                logging.getLogger("MX3.HWR").info("%s not available" % role)
                setattr(self, role, AdapterBase(None, "", app=self._application))

        if workflow:
            workflow.connect("parametersNeeded", self.wf_parameters_needed)

    def _import_adapter_cls(self, adapter_cls_str):
        adapter_mod = importlib.import_module(
            f"mxcube3.core.adapter.{utils.str_to_snake(adapter_cls_str)}"
        )
        return getattr(adapter_mod, adapter_cls_str)

    def _getattr_from_path(self, obj, attr):
        """Recurses through an attribute chain to get the attribute."""
        return reduce(getattr, attr.split("."), obj)

    def wf_parameters_needed(self, params):
         self._application.server.emit(
            "workflowParametersDialog", params, broadcast=True, namespace="/hwr"
        )

    def get_object(self, name):
        return getattr(self, name)

    def dict(self):
        """
        Build dictionary value-representation for each beamline attribute
         Returns:
           (dict): The dictionary.
        """
        attributes = {}

        for attr_name in self._configured_adapter_dict:
            try:
                _d = getattr(self, attr_name).dict()
                attributes.update({attr_name: _d})
            except Exception:
                logging.getLogger("MX3.HWR").exception(
                    "Failed to get dictionary representation of %s" % attr_name
                )

                # Create an empty AdapterBase to provide front end
                # with defualt values
                _d = AdapterBase(None, "", app=self._application).dict()
                attributes.update({attr_name: _d})

        return {"attributes": attributes}

    def get_available_methods(self):
        """
        Get the available methods.
        Returns:
            (list): The methods.
        """
        return self._bl.available_methods

    def get_available_elements(self):
        escan = self._bl.energy_scan
        elements = []

        if escan:
            elements = escan.get_elements()

        return {"elements": elements}

    def get_acquisition_limit_values(self):
        """
        Get the limits for the acquisition parameters.
        Returns:
            (dict): The limits.
        """
        _limits = self._bl.get_acquisition_limit_values()
        limits = {}

        for key, value in _limits.items():
            if isinstance(value, str) and "," in value:
                try:
                    limits[key] = list(map(float, _limits[key].split(",")))
                except BaseException:
                    msg = "[BEAMLINE_ADAPTER] Could not get limits for %s," % key
                    msg += " using -10000, 10000"
                    logging.getLogger("MX3.HWR").info(msg)
                    limits[key] = [-10000, 10000]
            else:
                limits[key] = value

        return limits