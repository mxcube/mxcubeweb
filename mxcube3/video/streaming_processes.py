"""Utileties for starting video encoding and streaming."""
# -*- coding: utf-8 -*-
import os
import subprocess
import sys
import time


def monitor(*processes):
    """
    Monitor processes, terminate all processes if one dies.

    :param processes: processes to monitor
    """
    while True:
        if all([p.poll() is None for p in processes]):
            time.sleep(1)

    for p in processes:
        p.terminate()


def start(device, scale):
    """
    Start encoding and streaming from device video_device.

    :param str device: The path to the device to stream from
    :returns: Tupple with the two processes performing streaming and encoding
    :rtype: tuple
    """
    fpath = os.path.dirname(__file__)
    websocket_relay_js = os.path.join(fpath, "websocket-relay.js")
    relay = subprocess.Popen(["node", websocket_relay_js, "video",
                              "4041", "4042"])

    # Make sure that the relay is running (socket is open)
    time.sleep(1)

    scale = "scale=w=%s:h=%s:force_original_aspect_ratio=decrease" % scale

    ffmpeg = subprocess.Popen(["ffmpeg",
                               "-f", "v4l2",
                               "-i", device,
                               "-vf", scale,
                               "-f", "mpegts",
                               "-an",
                               "-vcodec", "mpeg1video",
                               "http://localhost:4041/video"])

    return relay, ffmpeg


if __name__ == '__main__':
    try:
        video_device = sys.argv[1].strip()
    except IndexError:
        video_device = '/dev/video0'

    try:
        scale = sys.argv[2].strip()
    except IndexError:
        scale = "-1,-1"
    finally:
        scale = tuple(scale.split(","))

    monitor(*start(video_device, scale))
