# -*- coding: utf-8 -*-
import types
import sys
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
        mxcube.rest_lims.authenticate(loginID, password)
    except:
        logging.getLogger('HWR').error('[LIMS-REST] Could not authenticate')
        return dict({'status': {'code': '0'}})

    if mxcube.db_connection.loginType.lower() == 'user':
        # the rest interface does not create session, but the soap login only returns one proposal
        # if we auth by username we need all the associated proposals for later select
        try:
            proposals = mxcube.db_connection.get_proposals_by_user(loginID)
            mxcube.session.proposal_list = proposals
        except:
            logging.getLogger('HWR').error('[LIMS] Could not retreive proposal list, %s' % sys.exc_info()[1])
            return dict({'status': {'code': '0'}})

        login_res['ProposalList'] = proposals
        login_res['status'] = {"code": "ok", "msg": "Successful login"}

    else:
        # auth by proposal, we probably do not need to select the proposal but I keep it here for testing
        # to remove later/autoselect after login or whatever
        try:
            login_res = mxcube.db_connection.login(loginID, password)
        except:
            logging.getLogger('HWR').error('[LIMS] Could not login to LIMS')
            return dict({'status': {'code': '0'}})
        login_res['ProposalList'] = [login_res['Proposal']]
        mxcube.session.proposal_list = [login_res['Proposal']]
        login_res.pop('Proposal')

    logging.getLogger('HWR').info('[LIMS] Logged in, proposal data: %s' % login_res)

    return login_res


def get_proposal_info(proposal_number):
    """
    Search for the given proposal in the proposal list.
    """
    for prop in mxcube.session.proposal_list:
        if prop.get('Proposal').get('number', '') == proposal_number:
            return prop
    return {}


def select_proposal(proposal_number):
    proposal_info = get_proposal_info(proposal_number)
    logging.getLogger('HWR').info("[LIMS] Selecting proposal: %s" % proposal_number)

    if proposal_info:
        mxcube.session.proposal_code = proposal_info.get('Proposal').get('code', '')
        mxcube.session.proposal_number = proposal_info.get('Proposal').get('number', '')
        # in this case I assume single session
        mxcube.session.session_id = proposal_info.get('Session')[0].get('sessionId')
        try:
            logging.getLogger('HWR').info('[LIMS] Creating data directories for proposal %s'
                                          % proposal_number)
            mxcube.session.prepare_directories(proposal_info)
        except:
            logging.getLogger('HWR').info('[LIMS] Error creating data directories, %s'
                                          % sys.exc_info()[1])
        return True
    else:
        return False


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
