# -*- coding: utf-8 -*-
import os
import sys
import subprocess
import time

def monitor(*processes):
    while True:
        if all([p.poll() is None for p in processes]):
            time.sleep(1)

    for p in processes:
        p.terminate()

def start(video_device):
    websocket_relay_js = os.path.join(os.path.dirname(__file__), "websocket-relay.js")
    relay = subprocess.Popen(["node", websocket_relay_js, "video", "4041", "4042"])

    # Make sure that the relay is running (socket is open)
    time.sleep(1)
    ffmpeg = subprocess.Popen(["ffmpeg",
                               "-f", "video4linux2",
                               "-i", video_device,
                               "-f", "mpegts",
                               "-codec:v", "mpeg1video",
                               "http://localhost:4041/video"])

    return relay, ffmpeg

if __name__ == '__main__':
    try:
        video_device = sys.argv[1]
    except IndexError:
        video_device = '/dev/video0'

    monitor(*start(video_device))
