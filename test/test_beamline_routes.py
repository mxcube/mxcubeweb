import json

# Python 2 and 3 compatibility
try:
    unicode
except:
    unicode = str

from fixture import client


def test_beamline_get_all_attribute(client):
    """
    Checks that the data returned has the right structure and if "all"
    beamline attributes are at least present
    """
    resp = client.get("/mxcube/api/v0.1/beamline")
    data = json.loads(resp.data)

    actual = list(data.get("attributes").keys())

    expected = ['beamstop',
                'cryo',
                'detdist',
                'energy',
                'fast_shutter',
                'flux',
                'machinfo',
                'resolution',
                'safety_shutter',
                'transmission',
                'wavelength']

    assert isinstance(data["attributes"], dict)
    assert isinstance(data["actionsList"], list)
    assert isinstance(data["path"], unicode)
    assert len(data["energyScanElements"]) == 31
    assert isinstance(data["availableMethods"], dict)
    assert len(actual) == len(expected)


def test_beamline_get_attribute(client):
    """
    Tests retrieval of all the beamline attributes (one by one), checks that
    the data returned at-least contain a minimal set of keys that make up a
    'beamline attribute'
    """
    bl_attrs = [
        "safety_shutter",
        "beamstop",
        "fast_shutter",
        "resolution",
        "energy",
        "flux",
        "cryo",
        "wavelength",
        "transmission",
        "machinfo",
        "detdist",
    ]

    for name in bl_attrs:
        resp = client.get("/mxcube/api/v0.1/beamline/%s" % name)

        data = json.loads(resp.data)

        # Check for minimal set of attributes
        keys = ["name", "state", "value"]

        for key in keys:
            assert key in data

        assert resp.status_code == 200


def test_beamline_set_attribute(client):
    """
    Tests set on the writable attributes

    Basically only tests that the set command executes without unexpected
    errors. Reads the attributes current value and sets it to the same, so
    that the test can be safely executed on a beamline.
    """
    bl_attrs = [
        "resolution",
        "energy",
        "wavelength",
        "transmission",
        "safety_shutter",
        "beamstop",
        "fast_shutter",
        "detdist",
    ]

    for name in bl_attrs:
        resp = client.get("/mxcube/api/v0.1/beamline/%s" % name)
        data = json.loads(resp.data)

        new_value = data.get("value")

        resp = client.put(
            "/mxcube/api/v0.1/beamline/%s" % name,
            data=json.dumps({"name": name, "value": new_value}),
            content_type="application/json",
        )

        resp = client.get("/mxcube/api/v0.1/beamline/%s" % name)
        data = json.loads(resp.data)

        assert data.get("value", None) == new_value


def test_get_beam_info(client):
    """
    Tests retrieval of information regarding the beam, and that the data is
    returned on the expected format
    """
    resp = client.get("/mxcube/api/v0.1/beam/info")
    data = json.loads(resp.data)

    assert isinstance(data["currentAperture"], int)
    assert len(data["apertureList"]) >= 0
    assert isinstance(data["position"][0], int)
    assert isinstance(data["position"][1], int)
    assert isinstance(data["size_x"], float)
    assert isinstance(data["size_y"], float)


def test_get_data_path(client):
    """
    Retrieve data path, this is specific for each beamline.
    """
    resp = client.get("/mxcube/api/v0.1/beamline/datapath")
    data = json.loads(resp.data)
    assert isinstance(data["path"], unicode)
    assert len(data) > 0
