import logging

from flask import (
    Blueprint,
    Response,
    jsonify,
    request,
)


def init_route(app, server, url_prefix):
    bp = Blueprint("lims", __name__, url_prefix=url_prefix)

    @bp.route("/lims_samples", methods=["GET"])
    @server.restrict
    def get_proposal_samples():
        try:
            lims_name = request.args.get("lims")
            res = jsonify(app.lims.get_lims_samples(lims_name))
        except Exception:
            logging.getLogger("MX3.HWR").exception("Could not get Lims samples")
            res = (
                "Could not get Lims samples",
                409,
                {
                    "Content-Type": "application/json",
                },
            )

        return res

    @bp.route("/proposal", methods=["POST"])
    @server.restrict
    def set_proposal():
        """
        Set the selected proposal.
        """
        # proposal_number is the session identifier
        session_id = request.get_json().get("proposal_number", None)
        app.lims.select_session(session_id)
        app.usermanager.update_active_users()

        return Response(status=200)

    @bp.route("/proposal", methods=["GET"])
    @server.restrict
    def get_proposal():
        """
        Return the currently selected proposal.
        (The proposal list is part of the login_res)
        """
        return jsonify({"Proposal": app.lims.get_proposal_info()})

    return bp
