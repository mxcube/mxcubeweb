import json
import random

from gevent.event import Event
from mxcubecore import HardwareRepository as HWR


def test_set_phase(client):
    """Check the "set phase" operation.

    Sets phase to a phase P (any phase in the phase list), checks if the
    actual phase after set_phase is P.

    Moves the phase back to the original phase OP, and verifies that the
    current phase after the move is OP
    """
    # Get current phase
    resp = client.get("/mxcube/api/v0.1/hwobj/diffractometer/diffractometer/get_value")
    info = json.loads(resp.data)

    phase_list = info["phaseList"]

    new_phase = phase_list[random.randint(0, len(phase_list) - 1)]

    # Set a phase (any in the phase list)
    resp = client.put(
        "/mxcube/api/v0.1/hwobj/diffractometer/diffractometer/set_phase",
        data=json.dumps({"phase": new_phase}),
        content_type="application/json",
    )

    # Retrieve current phase
    resp = client.get("/mxcube/api/v0.1/hwobj/diffractometer/diffractometer/get_value")
    actual_phase = json.loads(resp.data)["currentPhase"]

    assert new_phase == actual_phase


def test_set_beam_size(client):
    """Check the "set beam size" operation.

    Sets the beam size to a value belonging to the list of valid
    beam sizes and verifies that the beam size actually changed to it.

    Moves the beam size back to its original value and verifies that the
    original value also is the current
    """
    resp = client.get(
        "/mxcube/api/v0.1/hwobj/beam/beam/get_value",
    )
    data = json.loads(resp.data)

    original_beam_size = data["value"]["currentAperture"]

    # apertureList entries are NStateOption objects ({"value", "label", ...}),
    # the underlying hardware object's set_value expects the plain string value
    beam_size = data["value"]["apertureList"][0]["value"]

    # make sure we are testing a change of beam size
    assert beam_size != original_beam_size

    resp = client.put(
        "/mxcube/api/v0.1/hwobj/beam/beam/set_value",
        data=json.dumps({"value": beam_size}),
        content_type="application/json",
    )
    assert resp.status_code == 200

    resp = client.get(
        "/mxcube/api/v0.1/hwobj/beam/beam/get_value",
    )
    actual_beam_size = json.loads(resp.data)["value"]["currentAperture"]

    beam_size_value_changed = Event()
    # listen for 'valueChanged' signal
    HWR.beamline.beam.aperture.connect(
        "valueChanged", lambda *_, **__: beam_size_value_changed.set()
    )

    resp = client.put(
        "/mxcube/api/v0.1/hwobj/beam/beam/set_value",
        data=json.dumps({"value": original_beam_size}),
        content_type="application/json",
    )
    assert resp.status_code == 200
    # wait until beam size changes the value
    beam_size_value_changed.wait(timeout=10)
    assert beam_size_value_changed.is_set(), "valueChanged signal was not emitted"

    resp = client.get(
        "/mxcube/api/v0.1/hwobj/beam/beam/get_value",
    )
    actual_original_beam_size = json.loads(resp.data)["value"]["currentAperture"]

    assert beam_size == actual_beam_size
    assert actual_original_beam_size == original_beam_size
