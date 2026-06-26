import functools
import logging
import smtplib
import socket
import time
from email.message import EmailMessage
from email.utils import formatdate, make_msgid, parseaddr
from html.parser import HTMLParser

import flask
import flask_security
import flask_socketio
from flask_login import current_user
from mxcubecore import HardwareRepository as HWR


class _HTMLTagDetector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.found_tag = False

    def handle_starttag(self, tag, attrs):
        self.found_tag = True

    def handle_startendtag(self, tag, attrs):
        self.found_tag = True

    def handle_endtag(self, tag):
        self.found_tag = True

    def handle_comment(self, data):
        self.found_tag = True

    def handle_decl(self, decl):
        self.found_tag = True

    def handle_pi(self, data):
        self.found_tag = True


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


def is_local_network(ip: str, local_domains: list):
    """Determine whether a given IP address belongs to the local network.

    The function compares the first two octets of the given IP address with the
    local host's IP address. It also checks if the reverse-resolved hostname of
    the IP ends with any of the specified local domains.

    Args:
        ip (str): The IP address to check.
        local_domains (list): A list of domain suffixes that are considered local
            (e.g. ['beamline1.site.eu', 'control.site.eu']).

    Returns:
        bool: True if the IP is in the same network range as the local host
              (i.e. mxcube server) or its hostname ends with any of the specified
              local domains; False otherwise.
    """
    localhost = socket.gethostbyname_ex(socket.gethostname())[2][0]
    localhost_range = ".".join(localhost.split(".")[0:2])
    private_address = ".".join(ip.split(".")[0:2])
    try:
        private_hostname = socket.gethostbyaddr(ip)[0]
    except (socket.herror, socket.gaierror):
        logging.getLogger("MX3.HWR").warning("Failed to resolve the client IP: %s" % ip)
        private_hostname = ""

    return private_address == localhost_range or any(
        private_hostname and private_hostname.endswith(domain)
        for domain in local_domains
    )


def is_local_host(local_domains: list):
    """Determine whether the remote client making the request is a "local host".

    A client is considered a "local host" if it runs on the same host as the
    mxcube-server, or if it belongs to the local network. The local network can
    also be identified by providing a list of domain suffixes considered local.

    Args:
        local_domains (list): A list of domain suffixes that are considered local
            (e.g. ['beamline1.site.eu', 'control.site.eu']).

    Returns:
        bool: True if the client's host is considered a local host; False otherwise.
    """
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

    return remote_address in localhost_list or is_local_network(
        remote_address, local_domains
    )


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


def send_feedback(sender_data):
    local_user = reject_header_value(sender_data.get("LOGGED_IN_USER", "unknown_user"))
    bl_name = reject_header_value(
        HWR.beamline.session.beamline_name or "unknown-beamline"
    )

    from_addr = validate_email(
        HWR.beamline.session.get_property("from_email", "")
        or f"noreply@{HWR.beamline.session.get_property('email_extension', '')}"
    )

    feedback_to = validate_email(
        HWR.beamline.session.get_property("feedback_email", "")
    )

    sender_email = sender_data.get("sender")
    subject = reject_header_value(f"[MX3 FEEDBACK] {local_user} on {bl_name}")
    content = sender_data["content"]

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = feedback_to
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid()

    if sender_email:
        msg["Reply-To"] = sender_email

    msg.set_content(content)

    with smtplib.SMTP("smtp", smtplib.SMTP_PORT, timeout=10) as smtp:
        smtp.send_message(msg)


def reject_header_value(value: str) -> str:
    value = (value or "").strip()
    if "\r" in value or "\n" in value:
        raise ValueError("Invalid header value")
    return value


def validate_content(value: str, max_length: int = 5000) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError("Invalid content")

    content = value.strip()
    if len(content) > max_length:
        raise ValueError("Invalid content")
    if "\x00" in content:
        raise ValueError("Invalid content")

    if "<" in content:
        parser = _HTMLTagDetector()
        parser.feed(content)
        parser.close()
        if parser.found_tag:
            raise ValueError("Invalid content")

    return content


def validate_email(value: str) -> str:
    value = reject_header_value(value)
    name, addr = parseaddr(value)
    if not addr or "@" not in addr:
        raise ValueError("Invalid email")
    return value
