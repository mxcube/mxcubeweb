# -*- coding: utf-8 -*-
import os

from mxcube3 import app as mxcube
from mxcube3.video import streaming


def get_beam_info():
    """
    Returns beam information retrived by the beam_info hardware object, containing
    position, size and shape.

    :returns: Beam info dictionary with keys: position, shape, size_x, size_y
    :rtype: dict
    """
    beam_info = mxcube.beamline.getObjectByRole("beam_info")
    beam_info_dict = {"position": [], "shape": "", "size_x": 0, "size_y": 0}

    if beam_info is not None:
        beam_info_dict.update(beam_info.get_beam_info())
        # Get the scale of the video stream, so that we can calculate
        # the correct beam posiition
        width, height, scale = streaming.video_size()
        position = beam_info.get_beam_position()
        beam_info_dict["position"] = position

    return beam_info_dict


def get_aperture():
    """
    Returns list of apertures and the one currently used.

    :returns: Tuple, (list of apertures, current aperture)
    :rtype: tuple
    """
    aperture_list, current_aperture = [], None
    aperture = get_beam_definer()

    if aperture is not None:
        aperture_list = aperture.getPredefinedPositionsList()
        current_aperture = aperture.getCurrentPositionName()

    return aperture_list, current_aperture


def get_beam_definer():
    beam_info = mxcube.beamline.getObjectByRole("beam_info") 

    if hasattr(beam_info, "beam_definer_hwobj") and beam_info.beam_definer_hwobj:
        bd = beam_info.beam_definer_hwobj
    else:
        bd = beam_info.aperture_hwobj

    return bd


def get_viewport_info():
    """
    Get information about current "view port" video dimension, beam position, pixels per mm,
    returns a dictionary with the format:

        data = {"pixelsPerMm": pixelsPerMm,
                "imageWidth": width,
                "imageHeight": height,
                "format": fmt,
                "sourceIsScalable": source_is_scalable,
                "scale": scale,
                "videoSizes": video_sizes,
                "position": position,
                "shape": shape,
                "size_x": sx, "size_y": sy}

    :returns: Dictionary with view port data, with format described above
    :rtype: dict
    """
    fmt, source_is_scalable = "MJPEG", False

    if mxcube.VIDEO_DEVICE and os.path.exists(mxcube.VIDEO_DEVICE):
        fmt, source_is_scalable = "MPEG1", True

    video_sizes = streaming.get_available_sizes(mxcube.diffractometer.camera)
    width, height, scale = streaming.video_size()
    pixelsPerMm = mxcube.diffractometer.get_pixels_per_mm()

    beam_info_dict = get_beam_info()

    data = {"pixelsPerMm": pixelsPerMm,
            "imageWidth": width,
            "imageHeight": height,
            "format": fmt,
            "sourceIsScalable": source_is_scalable,
            "scale": scale,
            "videoSizes": video_sizes}

    data.update(beam_info_dict)
    return data
