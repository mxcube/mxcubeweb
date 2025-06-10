import logging

from flask import (
    Blueprint,
    Response,
    jsonify,
    request,
)


def init_route(app, server, url_prefix):
    bp = Blueprint("lims", __name__, url_prefix=url_prefix)

    @bp.route("/synch_samples", methods=["POST"])
    @server.restrict
    def proposal_samples():
        try:
            lims_name = request.get_json().get("lims", None)
            res = jsonify(app.lims.synch_with_lims(lims_name))
        except Exception:
            logging.getLogger("MX3.HWR").exception("Could not synchronize with Lims")
            res = (
                "Could not synchronize with LIMS",
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
