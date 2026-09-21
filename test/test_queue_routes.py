import copy
import json
import os
import time

from mxcubecore import HardwareRepository as HWR
from mxcubecore.model import queue_model_objects as qmo
from mxcubecore.queue_entry.base_queue_entry import QUEUE_ENTRY_STATUS
from mxcubecore.queuelib import QUEUE_FORMAT_VERSION, WARNING

from mxcubeweb.app import MXCUBEApplication as mxcube

from .input_parameters import (
    default_char_acq_params,
    default_dc_params,
    default_mesh_params,
    default_xrf_parameters,
    test_edit_task,
)


def test_queue_get(client):
    """Test if we can get the queue."""
    resp = client.get("/mxcube/api/v0.1/queue/")
    assert resp.status_code == 200


def test_queue_get_reports_format_version(client):
    """Test the root queue response always carries format_version."""
    resp = client.get("/mxcube/api/v0.1/queue/")
    assert json.loads(resp.data)["format_version"] == QUEUE_FORMAT_VERSION


def test_add_and_get_sample(client):
    """Test if we can add a sample. The sample is added by a fixture."""
    resp = client.get("/mxcube/api/v0.1/queue/")
    assert resp.status_code == 200
    assert json.loads(resp.data).get("1:05")


def test_add_and_get_task(client):
    """Test if we can add a task to the sample."""
    resp = client.get("/mxcube/api/v0.1/queue/")
    assert resp.status_code == 200
    assert len(json.loads(resp.data).get("1:05")["tasks"]) == 1


def test_warning_entry_status_reported_as_warning_not_uncollected(client):
    """QUEUE_ENTRY_STATUS.WARNING (e.g. a Characterisation that ran to
    completion but produced no diffraction plan) must surface as WARNING
    """
    resp = client.get("/mxcube/api/v0.1/queue/")
    node_id = json.loads(resp.data)["1:05"]["tasks"][0]["queueID"]

    _model, entry = mxcube.queue.get_entry(node_id)
    entry.status = QUEUE_ENTRY_STATUS.WARNING

    _enabled, state = mxcube.queue.get_node_state(node_id)
    assert state == WARNING

    resp = client.get("/mxcube/api/v0.1/queue/")
    task = json.loads(resp.data)["1:05"]["tasks"][0]
    assert task["state"] == WARNING


def test_node_to_dict_returns_the_node_itself(client):
    """node_to_dict(node) is the unambiguous replacement for the old
    queue_to_dict([node]) trick (JSON_FORMAT.md known issue #2) - it must
    return a single dict representing that node, not the whole queue and
    not a list of its children."""
    resp = client.get("/mxcube/api/v0.1/queue/")
    task_queue_id = json.loads(resp.data)["1:05"]["tasks"][0]["queueID"]

    model, _entry = mxcube.queue.get_entry(task_queue_id)
    node_dict = mxcube.queue.node_to_dict(model)

    assert node_dict["queueID"] == task_queue_id
    assert node_dict["type"] == "DataCollection"
    assert "sample_order" not in node_dict


def test_add_and_edit_task(client):
    """Test if we can add edit a task i the sample in the queue."""
    resp = client.get("/mxcube/api/v0.1/queue/")
    queue_id = json.loads(resp.data).get("1:05")["queueID"]
    task_queue_id = json.loads(resp.data).get("1:05")["tasks"][0]["queueID"]

    assert resp.status_code == 200
    assert len(json.loads(resp.data).get("1:05")["tasks"]) == 1

    task_to_update = copy.deepcopy(test_edit_task)
    parameter_to_update = "num_images"
    parameter_update_value = 10
    task_to_update["parameters"][parameter_to_update] = parameter_update_value
    resp = client.post(
        ("/mxcube/api/v0.1/queue/{}/{}").format(queue_id, task_queue_id),
        data=json.dumps(task_to_update),
        content_type="application/json",
    )
    assert resp.status_code == 200
    assert (
        json.loads(resp.data).get("parameters")[parameter_to_update]
        == parameter_update_value
    )


def test_gphl_wf_node_serializes_with_wfpath(client):
    """A GphlWorkflow node's serialized parameters must include
    wfpath="Gphl"

    Uses a minimal TaskNode stand-in rather than a real qmo.GphlWorkflow()
    - the latter's __init__ requires HWR.beamline.gphl_workflow.config.
    """

    class FakeGphlNode(qmo.TaskNode):
        def __init__(self):
            super().__init__()
            self.path_template = qmo.PathTemplate()
            self.path_template.precision = "3"
            self.path_template.directory = os.path.join(
                HWR.beamline.session.get_base_image_directory(), "gphl"
            )
            self.strategy_name = "MX3sw"
            self.shape = -1
            # QueueModel.node_index walks every sample child expecting
            # TaskGroup-shaped nodes to have this attribute.
            self.interleave_num_images = 0

    sample_model = HWR.beamline.queue_model.get_sample_by_loc_str("1:05")
    node = FakeGphlNode()
    HWR.beamline.queue_model.add_child(sample_model, node)

    # No real QueueEntry gets auto-created for this stand-in node (that
    # only happens for types registered in MODEL_QUEUE_ENTRY_MAPPINGS) -
    # stub out state lookup, irrelevant to what this test checks.
    serializer = mxcube.queue._qs
    serializer.get_node_state = lambda node_id: (True, 0)
    result = serializer._handle_gphl_node(sample_model, node)

    assert result.type == "GphlWorkflow"
    assert result.parameters.wfpath == "Gphl"


def _new_dc_task(sample_id, subdir):
    return {
        "type": "DataCollection",
        "checked": True,
        "sampleID": sample_id,
        "parameters": {
            "num_images": 3,
            "osc_start": 0,
            "osc_range": 0.1,
            "exp_time": 0.05,
            "energy": 12.7,
            "resolution": 2.0,
            "shape": -1,
            "prefix": "local-user",
            "path": "",
            "subdir": subdir,
        },
    }


def test_add_task_by_loc_str(client):
    """Test add_task appends a single task to a sample addressed by loc_str."""
    resp = client.get("/mxcube/api/v0.1/queue/")
    tasks_before = json.loads(resp.data)["1:05"]["tasks"]
    assert len(tasks_before) == 1

    task_id = mxcube.queue.add_task("1:05", _new_dc_task("1:05", "Sample-1-05/"))
    assert isinstance(task_id, int)

    resp = client.get("/mxcube/api/v0.1/queue/")
    tasks_after = json.loads(resp.data)["1:05"]["tasks"]
    assert len(tasks_after) == 2
    assert tasks_after[-1]["queueID"] == task_id


def test_add_task_by_queue_id(client):
    """Test add_task appends a single task to a sample addressed by queueID."""
    resp = client.get("/mxcube/api/v0.1/queue/")
    sample = json.loads(resp.data)["1:01"]
    assert sample["tasks"] == []

    task_id = mxcube.queue.add_task(
        sample["queueID"], _new_dc_task("1:01", "Sample-1-01/")
    )
    assert isinstance(task_id, int)

    resp = client.get("/mxcube/api/v0.1/queue/")
    tasks_after = json.loads(resp.data)["1:01"]["tasks"]
    assert len(tasks_after) == 1
    assert tasks_after[0]["queueID"] == task_id


def test_new_tasks_get_distinct_run_numbers(client):
    """Two DataCollections added to the same sample with the same subdir
    must get distinct, incrementing run numbers
    """
    mxcube.queue.add_task("1:01", _new_dc_task("1:01", "Sample-1-01/"))
    mxcube.queue.add_task("1:01", _new_dc_task("1:01", "Sample-1-01/"))

    resp = client.get("/mxcube/api/v0.1/queue/")
    tasks = json.loads(resp.data)["1:01"]["tasks"]
    assert len(tasks) == 2

    run_numbers = [t["parameters"]["run_number"] for t in tasks]
    assert run_numbers[0] != run_numbers[1], (
        f"expected distinct run numbers, got {run_numbers}"
    )


def test_add_task_unknown_loc_str_raises(client):
    """Test add_task raises for a sample that isn't in the queue."""
    try:
        mxcube.queue.add_task("9:99", _new_dc_task("9:99", "Sample-9-99/"))
    except RuntimeError:
        pass
    else:
        raise AssertionError("Expected RuntimeError for unknown sample loc_str")


def test_queue_start(client):
    """Test if we can start the queue.

    The queue requires a sample and a task to start which are added by fixtures.
    It also requires a 3d point to be saved before it move from paused state to running.
    Unpause is called to mimick that.
    """
    resp = client.get("/mxcube/api/v0.1/queue/")
    assert resp.status_code == 200
    assert len(json.loads(resp.data).get("1:05")["tasks"]) == 1

    resp = client.put(
        "/mxcube/api/v0.1/queue/start",
        data=json.dumps({"sid": "1:05"}),
        content_type="application/json",
    )
    assert resp.status_code == 200

    resp = client.put("/mxcube/api/v0.1/queue/unpause")
    assert resp.status_code == 200

    time.sleep(1)

    resp = client.get("/mxcube/api/v0.1/queue/queue_state")
    assert resp.status_code == 200
    assert json.loads(resp.data).get("queueStatus") == "QueueRunning"


def test_queue_stop(client):
    """Test if we can stop the queue. The queue is started and then stopped."""
    resp = client.put(
        "/mxcube/api/v0.1/queue/start",
        data=json.dumps({"sid": "1:05"}),
        content_type="application/json",
    )
    assert resp.status_code == 200

    resp = client.put("/mxcube/api/v0.1/queue/unpause")
    assert resp.status_code == 200

    resp = client.get("/mxcube/api/v0.1/queue/queue_state")
    assert resp.status_code == 200
    assert json.loads(resp.data).get("queueStatus") == "QueueRunning"

    resp = client.put("/mxcube/api/v0.1/queue/stop")
    assert resp.status_code == 200

    time.sleep(2)
    resp = client.get("/mxcube/api/v0.1/queue/queue_state")
    assert resp.status_code == 200
    assert json.loads(resp.data).get("queueStatus") == "QueueStopped"


def test_queue_abort(client):
    """Test if we can abort the queue. The queue is started and then aborted."""
    resp = client.put(
        "/mxcube/api/v0.1/queue/start",
        data=json.dumps({"sid": "1:05"}),
        content_type="application/json",
    )
    assert resp.status_code == 200

    resp = client.put("/mxcube/api/v0.1/queue/unpause")
    assert resp.status_code == 200

    resp = client.get("/mxcube/api/v0.1/queue/queue_state")
    assert resp.status_code == 200
    assert json.loads(resp.data).get("queueStatus") == "QueueRunning"

    resp = client.put("/mxcube/api/v0.1/queue/abort")
    assert resp.status_code == 200

    resp = client.get("/mxcube/api/v0.1/queue/queue_state")
    assert resp.status_code == 200
    assert json.loads(resp.data).get("queueStatus") == "QueueStopped"


def test_queue_clear(client):
    """Test if we can clear the queue.

    A sample and a task are added by fixtures and then cleared. The
    response still carries "format_version" (see JSON_FORMAT.md) even
    though there are no samples left - only sample_order is omitted.
    """
    resp = client.put("/mxcube/api/v0.1/queue/clear")
    assert resp.status_code == 200

    resp = client.get("/mxcube/api/v0.1/queue/")
    assert json.loads(resp.data) == {"format_version": QUEUE_FORMAT_VERSION}


def test_queue_get_state(client):
    """Test if we can get the queue state."""
    resp = client.get("/mxcube/api/v0.1/queue/queue_state")
    assert resp.status_code == 200


def test_queue_delete_item(client):
    """Test if we can delete a task from sample in the queue."""
    resp = client.get("/mxcube/api/v0.1/queue/")
    assert resp.status_code == 200
    assert len(json.loads(resp.data).get("1:05")["tasks"]) == 1

    task_to_delete = ["1:05", 0]
    resp = client.post(
        "/mxcube/api/v0.1/queue/delete",
        data=json.dumps([task_to_delete]),
        content_type="application/json",
    )
    assert resp.status_code == 200

    resp = client.get("/mxcube/api/v0.1/queue/")
    assert resp.status_code == 200
    assert len(json.loads(resp.data).get("1:05")["tasks"]) == 0


def test_queue_enable_item(client):
    """Test if we can disable a task in the sample in queue."""
    resp = client.get("/mxcube/api/v0.1/queue/")
    queue_id = json.loads(resp.data).get("1:05")["queueID"]

    test_disable = {"qidList": [queue_id], "enabled": False}

    resp = client.post(
        "/mxcube/api/v0.1/queue/set_enabled",
        data=json.dumps(test_disable),
        content_type="application/json",
    )
    assert resp.status_code == 200

    resp = client.get("/mxcube/api/v0.1/queue/")
    assert resp.status_code == 200
    assert json.loads(resp.data).get("1:05")["checked"] == False


def assert_and_remove_keys_with_random_value(parameters):
    assert "osc_start" in parameters["acq_parameters"]
    assert "energy" in parameters["acq_parameters"]
    assert "resolution" in parameters["acq_parameters"]
    assert "kappa" in parameters["acq_parameters"]
    assert "kappa_phi" in parameters["acq_parameters"]

    parameters["acq_parameters"].pop("osc_start")
    parameters["acq_parameters"].pop("energy")
    parameters["acq_parameters"].pop("resolution")
    parameters["acq_parameters"].pop("kappa")
    parameters["acq_parameters"].pop("kappa_phi")


def test_get_default_dc_params(client):
    """Test if we get the right default data collection params."""
    resp = client.get("/mxcube/api/v0.1/queue/available_tasks")
    actual = json.loads(resp.data)["datacollection"]

    # some values are taken from current value/position which is random,
    # so ignore those. But make sure they keys exist
    assert_and_remove_keys_with_random_value(actual)

    assert resp.status_code == 200
    assert actual == default_dc_params


def test_get_default_char_acq_params(client):
    """Test if we get the right default characterisation acq params."""
    resp = client.get("/mxcube/api/v0.1/queue/available_tasks")
    actual = json.loads(resp.data)["characterisation"]

    # some values are taken from current value/position which is random,
    # so ignore those. But make sure they keys exist
    assert_and_remove_keys_with_random_value(actual)

    assert resp.status_code == 200
    assert actual == default_char_acq_params


def test_get_task_schema_is_flat_and_matches_add_item_payload(client):
    """get_task_schema must describe one flat dict (what queue_add_item
    actually expects), not data_model's own 5-sub-model nested shape
    """
    from mxcubecore.queue_entry.test_collection import TestCollectionTaskParameters

    schema = mxcube.queue.get_task_schema(TestCollectionTaskParameters)

    assert schema["type"] == "object"
    assert "path_parameters" not in schema["properties"]
    for flat_field in ("prefix", "subdir", "exp_time", "cell_a", "offset"):
        assert flat_field in schema["properties"]

    assert "allOf" in schema["properties"]["num_images"]


def test_get_default_xrf_parameters(client):
    """Test if we get the right default xrf params."""
    resp = client.get("/mxcube/api/v0.1/queue/available_tasks")
    actual = json.loads(resp.data)["xrf_spectrum"]

    # some values are taken from current value/position which is random,
    # so ignore those. But make sure they keys exist
    assert_and_remove_keys_with_random_value(actual)

    assert resp.status_code == 200
    assert actual == default_xrf_parameters


def test_get_default_mesh_params(client):
    """Test if we get the right default mesh params."""
    resp = client.get("/mxcube/api/v0.1/queue/available_tasks")
    actual = json.loads(resp.data)["mesh"]

    # some values are taken from current value/position which is random,
    # so ignore those. But make sure they keys exist
    assert_and_remove_keys_with_random_value(actual)

    assert resp.status_code == 200
    assert actual == default_mesh_params


def test_set_automount(client):
    """Test if we can set automount for samples."""
    resp = client.post(
        "/mxcube/api/v0.1/queue/automount",
        data=json.dumps({"automount": True}),
        content_type="application/json",
    )
    assert resp.status_code == 200
    assert json.loads(resp.data).get("automount") == True


def test_set_num_snapshots(client):
    """Test if we can set num of snapshots for acq."""
    resp = client.put(
        "/mxcube/api/v0.1/queue/num_snapshots",
        data=json.dumps({"numSnapshots": 2}),
        content_type="application/json",
    )
    assert resp.status_code == 200
    assert json.loads(resp.data).get("numSnapshots") == 2


def test_set_group_folder(client):
    """Test if we can set group folder."""
    resp = client.post(
        "/mxcube/api/v0.1/queue/group_folder",
        data=json.dumps({"path": "tmp/"}),
        content_type="application/json",
    )
    assert resp.status_code == 200
    assert json.loads(resp.data).get("path") == "tmp/"


def test_set_autoadd(client):
    resp = client.post(
        "/mxcube/api/v0.1/queue/auto_add_diffplan",
        data=json.dumps({"autoadddiffplan": True}),
        content_type="application/json",
    )
    assert resp.status_code == 200
    assert json.loads(resp.data).get("autoadddiffplan") == True
