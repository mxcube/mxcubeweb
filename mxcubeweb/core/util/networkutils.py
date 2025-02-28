import email.utils
import functools
import logging
import os
import smtplib
import socket
import time
from email.mime.text import MIMEText
from email.utils import make_msgid

import flask
import flask_security
import flask_socketio
from flask_login import current_user
from mxcubecore import HardwareRepository as HWR


def auth_required(fun):
    return flask_security.auth_required("session", within=-1, grace=None)(fun)


def RateLimited(maxPerSecond):
    minInterval = 1.0 / float(maxPerSecond)
    lastTimeCalled = {}

    def decorate(func):
        def rateLimitedFunction(*args, **kargs):
            key = args[0].get("Signal") if type(args[0]) is dict else args[0]
            elapsed = time.time() - lastTimeCalled.get(key, 0)
            leftToWait = minInterval - elapsed
            if leftToWait > 0:
                # ignore update
                return None
            ret = func(*args, **kargs)
            lastTimeCalled.update({key: time.time()})
            return ret

        return rateLimitedFunction

    return decorate


def remote_addr():
    hdr = flask.request.headers.get("x-forwarded-for", flask.request.remote_addr)

    return str(hdr).split(",")[-1]


def is_local_network(ip):
    localhost = socket.gethostbyname_ex(socket.gethostname())[2][0]
    localhost_range = ".".join(localhost.split(".")[0:2])
    private_address = ".".join(ip.split(".")[0:2])

    return private_address == localhost_range


def is_local_host():
    try:
        localhost_list = socket.gethostbyname_ex(socket.gethostname())[2]
    except Exception:
        localhost_list = []

    localhost_list.append("127.0.0.1")

    remote_address = remote_addr()

    # Remote address is sometimes None for instance when using the test
    # client, no real connection is made, assume that we are local host
    if remote_address in [None, "None", ""]:
        remote_address = "127.0.0.1"

    return remote_address in localhost_list or is_local_network(remote_address)


def valid_login_only(f):
    @functools.wraps(f)
    def wrapped(*args, **kwargs):
        if not current_user.is_authenticated:
            return flask.Response(status=404)
        return f(*args, **kwargs)

    return wrapped


def require_control(f):
    @functools.wraps(f)
    def wrapped(*args, **kwargs):
        if current_user.is_authenticated and not current_user.in_control:
            return flask.Response(status=401)
        return f(*args, **kwargs)

    return wrapped


def ws_valid_login_only(f):
    @functools.wraps(f)
    def wrapped(*args, **kwargs):
        if not current_user.is_authenticated:
            flask_socketio.disconnect()
            return None
        return f(*args, **kwargs)

    return wrapped


def send_mail(_from, to, subject, content):
    smtp = smtplib.SMTP("smtp", smtplib.SMTP_PORT)
    date = email.Utils.formatdate(localtime=True)

    msg = MIMEText(content)
    msg["Subject"] = subject
    msg["From"] = _from
    msg["To"] = to
    msg["Date"] = date
    msg["Message-ID"] = make_msgid()

    email_msg = msg.as_string()

    try:
        error_dict = smtp.sendmail(_from, to.split(","), email_msg)

        if error_dict:
            msg = "Could not send mail to %s, content %s, error was: %s"
            msg = msg % (to, content, str(error_dict))
            logging.getLogger().error(msg)
        else:
            msg = "Feedback sent to %s, msg: \n %s" % (to, content)
            logging.getLogger("MX3.HWR").info(msg)

    except smtplib.SMTPException as e:
        msg = "Could not send mail to %s, content %s, error was: %s"
        logging.getLogger().error(msg % (to, content, str(e)))
    finally:
        smtp.quit()


def send_feedback(sender_data):
    bl_name = HWR.beamline.session.beamline_name
    local_user = sender_data.get("LOGGED_IN_USER", "")

    if not bl_name:
        try:
            bl_name = os.environ["BEAMLINENAME"].lower()
        except KeyError:
            bl_name = "unknown-beamline"

    if not local_user:
        try:
            local_user = os.environ["USER"].lower()
        except KeyError:
            local_user = "unknown_user"

    _from = HWR.beamline.session.get_property("from_email", "")

    if not _from:
        _from = "%s@%s" % (
            local_user,
            HWR.beamline.session.get_property("email_extension", ""),
        )

    # Sender information provided by user
    _sender = sender_data.get("sender", "")
    to = HWR.beamline.session.get_property("feedback_email", "") + ",%s" % _sender
    subject = "[MX3 FEEDBACK] %s (%s) on %s" % (
        local_user,
        _sender,
        bl_name,
    )
    content = sender_data.get("content", "")

    send_mail(_from, to, subject, content)
