from gevent import monkey
monkey.patch_all(thread=False)

import redis
import sys

from mxcube3 import app
from mxcube3 import socketio

if __name__ == '__main__':
    db = redis.Redis()

    try:
        db.ping()
    except redis.RedisError:
      print "No Redis server is running, exiting"
      sys.exit(1)

    socketio.run(app, host='0.0.0.0', port=8081, debug=False)
