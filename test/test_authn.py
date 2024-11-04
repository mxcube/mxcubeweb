#


"""Authentication tests."""


import os
import time

import mxcubecore
import pytest

import mxcubeweb

URL_BASE = "/mxcube/api/v0.1/login"
URL_SIGNIN = f"{URL_BASE}/"  # Trailing slash is necessary
URL_SIGNOUT = f"{URL_BASE}/signout"
URL_INFO = f"{URL_BASE}/login_info"
URL_REFRESH = f"{URL_BASE}/refresh_session"

CREDENTIALS_0 = {"proposal": "idtest0", "password": "sUpErSaFe"}
# Password has to be `wrong` to simulate wrong password in `ISPyBClientMockup`
CREDENTIALS_0_WRONG = {"proposal": "idtest0", "password": "wrong"}
CREDENTIALS_1 = {"proposal": "idtest1", "password": "sUpErSaFe"}

SESSION_LIFETIME = 2.0  # seconds

USER_DB_PATH = "/tmp/mxcube-test-user.db"


@pytest.fixture(params=["proposal", "user"])
def login_type(request):
    return request.param


@pytest.fixture
def server(request, login_type):
    try:
        os.remove(USER_DB_PATH)
    except FileNotFoundError:
        pass

    mxcubecore.HardwareRepository.uninit_hardware_repository()

    argv = []
    server_, _ = mxcubeweb.build_server_and_config(test=True, argv=argv)
    server_.flask.config["TESTING"] = True
    # For the tests we override the configured value of the session lifetime
    # with a much smaller value, so that tests do not need to wait as long.
    server_.flask.permanent_session_lifetime = SESSION_LIFETIME

    hw_repo = mxcubecore.HardwareRepository.get_hardware_repository()
    lims = hw_repo.get_hardware_object("lims")
    lims.set_property("loginType", login_type)

    yield server_

    try:
        os.remove(USER_DB_PATH)
    except FileNotFoundError:
        pass


@pytest.fixture
def make_client(server):
    def _make_client():
        return server.flask.test_client()

    return _make_client


@pytest.fixture
def client(make_client):
    return make_client()


def test_authn_signin_good_credentials(client):
    resp = client.post(URL_SIGNIN, json=CREDENTIALS_0)
    assert resp.status_code == 200
    assert resp.json["msg"] == ""


def test_authn_signin_wrong_credentials(client):
    resp = client.post(URL_SIGNIN, json=CREDENTIALS_0_WRONG)
    assert resp.status_code == 200
    assert "code" not in resp.json, "Could authenticate with wrong credentials"
    assert resp.json["msg"] == "Could not authenticate"


def test_authn_signout(client):
    resp = client.post(URL_SIGNIN, json=CREDENTIALS_0)

    resp = client.get(URL_SIGNOUT)
    assert resp.status_code == 200
    assert resp.json == ""


def test_authn_info(client, login_type):
    """Test login info.

    The login info should have `loggedIn` false before authentication
    and true after successful authentication.
    """
    resp = client.get(URL_INFO)
    assert resp.status_code == 200
    assert resp.json["loggedIn"] == False

    client.post(URL_SIGNIN, json=CREDENTIALS_0)

    resp = client.get(URL_INFO)
    assert resp.status_code == 200
    assert resp.json["loggedIn"] == True
    assert resp.json["loginType"].lower() == login_type
    assert resp.json["user"]["inControl"] == True


# Test against proposal-based authentication only
@pytest.mark.parametrize("login_type", ["proposal"], indirect=True)
def test_authn_same_proposal(make_client):
    """Test two users for the same proposal.

    If a user signs in for the same proposal as another user already signed in,
    this user should not be "in control".
    """

    client_0 = make_client()
    resp = client_0.post(URL_SIGNIN, json=CREDENTIALS_0)

    assert resp.status_code == 200
    resp = client_0.get(URL_INFO)
    assert resp.json["user"]["inControl"] == True

    client_1 = make_client()
    resp = client_1.post(URL_SIGNIN, json=CREDENTIALS_0)
    assert resp.status_code == 200
    resp = client_1.get(URL_INFO)
    assert resp.json["user"]["inControl"] == False


# # Test against proposal-based authentication only
# @pytest.mark.parametrize("login_type", ["proposal"], indirect=True)
# def test_authn_different_proposals(make_client):
#     """Test two users for different proposals.

#     If a user signs in for a different proposal than an already signed in user,
#     this user should not be allowed to sign in.
#     """
#     client_0 = make_client()
#     resp = client_0.post(URL_SIGNIN, json=CREDENTIALS_0)
#     assert resp.status_code == 200
#     resp = client_0.get(URL_INFO)
#     assert resp.status_code == 200

#     client_1 = make_client()
#     resp = client_1.post(URL_SIGNIN, json=CREDENTIALS_1)
#     assert resp.status_code == 200
#     import pdb
#     pdb.set_trace()
#     assert resp.json["msg"] == "Could not authenticate"


def test_authn_session_timeout(client):
    """Test the session timeout

    The session can be refreshed, and can expire.
    It should be possible to sign in again after a valid session expired.
    """

    # Sign in and --as a side effect-- create a session
    client.post(URL_SIGNIN, json=CREDENTIALS_0)
    resp = client.get(URL_INFO)

    # Let the session nearly expire
    time.sleep(SESSION_LIFETIME * 0.9)

    # Refresh the session
    resp = client.get(URL_REFRESH)

    # Let the session nearly expire again
    time.sleep(SESSION_LIFETIME * 0.9)

    # Check that the session still has not expired
    resp = client.get(URL_INFO)
    assert resp.status_code == 200
    assert resp.json["loggedIn"] == True, "Session did not refresh"

    # Let the session expire completely
    time.sleep(SESSION_LIFETIME * 1.5)

    # Check that the session has expired
    resp = client.get(URL_INFO)
    assert resp.status_code == 200
    assert resp.json["loggedIn"] == False, "Session did not expire"

    # Check that it is possible to sign in again
    client.post(URL_SIGNIN, json=CREDENTIALS_0)
    resp = client.get(URL_INFO)
    assert resp.json["loggedIn"] == True, "We can not login again"
