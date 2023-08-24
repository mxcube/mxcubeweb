#


"""Authentication tests."""


import os

import pytest

import mxcube3
import mxcubecore

URL_BASE = "/mxcube/api/v0.1/login"
URL_SIGNIN = f"{URL_BASE}/"  # Trailing slash is necessary
URL_SIGNOUT = f"{URL_BASE}/signout"
URL_INFO = f"{URL_BASE}/login_info"

CREDENTIALS_0 = {"proposal": "idtest0", "password": "sUpErSaFe"}
# Password has to be `wrong` to simulate wrong password in `ISPyBClientMockup`
CREDENTIALS_0_WRONG = {"proposal": "idtest0", "password": "wrong"}
CREDENTIALS_1 = {"proposal": "idtest1", "password": "sUpErSaFe"}

USER_DB_PATH = "/tmp/mxcube-test-user.db"


@pytest.fixture
def server():
    try:
        os.remove(USER_DB_PATH)
    except FileNotFoundError:
        pass

    mxcubecore.HardwareRepository.uninit_hardware_repository()

    argv = []
    server_, _ = mxcube3.build_server_and_config(test=True, argv=argv)
    server_.flask.config["TESTING"] = True

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
    assert resp.json["code"] == "ok"
    assert resp.json["msg"] == "Successful login"


def test_authn_signin_wrong_credentials(client):
    resp = client.post(URL_SIGNIN, json=CREDENTIALS_0_WRONG)
    assert resp.status_code == 200
    assert "code" not in resp.json
    assert resp.json["msg"] == "Could not authenticate"


def test_authn_signout(client):
    resp = client.post(URL_SIGNIN, json=CREDENTIALS_0)
    assert resp.json["code"] == "ok"

    resp = client.get(URL_SIGNOUT)
    assert resp.status_code == 302
    assert resp.headers["Location"] == "/login"


def test_authn_info(client):
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
    assert resp.json["loginType"] == "Proposal"
    assert resp.json["user"]["inControl"] == True


def test_authn_same_proposal(make_client):
    """Test two users for the same proposal.

    If a user signs in for the same proposal as another user already signed in,
    this user should not be "in control".
    """

    client_0 = make_client()
    resp = client_0.post(URL_SIGNIN, json=CREDENTIALS_0)
    assert resp.json["code"] == "ok"
    resp = client_0.get(URL_INFO)
    assert resp.json["user"]["inControl"] == True

    client_1 = make_client()
    resp = client_1.post(URL_SIGNIN, json=CREDENTIALS_0)
    assert resp.json["code"] == "ok"
    resp = client_1.get(URL_INFO)
    assert resp.json["user"]["inControl"] == False


def test_authn_different_proposals(make_client):
    """Test two users for different proposals.

    If a user signs in for a different proposal than an already signed in user,
    this user should not be allowed to sign in.
    """

    client_0 = make_client()
    resp = client_0.post(URL_SIGNIN, json=CREDENTIALS_0)
    assert resp.json["code"] == "ok"
    resp = client_0.get(URL_INFO)
    assert resp.json["user"]["inControl"] == True

    client_1 = make_client()
    resp = client_1.post(URL_SIGNIN, json=CREDENTIALS_1)
    assert resp.status_code == 200
    assert resp.json["msg"] == "Could not authenticate"


# EOF
