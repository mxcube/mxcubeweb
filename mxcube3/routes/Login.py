from flask import session, redirect, url_for, render_template, request, Response, jsonify
from mxcube3 import app as mxcube
import logging
import itertools

@mxcube.route("/mxcube/api/v0.1/login", methods=["POST"])
def login():
    content = request.get_json()
    Proposal = content['proposal']
    password = content['password']
    proposal = "".join(itertools.takewhile(lambda c: not c.isdigit(), Proposal))
    prop_number = Proposal[len(proposal):]
    return jsonify(mxcube.db_connection.get_proposal(proposal, prop_number))
