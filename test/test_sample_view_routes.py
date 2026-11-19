import json

from mxcubecore import HardwareRepository as HWR


def test_delete_all_shapes(client):
    """All the shapes of the sample view are deleted at once."""
    sample_view = HWR.beamline.sample_view
    position = sample_view.get_positions()
    sample_view.add_shape_from_mpos([position], (0, 0), "P")
    sample_view.add_shape_from_mpos([position], (0, 0), "G")

    resp = client.get("/mxcube/api/v0.1/hwobj/sample_view/sample_view/shapes")
    assert len(json.loads(resp.data)) >= 2

    resp = client.put(
        "/mxcube/api/v0.1/hwobj/sample_view/sample_view/delete_all_shapes",
        data=json.dumps({}),
        content_type="application/json",
    )

    assert resp.status_code == 200
    assert list(sample_view.get_shapes()) == []
