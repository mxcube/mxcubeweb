import copy
import json
import time

from .input_parameters import (
    default_char_acq_params,
    default_dc_params,
    default_mesh_params,
    default_xrf_parameters,
    test_edit_task,
    test_task,
)


def test_queue_get(client):
    """Test if we can get the queue."""
    resp = client.get("/mxcube/api/v0.1/queue/")
    assert resp.status_code == 200


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

    A sample and a task are added by fixtures and then cleared.
    """
    resp = client.put("/mxcube/api/v0.1/queue/clear")
    assert resp.status_code == 200

    resp = client.get("/mxcube/api/v0.1/queue/")
    assert len(json.loads(resp.data)) == 0


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


def test_queue_swap_task_item(client):
    """Test if we can swap tasks in a sample in queue.

    Two tasks are added with a different param and then swaped and tested.
    """
    resp = client.get("/mxcube/api/v0.1/queue/")
    assert resp.status_code == 200
    assert len(json.loads(resp.data).get("1:05")["tasks"]) == 1

    queue_id = json.loads(resp.data).get("1:05")["queueID"]
    task_to_add = copy.deepcopy(test_task)
    task_to_add["queueID"] = queue_id
    task_to_add["tasks"][0]["sampleQueueID"] = queue_id
    task_to_add["tasks"][0]["parameters"]["kappa"] = 90

    resp = client.post(
        "/mxcube/api/v0.1/queue/",
        data=json.dumps([task_to_add]),
        content_type="application/json",
    )
    assert resp.status_code == 200

    resp = client.get("/mxcube/api/v0.1/queue/")
    assert resp.status_code == 200
    assert len(json.loads(resp.data).get("1:05")["tasks"]) == 2

    resp = client.post(
        ("/mxcube/api/v0.1/queue/{}/{}/{}/swap").format("1:05", 0, 1),
        content_type="application/json",
    )
    assert resp.status_code == 200

    resp = client.get("/mxcube/api/v0.1/queue/")
    assert resp.status_code == 200
    assert json.loads(resp.data).get("1:05")["tasks"][0]["parameters"]["kappa"] == 90


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
