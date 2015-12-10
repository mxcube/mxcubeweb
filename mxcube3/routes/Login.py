from flask import session, redirect, url_for, render_template, request, Response, jsonify
from mxcube3 import app as mxcube
import logging
import itertools
import time
import os
import types

def convert_to_dict(ispyb_object):
    d = {}
    for key in ispyb_object.__keylist__:
      val = getattr(ispyb_object, key)
      if type(val) == types.InstanceType:
          val = convert_to_dict(val)
      elif type(val) == types.ListType:
          val = [convert_to_dict(x) if type(x)==types.InstanceType else x for x in val]
      elif type(val) == types.DictType:
          val = dict([(k, convert_to_dict(x) if type(x)==types.InstanceType else x) for k, x in val.iteritems()])
      d[key] = val
    return d

@mxcube.route("/mxcube/api/v0.1/login", methods=["POST"])
def login():
    beamline_name = os.environ["SMIS_BEAMLINE_NAME"]
    content = request.get_json()
    Proposal = content['proposal']
    password = content['password']
    proposal = "".join(itertools.takewhile(lambda c: not c.isdigit(), Proposal))
    prop_number = Proposal[len(proposal):]
    
    prop = mxcube.db_connection.get_proposal(proposal, prop_number)

    # following code is from ProposalBrick2, almost untouched;
    # this should be moved to the hardware object somehow
    # or even better, to a web service on ISPyB side
    sessions = prop.get('Session')
    
    # Check if there are sessions in the proposal
    todays_session = None
    if sessions:
        # Check for today's session
        for session in sessions:
            beamline=session['beamlineName']
            start_date="%s 00:00:00" % session['startDate'].split()[0]
            end_date="%s 23:59:59" % session['endDate'].split()[0]
            try:
                start_struct=time.strptime(start_date,"%Y-%m-%d %H:%M:%S")
            except ValueError:
                pass
            else:
                try:
                    end_struct=time.strptime(end_date,"%Y-%m-%d %H:%M:%S")
                except ValueError:
                    pass
                else:
                    start_time=time.mktime(start_struct)
                    end_time=time.mktime(end_struct)
                    current_time=time.time()

                    # Check beamline name
                    if beamline==beamline_name:
                        # Check date
                        if current_time>=start_time and current_time<=end_time:
                            todays_session=session
                            break

    if todays_session is None:
        is_inhouse = mxcube.session.is_inhouse(proposal, prop_number)
        if not is_inhouse:
            res = { "status": { "code": "error", "msg": "No session scheduled for today" } }

        current_time=time.localtime()
        start_time=time.strftime("%Y-%m-%d 00:00:00", current_time)
        end_time=time.mktime(current_time)+60*60*24
        tomorrow=time.localtime(end_time)
        end_time=time.strftime("%Y-%m-%d 07:59:59", tomorrow)

        # Create a session
        new_session_dict={}
        new_session_dict['proposalId']=prop['Proposal']['proposalId']
        new_session_dict['startDate']=start_time
        new_session_dict['endDate']=end_time
        new_session_dict['beamlineName']=beamline_name
        new_session_dict['scheduled']=0
        new_session_dict['nbShifts']=3
        new_session_dict['comments']="Session created by the BCM"
        session_id = mxcube.db_connection.createSession(new_session_dict)
        new_session_dict['sessionId']=session_id

        todays_session=new_session_dict
        localcontact = None
    else:
        session_id = todays_session['sessionId']
        
    res = { "status": { "code": "ok", "msg": "" },
            "proposal_title": prop['Proposal']['title'],
            "local_contact": mxcube.db_connection.getSessionLocalContact(session_id),
            "session": todays_session,
            "person": prop['Person'],
            "laboratory": prop['Laboratory'] }

    return jsonify(res)


@mxcube.route("/mxcube/api/v0.1/samples/<proposal_id>")
def proposal_samples(proposal_id):
   # session_id is not used, so we can pass None as second argument to function
   ret = mxcube.db_connection.get_samples(proposal_id, None)
   return jsonify({ "samples_info": [convert_to_dict(x) for x in ret] })

