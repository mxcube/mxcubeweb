import json

from fixture import client


def test_get_sample_list(client):
    """
    Checks retrieval of the samples list from lims
    """
    resp = client.get("/mxcube/api/v0.1/sample_changer/samples_list")
    data = json.loads(resp.data)

    assert isinstance(data["sampleList"], dict)
    assert isinstance(data["sampleOrder"], list)


def test_get_sc_state(client):
    """
    Checks retrieval of the sample changer state
    """
    resp = client.get("/mxcube/api/v0.1/sample_changer/state")
    data = json.loads(resp.data)

    assert isinstance(data["state"], str)


def test_get_loaded_sample(client):
    """
    Checks retrieval of the sample changer loaded sample
    """
    resp = client.get("/mxcube/api/v0.1/sample_changer/loaded_sample")
    data = json.loads(resp.data)

    assert isinstance(data["address"], str)
    assert isinstance(data["barcode"], str)


def test_get_sc_contents_view(client):
    """
    Checks retrieval of the sample changer contents
    """
    resp = client.get("/mxcube/api/v0.1/sample_changer/contents")
    data = json.loads(resp.data)
    resp = client.get("/mxcube/api/v0.1/sample_changer/capacity")
    capacity = json.loads(resp.data)["capacity"]

    assert isinstance(data["children"], list)
    assert len(data["children"]) == capacity["num_baskets"]  # pucks

    num_samples = 0
    for basket in data["children"]:
        num_samples += len(basket["children"])

    assert num_samples == capacity["num_samples"]  # samples


def test_get_maintenance_cmds(client):
    """
    Checks retrieval of the sample changer manteniance commands
    """
    resp = client.get("/mxcube/api/v0.1/sample_changer/get_maintenance_cmds")
    data = json.loads(resp.data)

    assert isinstance(data["cmds"], list)


def test_get_global_state(client):
    """
    Checks retrieval of the sample changer global state
    """
    resp = client.get("/mxcube/api/v0.1/sample_changer/get_global_state")
    data = json.loads(resp.data)

    assert isinstance(data["commands_state"], dict)
    assert isinstance(data["message"], str)
    assert isinstance(data["state"], dict)


def test_get_initial_state(client):
    """
    Checks retrieval of the sample changer initial state
    """
    resp = client.get("/mxcube/api/v0.1/sample_changer/get_initial_state")
    data = json.loads(resp.data)

    assert isinstance(data["cmds"], dict)
    assert isinstance(data["cmds"]["cmds"], list)
    assert isinstance(data["contents"], dict)
    assert isinstance(data["global_state"], dict)
    assert isinstance(data["loaded_sample"], dict)
    assert isinstance(data["msg"], str)
    assert isinstance(data["state"], str)
