import time
import json
import copy

from input_parameters import (
    test_sample_5,
    test_sample_6,
    test_task,
    test_edit_task,
    default_dc_params,
    default_char_acq_params,
    default_char_params,
    default_mesh_params,
    default_xrf_parameters,
)


from fixture import client, add_sample, add_task


def test_get_main(client):
    """Test if we can get the home page."""
    assert client.get("/").status_code == 200


def test_queue_get(client):
    """Test if we can get the queue."""
    rv = client.get("/mxcube/api/v0.1/queue")
    assert rv.status_code == 200


def test_queue_get_item(client, add_sample):
    """Test if we the queue has the intial sample, only mockups hwobj."""
    rv = client.get("/mxcube/api/v0.1/queue")
    assert rv.status_code == 200 and json.loads(rv.data).get("1:01")


def test_queue_add_item(client):
    """Test if we can add a sample."""
    rv = client.post(
        "/mxcube/api/v0.1/queue",
        data=json.dumps([test_sample_5]),
        content_type="application/json",
    )
    assert rv.status_code == 200


def test_add_and_get_sample(client, add_sample):
    """Test if we can add a sample. The sample is added by a fixture."""
    rv = client.get("/mxcube/api/v0.1/queue")
    assert rv.status_code == 200 and json.loads(rv.data).get("1:05")


def test_add_and_get_task(client, add_sample, add_task):
    """Test if we can add a task to the sample."""
    rv = client.get("/mxcube/api/v0.1/queue")
    assert rv.status_code == 200 and len(json.loads(rv.data).get("1:05")["tasks"]) == 1


def test_add_and_edit_task(client, add_sample, add_task):
    """Test if we can add edit a task i the sample in the queue."""
    rv = client.get("/mxcube/api/v0.1/queue")
    queue_id = json.loads(rv.data).get("1:05")["queueID"]
    task_queue_id = json.loads(rv.data).get("1:05")["tasks"][0]["queueID"]
    assert rv.status_code == 200 and len(json.loads(rv.data).get("1:05")["tasks"]) == 1

    task_to_update = copy.deepcopy(test_edit_task)
    parameter_to_update = "num_images"
    parameter_update_value = 10
    task_to_update["parameters"][parameter_to_update] = parameter_update_value
    rv = client.post(
        ("/mxcube/api/v0.1/queue/{}/{}").format(queue_id, task_queue_id),
        data=json.dumps(task_to_update),
        content_type="application/json",
    )
    assert (
        rv.status_code == 200
        and json.loads(rv.data).get("parameters")[parameter_to_update]
        == parameter_update_value
    )


def test_queue_start(client, add_sample, add_task):
    """
    Test if we can start the queue.
    The queue requires a sample and a task to start which are added by fixtures.
    It also requires a 3d point to be saved before it move from paused state to running.
    Unpause is called to mimick that.
    """
    rv = client.get("/mxcube/api/v0.1/queue")
    assert rv.status_code == 200 and len(json.loads(rv.data).get("1:05")["tasks"]) == 1

    rv = client.put(
        "/mxcube/api/v0.1/queue/start",
        data=json.dumps({"sid": "1:05"}),
        content_type="application/json",
    )
    assert rv.status_code == 200

    rv = client.put("/mxcube/api/v0.1/queue/unpause")
    assert rv.status_code == 200

    time.sleep(1)
    rv = client.get("/mxcube/api/v0.1/queue_state")
    assert (
        rv.status_code == 200
        and json.loads(rv.data).get("queueStatus") == "QueueRunning"
    )


def test_queue_stop(client, add_sample, add_task):
    """Test if we can stop the queue. The queue is started and then stopped."""
    rv = client.put(
        "/mxcube/api/v0.1/queue/start",
        data=json.dumps({"sid": "1:05"}),
        content_type="application/json",
    )
    assert rv.status_code == 200

    rv = client.put("/mxcube/api/v0.1/queue/unpause")
    assert rv.status_code == 200

    rv = client.get("/mxcube/api/v0.1/queue_state")
    assert (
        rv.status_code == 200
        and json.loads(rv.data).get("queueStatus") == "QueueRunning"
    )

    rv = client.put("/mxcube/api/v0.1/queue/stop")
    assert rv.status_code == 200

    time.sleep(2)
    rv = client.get("/mxcube/api/v0.1/queue_state")
    assert (
        rv.status_code == 200
        and json.loads(rv.data).get("queueStatus") == "QueueStopped"
    )


def test_queue_abort(client, add_sample, add_task):
    """Test if we can abort the queue. The queue is started and then aborted."""
    rv = client.put(
        "/mxcube/api/v0.1/queue/start",
        data=json.dumps({"sid": "1:05"}),
        content_type="application/json",
    )
    assert rv.status_code == 200

    rv = client.put("/mxcube/api/v0.1/queue/unpause")
    assert rv.status_code == 200

    rv = client.get("/mxcube/api/v0.1/queue_state")
    assert (
        rv.status_code == 200
        and json.loads(rv.data).get("queueStatus") == "QueueRunning"
    )

    rv = client.put("/mxcube/api/v0.1/queue/abort")
    assert rv.status_code == 200

    rv = client.get("/mxcube/api/v0.1/queue_state")
    assert (
        rv.status_code == 200
        and json.loads(rv.data).get("queueStatus") == "QueueStopped"
    )


def test_queue_clear(client, add_sample, add_task):
    """Test if we can clear the queue. A sample and a task are added by fixtures and then cleared."""
    rv = client.put("/mxcube/api/v0.1/queue/clear")
    assert rv.status_code == 200

    rv = client.get("/mxcube/api/v0.1/queue")
    assert len(json.loads(rv.data)) == 0


def test_queue_get_state(client):
    """Test if we can get the queue state."""
    rv = client.get("/mxcube/api/v0.1/queue_state")
    assert rv.status_code == 200


def test_queue_delete_item(client, add_sample, add_task):
    """Test if we can delete a task from sample in the queue."""
    rv = client.get("/mxcube/api/v0.1/queue")
    assert rv.status_code == 200 and len(json.loads(rv.data).get("1:05")["tasks"]) == 1

    task_to_delete = ["1:05", 0]
    rv = client.post(
        "/mxcube/api/v0.1/queue/delete",
        data=json.dumps([task_to_delete]),
        content_type="application/json",
    )
    assert rv.status_code == 200

    rv = client.get("/mxcube/api/v0.1/queue")
    assert rv.status_code == 200 and len(json.loads(rv.data).get("1:05")["tasks"]) == 0


def test_queue_enable_item(client, add_sample):
    """Test if we can disable a task in the sample in queue."""
    rv = client.get("/mxcube/api/v0.1/queue")
    queue_id = json.loads(rv.data).get("1:05")["queueID"]

    test_disable = {"qidList": [queue_id], "enabled": False}

    rv = client.post(
        "/mxcube/api/v0.1/queue/set_enabled",
        data=json.dumps(test_disable),
        content_type="application/json",
    )
    assert rv.status_code == 200

    rv = client.get("/mxcube/api/v0.1/queue")
    assert rv.status_code == 200 and json.loads(rv.data).get("1:05")["checked"] == False


def test_queue_swap_task_item(client, add_sample, add_task):
    """Test if we can swap tasks in a sample in queue. Two tasks are added with a different param and then swaped and tested"""
    rv = client.get("/mxcube/api/v0.1/queue")
    assert rv.status_code == 200 and len(json.loads(rv.data).get("1:05")["tasks"]) == 1

    queue_id = json.loads(rv.data).get("1:05")["queueID"]
    task_to_add = copy.deepcopy(test_task)
    task_to_add["queueID"] = queue_id
    task_to_add["tasks"][0]["sampleQueueID"] = queue_id
    task_to_add["tasks"][0]["parameters"]["kappa"] = 90

    rv = client.post(
        "/mxcube/api/v0.1/queue",
        data=json.dumps([task_to_add]),
        content_type="application/json",
    )
    assert rv.status_code == 200

    rv = client.get("/mxcube/api/v0.1/queue")
    assert rv.status_code == 200 and len(json.loads(rv.data).get("1:05")["tasks"]) == 2

    rv = client.post(
        ("/mxcube/api/v0.1/queue/{}/{}/{}/swap").format("1:05", 0, 1),
        content_type="application/json",
    )
    assert rv.status_code == 200

    rv = client.get("/mxcube/api/v0.1/queue")
    assert (
        rv.status_code == 200
        and json.loads(rv.data).get("1:05")["tasks"][0]["parameters"]["kappa"] == 90
    )


def test_queue_move_task_item(client, add_sample, add_task):
    """Test if we can move tasks in a sample in queue.
    Three tasks are added with a different param and then moved and tested."""
    rv = client.get("/mxcube/api/v0.1/queue")
    assert rv.status_code == 200 and len(json.loads(rv.data).get("1:05")["tasks"]) == 1

    queue_id = json.loads(rv.data).get("1:05")["queueID"]
    task_to_add = copy.deepcopy(test_task)
    task_to_add["queueID"] = queue_id
    task_to_add["tasks"][0]["sampleQueueID"] = queue_id
    task_to_add["tasks"][0]["parameters"]["kappa"] = 90

    rv = client.post(
        "/mxcube/api/v0.1/queue",
        data=json.dumps([task_to_add]),
        content_type="application/json",
    )
    assert rv.status_code == 200

    rv = client.get("/mxcube/api/v0.1/queue")
    assert rv.status_code == 200 and len(json.loads(rv.data).get("1:05")["tasks"]) == 2

    task_to_add = copy.deepcopy(test_task)
    task_to_add["queueID"] = queue_id
    task_to_add["tasks"][0]["sampleQueueID"] = queue_id
    task_to_add["tasks"][0]["parameters"]["kappa"] = 180

    rv = client.post(
        "/mxcube/api/v0.1/queue",
        data=json.dumps([task_to_add]),
        content_type="application/json",
    )
    assert rv.status_code == 200

    rv = client.get("/mxcube/api/v0.1/queue")
    assert rv.status_code == 200 and len(json.loads(rv.data).get("1:05")["tasks"]) == 3

    rv = client.post(
        ("/mxcube/api/v0.1/queue/{}/{}/{}/move").format("1:05", 0, 2),
        content_type="application/json",
    )
    assert rv.status_code == 200

    rv = client.get("/mxcube/api/v0.1/queue")
    assert (
        rv.status_code == 200
        and json.loads(rv.data).get("1:05")["tasks"][2]["parameters"]["kappa"] == 0
    )


def test_queue_move_task_item_fail(client, add_sample, add_task):
    """Test if we can move tasks in a sample in queue with boundry condition.
    Three tasks are added with a different param and then moved and tested."""
    rv = client.get("/mxcube/api/v0.1/queue")
    assert rv.status_code == 200 and len(json.loads(rv.data).get("1:05")["tasks"]) == 1

    queue_id = json.loads(rv.data).get("1:05")["queueID"]
    task_to_add = test_task
    task_to_add["queueID"] = queue_id
    task_to_add["tasks"][0]["sampleQueueID"] = queue_id
    task_to_add["tasks"][0]["parameters"]["kappa"] = 90
    rv = client.post(
        "/mxcube/api/v0.1/queue",
        data=json.dumps([task_to_add]),
        content_type="application/json",
    )
    assert rv.status_code == 200

    rv = client.get("/mxcube/api/v0.1/queue")
    assert rv.status_code == 200 and len(json.loads(rv.data).get("1:05")["tasks"]) == 2

    task_to_add = test_task
    task_to_add["queueID"] = queue_id
    task_to_add["tasks"][0]["sampleQueueID"] = queue_id
    task_to_add["tasks"][0]["parameters"]["kappa"] = 180
    rv = client.post(
        "/mxcube/api/v0.1/queue",
        data=json.dumps([task_to_add]),
        content_type="application/json",
    )
    assert rv.status_code == 200

    rv = client.get("/mxcube/api/v0.1/queue")
    assert rv.status_code == 200 and len(json.loads(rv.data).get("1:05")["tasks"]) == 3

    rv = client.post(
        ("/mxcube/api/v0.1/queue/{}/{}/{}/move").format("1:05", 2, 2),
        content_type="application/json",
    )
    rv = client.get("/mxcube/api/v0.1/queue")

    assert (
        rv.status_code == 200
        and json.loads(rv.data).get("1:05")["tasks"][2]["parameters"]["kappa"] == 180
    )


def test_queue_set_sample_order(client, add_sample):
    """Test if we can set the sample order in the queue."""
    sample_to_add = test_sample_6
    rv = client.post(
        "/mxcube/api/v0.1/queue",
        data=json.dumps([sample_to_add]),
        content_type="application/json",
    )
    assert rv.status_code == 200

    new_sample_order = {"sampleOrder": ["1:01", "1:06", "1:05"]}
    rv = client.post(
        "/mxcube/api/v0.1/queue/sample-order",
        data=json.dumps(new_sample_order),
        content_type="application/json",
    )
    assert rv.status_code == 200

    rv = client.get("/mxcube/api/v0.1/queue")
    assert (
        rv.status_code == 200 and json.loads(rv.data).get("sample_order")[1] == "1:06"
    )


def test_get_default_dc_params(client):
    """Test if we get the right default data collection params."""
    resp = client.get("/mxcube/api/v0.1/queue/dc")
    actual = json.loads(resp.data)

    # osc_start is taken from current omega which is random, so ignore it
    actual['acq_parameters'].pop('osc_start')
    assert resp.status_code == 200 and actual == default_dc_params


def test_get_default_char_acq_params(client):
    """Test if we get the right default characterisation acq params."""
    resp = client.get("/mxcube/api/v0.1/queue/char_acq")
    actual = json.loads(resp.data)

    # osc_start is taken from current omega which is random, so ignore it
    actual['acq_parameters'].pop('osc_start')

    assert resp.status_code == 200 and actual == default_char_acq_params


def test_get_default_char_params(client):
    """Test if we get the right default characterisation params."""
    resp = client.get("/mxcube/api/v0.1/queue/char")
    actual = json.loads(resp.data)
    assert resp.status_code == 200 and actual == default_char_params


def test_get_default_mesh_params(client):
    """Test if we get the right default mesh params."""
    resp = client.get("/mxcube/api/v0.1/queue/mesh")
    actual = json.loads(resp.data)

    # osc_start is taken from current omega which is random, so ignore it
    actual['acq_parameters'].pop('osc_start')

    assert resp.status_code == 200 and actual == default_mesh_params


def test_get_default_xrf_parameters(client):
    """Test if we get the right default xrf params."""
    rv = client.get("/mxcube/api/v0.1/queue/xrf")
    assert rv.status_code == 200 and json.loads(rv.data) == default_xrf_parameters


def test_set_automount(client):
    """Test if we can set automount for samples."""
    rv = client.post(
        "/mxcube/api/v0.1/queue/automount",
        data=json.dumps(True),
        content_type="application/json",
    )
    assert rv.status_code == 200 and json.loads(rv.data).get("automount") == True


def test_set_num_snapshots(client):
    """Test if we can set num of snapshots for acq."""
    rv = client.put(
        "/mxcube/api/v0.1/queue/num_snapshots",
        data=json.dumps({"numSnapshots": 2}),
        content_type="application/json",
    )
    assert rv.status_code == 200 and json.loads(rv.data).get("numSnapshots") == 2


def test_set_group_folder(client):
    """Test if we can set group folder."""
    rv = client.post(
        "/mxcube/api/v0.1/queue/group_folder",
        data=json.dumps({"path": "tmp/"}),
        content_type="application/json",
    )
    assert rv.status_code == 200 and json.loads(rv.data).get("path") == "tmp/"


def test_set_autoadd(client, add_sample):

    rv = client.post(
        "/mxcube/api/v0.1/queue/auto_add_diffplan",
        data=json.dumps(True),
        content_type="application/json",
    )
    assert (
        rv.status_code == 200 and json.loads(rv.data).get("auto_add_diffplan") == True
    )
