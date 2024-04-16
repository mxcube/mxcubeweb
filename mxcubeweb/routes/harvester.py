import json
import logging
from flask import Blueprint, jsonify, request

from mxcubecore import HardwareRepository as HWR


# Disabling C901 function is too complex (19)
def init_route(app, server, url_prefix):  # noqa: C901
    bp = Blueprint("harvester", __name__, url_prefix=url_prefix)

    @bp.route("/crystal_list", methods=["GET"])
    @server.restrict
    def get_crystal_list():
        app.harvester.get_crystal_list()
        return jsonify(app.harvester.get_harvester_contents())

    @bp.route("/harvester_state", methods=["GET"])
    @server.restrict
    def get_harvester_state():
        state = HWR.beamline.harvester.get_status().upper()
        return jsonify({"state": state})

    @bp.route("/get_harvester_initial_state", methods=["GET"])
    @server.restrict
    def get_harvester_initial_state():
        return jsonify(app.harvester.get_initial_state())

    @bp.route("/contents", methods=["GET"])
    @server.restrict
    def get_harvester_contents_view():
        return jsonify(app.harvester.get_harvester_contents())

    @bp.route("/harvest", methods=["POST"])
    @server.require_control
    @server.restrict
    def harvest_crystal():
        try:
            data = json.loads(request.data)
            app.harvester.harvest_crystal(data)
        except Exception as ex:
            logging.getLogger("user_level_log").exception("Cannot Harvest Crystal")
            resp = (
                "Cannot Harvest Crystal",
                409,
                {"Content-Type": "application/json", "message": str(ex)},
            )
            return resp

        return jsonify(app.harvester.get_harvester_contents())

    @bp.route("/harvest_and_mount", methods=["POST"])
    @server.require_control
    @server.restrict
    def harvest_and_mount_sample():
        try:
            data = json.loads(request.data)
            app.harvester.harvest_and_mount_sample(data)
        except Exception as ex:
            resp = (
                "Cannot Harvest or Mount Sample",
                409,
                {"Content-Type": "application/json", "message": str(ex)},
            )
            return resp

        return jsonify(app.harvester.get_harvester_contents())

    @bp.route("/calibrate", methods=["GET"])
    @server.require_control
    @server.restrict
    def calibrate():
        ret = app.harvester.calibrate_pin()
        if ret:
            return jsonify(app.harvester.get_harvester_contents())

    @bp.route("/send_data_collection_info_to_crims", methods=["GET"])
    @server.require_control
    @server.restrict
    def send_data_collection_info_to_crims():
        ret = app.harvester.send_data_collection_info_to_crims()
        if ret:
            return jsonify(app.harvester.get_harvester_contents())

    @bp.route("/validate_calibration", methods=["POST"])
    @server.restrict
    def validate_calibration():
        validated = json.loads(request.data)
        if validated:
            app.harvester.validate_calibration()
        else:
            app.harvester.cancel_calibration()

        return jsonify(app.harvester.get_harvester_contents())

    @bp.route("/send_command/<cmdparts>/<args>", methods=["GET"])
    @server.require_control
    @server.restrict
    def send_ha_command(cmdparts, args=None):
        try:
            if cmdparts == "set_room_temperature_mode":
                value = True if args in ["true", "True", "TRUE", "1"] else False
                HWR.beamline.harvester_maintenance.send_command(cmdparts, value)
                # Temporary set MD and SC Temperature mode at the same time
                HWR.beamline.sample_changer.set_room_temperature_mode(value)
                HWR.beamline.diffractometer.set_room_temperature_mode(value)
            else:
                HWR.beamline.harvester_maintenance.send_command(cmdparts, args)
        except Exception as ex:
            logging.getLogger("user_level_log").exception(
                f"Cannot execute command{cmdparts}"
            )
            msg = str(ex)
            msg = msg.replace("\n", " - ")
            return (
                "Cannot execute command",
                406,
                {"Content-Type": "application/json", "message": msg},
            )
        else:
            return jsonify(
                response=f"executed command {cmdparts}",
                contents=app.harvester.get_harvester_contents(),
            )

    return bp
