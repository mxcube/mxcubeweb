import json

from flask import (
    Blueprint,
    Response,
    jsonify,
    request,
)


def init_route(app, server, url_prefix):
    bp = Blueprint("diffractometer", __name__, url_prefix=url_prefix)

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

    @bp.route("/info", methods=["GET"])
    @server.restrict
    def get_diffractometer_info():
        resp = jsonify(app.beamline.diffractometer_get_info())
        resp.status_code = 200
        return resp

    return bp
