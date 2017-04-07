# -*- coding: utf-8 -*-
"""Utility functions for video streaming."""
import fcntl
import StringIO
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
        print "Opened %s with %s: " % (path, capability.driver)
    else:
        print "Could not open %s" % path

    return device

def write_to_video_device(device, image_data):
    if device:
        b = StringIO.StringIO()
        b.write(image_data)
        b.seek(0)

        image = PIL.Image.open(b)
        image.convert('RGB')
        width, height = image.size

        f = v4l2.v4l2_format()
        f.type = v4l2.V4L2_BUF_TYPE_VIDEO_OUTPUT
        f.fmt.pix.pixelformat = v4l2.V4L2_PIX_FMT_RGB24
        f.fmt.pix.width = width
        f.fmt.pix.height = height
        f.fmt.pix.field = v4l2.V4L2_FIELD_NONE
        f.fmt.pix.bytesperline = width * 3
        f.fmt.pix.sizeimage = width * height * 3
        f.fmt.pix.colorspace = v4l2.V4L2_COLORSPACE_SRGB

        res = fcntl.ioctl(device, v4l2.VIDIOC_S_FMT, f)

        if res == 0:
            device.write(numpy.array(image))
        else:
            print "Could not write frame to v4l2 loopback device"
