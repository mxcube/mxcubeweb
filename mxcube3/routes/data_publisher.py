from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

from flask_restx import Namespace, Resource, fields

from mxcube3 import server
from mxcube3 import blcontrol
from mxcube3.core.beamline_adapter import BeamlineAdapter

ns = Namespace('mxcube/api/v0.1/data_publisher', description='Data publisher operations')

DataPublisher = ns.model('DataPublisher', {
    'id': fields.String(required=True, description='Publisher identifier'),
    'name': fields.String(required=True, description='Publisher identifier'),
    'data_type': fields.String(required=True, description='Publisher identifier'),
    'data_dim': fields.String(required=True, description='Publisher identifier'),
    'channels': fields.List(fields.String, required=True, description='Publisher identifier'),
    'plot_type': fields.String(required=True, description='Publisher identifier'),
    'sample_rate':  fields.Float(required=True, description='Publisher identifier'),
    'content_type': fields.String(required=True, description='Publisher identifier'),
    'range': fields.List(fields.Float, required=True, description='Publisher identifier'),
    'meta':  fields.String(required=True, description='Publisher identifier'),
    'running': fields.Boolean(required=True, description='Publisher identifier'),
    'values': fields.Raw()
})

@ns.route('/list/')
class DataPublisherListResource(Resource):
    @ns.doc('Get DataPublisher')
    @ns.marshal_list_with(DataPublisher)
    # @server.restrict
    def get(self):
        """Get all DataPublishers"""
        adapter = BeamlineAdapter(blcontrol.beamline).get_object("data_publisher_registry")

        return adapter.ho_proxy.get_description(include_data=True)

@ns.route('/<id>')
@ns.param("id", "The DataPublisher identifier")
@ns.response(404, "DataPublisher not found")
class DataPublisherResource(Resource):
    @ns.doc('Get DataPublisher')
    @ns.marshal_with(DataPublisher)
    # @server.restrict
    def get(self, id):
        """Get all DataPublisher with ID"""
        adapter = BeamlineAdapter(blcontrol.beamline).get_object("data_publisher_registry")

        return adapter.ho_proxy.get_description(_id=id, include_data=True)[0]
