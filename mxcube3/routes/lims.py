# -*- coding: utf-8 -*-
from flask import jsonify
from mxcube3 import app as mxcube
from . import limsutils

@mxcube.route("/mxcube/api/v0.1/lims/samples/<proposal_id>")
def proposal_samples(proposal_id):
    # session_id is not used, so we can pass None as second argument to
    # 'db_connection.get_samples'
    lims_samples = mxcube.db_connection.get_samples(proposal_id, None)
    samples_info_list = [limsutils.convert_to_dict(x) for x in lims_samples]

    for sample_info in samples_info_list:
        sample_info["limsID"] = sample_info.pop("sampleId")
        sample_info["limsLink"] = mxcube.rest_lims.sample_link()
        
        try:
            basket = int(sample_info["containerSampleChangerLocation"])
        except (TypeError, ValueError):
            continue
        else:
            if mxcube.sample_changer.__class__.__TYPE__ == 'Robodiff':
                cell = int(round((basket+0.5)/3.0))
                puck = basket-3*(cell-1)
                sample_info["containerSampleChangerLocation"] = "%d:%d" % (cell, puck)

    return jsonify({"samples_info": samples_info_list})
