# -*- coding: utf-8 -*-
import StringIO
import logging

from flask import jsonify, Response, send_file, request
from mxcube3 import app as mxcube
from . import limsutils
from . import qutils

@mxcube.route("/mxcube/api/v0.1/lims/samples/<proposal_id>", methods=['GET'])
def proposal_samples(proposal_id):
    # session_id is not used, so we can pass None as second argument to
    # 'db_connection.get_samples'
    lims_samples = mxcube.db_connection.get_samples(proposal_id, None)
    samples_info_list = [limsutils.convert_to_dict(x) for x in lims_samples]
    mxcube.LIMS_SAMPLE_DATA = {}

    for sample_info in samples_info_list:
        sample_info["limsID"] = sample_info.pop("sampleId")
        sample_info["limsLink"] = mxcube.rest_lims.sample_link()
        sample_info["defaultPrefix"] = limsutils.get_default_prefix(sample_info, False)
        sample_info["defaultSubDir"] = limsutils.get_default_subdir(sample_info)

        try:
            basket = int(sample_info["containerSampleChangerLocation"])
        except (TypeError, ValueError):
            continue
        else:
            if mxcube.sample_changer.__class__.__TYPE__ in ['HCD', 'FlexHCD', 'RoboDiff']:
                cell = int(round((basket+0.5)/3.0))
                puck = basket-3*(cell-1)
                sample_info["containerSampleChangerLocation"] = "%d:%d" % (cell, puck)
            
        lims_location = sample_info["containerSampleChangerLocation"] + ":%02d" % int(sample_info["sampleLocation"])
        sample_info["lims_location"] = lims_location
        limsutils.sample_list_sync_sample(sample_info)
       
    return jsonify(limsutils.sample_list_get())


@mxcube.route("/mxcube/api/v0.1/lims/dc/thumbnail/<image_id>", methods=['GET'])
def get_dc_thumbnail(image_id):
    fname, data = mxcube.rest_lims.get_dc_thumbnail(image_id)
    data = StringIO.StringIO(data)
    data.seek(0)
    return send_file(data, attachment_filename=fname, as_attachment=True)


@mxcube.route("/mxcube/api/v0.1/lims/dc/<dc_id>", methods=['GET'])
def get_dc(dc_id):
    data = mxcube.rest_lims.get_dc_(dc_id)
    return jsonify(data)


@mxcube.route("/mxcube/api/v0.1/lims/proposal", methods=['POST'])
def set_proposal():
    """
    Set the selected proposal.
    """
    content = request.get_json()
    proposal_number = content['proposal_number']
    limsutils.select_proposal(proposal_number)
    logging.getLogger('user_log').info('[LIMS] Proposal selected.')

    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/lims/proposal", methods=['GET'])
def get_proposal():
    """
    Return the currently selected proposal. (The proposal list is part of the login_res)
    """
    proposal_info = limsutils.get_proposal_info(mxcube.session.proposal_code)

    return jsonify({"Proposal": proposal_info})
