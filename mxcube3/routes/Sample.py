from flask import session, redirect, url_for, render_template, request, Response
from mxcube3 import app as mxcube
import signals
import logging

###----SAMPLE----###
@mxcube.route("/mxcube/api/v0.1/samples/<id>", methods=['POST', 'PUT', 'GET'])
def add_sample(id):
    """Add the information of the sample with id:"id"
    data = {generic_data, "SampleId":id, sample_data={'holderLength': 22.0, 'code': None, 'containerSampleChangerLocation': '1', 'proteinAcronym': 'Mnth', 'cellGamma': 0.0, 'cellAlpha': 0.0, 'sampleId': 444179, 'cellBeta': 0.0, 'crystalSpaceGroup': 'R32', 'sampleLocation': '2', 'sampleName': 'sample-E02', 'cellA': 0.0, 'diffractionPlan': {}, 'cellC': 0.0, 'cellB': 0.0, 'experimentType': 'Default'}}
    return_data={"result": True/False}
    """
    if request.method == 'PUT':
        return samples.addSample(data)
    elif request.method == 'GET':
        return jsonify(signals.samples_list)
    else:
        return "False"
@mxcube.route("/mxcube/api/v0.1/samples/<id>", methods=['PUT'])
def update_sample(id):
    """Update the information of the sample with id:"id"
    data = {generic_data, "SampleId":id, sample_data={'holderLength': 22.0, 'code': None, 'containerSampleChangerLocation': '1', 'proteinAcronym': 'Mnth', 'cellGamma': 0.0, 'cellAlpha': 0.0, 'sampleId': 444179, 'cellBeta': 0.0, 'crystalSpaceGroup': 'R32', 'sampleLocation': '2', 'sampleName': 'sample-E02', 'cellA': 0.0, 'diffractionPlan': {}, 'cellC': 0.0, 'cellB': 0.0, 'experimentType': 'Default'}}
    return_data={"result": True/False}
    """
    data = dict(request.POST.items())
    return samples.updateSample(data)

@mxcube.route("/mxcube/api/v0.1/samples/<id>", methods=['GET'])
def get_sample(id):
    """Get the information of the sample with id:"id"
    data = {generic_data, "SampleId":id}
    return_data={"SampleId":id, sample_data={'holderLength': 22.0, 'code': None, 'containerSampleChangerLocation': '1', 'proteinAcronym': 'Mnth', 'cellGamma': 0.0, 'cellAlpha': 0.0, 'sampleId': 444179, 'cellBeta': 0.0, 'crystalSpaceGroup': 'R32', 'sampleLocation': '2', 'sampleName': 'sample-E02', 'cellA': 0.0, 'diffractionPlan': {}, 'cellC': 0.0, 'cellB': 0.0, 'experimentType': 'Default'}}
    """
    data = dict(request.POST.items())
    return samples.getSample(data)

@mxcube.route("/mxcube/api/v0.1/samples/<id>", methods=['DELETE'])
def delete_sample(id):
    """Delete the sample with id:"id"
    data = {generic_data, "SampleId":id}
    return_data={"result": True/False}
    """
    data = dict(request.POST.items())
    return samples.deleteSample(data)

@mxcube.route("/mxcube/api/v0.1/samples", methods=['GET'])
def get_sample_list():
    """Get the sample list already on the queue
    data = {generic_data}
    return_data={"SampleId1":id, ..., "SampleIdN":id}
    """
    data = dict(request.POST.items())
    return samples.getSampleList()

@mxcube.route("/mxcube/api/v0.1/samples/<id>/mode", methods=['POST'])
def set_sample_mode(id):
    """Set sample changer mode: sample changer, manually mounted, ... (maybe it is enoug to set for all the same mode)
    data = {generic_data, "Mode": mode}
    return_data={"result": True/False}
    """
    data = dict(request.POST.items())
    return samples.getMode(data)

@mxcube.route("/mxcube/api/v0.1/samples/<id>/centring", methods=['PUT'])
def set_centring_mode(id):
    """Set centring method: semi auto, fully auto,  ...
    data = {generic_data, "Mode": mode}
    return_data={"result": True/False}
    """
    data = dict(request.POST.items())
    return samples.setCentring(data)

###----SAMPLECHANGER----###
@mxcube.route("/mxcube/api/v0.1/samples/<id>/mount", methods=['PUT'])
def mount_sample(id):
    """Mount sample with id:"id"
    data = {generic_data, "SampleId": id}
    return_data={"result": True/False}
    """
    data = dict(request.POST.items())
    return samples.mountSample(data)

@mxcube.route("/mxcube/api/v0.1/samples/<id>/umount", methods=['PUT'])
def umount_sample():
    """Umount mounted sample
    data = {generic_data}
    return_data={"result": True/False}
    """
    data = dict(request.POST.items())
    return samples.umountSample(data)
