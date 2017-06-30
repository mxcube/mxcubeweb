# -*- coding: utf-8 -*-
"""Functions for video streaming."""
import cStringIO
import fcntl
import os
import signal
import struct
import subprocess
import sys
import time
import types
import json


import PIL
import v4l2

VIDEO_DEVICE = None
VIDEO_STREAM_PROCESS = None
VIDEO_INITIALIZED = False
VIDEO_SIZE = "-1,-1"
VIDEO_RESTART = False
VIDEO_ORIGINAL_SIZE = 0,0


def open_video_device(path="/dev/video0"):
    global VIDEO_DEVICE

    if os.path.exists(path):
        # binary, unbuffered write
        device = open(path, "wb", 0)
        VIDEO_DEVICE = device
    else:
        msg = "Cannot open video device %s, path do not exist. " % path
        msg += "Make sure that the kernel module v4l2loopback is installed (modprobe v4l2loopback). "
        msg += "Falling back to MJPEG."
        raise RuntimeError(msg)

    return VIDEO_DEVICE


def initialize_video_device(pixel_format, width, height, channels):
    f = v4l2.v4l2_format()
    f.type = v4l2.V4L2_BUF_TYPE_VIDEO_OUTPUT
    f.fmt.pix.pixelformat = pixel_format
    f.fmt.pix.width = width
    f.fmt.pix.height = height
    f.fmt.pix.field = v4l2.V4L2_FIELD_NONE
    f.fmt.pix.bytesperline = width * channels
    f.fmt.pix.sizeimage = width * height * channels
    f.fmt.pix.colorspace = v4l2.V4L2_COLORSPACE_SRGB

    res = fcntl.ioctl(VIDEO_DEVICE, v4l2.VIDIOC_S_FMT, f)

    if res != 0:
        raise RuntimeError("Could not initialize video device: %d" % res)

    return True


def set_video_size(width=-1, height=-1):
    global VIDEO_SIZE
    global VIDEO_RESTART
    VIDEO_SIZE = "%s,%s" % (width, height)
    VIDEO_RESTART = True


def video_size():
    current_size = VIDEO_SIZE.split(",")
    scale = float(current_size[0]) / VIDEO_ORIGINAL_SIZE[0]
    return current_size + list((scale,))


def new_frame_received(img, width, height, *args, **kwargs):
    """
    Executed when a new image is received, (new frame received callback).
    """
    pixel_format = v4l2.V4L2_PIX_FMT_RGB24
    channels = 3

    global VIDEO_INITIALIZED
    global VIDEO_STREAM_PROCESS
    global VIDEO_RESTART

    # Assume that we are getting a qimage if we are not getting a str,
    # to be able to handle data sent by hardware objects used in MxCuBE 2.x
    if not isinstance(img, str):
        # 4 Channels with alpha
        channels = 4
        pixel_format = v4l2.V4L2_PIX_FMT_RGB32
        rawdata = img.bits().asstring(img.numBytes())
        img = rawdata
    else:
        # Is the image on JPEG format get the RGB data otherwise assume its
        # already RGB and do nothing with the data
        if img.startswith('\xff\xd8\xff\xe0\x00\x10JFIF'):
            # jpeg image
            strbuf = cStringIO.StringIO(img)
            img = PIL.Image.open(strbuf)
            img = img.tobytes()

    if VIDEO_DEVICE:
        if not VIDEO_INITIALIZED:
            VIDEO_INITIALIZED = \
                initialize_video_device(pixel_format, width, height, channels)

        VIDEO_DEVICE.write(img)

        if VIDEO_RESTART and VIDEO_STREAM_PROCESS:
            os.system('pkill -TERM -P {pid}'.format(pid=VIDEO_STREAM_PROCESS.pid))
            VIDEO_RESTART = False
            VIDEO_STREAM_PROCESS = None

        # start the streaming process if not started or restart if terminated
        if not VIDEO_STREAM_PROCESS or VIDEO_STREAM_PROCESS.poll() is not None:
            sfpath = os.path.join(os.path.dirname(__file__), "streaming_processes.py")
            VIDEO_STREAM_PROCESS = subprocess.Popen([sys.executable, sfpath, VIDEO_DEVICE.name, VIDEO_SIZE])


def get_available_sizes(camera):
    try:
        w, h = camera.getWidth(), camera.getHeight()

        # Some video decoders have difficulties to decode videos with odd image dimensions
        # (JSMPEG beeing one of them) so we make sure that the size is even
        w = w if w % 2 == 0 else w + 1
        h = h if h % 2 == 0 else h + 1

        # Calculate half the size and quarter of the size if MPEG streaming is used
        # otherwise just return the orignal size.
        if VIDEO_STREAM_PROCESS:
            video_sizes = [(w, h), (w/2, h/2), (w/4, h/4)]
        else:
            video_sizes = [(w, h)]

    except (ValueError, AttributeError):
        video_sizes = []

    return video_sizes


def set_initial_stream_size(camera, video_device_path):
    global VIDEO_SIZE
    global VIDEO_ORIGINAL_SIZE

    w, h = camera.getWidth(), camera.getHeight()
    w = w if w % 2 == 0 else w + 1
    h = h if h % 2 == 0 else h + 1

    VIDEO_ORIGINAL_SIZE = w, h
    VIDEO_SIZE = "%s,%s" % VIDEO_ORIGINAL_SIZE


def tango_lima_video_plugin(camera, video_device):
    """
    Configures video frame handling for TangoLimaVideo devices.

    :param HardwareObject camera:  Object providing frames to encode and stream
    :param str video_device: Video loopback path
    """
    if camera.__class__.__name__ == 'TangoLimaVideo':
        # patch hardware object to set acquisition to the right mode
        # and to get the right frames out of the video device
        if camera.isReady():
            camera.setLive(False)
            camera.device.video_mode = "RGB24"
            time.sleep(0.1)
            camera.setLive(True)

            def do_polling(self, sleep_time):
                hfmt = ">IHHqiiHHHH"
                hsize = struct.calcsize(hfmt)
                while True:
                    img_data = self.device.video_last_image
                    _, _, img_mode, frame_number, width, height, _, _, _, _ = \
                        struct.unpack(hfmt, img_data[1][:hsize])

                    raw_data = img_data[1][hsize:]
                    self.emit("imageReceived", raw_data, width, height, False)
                    time.sleep(sleep_time)

            camera._do_polling = types.MethodType(do_polling, camera)


def init(camera, video_device_path):
    """
    Initialize video loopback device.

    :param HardwareObject camera:  Object providing frames to encode and stream
    :param str video_device_path: Video loopback path
    """
    set_initial_stream_size(camera, video_device_path)
    tango_lima_video_plugin(camera, video_device_path)
    video_device = open_video_device(video_device_path)
    camera.connect("imageReceived", new_frame_received)
    return video_device
