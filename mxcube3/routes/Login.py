from flask import session, redirect, url_for, render_template, request, Response, jsonify
import logging
from .. import app as mxcube

@mxcube.route("/login")
def login():
    username = request.args['username']
    password = request.args['password']
    print "USERNAME",username,"PASS",password
    return "ok"
