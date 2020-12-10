import json

from fixture import client

def test_request_contro(client):
    """Test if we can request the control."""
    resp = client.post("/mxcube/api/v0.1/ra/request_control",
        data=json.dumps({
            "name": "test",
            "control": "True",
            "message": "Please give me control"}),
        content_type="application/json",
    )
    assert resp.status_code == 200

def test_take_contro(client):
    """Test if we can take the control."""
    resp = client.post("/mxcube/api/v0.1/ra/take_control",
        data=json.dumps({
            "name": "test",
            "control": "True",
            "message": "Please give me control"}),
        content_type="application/json",
    )
    assert resp.status_code == 200

def test_give_control(client):
    """Test if we can give the control."""
    resp = client.post("/mxcube/api/v0.1/ra/give_control",
        data=json.dumps({
            "sid": "19fd5ba1-d30f-4000-ba34-7c8204d9dc63"}),
        content_type="application/json",
    )
    # it will fail due to missing sid
    assert resp.status_code == 409