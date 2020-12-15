import json

from fixture import client
from mxcube3.core.loginutils import (
    lims_login_type,
    user_type,
    define_user_type,
    logged_in_users,
    users,
    get_user_by_name,
    is_local_network
)

def test_signout(client):
    """Test if we can signout."""
    resp = client.get("/mxcube/api/v0.1/signout")
    assert resp.status_code == 200

def test_login_info(client):
    """Test if we can get login info."""
    resp = client.get("/mxcube/api/v0.1/login_info")
    actual = json.loads(resp.data)
    print(actual)
    assert resp.status_code == 200

def test_forceusersignout(client):
    """Test if we can get signout a user."""
    resp = client.post("/mxcube/api/v0.1/forceusersignout",
        data=json.dumps({
            "sid": "19fd5ba1-d30f-4000-ba34-7c8204d9dc63"}),
        content_type="application/json",
    )
    # it will fail due to wrong sid
    assert resp.status_code == 409

def test_login_type(client):
    """Test we get the correct login type"""
    _type = lims_login_type()
    assert _type in ['user', 'proposal']

def test_user_type(client):
    """Test we get the correct login type"""
    try:
        # sid does not exist
        _type = user_type("19fd5ba1-d30f-4000-ba34-7c8204d9dc63")
    except AttributeError:
        assert True

def test_define_user_type(client):
    """test for proper user types definitions."""
    _type = define_user_type(True, False, False)
    assert _type == 'local'
    _type = define_user_type(True, True, False)
    assert _type == 'staff'
    _type = define_user_type(False, False, False)
    assert _type == 'remote'

def test_logged_in_users(client):
    _users = logged_in_users()
    assert 'idtest0' in _users

def test_get_users(client):
    _users = users()
    print(_users)
    _sid = list(_users.keys())[0]
    assert 'idtest0' == _users.get(_sid).get('loginID')

def test_get_user_by_name(client):
    _user = get_user_by_name('idtest0')
    print(_user)
    assert _user is not None

def test_is_local_network(client):
    assert is_local_network('127.0.0.1')
    assert not is_local_network('123.123.123.123')
