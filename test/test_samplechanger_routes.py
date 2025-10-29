import json


def test_get_sample_list(client):
    """Check retrieval of the samples list from lims."""
    resp = client.get("/mxcube/api/v0.1/lims/samples_list")
    data = json.loads(resp.data)

    assert isinstance(data["sampleList"], dict)
    assert isinstance(data["sampleOrder"], list)


def test_get_loaded_sample(client):
    """Check retrieval of the sample changer loaded sample."""
    resp = client.get(
        "/mxcube/api/v0.1/hwobj/sample_changer/sample_changer/loaded_sample"
    )
    data = json.loads(resp.data)

    assert isinstance(data["address"], str)
    assert isinstance(data["barcode"], str)


def test_get_sc_contents_view(client):
    """Check retrieval of the sample changer contents."""
    resp = client.get(
        "/mxcube/api/v0.1/hwobj/sample_changer/sample_changer/get_contents"
    )
    data = json.loads(resp.data)

    assert isinstance(data["children"], list)


def test_get_initial_state(client):
    """Check retrieval of the sample changer initial state."""
    resp = client.get("/mxcube/api/v0.1/hwobj/sample_changer/sample_changer/get_value")
    data = json.loads(resp.data)

    assert isinstance(data["cmds"], dict)
    assert isinstance(data["cmds"]["cmds"], list)
    assert isinstance(data["contents"], dict)
    assert isinstance(data["global_state"], dict)
    assert isinstance(data["loaded_sample"], dict)
    assert isinstance(data["msg"], str)
    assert isinstance(data["state"], str)
