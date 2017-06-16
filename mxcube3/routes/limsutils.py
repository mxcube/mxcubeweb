# -*- coding: utf-8 -*-
import types
import logging

import queue_model_objects_v1 as qmo

from mxcube3 import app as mxcube


def lims_login(loginID, password):
    """
    :param str loginID: Username
    :param str password: Password
    :returns dict: On the format:

      {'status': { 'code': 'ok', 'msg': msg }, 'Proposal': proposal,
      'session': todays_session,
      'local_contact': local_contact,
      'person': Person,
      'laboratory': Laboratory}
    """
    login_res = {}

    try:
        login_res = mxcube.db_connection.login(loginID, password)
    except:
        logging.getLogger('HWR').info('[LIMS] Could not login to LIMS')
        return login_res

    try:
        mxcube.rest_lims.authenticate(loginID, password)
    except:
        logging.getLogger('HWR').info('[LIMS-REST] Could not authenticate')
        return login_res

    return login_res


def update_mxcube_session(login_id, login_res):
    proplist = mxcube.rest_lims.get_proposals_by_user(login_id)
    proposal_code = login_res['Proposal']['code']
    proposal_number = login_res['Proposal']['number']

    # Temporary fix until we have the user have the possibility to select
    # proposal. If there is a proposal in the list use the first one,
    # Otherwise use the one returned by db_connection.login
    if proplist:
        session_id = proplist[0]['Proposal']['number']
    else:
        session_id = login_res['session']['session']['sessionId']

    mxcube.session.proposal_code = proposal_code
    mxcube.session.proposal_number = proposal_number
    mxcube.session.session_id = session_id


def get_default_prefix(sample_data, generic_name):
    sample = qmo.Sample()
    sample.code = sample_data.get("code", "")
    sample.name = sample_data.get("sampleName", "")
    sample.location = sample_data.get("location", "").split(':')
    sample.crystals[0].protein_acronym = sample_data.get("proteinAcronym", "")

    return mxcube.session.get_default_prefix(sample, generic_name)


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
