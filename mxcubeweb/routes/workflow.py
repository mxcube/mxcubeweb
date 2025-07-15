from flask import (
    Blueprint,
    Response,
    jsonify,
    request,
)


def init_route(app, server, url_prefix):
    bp = Blueprint("workflow", __name__, url_prefix=url_prefix)

    @bp.route("/", methods=["GET"])
    @server.restrict
    def workflow():
        return jsonify(app.workflow.get_available_workflows())

    @bp.route("/", methods=["POST"])
    @server.restrict
    def submit_parameters():
        data = request.get_json()
        app.workflow.submit_parameters(data)
        return Response(status=200)

    @bp.route("/gphl", methods=["POST"])
    @server.restrict
    def submit_gphl_parameters():
        data = request.get_json()
        app.workflow.update_gphl_parameters(data)
        return Response(status=200)

    return bp
