from flask import session, redirect, url_for, render_template, request, Response, jsonify
import logging
from mxcube3 import app as mxcube

@mxcube.route("/login")
def login():
    proposal = request.args['proposal']
    prop_number = request.args['prop_number']
    password = request.args['password']
    print mxcube.dbconnection.get_proposal(proposal, prop_number)
    return "ok"
