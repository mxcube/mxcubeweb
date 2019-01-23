# -*- coding: utf-8 -*-
"""Utility functions for video streaming."""
import fcntl
import io
import os
import PIL
import v4l2
import numpy


def open_video_device(path="/dev/video0"):
    device = None

    if os.path.exists(path):
        # binary, unbuffered write
        device = open(path, "wb", 0)
        capability = v4l2.v4l2_capability()
        fcntl.ioctl(device, v4l2.VIDIOC_QUERYCAP, capability)
        print("Opened %s with %s: " % (path, capability.driver))
    else:
        print("Could not open %s" % path)

    return device


def write_to_video_device(device, image_data, pixel_format, width, height):
    if device:
        channels = 3
        f = v4l2.v4l2_format()
        f.type = v4l2.V4L2_BUF_TYPE_VIDEO_OUTPUT
        if pixel_format == 'RGB24':
            f.fmt.pix.pixelformat = v4l2.V4L2_PIX_FMT_RGB24
        else:
            f.fmt.pix.pixelformat = v4l2.V4L2_PIX_FMT_RGB32
            channels = 4
        f.fmt.pix.width = width
        f.fmt.pix.height = height
        f.fmt.pix.field = v4l2.V4L2_FIELD_NONE
        f.fmt.pix.bytesperline = width * channels
        f.fmt.pix.sizeimage = width * height * channels
        f.fmt.pix.colorspace = v4l2.V4L2_COLORSPACE_SRGB

        res = fcntl.ioctl(device, v4l2.VIDIOC_S_FMT, f)

        if res == 0:
            device.write(image_data)
        else:
            print("Could not write frame to v4l2 loopback device")
