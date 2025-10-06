import json


def test_beamline_get_all_attribute(client):
    """
    Checks that the data returned has the right structure and if "all"
    beamline attributes are at least present
    """
    resp = client.get(
        "/mxcube/api/v0.1/hwobj/beamline/beamline/get_value",
    )
    data = json.loads(resp.data)

    actual = list(data.get("hardwareObjects").keys())

    expected = [
        "beam",
        "beam.aperture",
        "cryo",
        "detector",
        "detector.detector_distance",
        "diffractometer",
        "diffractometer.backlight",
        "diffractometer.backlightswitch",
        "diffractometer.beamstop",
        "diffractometer.beamstop_distance",
        "diffractometer.capillary",
        "diffractometer.frontlight",
        "diffractometer.frontlightswitch",
        "diffractometer.kappa",
        "diffractometer.kappa_phi",
        "diffractometer.phi",
        "diffractometer.phix",
        "diffractometer.phiy",
        "diffractometer.phiz",
        "diffractometer.sampx",
        "diffractometer.sampy",
        "diffractometer.zoom",
        "energy",
        "energy.wavelength",
        "fast_shutter",
        "flux",
        "machine_info",
        "resolution",
        "safety_shutter",
        "transmission",
        "beamline_actions",
        "sample_changer",
    ]

    assert isinstance(data["hardwareObjects"], dict)
    assert isinstance(data["actionsList"], list)
    assert isinstance(data["path"], str)
    assert len(data["energyScanElements"]) == 31
    assert len(actual) == len(expected)


def test_beamline_get_attribute(client):
    """
    Tests retrieval of all the beamline attributes (one by one), checks that
    the data returned at-least contain a minimal set of keys that make up a
    'beamline attribute'
    """
    bl_attrs = [
        ("safety_shutter", "nstate"),
        ("diffractometer.capillary", "nstate"),
        ("diffractometer.beamstop", "nstate"),
        ("fast_shutter", "nstate"),
        ("resolution", "motor"),
        ("energy", "motor"),
        ("flux", "actuator"),
        ("transmission", "motor"),
        ("detector.detector_distance", "motor"),
    ]

    for name, adapter_type in bl_attrs:
        resp = client.get(
            f"/mxcube/api/v0.1/hwobj/{adapter_type}/{name}/data",
        )
        data = json.loads(resp.data)

        # Check for minimal set of attributes
        keys = ["name", "state", "value"]

        for key in keys:
            assert key in data

        assert data["available"] == True
        assert resp.status_code == 200


def test_beamline_set_attribute(client):
    """
    Tests set on the writable attributes

    Basically only tests that the set command executes without unexpected
    errors. Reads the attributes current value and sets it to the same, so
    that the test can be safely executed on a beamline.
    """
    bl_attrs = [
        ("resolution", "motor"),
        ("energy", "energy"),
        ("transmission", "motor"),
        ("safety_shutter", "nstate"),
        ("diffractometer.beamstop", "nstate"),
        ("fast_shutter", "nstate"),
        ("detector.detector_distance", "motor"),
    ]

    for name, adapter_type in bl_attrs:
        resp = client.get(f"/mxcube/api/v0.1/hwobj/{adapter_type}/{name}/data")
        data = json.loads(resp.data)

        new_value = data.get("value")

        resp = client.put(
            f"/mxcube/api/v0.1/hwobj/{adapter_type}/{name}/set_value",
            data=json.dumps({"name": name, "value": new_value}),
            content_type="application/json",
        )

        resp = client.get(f"/mxcube/api/v0.1/hwobj/{adapter_type}/{name}/data")
        data = json.loads(resp.data)
        value = data.get("value", None)

        assert value == new_value


def test_get_beam_info(client):
    """
    Tests retrieval of information regarding the beam, and that the data is
    returned on the expected format
    """
    resp = client.get(
        "/mxcube/api/v0.1/hwobj/beam/beam/get_value",
    )
    data = json.loads(resp.data)["value"]

    assert isinstance(data["currentAperture"], str)
    assert len(data["apertureList"]) > 0
    assert isinstance(data["position"][0], float)
    assert isinstance(data["position"][1], float)
    assert isinstance(data["size_x"], float)
    assert isinstance(data["size_y"], float)
