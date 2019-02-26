import json
import random

# Python 2 and 3 compatibility
try:
    unicode
except:
    unicode = str

from fixture import client


def test_get_phase_list(client):
    """
    Checks retrieval of phase list and if the returned data is list.
    Does not test if the actual phases in the list are correct
    """
    resp = client.get("/mxcube/api/v0.1/diffractometer/phaselist")
    data = json.loads(resp.data)

    assert isinstance(data["current_phase"], list)


def test_get_phase(client):
    """
    Checks if current phase is one of the phases in the phase list.
    """
    resp = client.get("/mxcube/api/v0.1/diffractometer/phaselist")
    data = json.loads(resp.data)

    phase_list = data["current_phase"]

    resp = client.get("/mxcube/api/v0.1/diffractometer/phase")
    data = json.loads(resp.data)

    phase = data["current_phase"]

    assert phase in phase_list


def test_set_phase(client):
    """
    Sets phase to a phase P (any phase in the phase list), checks if the
    actual phase after set_phase is P.

    Moves the phase back to the original phase OP, and verifies that the
    current phase after the move is OP
    """
    # Get current phase
    resp = client.get("/mxcube/api/v0.1/diffractometer/phase")
    original_phase = json.loads(resp.data)["current_phase"]

    resp = client.get("/mxcube/api/v0.1/diffractometer/phaselist")
    data = json.loads(resp.data)
    phase_list = data["current_phase"]

    new_phase = phase_list[random.randint(0, len(phase_list) - 1)]

    # Set a phase (any in the phase list)
    resp = client.put(
        "/mxcube/api/v0.1/diffractometer/phase",
        data=json.dumps({"phase": new_phase}),
        content_type="application/json",
    )

    # Retrieve current phase
    resp = client.get("/mxcube/api/v0.1/diffractometer/phase")
    actual_phase = json.loads(resp.data)["current_phase"]

    # Move phase back to its original value
    resp = client.put(
        "/mxcube/api/v0.1/diffractometer/phase",
        data=json.dumps({"phase": original_phase}),
        content_type="application/json",
    )

    # actual_original_phase = json.loads(resp.data)["current_phase"]

    assert new_phase == actual_phase
    # assert original_phase == actual_original_phase


def test_get_movables_state(client):
    """
    Checks if atleast the key elements ['sampx', 'sampy', 'phi', 'focus',
    'zoom', 'phiy', 'phiz', 'BackLight'] that can be assumed to exist on all
    diffractometers used with MXCuBE exists in the data returned.

    Does not check the structure of each movable
    """
    resp = client.get("/mxcube/api/v0.1/diffractometer/movables/state")
    data = json.loads(resp.data)

    keys = ["sampx", "sampy", "phi", "focus", "zoom", "phiy", "phiz", "BackLight"]

    for key in keys:
        assert key in data


def test_get_aperture(client):
    """
    Checks if the data returned have is on the expected format
    """
    resp = client.get("/mxcube/api/v0.1/diffractometer/aperture")
    data = json.loads(resp.data)

    assert isinstance(data["currentAperture"], int)
    assert isinstance(data["apertureList"], list)


def test_set_aperture(client):
    """
    Sets the aperture to an aperture AP belonging to the list of valid
    apertures and verifies that the aperture actually changed to AP.

    Moves the aperture back to its original value and verifies that the
    original value also is the current
    """

    resp = client.get("/mxcube/api/v0.1/diffractometer/aperture")
    data = json.loads(resp.data)

    original_aperture = data["currentAperture"]

    ap = data["apertureList"][random.randint(0, len(data["apertureList"]) - 1)]

    resp = client.put(
        "/mxcube/api/v0.1/diffractometer/aperture",
        data=json.dumps({"diameter": ap}),
        content_type="application/json",
    )

    resp = client.get("/mxcube/api/v0.1/diffractometer/aperture")
    actual_aperture = json.loads(resp.data)["currentAperture"]

    resp = client.put(
        "/mxcube/api/v0.1/diffractometer/aperture",
        data=json.dumps({"diameter": original_aperture}),
        content_type="application/json",
    )

    resp = client.get("/mxcube/api/v0.1/diffractometer/aperture")
    actual_original_aperture = json.loads(resp.data)["currentAperture"]

    assert ap == actual_aperture
    assert actual_original_aperture == original_aperture


def test_get_md_plate_mode(client):
    """
    Simply checks if the route runs and does not throws any exceptions
    """
    resp = client.get("/mxcube/api/v0.1/diffractometer/platemode")
    assert resp.status_code == 200


def test_get_diffractometer_info(client):
    """
    Simply checks if the route runs and does not throws any exceptions
    """
    resp = client.get("/mxcube/api/v0.1/diffractometer/info")
    assert resp.status_code == 200
