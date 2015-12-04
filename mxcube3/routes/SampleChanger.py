from flask import session, redirect, url_for, render_template, request, Response, jsonify
from mxcube3 import app as mxcube
import logging
import itertools

@mxcube.route("/mxcube/api/v0.1/sample_changer/samples_list")
def get_samples_list():
    samples_list = mxcube.sample_changer.getSampleList()
    samples = { 'data': [ { "id": s.getAddress(), "location": ":".join(map(str, s.getCoords())) } for s in samples_list] }
    return jsonify(samples)
