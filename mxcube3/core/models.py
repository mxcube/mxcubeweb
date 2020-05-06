from flask_restx import Model, fields


def register_model(ns, model):
    return ns.add_model(model.name, model)


SampleViewDataModel = Model('SampleViewDataModel', {
    'pixelsPerMm': fields.List(fields.Float, readonly=True, description="Pixels per milimeter x and y"), 
    'imageWidth': fields.Float(readonly=True, description="Image width"),
    'imageHeight': fields.Float(readonly=True, description="Image height"),
    'format': fields.String(readonly=True, description="Video format"),
    'sourceIsScalable': fields.Boolean(readonly=True, description="Does video suport scaling"),
    'scale': fields.Float(readonly=True, description="Current scale"), 
    'videoSizes': fields.List(fields.Float, readonly=True, description="List of suported video sizes"), 
    'videoHash': fields.String(readonly=True, description="Video hash"), 
    'position': fields.List(fields.Float, readonly=True, description="Position of beam"), 
    'shape': fields.String(readonly=True, description="Beam shape"),
    'size_x': fields.Float(readonly=True, description="Beam width in mm"), 
    'size_y': fields.Float(readonly=True, description="Beam height in mm"), 
    'apertureList': fields.List(fields.Float, readonly=True, description="List of avialable apertures in microns"),
    'currentAperture': fields.Float(readonly=True, description="Current apperture in microns"),
})


WidthHeightModel = Model('WidthHeightModel',{
    "width": fields.Float(readonly=True, description="Image width"),
    "height": fields.Float(readonly=True, description="Image height"),
})


ZoomLevelModel = Model("ZoomLevelModel", {
    "level": fields.Float(readonly=True, description="Zoom level"),
})


PixelsPermmModel = Model("PixelsPermmModel", {
    'pixelsPerMm': fields.List(fields.Float, readonly=True, description="Pixels per milimeter x and y"),
})


ClicksLeftModel = Model("ClicksLeftModel", {
    "clicksLeft": fields.Integer(readonly=True, description="Clicks left"),
})


ScreenPositionModel = Model("ScreenPositionModel", {
    "x": fields.Float(readonly=True, description="x position in pixels"),
    "y": fields.Float(readonly=True, description="y postiion in pixels"),
})


ClickPositionModel = Model("ClickPositionModel",{
    "clickPos": fields.Nested(ScreenPositionModel)
})


CentringMethodModel = Model("CentringMethodModel", {
    "centringMethod": fields.String(readonly=True, description="Centring method"),
})