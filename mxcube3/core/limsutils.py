# -*- coding: utf-8 -*-
import types
import sys
import logging
import copy
import os
import StringIO
from scandir import scandir

import queue_model_objects_v1 as qmo

from mxcube3 import mxcube
from mxcube3 import blcontrol

from flask import session


def scantree(path, include):
    res = []

    try:
        res = _scantree_rec(path, include, [])
    except OSError:
        pass

    return res


def _scantree_rec(path, include=[], files=[]):
    for entry in scandir(path):
        if entry.is_dir(follow_symlinks=False):
            _scantree_rec(entry.path, include, files)
        elif entry.is_file():
            if os.path.splitext(entry.path)[1][1:] in include:
                files.append(entry.path)

    return files


def new_sample_list():
    return {"sampleList": {}, 'sampleOrder': []}


def init_sample_list():
    sample_list_set(new_sample_list())


def sample_list_set(sample_list):
    mxcube.SAMPLE_LIST = sample_list


def sample_list_set_order(sample_order):
    mxcube.SAMPLE_LIST['sampleOrder'] = sample_order


def sample_list_get(loc=None, current_queue=None):
    synch_sample_list_with_queue(current_queue)
    res = mxcube.SAMPLE_LIST

    if loc:
        res = mxcube.SAMPLE_LIST.get("sampleList").get(loc, {})

    return res


def sample_list_sync_sample(lims_sample):
    import scutils

    lims_code = lims_sample.get("code", None)
    lims_location = lims_sample.get("lims_location")
    sample_to_update = None

    # LIMS sample has code, check if the code was read by SC
    if lims_code and scutils.sc_contents_from_code_get(lims_code):
        sample_to_update = scutils.sc_contents_from_code_get(lims_code)
    elif lims_location:
        # Asume that the samples have been put in the right place of the SC
        sample_to_update = scutils.sc_contents_from_location_get(lims_location)

    if sample_to_update:
        loc = sample_to_update["sampleID"]
        sample_list_update_sample(loc, lims_sample)


def synch_sample_list_with_queue(current_queue=None):
    from mxcube3.core import qutils

    if not current_queue:
        current_queue = qutils.queue_to_dict(include_lims_data=True)

    sample_order = current_queue.get("sample_order", [])

    for loc, data in mxcube.SAMPLE_LIST["sampleList"].iteritems():
        if loc in current_queue:
            sample = current_queue[loc]

            # Don't synchronize, lims attributes from queue sample, if
            # they are already set by sc or lims
            if data.get("sampleName", ""):
                sample.pop("sampleName")

            if data.get("proteinAcronym", ""):
                sample.pop("proteinAcronym")

            # defaultSubDir and prefix are derived from proteinAcronym
            # and/or sampleName so make sure that those are removed from
            # queue sample so that they can be updated if changed.
            if data.get("proteinAcronym", "") or data.get("sampleName", ""):
                sample.pop("defaultPrefix")
                sample.pop("defaultSubDir")

            # Make sure that sample in queue is updated with lims information
            model, entry = qutils.get_entry(sample["queueID"])
            model.set_from_dict(data)

            # Update sample location, location is Manual for free pin mode
            # in MXCuBE3
            model.loc_str = data.get("sampleID", -1)
            model.free_pin_mode = data.get('location', '') == 'Manual'

            sample_list_update_sample(loc, sample)


def sample_list_update_sample(loc, sample):
    _sample = mxcube.SAMPLE_LIST["sampleList"].get(loc, {})

    # If sample exists in sample list update it, otherwise add it
    if _sample:
        _sample.update(sample)
    else:
        mxcube.SAMPLE_LIST["sampleList"][loc] = sample
        mxcube.SAMPLE_LIST["sampleOrder"].append(loc)

    return mxcube.SAMPLE_LIST["sampleList"].get(loc, {})


def apply_template(params, sample_model, path_template):
    # Apply subdir template if used:
    if '{' in params.get('subdir', ''):
        if sample_model.crystals[0].protein_acronym:
            params['subdir'] = params['subdir'].\
                format(NAME=sample_model.get_name(),
                       ACRONYM=sample_model.crystals[0].protein_acronym)
        else:
            stripped = params["subdir"][0: params["subdir"].find('{')]
            params['subdir'] = stripped + sample_model.get_name()

        # The template was only applied partially if subdir ends with '-'
        # probably because either acronym or protein name is null in LIMS
        if params['subdir'].endswith('-'):
            params['subdir'] = sample_model.get_name()

    if '{' in params.get('prefix', ''):
        sample = mxcube.SAMPLE_LIST["sampleList"].get(sample_model.loc_str, {})
        prefix = get_default_prefix(sample, False)
        shape = params["shape"] if params["shape"] > 0 else ''
        params['prefix'] = params['prefix'].format(PREFIX=prefix,
                                                   POSITION=shape)

        if params['prefix'].endswith('_'):
            params['prefix'] = params['prefix'][:-1]

    # mxcube3 passes entire prefix as prefix, including reference, mad and wedge
    # prefix. So we strip those before setting the actual base_prefix.
    params['prefix'] = strip_prefix(path_template, params['prefix'])


def strip_prefix(pt, prefix):
    """
    Strips the reference, wedge and mad prefix from a given prefix. For example
    removes ref- from the beginning and _w[n] and -pk, -ip, -ipp from the end.

    :param PathTemplate pt: path template used to create the prefix
    :param str prefix: prefix from the client
    :returns: stripped prefix
    """
    if pt.reference_image_prefix and \
       pt.reference_image_prefix == prefix[0:len(pt.reference_image_prefix)]:
        prefix = prefix[len(pt.reference_image_prefix) + 1:]

    if pt.wedge_prefix and pt.wedge_prefix == prefix[-len(pt.wedge_prefix):]:
        prefix = prefix[:-(len(pt.wedge_prefix) + 1)]

    if pt.mad_prefix and pt.mad_prefix == prefix[-len(pt.mad_prefix):]:
        prefix = prefix[:-(len(pt.mad_prefix) + 1)]

    return prefix


def lims_existing_session(login_res):
    return not login_res.get("Session", {}).get("new_session_flag", True)


def lims_is_inhouse(login_res):
    return login_res.get("Session", {}).get("is_inhouse", False)


def lims_valid_login(login_res):
    return login_res['status']['code'] == 'ok'


def lims_login(loginID, password):
    """
    :param str loginID: Username
    :param str password: Password
    :returns dict: On the format:

      {'status': { 'code': 'ok', 'msg': msg },
      'proposalList':[]
      }
    """
    login_res = {}

    # If this is used often, it could be moved to a better place.
    ERROR_CODE = dict({'status': {'code': '0'}})

    try:
        blcontrol.rest_lims.authenticate(loginID, password)
    except:
        logging.getLogger('MX3.HWR').error(
            '[LIMS-REST] Could not authenticate')
        return ERROR_CODE

    if blcontrol.db_connection.loginType.lower() == 'user':
        try:
            connection_ok = blcontrol.db_connection.echo()
            if not connection_ok:
                blcontrol.db_connection.init()
        except:
            msg = '[LIMS] Connection Error!'
            logging.getLogger('MX3.HWR').error(msg)
            return ERROR_CODE

        try:

            proposals = blcontrol.db_connection.get_proposals_by_user(loginID)

            logging.getLogger('MX3.HWR').info(
                '[LIMS] Retrieving proposal list for user: %s, proposals: %s' % (loginID, proposals))
            session['proposal_list'] = copy.deepcopy(proposals)
        except:
            logging.getLogger('MX3.HWR').error(
                '[LIMS] Could not retreive proposal list, %s' % sys.exc_info()[1])
            return ERROR_CODE

        for prop in session['proposal_list']:
            todays_session = blcontrol.db_connection.get_todays_session(prop)
            prop['Session'] = [todays_session['session']]

        if hasattr(blcontrol.session, 'commissioning_fake_proposal') and blcontrol.session.is_inhouse(loginID, None):
            dummy = blcontrol.session.commissioning_fake_proposal
            session['proposal_list'].append(dummy)

        login_res['proposalList'] = session['proposal_list']
        login_res['status'] = {"code": "ok", "msg": "Successful login"}

    else:
        try:
            login_res = blcontrol.db_connection.login(loginID, password)
            proposal = blcontrol.db_connection.\
                get_proposal(login_res['Proposal']['code'],
                             login_res['Proposal']['number'])

        except:
            logging.getLogger('MX3.HWR').error(
                '[LIMS] Could not login to LIMS')
            return ERROR_CODE

        session['proposal_list'] = [proposal]
        login_res['proposalList'] = [proposal]

    logging.getLogger('MX3.HWR').info(
        '[LIMS] Logged in, proposal data: %s' % login_res)

    return login_res


def get_proposal_info(proposal):
    """
    Search for the given proposal in the proposal list.
    """
    from loginutils import users

    for user in users().itervalues():
        logging.getLogger('MX3.HWR').info(
            "[LIMS] Serching for proposal: %s" % proposal)
        for prop in user["limsData"].get('proposalList', []):
            _p = "%s%s" % (prop.get('Proposal').get('code', '').lower(),
                           prop.get('Proposal').get('number', ''))

            if _p == proposal.lower():
                return prop

    return {}


def select_proposal(proposal):
    proposal_info = get_proposal_info(proposal)

    logging.getLogger('MX3.HWR').info(
        "[LIMS] Selecting proposal: %s" % proposal)
    logging.getLogger('MX3.HWR').info(
        "[LIMS] Proposal info: %s" % proposal_info)
    if blcontrol.db_connection.loginType.lower() == 'user' and 'Commissioning' in proposal_info['Proposal']['title']:
        if hasattr(blcontrol.session, 'set_in_commissioning'):
            blcontrol.session.set_in_commissioning(proposal_info)
            logging.getLogger('MX3.HWR').info(
                "[LIMS] Commissioning proposal flag set.")

    if proposal_info:
        blcontrol.session.proposal_code = proposal_info.get(
            'Proposal').get('code', '')
        blcontrol.session.proposal_number = proposal_info.get(
            'Proposal').get('number', '')
        blcontrol.session.session_id = proposal_info.get('Session')[
            0].get('sessionId')

        session['proposal'] = proposal_info

        if hasattr(blcontrol.session, 'prepare_directories'):
            try:
                logging.getLogger('MX3.HWR').info('[LIMS] Creating data directories for proposal %s'
                                                  % proposal)
                blcontrol.session.prepare_directories(proposal_info)
            except:
                logging.getLogger('MX3.HWR').info('[LIMS] Error creating data directories, %s'
                                                  % sys.exc_info()[1])

        # Get all the files in the root data dir for this user
        root_path = blcontrol.session.get_base_image_directory()

        if not mxcube.INITIAL_FILE_LIST and os.path.isdir(root_path):
            ftype = blcontrol.beamline.detector_hwobj.getProperty(
                'file_suffix')
            mxcube.INITIAL_FILE_LIST = scantree(root_path, [ftype])

        logging.getLogger('user_log').info('[LIMS] Proposal selected.')

        return True
    else:
        return False


def get_default_prefix(sample_data, generic_name):
    if isinstance(sample_data, dict):
        sample = qmo.Sample()
        sample.code = sample_data.get("code", "")
        sample.name = sample_data.get("sampleName", "").replace(':', '-')
        sample.location = sample_data.get("location", "").split(':')
        sample.lims_id = sample_data.get("limsID", -1)
        sample.crystals[0].protein_acronym = sample_data.get(
            "proteinAcronym", "")
    else:
        sample = sample_data

    return blcontrol.session.get_default_prefix(sample, generic_name)


def get_default_subdir(sample_data):
    subdir = ""

    if isinstance(sample_data, dict):
        sample_name = sample_data.get("sampleName", "")
        protein_acronym = sample_data.get("proteinAcronym", "")
    else:
        sample_name = sample_data.name
        protein_acronym = sample_data.crystals[0].protein_acronym

    if protein_acronym:
        subdir = "%s/%s-%s/" % (protein_acronym, protein_acronym, sample_name)
    else:
        subdir = "%s/" % sample_name

    return subdir.replace(':', '-')


def get_dc_link(col_id):
    link = blcontrol.rest_lims.dc_link(col_id)

    if not link:
        link = blcontrol.db_connection.dc_link(col_id)

    return link


def get_dc_thumbnail(image_id):
    fname, data = blcontrol.rest_lims.get_dc_thumbnail(image_id)
    data = StringIO.StringIO(data)
    data.seek(0)

    return fname, data


def get_dc_image(image_id):
    fname, data = blcontrol.rest_lims.get_dc_image(image_id)
    data = StringIO.StringIO(data)
    data.seek(0)

    return fname, data


def get_quality_indicator_plot(dc_id):
    data = blcontrol.rest_lims.get_quality_indicator_plot(dc_id)
    data = StringIO.StringIO(data)
    data.seek(0)

    return "qind", data


def synch_with_lims(proposal_id):
    # session_id is not used, so we can pass None as second argument to
    # 'db_connection.get_samples'
    lims_samples = blcontrol.db_connection.get_samples(proposal_id, None)

    samples_info_list = lims_samples
    mxcube.LIMS_SAMPLE_DATA = {}

    for sample_info in samples_info_list:
        sample_info["limsID"] = sample_info.pop("sampleId")
        sample_info["limsLink"] = blcontrol.rest_lims.sample_link()
        sample_info["defaultPrefix"] = get_default_prefix(sample_info, False)
        sample_info["defaultSubDir"] = get_default_subdir(sample_info)

        try:
            basket = int(sample_info["containerSampleChangerLocation"])
        except (TypeError, ValueError, KeyError):
            continue
        else:
            if blcontrol.sample_changer.__class__.__TYPE__ in ['HCD', 'FlexHCD', 'RoboDiff']:
                cell = int(round((basket+0.5)/3.0))
                puck = basket-3*(cell-1)
                sample_info["containerSampleChangerLocation"] = "%d:%d" % (
                    cell, puck)

        try:
            lims_location = sample_info["containerSampleChangerLocation"] + \
                ":%02d" % int(sample_info["sampleLocation"])
        except:
            logging.getLogger('MX3.HWR').info(
                '[LIMS] Could not parse sample loaction from LIMS, (perhaps not set ?)')
        else:
            sample_info["lims_location"] = lims_location
            sample_list_sync_sample(sample_info)

    return sample_list_get()


def convert_to_dict(ispyb_object):
    d = {}

    if type(ispyb_object) == types.DictType:
        d.update(ispyb_object)
    else:
        for key in ispyb_object.__keylist__:
            val = getattr(ispyb_object, key)
            if type(val) == types.InstanceType:
                val = convert_to_dict(val)
            elif type(val) == types.ListType:
                val = [convert_to_dict(x)
                       if type(x) == types.InstanceType else x
                       for x in val]
            elif type(val) == types.DictType:
                val = dict([(k, convert_to_dict(x)
                             if type(x) == types.InstanceType else x)
                            for k, x in val.iteritems()])

            d[key] = val

    return d
