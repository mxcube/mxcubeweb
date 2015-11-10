from flask import session, redirect, url_for, render_template, request, Response
from mxcube3 import app as mxcube

import logging

###----COLLECTION----###
@mxcube.route("/mxcube/api/v0.1/samples/<id>/collections/<colid>/mode", methods=['POST'])
def set_collection_method(method):
    """Define the collection method, standard collection, helical, mesh
    data={generic_data, "Method":method}
    return_data={"result": True/False}
    OBSOLETE BY ADD COLLECTION
    """
    data = dict(request.POST.items())
    return mxcube.collection.defineCollectionMethod(data)

@mxcube.route("/mxcube/api/v0.1/samples/<id>/collections/<colid>", methods=['PUT'])
def update_collection(method):
    """update a collection into the sample queue ***asociated to a sample!
    data={generic_data, "Method":method, "SampleId": sampleid ,"CollectionId": id, parameters}, 
    for example for a standard data collection:
    data={generic_data, "Method":StandardCollection, "SampleId": sampleid, "CollectionId": colid, parameters:{
            osc_range: { label: "Oscillation range", default_value: 1.0, value: 0 },
            osc_start: { label: "Oscillation start", default_value: 0, value: 0 },
            exp_time: { label: "Exposure time", default_value: 10.0, value: 0 },
            n_images: { label: "Number of images", default_value: 1, value: 0 },
            energy: {label: "Energy", default_value: 12.3984, value: 0 },
            resolution: {label: "Resolution", default_value: 2.498, value: 0 },
            transmission: {label: "Transmission", default_value: 100.0, value: 0} },
          }, 
    return_data={"result": True/False}
    """
    data = dict(request.POST.items())
    return mxcube.collection.updateCollection(data)

@mxcube.route("/mxcube/api/v0.1/samples/<id>/collections/<colid>", methods=['POST'])
def add_collection(id, colid):
    """Add a collection into the sample queue ***asociate to a sample!
    data={generic_data, "Method":method, "SampleId": sampleid ,"CollectionId": id, parameters}, 
    for example for a standard data collection:
    data={generic_data, "Method":StandardCollection, "SampleId": sampleid, "CollectionId": colid, parameters:{
            osc_range: { label: "Oscillation range", default_value: 1.0, value: 0 },
            osc_start: { label: "Oscillation start", default_value: 0, value: 0 },
            exp_time: { label: "Exposure time", default_value: 10.0, value: 0 },
            n_images: { label: "Number of images", default_value: 1, value: 0 },
            energy: {label: "Energy", default_value: 12.3984, value: 0 },
            resolution: {label: "Resolution", default_value: 2.498, value: 0 },
            transmission: {label: "Transmission", default_value: 100.0, value: 0} },
          }, 
    return_data={"result": True/False}
    """
    data = dict(request.POST.items())
    print data
    return mxcube.collection.addCollection(data)

@mxcube.route("/mxcube/api/v0.1/samples/<id>/collections/<colid>", methods=['GET'])
def get_collection(id):
    """get the collection with id:"colid"
    data={generic_data}, 
    for example for a standard data collection:
    return_data={"Method":StandardCollection,  "SampleId": sampleid, "CollectionId": colid, parameters:{
            osc_range: { label: "Oscillation range", default_value: 1.0, value: 0 },
            osc_start: { label: "Oscillation start", default_value: 0, value: 0 },
            exp_time: { label: "Exposure time", default_value: 10.0, value: 0 },
            n_images: { label: "Number of images", default_value: 1, value: 0 },
            energy: {label: "Energy", default_value: 12.3984, value: 0 },
            resolution: {label: "Resolution", default_value: 2.498, value: 0 },
            transmission: {label: "Transmission", default_value: 100.0, value: 0} },
          }, 
    """
    data = dict(request.POST.items())
    return mxcube.collection.getCollection(data)

@mxcube.route("/mxcube/api/v0.1/samples/<id>/collections", methods=['GET'])
def get_collection_list(id):
    """get the collection with id:"id"
    data={generic_data}, 
    for example for a standard data collection:
    return_data={"Method":StandarCollection,  "SampleId": sampleid, "CollectionId": colid, parameters:{
            osc_range: { label: "Oscillation range", default_value: 1.0, value: 0 },
            osc_start: { label: "Oscillation start", default_value: 0, value: 0 },
            exp_time: { label: "Exposure time", default_value: 10.0, value: 0 },
            n_images: { label: "Number of images", default_value: 1, value: 0 },
            energy: {label: "Energy", default_value: 12.3984, value: 0 },
            resolution: {label: "Resolution", default_value: 2.498, value: 0 },
            transmission: {label: "Transmission", default_value: 100.0, value: 0} },
          }, 
    """
    data = dict(request.POST.items())
@mxcube.route("/mxcube/api/v0.1/samples/<id>/collections/<colid>", methods=['DELETE'])
def delete_collection(id):
    """delete the collection with id:"id"
    data={generic_data, "CollectionId": id},   
    return_data={"result": True/False}
    """
    data = dict(request.POST.items())
    return samples.getCollection(data)
    
@mxcube.route("/mxcube/api/v0.1/samples/<id>/collections/status", methods=['GET'])
def get_collection_status(id):
    """get the status of all data collections, (running, stopped, cancelled, finished, ...)
    data={generic_data},   
    return_data={ {"CollectionId": id1, "Status": status}, ..., {"CollectionId": idN, "Status": status} }
    """
    data = dict(request.POST.items())
    return mxcube.collection.getCollectionStatus(data)

@mxcube.route("/mxcube/api/v0.1/samples/<id>/collections/<colid>/status", methods=['GET'])
def get_collection_id_status(id):
    """get the status of the collection with id:"id", (running, stopped, cancelled, finished, ...)
    data={generic_data},
    return_data={"CollectionId": id, "Status": status}
    """
    data = dict(request.POST.items())
    return mxcube.collection.getCollectionStatus(data)

@mxcube.route("/mxcube/api/v0.1/samples/<sampleid>/collections/<colid>/run", methods=['POST'])
def run_collection(**args):
    """run the collection with id:"colid"
    data={generic_data},
    return_data={"CollectionId": id, "Status": status}
    """
    print "in run collection", args['sampleid'], args['colid']
    data = dict(request.POST.items())
    print data
    #return "collection ok"
    return mxcube.collection.executeCollection(data)
    #return collection.runCollectionStatus(data)

# @mxcube.route("/mxcube/api/v0.1/samples/<id>/collections/<colid>/run", methods='POST')
# def run_queue(id):
#     """run the whole queue
#     data={generic_data},
#     return_data={"CollectionId": id, "Status": status}
#     """
#     data = dict(request.POST.items())
#     print data
#     #return collection.runCollectionStatus(data)
