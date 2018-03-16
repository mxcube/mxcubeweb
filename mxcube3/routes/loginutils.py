import functools

from flask import session,  Response, jsonify
from mxcube3 import app as mxcube


def create_user(loginID, host, sid):
    return {"loginID": loginID, "host": host, "sid": sid}


def add_user(user):
    mxcube.USERS[user["sid"]] = user


def remove_user(sid):
    mxcube.USERS.pop(sid)


def get_user_by_sid(sid):
    return mxcube.USERS.get(sid, None)


def deny_access(msg):
    resp = jsonify({"msg": msg})
    resp.code = 409
    return resp


def logged_in_users():
    return [user["loginID"] for user in mxcube.USERS.itervalues()]


def valid_login_only(f):
    @functools.wraps(f)
    def wrapped(*args, **kwargs):
        if not get_user_by_sid(session.sid):
            return Response(status=404)
        else:
            return f(*args, **kwargs)

    return wrapped
