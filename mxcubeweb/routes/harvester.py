import json
import logging

from flask import (
    Blueprint,
    jsonify,
    request,
)
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
            crystal_uuid = json.loads(request.data)
            HWR.beamline.harvester.harvest_crystal(crystal_uuid)
        except Exception:
            logging.getLogger("MX3.HWR").exception("Cannot Harvest Crystal")
            return (
                "Cannot Harvest Crystal",
                409,
                {"Content-Type": "application/json"},
            )

        return jsonify(app.harvester.get_harvester_contents())

    @bp.route("/harvest_and_mount", methods=["POST"])
    @server.require_control
    @server.restrict
    def harvest_and_mount_sample():
        try:
            crystal_uuid = json.loads(request.data)
            sample = app.harvester.get_sample_by_id(crystal_uuid)
            HWR.beamline.sample_changer.harvest_and_mount_sample(
                crystal_uuid, sample["sampleID"]
            )
        except Exception:
            logging.getLogger("MX3.HWR").exception("Cannot Harvest or mount Crystal")
            return (
                "Cannot Harvest or Mount Sample",
                409,
                {"Content-Type": "application/json"},
            )
        app.harvester.init_signals()
        return jsonify(app.harvester.get_harvester_contents())

    @bp.route("/calibrate", methods=["GET"])
    @server.require_control
    @server.restrict
    def calibrate():
        ret = HWR.beamline.harvester_maintenance.calibrate_pin()
        if ret:
            return jsonify(app.harvester.get_harvester_contents())
        return None

    @bp.route("/send_data_collection_info_to_crims", methods=["GET"])
    @server.require_control
    @server.restrict
    def send_data_collection_info_to_crims():
        ret = app.harvester.send_data_collection_info_to_crims()
        if ret:
            return jsonify(app.harvester.get_harvester_contents())
        return None

    @bp.route("/validate_calibration", methods=["POST"])
    @server.restrict
    def validate_calibration():
        validated = json.loads(request.data)
        if validated:
            HWR.beamline.harvester_maintenance.validate_calibration()
        else:
            HWR.beamline.harvester.set_calibration_state(False)
            logging.getLogger("user_level_log").warning("Pin Calibration Canceled")

        return jsonify(app.harvester.get_harvester_contents())

    @bp.route("/send_command/<cmdparts>/<args>", methods=["GET"])
    @server.require_control
    @server.restrict
    def send_ha_command(cmdparts, args=None):
        try:
            if cmdparts == "set_room_temperature_mode":
                value = args in ["true", "True", "TRUE", "1"]
                HWR.beamline.harvester_maintenance.send_command(cmdparts, value)
                # Temporary set MD and SC Temperature mode at the same time
                HWR.beamline.sample_changer.set_room_temperature_mode(value)
                HWR.beamline.diffractometer.set_room_temperature_mode(value)
            else:
                HWR.beamline.harvester_maintenance.send_command(cmdparts, args)
        except Exception:
            logging.getLogger("MX3.HWR").exception(
                "Cannot execute command %s", cmdparts
            )
            return (
                "Cannot execute command",
                406,
                {"Content-Type": "application/json"},
            )
        else:
            return jsonify(
                response=f"executed command {cmdparts}",
                contents=app.harvester.get_harvester_contents(),
            )

    return bp
