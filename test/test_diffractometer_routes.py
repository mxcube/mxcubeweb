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


def test_set_aperture(client):
    """Check the "set aperture" operation.

    Sets the aperture to an aperture AP belonging to the list of valid
    apertures and verifies that the aperture actually changed to AP.

    Moves the aperture back to its original value and verifies that the
    original value also is the current
    """
    resp = client.get(
        "/mxcube/api/v0.1/hwobj/beam/beam/get_value",
    )
    data = json.loads(resp.data)

    original_aperture = data["value"]["currentAperture"]

    ap = data["value"]["apertureList"][0]

    # make sure we are testing a change of aperture
    assert ap != original_aperture

    resp = client.put(
        "/mxcube/api/v0.1/hwobj/beam/beam/set_value",
        data=json.dumps({"value": ap}),
        content_type="application/json",
    )

    resp = client.get(
        "/mxcube/api/v0.1/hwobj/beam/beam/get_value",
    )
    actual_aperture = json.loads(resp.data)["value"]["currentAperture"]

    aperture_value_changed = Event()
    # listen for 'valueChanged' signal
    HWR.beamline.beam.aperture.connect(
        "valueChanged", lambda *_, **__: aperture_value_changed.set()
    )

    resp = client.put(
        "/mxcube/api/v0.1/hwobj/beam/beam/set_value",
        data=json.dumps({"value": original_aperture}),
        content_type="application/json",
    )
    # wait until aperture changes the value
    aperture_value_changed.wait()

    resp = client.get(
        "/mxcube/api/v0.1/hwobj/beam/beam/get_value",
    )
    actual_original_aperture = json.loads(resp.data)["value"]["currentAperture"]

    assert ap == actual_aperture
    assert actual_original_aperture == original_aperture
