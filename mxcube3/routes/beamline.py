import json
import sys
import logging

import types

import typing
import spectree

from flask import Blueprint, Response, jsonify, request, make_response

from mxcube3.core import beamlineutils
from mxcube3.core.models import HOActuatorModel, HOActuatorValueChangeModel


def create_get_route(mxcube, server, bp, adapter, func, name):
    atype = adapter.adapter_type.lower()
    get_type_hint = typing.get_type_hints(func)

    if "return" in get_type_hint:
        if adapter._unique:
            route_url = f"{atype}/{name}" if name else f"{atype}"
        else:
            route_url = f"{atype}/{name}/<string:name>" if name else f"{atype}/<string:name>"

        endpoint = f"{atype}_get_{name}" if name else f"{atype}_get"

        @bp.route(route_url, endpoint=endpoint, methods=["GET"])
        @server.restrict
        @server.validate(resp=spectree.Response(HTTP_200=get_type_hint["return"]), tags=["beamline"])
        def get_func(name):
            """
            Retrieves value of attribute < name > 
            Replies with status code 200 on success and 409 on exceptions.
            """
            return jsonify(mxcube.mxcubecore.get_adapter(name.lower()).dict())

        get_func.__name__ = f"{atype}_get_value"


def create_set_route(mxcube, server, bp,adapter, func, name):
    atype = adapter.adapter_type.lower()
    set_type_hint = typing.get_type_hints(func)

    if "value" in set_type_hint:
        if adapter._unique:
            route_url = f"{atype}/{name}" if name else f"{atype}"
        else:
            route_url = f"{atype}/{name}/<string:name>" if name else f"{atype}/<string:name>"

        endpoint = f"{atype}_set_{name}" if name else f"{atype}_set"

        @bp.route(route_url, endpoint=endpoint, methods=["PUT"])
        @server.require_control
        @server.restrict
        @server.validate(json=set_type_hint["value"], tags=["beamline"])
        def set_func(name, _th=set_type_hint):
            """
            Tries to set < name > to value
            Replies with status code 200 on success and 409 on exceptions.
            """
            rd = _th["value"].parse_raw(request.data)
            mxcube.mxcubecore.get_adapter(rd.name.lower()).set_value(rd)
            return make_response("{}", 200)

        set_func.__name__ = f"{atype}_set_value"


def add_adapter_routes(mxcube, server, bp):
    adapter_type_list = []

    for _id, a in mxcube.mxcubecore.adapter_dict.items():
        adapter = a["adapter"]
        atype = adapter.adapter_type.lower()

        if adapter.adapter_type not in adapter_type_list:
            adapter_type_list.append(adapter.adapter_type)

            set_type_hint = typing.get_type_hints(adapter._set_value)
            get_type_hint = typing.get_type_hints(adapter._get_value)

            if "value" in set_type_hint:
                create_set_route(mxcube, server, bp, adapter, adapter._set_value, None)

            if "return" in get_type_hint:
                create_get_route(mxcube, server, bp, adapter, adapter._get_value, None)

            for attr in dir(adapter):
                func = getattr(adapter, attr)

                if attr[0] == "_" or not hasattr(func, "_export"):
                    continue

                if attr.startswith("get"): 
                    create_get_route(mxcube, server, bp, adapter, func, attr.replace("get_", ""))
                
                if attr.startswith("set"):
                    create_set_route(mxcube, server, bp, adapter, func, attr.replace("set_", ""))
        else:
            continue


def init_route(mxcube, server, url_prefix):
    bp = Blueprint("beamline", __name__, url_prefix=url_prefix)

    add_adapter_routes(mxcube, server, bp)

    @bp.route("/", methods=["GET"])
    @server.restrict
    def beamline_get_all_attributes():
        return jsonify(beamlineutils.beamline_get_all_attributes())


    @bp.route("/<name>/abort", methods=["GET"])
    @server.require_control
    @server.restrict
    def beamline_abort_action(name):
        """
        Aborts an action in progress.

        :param str name: Owner / Actuator of the process/action to abort

        Replies with status code 200 on success and 520 on exceptions.
        """
        try:
            beamlineutils.beamline_abort_action(name)
        except Exception:
            err = str(sys.exc_info()[1])
            return make_response(err, 520)
        else:
            logging.getLogger("user_level_log").error("%s, aborted" % name)
            return make_response("", 200)


    @bp.route("/<name>/run", methods=["POST"])
    @server.require_control
    @server.restrict
    def beamline_run_action(name):
        """
        Starts a beamline action; POST payload is a json-encoded object with
        'parameters' as a list of parameters

        :param str name: action to run

        Replies with status code 200 on success and 520 on exceptions.
        """
        try:
            params = request.get_json()["parameters"]
        except Exception:
            params = []

        try:
            beamlineutils.beamline_run_action(name, params)
        except Exception as ex:
            return make_response(str(ex), 520)
        else:
            return make_response("{}", 200)


    @bp.route("/beam/info", methods=["GET"])
    @server.restrict
    def get_beam_info():
        """
        Beam information: position, size, shape
        return_data = {"position": , "shape": , "size_x": , "size_y": }
        """
        return jsonify(beamlineutils.get_beam_info())


    @bp.route("/datapath", methods=["GET"])
    @server.restrict
    def beamline_get_data_path():
        """
        Retrieve data directory from the session hwobj,
        this is specific for each beamline.
        """
        data = mxcube.mxcubecore.beamline_ho.session.get_base_image_directory()
        return jsonify({"path": data})


    @bp.route("/prepare_beamline", methods=["PUT"])
    @server.require_control
    @server.restrict
    def prepare_beamline_for_sample():
        """
        Prepare the beamline for a new sample.
        """
        try:
            beamlineutils.prepare_beamline_for_sample()
        except Exception:
            msg = "Cannot prepare the Beamline for a new sample"
            logging.getLogger("HWR").error(msg)
            return Response(status=200)
        return Response(status=200)

    return bp