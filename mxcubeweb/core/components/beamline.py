from mxcubecore import HardwareRepository as HWR

from mxcubeweb.core.components.component_base import ComponentBase


class Beamline(ComponentBase):
    def __init__(self, app, config):
        super().__init__(app, config)

    def init_signals(self):
        pass

    def get_viewport_info(self):
        """
        Get information about current "view port" video dimension, beam position,
        pixels per mm, returns a dictionary with the format:

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

        if self.app.CONFIG.app.VIDEO_FORMAT == "MPEG1":
            fmt, source_is_scalable = "MPEG1", True
            video_sizes = HWR.beamline.sample_view.camera.get_available_stream_sizes()
            (width, height, scale) = HWR.beamline.sample_view.camera.get_stream_size()
        else:
            scale = 1
            width = HWR.beamline.sample_view.camera.get_width()
            height = HWR.beamline.sample_view.camera.get_height()
            video_sizes = [(width, height)]

        pixelsPerMm = HWR.beamline.diffractometer.get_pixels_per_mm()

        return {
            "pixelsPerMm": pixelsPerMm,
            "imageWidth": width,
            "imageHeight": height,
            "format": fmt,
            "sourceIsScalable": source_is_scalable,
            "scale": scale,
            "videoSizes": video_sizes,
            "videoHash": HWR.beamline.sample_view.camera.stream_hash,
            "videoURL": self.app.CONFIG.app.VIDEO_STREAM_URL,
        }
