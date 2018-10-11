import sys
import pytest
import json

from mxcube3 import server


sys.path.append('./')


@pytest.fixture
def client():
    server.config['TESTING'] = True

    client = server.test_client()

    data = json.dumps({'proposal': 'idtest000',
                       'password': 'sUpErSaFe'})

    client.post("/mxcube/api/v0.1/login", data=data,
                content_type='application/json')

    yield client


def test_beamline_get_all_attributes(client):
    """
    Checks that the data returned has the right structure and if "all"
    beamline movables are at least present
    """
    resp = client.get("/mxcube/api/v0.1/beamline")
    data = json.loads(resp.data)

    actual = data.get("movables").keys()

    minimal = ['sampx', 'sampy', 'safety_shutter', 'energy',
               'focus', 'wavelength', 'BackLight', 'beamstop', 'detdist',
               'phi', 'fast_shutter', 'FrontLight', 'transmission', 'zoom',
               'resolution', 'phiz', 'phiy']

    assert isinstance(data['movables'], dict)
    assert isinstance(data['actionsList'], list)
    assert isinstance(data['path'], unicode)
    assert len(data['energyScanElements']) == 31
    assert isinstance(data['availableMethods'], dict)

    for movable in minimal:
        assert movable in actual


def test_get_movable(client):
    """
    Tests retrieval of all the beamline movables (one by one), checks that
    the data returned at-least contain a minimal set of keys that make up a
    'movable'
    """
    movables = ['BackLight', 'safety_shutter', 'sampx', 'sampy',  'energy',
                'focus', 'wavelength', 'beamstop', 'detdist',
                'phi', 'fast_shutter', 'FrontLight', 'transmission', 'zoom',
                'resolution', 'phiz', 'phiy']

    for name in movables:
        resp = client.get("/mxcube/api/v0.1/beamline/movable/%s" % name)

        data = json.loads(resp.data)
        # Check for minimal set of attributes
        keys = ['name', 'state', 'value']

        for key in keys:
            assert key in data


def test_set_movable(client):
    """
    Tests set on movables

    Basically only tests that the set command executes without unexpected
    errors. Reads the movables current value and sets it to the same
    """
    movables = ['BackLight', 'safety_shutter', 'sampx', 'sampy',  'energy',
                'focus', 'wavelength', 'beamstop', 'detdist',
                'phi', 'fast_shutter', 'FrontLight', 'transmission', 'zoom',
                'resolution', 'phiz', 'phiy']

    for name in movables:
        resp = client.get("/mxcube/api/v0.1/beamline/movable/%s" % name)
        data = json.loads(resp.data)

        new_value = data.get("value")

        resp = client.\
            put("/mxcube/api/v0.1/beamline/movable/%s/%s" % (name, new_value))

        resp = client.get("/mxcube/api/v0.1/beamline/movable/%s" % name)
        data = json.loads(resp.data)

        assert data.get("value", None) == new_value


def test_get_beam_info(client):
    """
    Tests retrieval of information regarding the beam, and that the data is
    returned on the expected format
    """
    resp = client.get("/mxcube/api/v0.1/beam/info")
    data = json.loads(resp.data)

    assert isinstance(data['currentAperture'], unicode)
    assert len(data['apertureList']) >= 0
    assert isinstance(data['position'][0], int)
    assert isinstance(data['position'][1], int)
    assert isinstance(data['size_x'], float)
    assert isinstance(data['size_y'], float)


def test_get_data_path(client):
    """
    Retrieve data path, this is specific for each beamline.
    """
    resp = client.get("/mxcube/api/v0.1/beamline/datapath")
    data = json.loads(resp.data)
    assert isinstance(data['path'], unicode)
    assert len(data) > 0
