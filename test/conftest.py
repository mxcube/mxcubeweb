"""Helper functions for pytest"""

from gevent import monkey

monkey.patch_all(thread=False)


from pathlib import Path  # noqa: I001


import atexit
import copy
import json
import os
import sys

import psutil
import pytest
from input_parameters import (
    test_sample_1,
    test_sample_5,
    test_task,
)

MXCUBE_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(os.path.realpath(__file__)), "../")
)

sys.path.append(MXCUBE_ROOT)
sys.path.append("./")


from mxcubecore import HardwareRepository

from mxcubeweb import build_server_and_config

_SIO_TEST_CLIENT = None

from mxcubeweb.core.server.resource_handler import AdapterResourceHandlerFactory


@pytest.fixture(autouse=True)
def cleanup_adapter_resource_handler():
    yield

    # Teardown
    AdapterResourceHandlerFactory.unregister_all()


def noop_register(*args, **kwargs):
    pass


@pytest.fixture(autouse=True)
def no_atexit_handlers(monkeypatch):
    # Mock out atexit.register so no handlers are registered during tests
    monkeypatch.setattr(atexit, "register", noop_register)


@pytest.fixture(autouse=True)
def cleanup_subprocesses():
    """Fixture to clean up child processes after each test."""
    parent_pid = os.getpid()

    yield

    parent_process = psutil.Process(parent_pid)

    for child in parent_process.children(recursive=True):
        if child.is_running():
            try:
                child.terminate()
                child.wait(timeout=1)
            except psutil.NoSuchProcess:
                pass
            except psutil.TimeoutExpired:
                child.kill()


@pytest.fixture
def client():
    global _SIO_TEST_CLIENT

    HardwareRepository.uninit_hardware_repository()
    argv = []
    server, cfg = build_server_and_config(test=True, argv=argv)

    client = server.flask.test_client()

    data = json.dumps({"proposal": "idtest0", "password": "sUpErSaFe"})

    client.post("/mxcube/api/v0.1/login/", data=data, content_type="application/json")

    resp = client.post(
        "/mxcube/api/v0.1/queue/",
        data=json.dumps([test_sample_1]),
        content_type="application/json",
    )

    assert resp.status_code == 200

    resp = client.post(
        "/mxcube/api/v0.1/queue/",
        data=json.dumps([test_sample_5]),
        content_type="application/json",
    )

    assert resp.status_code == 200

    _SIO_TEST_CLIENT = server.flask_socketio.test_client(server)

    resp = client.get("/mxcube/api/v0.1/queue/")

    assert resp.status_code == 200
    assert json.loads(resp.data).get("1:05")

    queue_id = json.loads(resp.data).get("1:05")["queueID"]
    task_to_add = copy.deepcopy(test_task)
    task_to_add["queueID"] = queue_id
    task_to_add["tasks"][0]["sampleQueueID"] = queue_id

    resp = client.post(
        "/mxcube/api/v0.1/queue/",
        data=json.dumps([task_to_add]),
        content_type="application/json",
    )

    assert resp.status_code == 200

    yield client

    client.get("/mxcube/api/v0.1/login/signout/")

    test_db = Path(cfg.flask.USER_DB_PATH)
    if test_db.exists():
        test_db.unlink(missing_ok=True)


@pytest.fixture
def add_sample(client):
    """Fixture to add a sample to the queue, since it is required for alot of test cases."""
    resp = client.post(
        "/mxcube/api/v0.1/queue",
        data=json.dumps([test_sample_1]),
        content_type="application/json",
    )

    assert resp.status_code == 200

    resp = client.post(
        "/mxcube/api/v0.1/queue",
        data=json.dumps([test_sample_5]),
        content_type="application/json",
    )

    assert resp.status_code == 200
    return client


@pytest.fixture
def add_task(client):
    """Fixture to add a task to the sample in the queue queue, since it is required for alot of test cases."""
    resp = client.get("/mxcube/api/v0.1/queue")

    assert resp.status_code == 200
    assert json.loads(resp.data).get("1:05")

    queue_id = json.loads(resp.data).get("1:05")["queueID"]
    task_to_add = copy.deepcopy(test_task)
    task_to_add["queueID"] = queue_id
    task_to_add["tasks"][0]["sampleQueueID"] = queue_id

    resp = client.post(
        "/mxcube/api/v0.1/queue",
        data=json.dumps([task_to_add]),
        content_type="application/json",
    )

    assert resp.status_code == 200

    return client
