from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

from flask_restx import Namespace, Resource, fields

from mxcube3 import server
from mxcube3 import blcontrol
from mxcube3.core.beamline_adapter import BeamlineAdapter

ns = Namespace("mxcube/api/v0.1/data_publisher", description="Data publisher operations")

DataPublisher = ns.model("DataPublisher", {
    "id": fields.String(required=True, description="Publisher identifier"),
    "name": fields.String(required=True, description="Publisher name"),
    "axis_labels": fields.List(fields.String, required=True, description="Axis labels"),
    "data_type": fields.String(required=True, description="Data type of data"),
    "data_dim": fields.Float(required=True, description="Dimension of data 1 or 2"),
    "channel": fields.String(required=True, description="Channel name"),
    "plot_type": fields.String(required=True, description="Type of plot to use as default"),
    "sample_rate":  fields.Float(required=True, description="Sampling rate"),
    "content_type": fields.String(required=True, description="Content"),
    "range": fields.List(fields.Float, required=True, description="Min max value"),
    "meta":  fields.Raw(required=True, description="Meta data to use by client"),
    "running": fields.Boolean(required=True, description="True if publishing otherwise False"),
    "values": fields.Raw(description="x, y, and z (if three dimensions) values")
})

@ns.route("/list/")
class DataPublisherListResource(Resource):
    @ns.doc("Get DataPublisher")
    @ns.marshal_list_with(DataPublisher)
    #@server.restrict
    def get(self):
        """Get all DataPublishers"""
        adapter = BeamlineAdapter(blcontrol.beamline).data_publisher
        return adapter.ho_proxy.get_description(include_data=True)

@ns.route("/<id>")
@ns.param("id", "The DataPublisher identifier")
@ns.response(404, "DataPublisher not found")
class DataPublisherResource(Resource):
    @ns.doc("Get DataPublisher")
    @ns.marshal_with(DataPublisher)
    #@server.restrict
    def get(self, id):
        """Get DataPublisher with id"""
        adapter = BeamlineAdapter(blcontrol.beamline).data_publisher
        return adapter.ho_proxy.get_description(_id=id, include_data=True)[0]

@ns.route("/mockscan")
@ns.response(404, "Coult not start mockscan")
class StartMockScan(Resource):
    @ns.doc("Start mockscan")
    # @server.restrict
    def get(self):
        """Start mockscan"""
        blcontrol.beamline.scan_mockup.start()
        return ""