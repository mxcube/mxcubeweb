# -*- coding: utf-8 -*-
import types
from mxcube3 import app as mxcube


def lims_login(loginID, password):
    loginRes = mxcube.db_connection.login(loginID, password)

    limsSession = mxcube.db_connection.get_todays_session(loginRes)
 
    mxcube.session.session_id = limsSession['session']['sessionId']
    mxcube.session.proposal_code = loginRes['Proposal']['code']
    mxcube.session.proposal_number = loginRes['Proposal']['number']

    mxcube.rest_lims.authenticate(loginID, password)

    return loginRes


def get_default_prefix(sample_data, generic_name):
    sample = qmo.Sample()
    sample.code = sample_data.code
    sample.name = sample_data.sampleName
    sample.location = sample_data.split(':')
    sample.crystals[0].protein_acronym = sample_data.proteinAcronym
    
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


    
    
    
