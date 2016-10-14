# -*- coding: utf-8 -*-
import types
import logging

import queue_model_objects_v1 as qmo

from mxcube3 import app as mxcube


def lims_login(loginID, password):
    login_res = mxcube.db_connection.login(loginID, password)

    try:
        mxcube.session.session_id = login_res['session']['session']['sessionId']
        mxcube.session.proposal_code = login_res['Proposal']['code']
        mxcube.session.proposal_number = login_res['Proposal']['number']
    except:
        logging.getLogger('HWR').info('[LIMS] Could not get LIMS session')

    try:
        mxcube.rest_lims.authenticate(loginID, password)
    except:
        logging.getLogger('HWR').info('[LIMS-REST] Could not authenticate')

    return login_res


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
                val = [convert_to_dict(x) if type(x) == types.InstanceType else x for x in val]
            elif type(val) == types.DictType:
                val = dict([(k, convert_to_dict(x) if type(x) == types.InstanceType else x) for k, x in val.iteritems()])
            d[key] = val

    return d


    
    
    
