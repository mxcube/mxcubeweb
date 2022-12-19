# import json
import sys
import logging

# import types

import typing
import spectree

from flask import Blueprint, Response, jsonify, request, make_response

from mxcube3.core.adapter.adapter_base import ActuatorAdapterBase

from mxcubecore import HardwareRepository as HWR


def create_get_route(app, server, bp, adapter, attr, name):
    atype = adapter.adapter_type.lower()
    func = getattr(adapter, attr)
    get_type_hint = typing.get_type_hints(func)

    if "return" in get_type_hint:
        route_url = (
            f"{atype}/{name}/<string:name>" if name else f"{atype}/<string:name>"
        )
        endpoint = f"{atype}_get_{name}" if name else f"{atype}_get"

        @bp.route(route_url, endpoint=endpoint, methods=["GET"])
        @server.restrict
        @server.validate(resp=spectree.Response(HTTP_200=get_type_hint["return"]))
        def get_func(name):
            """
            Retrieves value of attribute < name >
            Replies with status code 200 on success and 409 on exceptions.
            """
            return jsonify(
                getattr(app.mxcubecore.get_adapter(name.lower()), attr)().dict()
            )

        get_func.__name__ = f"{atype}_get_value"


def create_set_route(app, server, bp, adapter, attr, name):
    atype = adapter.adapter_type.lower()
    func = getattr(adapter, attr)
    set_type_hint = typing.get_type_hints(func)

    if "value" in set_type_hint:
        route_url = (
            f"{atype}/{name}/<string:name>" if name else f"{atype}/<string:name>"
        )
        endpoint = f"{atype}_set_{name}" if name else f"{atype}_set"

        @bp.route(route_url, endpoint=endpoint, methods=["PUT"])
        @server.require_control
        @server.restrict
        @server.validate(json=set_type_hint["value"])
        def set_func(name, _th=set_type_hint):
            """
            Tries to set < name > to value
            Replies with status code 200 on success and 409 on exceptions.
            """
            rd = _th["value"].parse_raw(request.data)
            getattr(app.mxcubecore.get_adapter(rd.name.lower()), attr)(rd)
            return make_response("{}", 200)

        set_func.__name__ = f"{atype}_set_value"


def create_route(app, server, bp, adapter, obj, cmd_name):
    route_url = f"/{obj}/command/{cmd_name}"
    arg_schema = adapter._pydantic_model_for_command(cmd_name)

    @bp.route(route_url, endpoint=cmd_name, methods=["POST"])
    @server.require_control
    @server.restrict
    @server.validate(json=arg_schema)
    def set_func():
        """
        Tries to set < name > to value
        Replies with status code 200 on success and 409 on exceptions.
        """
        args = request.get_json()
        adapter = app.mxcubecore.get_adapter(obj.lower())
        adapter.execute_command(cmd_name, args)
        return make_response("{}", 200)

    set_func.__name__ = f"{obj}_{cmd_name}"


def add_adapter_routes(app, server, bp):
    adapter_type_list = []

    for _id, a in app.mxcubecore.adapter_dict.items():
        adapter = a["adapter"]

        # Only add the route once for each type (class) of adapter
        if adapter.adapter_type not in adapter_type_list:
            adapter_type_list.append(adapter.adapter_type)

            # All adapters, inheriting BaseAdapter have _set_value() to
            # set the value of the underlyaing hardware object and
            # data() to return a representation of the object, so we are
            # mapping these by default
            set_type_hint = typing.get_type_hints(adapter._set_value)
            data_type_hint = typing.get_type_hints(adapter.data)

            if "value" in set_type_hint:
                create_set_route(app, server, bp, adapter, "_set_value", "value")

            if "return" in data_type_hint:
                create_get_route(app, server, bp, adapter, "data", None)

            # For consitency add GET route for value even if its currently unused
            if isinstance(adapter, ActuatorAdapterBase):
                get_type_hint = typing.get_type_hints(adapter._get_value)

                if "return" in get_type_hint:
                    create_get_route(app, server, bp, adapter, "_get_value", "value")

            # Map all other functions starting with prefix get_ or set_ and
            # flagged with the @export
            for attr in dir(adapter):
                if attr.startswith("get"):
                    create_get_route(
                        app, server, bp, adapter, attr, attr.replace("get_", "")
                    )

                if attr.startswith("set"):
                    create_set_route(
                        app, server, bp, adapter, attr, attr.replace("set_", "")
                    )

        exported_methods = adapter._exported_methods()

        for cmd_name in exported_methods.keys():
            create_route(app, server, bp, adapter, _id, cmd_name)


def init_route(app, server, url_prefix):
    bp = Blueprint("beamline", __name__, url_prefix=url_prefix)

    add_adapter_routes(app, server, bp)

    @bp.route("/", methods=["GET"])
    @server.restrict
    def beamline_get_all_attributes():
        return jsonify(app.beamline.beamline_get_all_attributes())

    # @bp.route("/<string:obj>/command/<string:name>", methods=["POST"])
    # @server.restrict
    # def execute_command(obj, name):
    #     params = request.get_json()
    #     adapter = app.mxcubecore.get_adapter(obj.lower())
    #     adapter._ho.pydantic_model[name].validate(**params["args"])
    #     adapter.execute_command(name, params["args"])
    #     return make_response("{}", 200)

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
            app.beamline.beamline_abort_action(name)
        except Exception:
            err = str(sys.exc_info()[1])
            return make_response(err, 520)
        else:
            logging.getLogger("user_level_log").error("%s, aborted" % name)
            return make_response("{}", 200)

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
            app.beamline.beamline_run_action(name, params)
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
        return jsonify(app.beamline.get_beam_info())

    @bp.route("/datapath", methods=["GET"])
    @server.restrict
    def beamline_get_data_path():
        """
        Retrieve data directory from the session hwobj,
        this is specific for each beamline.
        """
        data = HWR.beamline.session.get_base_image_directory()
        return jsonify({"path": data})

    @bp.route("/prepare_beamline", methods=["PUT"])
    @server.require_control
    @server.restrict
    def prepare_beamline_for_sample():
        """
        Prepare the beamline for a new sample.
        """
        try:
            app.beamline.prepare_beamline_for_sample()
        except Exception:
            msg = "Cannot prepare the Beamline for a new sample"
            logging.getLogger("HWR").error(msg)
            return Response(status=200)
        return Response(status=200)

    return bp
