# -*- coding: utf-8 -*-
import re
import logging
import time
import gevent
import gevent.event
import inspect
import base64
import os
import sys

from mxcube3 import mxcube

from mxcubecore.BaseHardwareObjects import HardwareObjectState
from mxcubecore.HardwareObjects.abstract.AbstractNState import AbstractNState

SNAPSHOT_RECEIVED = gevent.event.Event()
SNAPSHOT = None


