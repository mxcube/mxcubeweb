# -*- coding: utf-8 -*-
import types
import sys
import logging
import copy

import queue_model_objects_v1 as qmo

from mxcube3 import app as mxcube
from flask import session

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

    try:
        mxcube.rest_lims.authenticate(loginID, password)
    except:
        logging.getLogger('HWR').error('[LIMS-REST] Could not authenticate')
        return dict({'status': {'code': '0'}})

    if mxcube.db_connection.loginType.lower() == 'user':
        # soap will autocreate a session if empty, this is the only reason for this
        # login_res = mxcube.db_connection.login(loginID, password)
        # the rest interface does not create session, but the soap login only returns one proposal
        # if we auth by username we need all the associated proposals for later select

        try:
            proposals = mxcube.db_connection.get_proposals_by_user(loginID)
            logging.getLogger('HWR').info('[LIMS] Retrieving proposal list for user: %s, proposals: %s' % (loginID, proposals))
            session['proposal_list'] = copy.deepcopy(proposals)
        except:
            logging.getLogger('HWR').error('[LIMS] Could not retreive proposal list, %s' % sys.exc_info()[1])
            return dict({'status': {'code': '0'}})
        for prop in session['proposal_list']:
            # if len(prop['Session']) == 0:
            todays_session = mxcube.db_connection.get_todays_session(prop)
            prop['Session'] = [todays_session]
            # elif not prop['Session'][0]['scheduled']:
            #     todays_session = mxcube.db_connection.get_todays_session(prop)
            #     prop['Session'] = [todays_session]

    	# append a dummy proposal data so staff can select instead of their own research
        if hasattr(mxcube.session, 'commissioning_fake_proposal') and mxcube.session.is_inhouse(loginID, None):
            dummy = mxcube.session.commissioning_fake_proposal
    	    session['proposal_list'].append(dummy)

        login_res['proposalList'] = session['proposal_list']
        login_res['status'] = {"code": "ok", "msg": "Successful login"}

    else:
        try:
            aux = mxcube.db_connection.login(loginID, password)
            status = aux['status']
            aux = mxcube.db_connection.get_proposal(
                 aux['Proposal']['code'], aux['Proposal']['number'])
        except:
            logging.getLogger('HWR').error('[LIMS] Could not login to LIMS')
            return dict({'status': {'code': '0'}})

        login_res['proposalList'] = [aux]
        login_res['status'] = status
        session['proposal_list'] = [aux]

    logging.getLogger('HWR').info('[LIMS] Logged in, proposal data: %s' % login_res)

    return login_res


def get_proposal_info(proposal):
    """
    Search for the given proposal in the proposal list.
    """
    for prop in session.get('proposal_list', []):

        _p = "%s%s" % (prop.get('Proposal').get('code', ''),
                       prop.get('Proposal').get('number', ''))

        if _p == proposal.lower():
            return prop

    return {}


def select_proposal(proposal):
    proposal_info = get_proposal_info(proposal)
    logging.getLogger('HWR').info("[LIMS] Selecting proposal: %s" % proposal)
    logging.getLogger('HWR').info("[LIMS] Proposal info: %s" % proposal_info)
    if mxcube.db_connection.loginType.lower() == 'user' and 'Commissioning' in proposal_info['Proposal']['title']:
        if hasattr(mxcube.session, 'set_in_commissioning'):
            mxcube.session.set_in_commissioning(proposal_info)
    	    logging.getLogger('HWR').info("[LIMS] Commissioning proposal flag set.")

    if proposal_info:
        mxcube.session.proposal_code = proposal_info.get('Proposal').get('code', '')
        mxcube.session.proposal_number = proposal_info.get('Proposal').get('number', '')
        mxcube.session.session_id = proposal_info.get('Session')[0].get('sessionId')

        if hasattr(mxcube.session, 'prepare_directories'):
            try:
                logging.getLogger('HWR').info('[LIMS] Creating data directories for proposal %s'
                                              % proposal)
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
