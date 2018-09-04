# -*- coding: utf-8 -*-
import StringIO
import logging
from subprocess import check_output
from os.path import (isfile, join)

from flask import jsonify, Response, send_file, request, render_template
from mxcube3 import app as mxcube

import queue_model_objects_v1 as qmo

from . import limsutils
from . import qutils
from . import signals


@mxcube.route("/mxcube/api/v0.1/lims/samples/<proposal_id>", methods=['GET'])
@mxcube.restrict
def proposal_samples(proposal_id):
    # session_id is not used, so we can pass None as second argument to
    # 'db_connection.get_samples'
    lims_samples = mxcube.db_connection.get_samples(proposal_id, None)

    samples_info_list = lims_samples
    mxcube.LIMS_SAMPLE_DATA = {}

    for sample_info in samples_info_list:
        sample_info["limsID"] = sample_info.pop("sampleId")
        sample_info["limsLink"] = mxcube.rest_lims.sample_link()
        sample_info["defaultPrefix"] = limsutils.get_default_prefix(sample_info, False)
        sample_info["defaultSubDir"] = limsutils.get_default_subdir(sample_info)

        try:
            basket = int(sample_info["containerSampleChangerLocation"])
        except (TypeError, ValueError, KeyError):
            continue
        else:
            if mxcube.sample_changer.__class__.__TYPE__ in ['HCD', 'FlexHCD', 'RoboDiff']:
                cell = int(round((basket+0.5)/3.0))
                puck = basket-3*(cell-1)
                sample_info["containerSampleChangerLocation"] = "%d:%d" % (cell, puck)

        try:
            lims_location = sample_info["containerSampleChangerLocation"] + ":%02d" % int(sample_info["sampleLocation"])
        except:
            logging.getLogger('HWR').info('[LIMS] Could not parse sample loaction from LIMS, (perhaps not set ?)')
        else:
            sample_info["lims_location"] = lims_location
            limsutils.sample_list_sync_sample(sample_info)

    return jsonify(limsutils.sample_list_get())


@mxcube.route("/mxcube/api/v0.1/lims/dc/thumbnail/<image_id>", methods=['GET'])
@mxcube.restrict
def get_dc_thumbnail(image_id):
    fname, data = mxcube.rest_lims.get_dc_thumbnail(image_id)
    data = StringIO.StringIO(data)
    data.seek(0)
    return send_file(data, attachment_filename=fname, as_attachment=True)


@mxcube.route("/mxcube/api/v0.1/lims/dc/image/<image_id>", methods=['GET'])
@mxcube.restrict
def get_dc_image(image_id):
    fname, data = mxcube.rest_lims.get_dc_image(image_id)
    data = StringIO.StringIO(data)
    data.seek(0)
    return send_file(data, attachment_filename=fname, as_attachment=True)


@mxcube.route("/mxcube/api/v0.1/lims/quality_indicator_plot/<dc_id>", methods=['GET'])
@mxcube.restrict
def get_quality_indicator_plot(dc_id):
    data = mxcube.rest_lims.get_quality_indicator_plot(dc_id)
    data = StringIO.StringIO(data)
    data.seek(0)
    return send_file(data, attachment_filename="qind", as_attachment=True)


@mxcube.route("/mxcube/api/v0.1/lims/dc/<dc_id>", methods=['GET'])
@mxcube.restrict
def get_dc(dc_id):
    data = mxcube.rest_lims.get_dc(dc_id)
    return jsonify(data)


@mxcube.route("/mxcube/api/v0.1/lims/proposal", methods=['POST'])
@mxcube.restrict
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
@mxcube.restrict
def get_proposal():
    """
    Return the currently selected proposal. (The proposal list is part of the login_res)
    """
    proposal_info = limsutils.get_proposal_info(mxcube.session.proposal_code)

    return jsonify({"Proposal": proposal_info})


def run_get_result_script(script_name, url):
    return check_output(['node', script_name, url], close_fds=True)


def result_file_test(prefix):
    return isfile(join(mxcube.template_folder, prefix))


def apply_template(name, data):
    try:
        r = jsonify({"result": render_template(name, data=data)})
    except:
        r = jsonify({"result": "No results yet, processing ..."})

    return r

@mxcube.route("/mxcube/api/v0.1/lims/results", methods=['POST'])
@mxcube.restrict
def get_results():
    """
    """
    qid = request.get_json().get("qid", None)
    r =  jsonify({"result": ""})

    if qid:
        model, entry = qutils.get_entry(qid)
        data = qutils.queue_to_dict([model], True)
        signals.update_task_result(entry)

        if isinstance(model, qmo.DataCollection):
            if result_file_test('data-collection-results.js'):
                pass
            elif result_file_test('data-collection-results.html'):
                r = apply_template("data-collection-results.html", data)

        elif isinstance(model, qmo.Characterisation) or isinstance(model, qmo.Workflow):
            if result_file_test('characterisation-results.js'):
                url_list =  data["limsResultData"]["workflow_result_url_list"]

                if url_list:
                    r = jsonify({"result": run_get_result_script(join(mxcube.template_folder, 'characterisation-results.js'), url_list[0])})
                else:
                    r = apply_template("data-collection-results.html", data)

            elif result_file_test('characterisation-results.html'):
                r = apply_template("characterisation-results.html", data)

        elif isinstance(model, qmo.Workflow):
            pass
        elif isinstance(model, qmo.XRFSpectrum):
            pass
        elif isinstance(model, qmo.EnergyScan):
            pass
        else:
            pass

    return r
