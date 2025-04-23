import json

from flask import Blueprint, Response, jsonify, request

from mxcubecore import HardwareRepository as HWR


def init_route(app, server, url_prefix):
    bp = Blueprint("diffractometer", __name__, url_prefix=url_prefix)

    @bp.route("/phase", methods=["GET"])
    @server.restrict
    def get_phase():
        """
        Retrieve the current phase in the diffractometer.
            :response Content-type: application/json, example:
                {'current_phase': 'Centring'},
                available phases: [Centring, BeamLocation, DataCollection,
                                Transfer]
            :statuscode: 200: no error
            :statuscode: 409: error
        """
        data = {"current_phase": HWR.beamline.diffractometer.get_current_phase()}
        resp = jsonify(data)
        resp.status_code = 200
        return resp

    @bp.route("/phaselist", methods=["GET"])
    @server.restrict
    def get_phase_list():
        """
        Retrieve the available phases in the diffractometer.
            :response Content-type: application/json,
                example: {'phase_list': [Centring, BeamLocation, DataCollection,
                                        Transfer]}
            :statuscode: 200: no error
            :statuscode: 409: error
        """
        resp = jsonify({"current_phase": HWR.beamline.diffractometer.get_phase_list()})
        resp.status_code = 200
        return resp

    @bp.route("/phase", methods=["PUT"])
    @server.require_control
    @server.restrict
    def set_phase():
        """
        Set the phase in the diffractometer.
            :request Content-type: application/json, an object containing
                the new phase as string, e.g. {'phase': 'Centring'}.
                [Centring, BeamLocation, DataCollection, Transfer]
            :statuscode: 200: no error
            :statuscode: 409: error
        """
        params = request.data
        params = json.loads(params)
        phase = params["phase"]
        app.beamline.diffractometer_set_phase(phase)
        return Response(status=200)

    @bp.route("/rex_position",methods=["GET"])
    @server.restrict
    def get_rex_position():
        """
        Retrieve the current REX cold head position.
            :request Content-type: application/json, example:
                {'current_rex_position':'Cryo_In'},
                available positions: [Cryo_In, Cryo_Back, Park, Humidifier]
            :statuscode: 200: no error
            :statuscode: 409: error
        """
        try:
            current_position = HWR.beamline.diffractometer.get_cold_head_state()
            data = {"current_rex_position": current_position}
            print("-----------------------------------------------------")
            print(data)
            print("-----------------------------------------------------")
            resp = jsonify(data)
            resp.status_code = 200
            return resp
        except Exception as e:
            resp = jsonify({"message":  f"Failed to get REXposition: {str(e)}"})
            resp.status_code = 409
            return resp

    @bp.route("/rex_position", methods=["GET"])
    @server.restrict
    def get_rex_position_list():
        """
        Retrieve the current REX cold head position.
            :request Content-type: application/json, example:
                {'rex_position_list':['Cryo_In', 'Cryo_Back', 'Park', 'Humidifier']},
            :statuscode: 200: no error
            :statuscode: 409: error
        """
        try:
            position_list = ['CRYO_IN','CRYO_BACK','PARK','HUMIDIFIER']
            resp = jsonify({"rex_position_list": position_list})
            resp.status_code = 200
            return resp
        except Exception as e:
            resp = jsonify({"message": f"Failed to get REX position list: {str(e)}"})
            resp.status_code = 409
            return resp

    @bp.route("/rex_position", methods=["PUT"])
    @server.require_control
    @server.restrict
    def set_rex_position():
        """
        Set the REX cold head postion.
            :request Content-type: application/json, an object containing
                the new position as string, e.g. {'position': 'Cryo_In'}.
                Available position: [Cryo_In, Cryo_Back, Park, Humidifier]
            :statuscode: 200: no error
            :statuscode: 409: error
        """
        try:
            params = request.get_json()
            position = params["position"].upper()
            valid_positions = ["CRYO_IN", "CRYO_BACK", "PARK", "HUMIDIFIER"]
            if position not in valid_positions:
                return jsonify({"error":f"Invalid position:{position}. Valid positions are {valid_positions}"}), 400
            HWR.beamline.diffractometer.switch_cold_head(position)
            return jsonify({"status": "success"}), 200
        except Exception as e:
            resp = jsonify({"message": f"Failed to set REX position: {str(e)}"}), 409

    @bp.route("/platemode", methods=["GET"])
    @server.restrict
    def md_in_plate_mode():
        """
        md_in_plate_mode: check if diffractometer is in plate mode or not
        data = {"md_in_plate_mode": } True /False
        return_data: data plus error code 200/409
        """
        md_in_plate_mode = HWR.beamline.diffractometer.in_plate_mode()
        resp = jsonify({"md_in_plate_mode": md_in_plate_mode})
        resp.status_code = 200
        return resp

    # @bp.route("/movables/state", methods=["GET"])
    # @server.restrict
    # def get_movables_state():
    #     ret = utils.get_centring_motors_info()
    #     ret.update(utils.get_light_state_and_intensity())
    #     resp = jsonify(ret)
    #     resp.status_code = 200
    #     return resp

    @bp.route("/aperture", methods=["PUT"])
    @server.require_control
    @server.restrict
    def set_aperture():
        """
        Move the aperture motor.
            :request Content-type: application/json, new position {'diameter': 50}.
                Note: level specified as integer (not 'Diameter 50')
            :statuscode: 200: no error
            :statuscode: 409: error
        """
        params = request.data
        params = json.loads(params)
        new_pos = params["diameter"]
        app.beamline.set_aperture(new_pos)

        return Response(status=200)

    @bp.route("/aperture", methods=["GET"])
    @server.restrict
    def get_aperture():
        ret = {}

        aperture_list, current_aperture = app.beamline.get_aperture()

        ret.update({"apertureList": aperture_list, "currentAperture": current_aperture})

        resp = jsonify(ret)
        resp.status_code = 200
        return resp

    @bp.route("/info", methods=["GET"])
    @server.restrict
    def get_diffractometer_info():
        resp = jsonify(app.beamline.diffractometer_get_info())
        resp.status_code = 200
        return resp

    return bp
