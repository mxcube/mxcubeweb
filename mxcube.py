#!/bin/env python
from gevent import monkey
monkey.patch_all()

from src import app, socketio

if __name__ == '__main__':
    socketio.run(app, host='localhost', port=8081)
