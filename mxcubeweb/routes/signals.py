import contextlib
import json
import logging

from mxcubecore import HardwareRepository as HWR
from mxcubecore import queue_entry as qe
from mxcubecore.HardwareObjects.abstract.AbstractSampleChanger import SampleChangerState
from mxcubecore.HardwareObjects.Harvester import HarvesterState
from mxcubecore.model import queue_model_objects as qmo

from mxcubeweb.app import MXCUBEApplication as mxcube
from mxcubeweb.core.components.queue import (
    COLLECTED,
    FAILED,
    RUNNING,
    WARNING,
)
from mxcubeweb.core.util.networkutils import RateLimited
from mxcubeweb.server import Server as server


def last_queue_node():
    node = HWR.beamline.queue_manager._current_queue_entries[-1].get_data_model()

    # Reference collections are orphans, the node we want is the
    # characterisation not the reference collection itself
    if "ref" in node.get_name():
        parent = node.get_parent()
        node = parent._children[0]

    res = mxcube.queue.node_index(node)
    res["node"] = node

    return res


centringSignals = [
    "centringInvalid",
    "newAutomaticCentringPoint",
    "centringStarted",
    "centringAccepted",
    "centringMoving",
    "centringFailed",
    "centringSuccessful",
    "centringSnapshots",
]

task_signals = {  # missing egyscan, xrf, etc...
    "collectStarted": "Data collection has started",
    "collectOscillationStarted": "Data collection oscillation has started",
    "collectOscillationFailed": "Data collection oscillacion has failed",
    "collectOscillationFinished": "Data collection oscillacion has finished",
    "collectEnded": "Data collection has finished",
    "warning": "Data collection finished with a warning",
    "collect_finished": "Data collection has finished",
    "collectImageTaken": "Image acquired",
}

motor_signals = {
    "actuatorStateChanged": "actuatorStateChanged",
    "minidiffPhaseChanged": "minidiffPhaseChanged",
    "minidiffTransferModeChanged": "minidiffTransferModeChanged",
    "minidiffSampleIsLoadedChanged": "minidiffSampleIsLoadedChanged",
    "zoomMotorPredefinedPositionChanged": "zoomMotorPredefinedPositionChanged",
}


def handle_auto_mount_next(entry):
    model = entry.get_data_model()

    if isinstance(model.get_parent(), qmo.TaskGroup):
        auto_mount = mxcube.queue.get_auto_mount_sample()
        tgroup = entry.get_data_model()
        tgroup_list = entry.get_data_model().get_parent().get_children()

        try:
            last_gentry = tgroup_list.index(tgroup) == (len(tgroup_list) - 1)
        except ValueError:
            last_gentry = None

        if not auto_mount and last_gentry:
            msg = "Not mounting next sample automatically (Auto mount next)"
            logging.getLogger("user_level_log").info(msg)


def harvester_state_changed(*args):
    new_state = args[0]
    state_str = HarvesterState.STATE_DESC.get(new_state, "Unknown").upper()
    server.emit("harvester_state", state_str, namespace="/hwr")


def harvester_contents_update():
    server.emit("harvester_contents_update")


def sc_state_changed(*args):
    new_state = args[0]
    state_str = SampleChangerState.STATE_DESC.get(new_state, "Unknown").upper()
    server.emit("sc_state", state_str, namespace="/hwr")


def sc_load(location):
    msg = {
        "signal": "operatingSampleChanger",
        "location": location,
        "message": "Please wait, loading sample",
    }

    server.emit("sc", msg, namespace="/hwr")


def sc_load_ready(location):
    msg = {
        "signal": "loadReady",
        "location": location,
        "message": "Sample changer, loaded sample",
    }

    server.emit("sc", msg, namespace="/hwr")


def sc_unload(location):
    msg = {
        "signal": "operatingSampleChanger",
        "location": location,
        "message": "Please wait, unloading sample",
    }

    server.emit("sc", msg, namespace="/hwr")


def is_collision_safe(*args):
    # responds to the 'isCollisionSafe' signal from the Sample Changer
    new_state = args[0]
    # we are only interested when it becames true
    if new_state:
        msg = {
            "signal": "isCollisionSafe",
            "message": "Sample moved to safe area",
        }
        server.emit("sc", msg, namespace="/hwr")


def loaded_sample_changed(sample):
    if hasattr(sample, "get_address"):
        address = sample.get_address()
        barcode = sample.get_id()
    else:
        address = ""
        barcode = ""

    logging.getLogger("HWR").info("Loaded sample changed: " + address)

    try:
        sampleID = address

        if HWR.beamline.sample_changer.has_loaded_sample():
            mxcube.sample_changer.set_current_sample(sampleID)
        else:
            sample = HWR.beamline.sample_changer.get_loaded_sample()

            address = sample.get_address() if sample else None

            mxcube.sample_changer.set_current_sample(address)

        server.emit(
            "loaded_sample_changed",
            {"address": address, "barcode": barcode},
            namespace="/hwr",
        )

        sc_load_ready(address)
    except Exception as msg:
        logging.getLogger("HWR").error("error setting loaded sample: %s" + str(msg))


def set_current_sample(sample_id):
    if not sample_id:
        sample_id = ""

    sample = {"sampleID": sample_id}
    server.emit("set_current_sample", sample, namespace="/hwr")


def sc_contents_update():
    server.emit("sc_contents_update", {}, namespace="/hwr")


def sc_maintenance_update(*args):
    if len(args) == 3:
        # be backward compatible with older HW objects,
        # which are emitting signal with 3 arguments
        _, cmd_state, message = args
    else:
        cmd_state, message = args

    try:
        server.emit(
            "sc_maintenance_update",
            {
                "commands_state": json.dumps(cmd_state),
                "message": message,
            },
            namespace="/hwr",
        )
    except Exception as msg:
        logging.getLogger("HWR").error("error sending message: %s" + str(msg))


def centring_started(method, *args):
    msg = {"method": method}

    if method in ["Computer automatic"]:
        msg = {"method": qe.CENTRING_METHOD.LOOP}
    elif method in [HWR.beamline.diffractometer.CENTRING_METHOD_MANUAL]:
        msg = {"method": qe.CENTRING_METHOD.MANUAL}

    server.emit("sample_centring", msg, namespace="/hwr")


def get_task_state(entry):
    node_id = entry.get_data_model()._node_id
    _, state = mxcube.queue.get_node_state(node_id)
    node_index = mxcube.queue.node_index(entry.get_data_model())

    return {
        "Signal": "",
        "Message": "",
        "taskIndex": node_index["idx"],
        "queueID": node_id,
        "sample": node_index["sample"],
        "state": state,
        "progress": 1 if state == COLLECTED else 0,
    }


def queue_execution_entry_started(entry, message=None):
    handle_auto_mount_next(entry)

    if not mxcube.queue.is_interleaved(entry.get_data_model()):
        server.emit("task", get_task_state(entry), namespace="/hwr")


def queue_execution_entry_finished(entry, message):
    handle_auto_mount_next(entry)

    if not mxcube.queue.is_interleaved(entry.get_data_model()):
        server.emit("task", get_task_state(entry), namespace="/hwr")

    queue_toggle_sample(entry)


def queue_toggle_sample(entry):
    if isinstance(entry, qe.SampleQueueEntry):
        msg = {
            "Signal": "DisableSample",
            "sampleID": entry.get_data_model().loc_str,
        }
        server.emit("queue", msg, namespace="/hwr")


def queue_execution_started(entry, queue_state=None):
    state = queue_state if queue_state else mxcube.queue.queue_exec_state()
    msg = {"Signal": state, "Message": "Queue execution started"}

    server.emit("queue", msg, namespace="/hwr")


def queue_execution_finished(entry, queue_state=None):
    state = queue_state if queue_state else mxcube.queue.queue_exec_state()
    msg = {"Signal": state, "Message": "Queue execution stopped"}

    mxcube.queue.enable_sample_entries(mxcube.TEMP_DISABLED, True)
    mxcube.TEMP_DISABLED = []

    server.emit("queue", msg, namespace="/hwr")
    mxcube.sample_view._emit_shapes_updated()


def queue_execution_stopped(*args):
    msg = {
        "Signal": "QueueStopped",
        "Message": "Queue execution stopped",
    }

    server.emit("queue", msg, namespace="/hwr")


def queue_execution_paused(state):
    if state:
        msg = {
            "Signal": "QueuePaused",
            "Message": "Queue execution paused",
        }
    else:
        msg = {
            "Signal": "QueueRunning",
            "Message": "Queue execution paused",
        }

    server.emit("queue", msg, namespace="/hwr")


def queue_execution_failed(entry):
    msg = {
        "Signal": mxcube.queue.queue_exec_state(),
        "Message": "Queue execution stopped",
    }

    server.emit("queue", msg, namespace="/hwr")


def collect_oscillation_started(*args):
    node = last_queue_node()

    if not mxcube.queue.is_interleaved(node["node"]):
        msg = {
            "Signal": "collectOscillationStarted",
            "Message": task_signals["collectOscillationStarted"],
            "taskIndex": node["idx"],
            "queueID": node["queue_id"],
            "sample": node["sample"],
            "state": RUNNING,
            "progress": 0,
        }

        logging.getLogger("HWR").debug("[TASK CALLBACK] " + str(msg))

        try:
            server.emit("task", msg, namespace="/hwr")
        except Exception:
            logging.getLogger("HWR").error("error sending message: " + str(msg))


def collect_image_taken(frame):
    try:
        node = last_queue_node()
    except IndexError:
        node = None

    if node and not mxcube.queue.is_interleaved(node["node"]):
        progress = mxcube.queue.get_task_progress(last_queue_node()["node"], frame)

        msg = {
            "Signal": "collectImageTaken",
            "Message": task_signals["collectImageTaken"],
            "taskIndex": node["idx"],
            "queueID": node["queue_id"],
            "sample": node["sample"],
            "state": RUNNING if progress < 1 else COLLECTED,
            "progress": progress,
        }
        try:
            _emit_progress(msg)
        except Exception:
            logging.getLogger("HWR").error("error sending message: " + str(msg))


@RateLimited(1)
def _emit_progress(msg):
    logging.getLogger("HWR").debug("[TASK CALLBACK] " + str(msg))
    server.emit("task", msg, namespace="/hwr")


def collect_oscillation_failed(
    owner=None,
    status=FAILED,
    state=None,
    lims_id="",
    osc_id=None,
    params=None,
):
    node = last_queue_node()

    mxcube.NODE_ID_TO_LIMS_ID[node["queue_id"]] = lims_id

    if not mxcube.queue.is_interleaved(node["node"]):
        with contextlib.suppress(Exception):
            HWR.beamline.get_dc(lims_id)

        msg = {
            "Signal": "collectOscillationFailed",
            "Message": task_signals["collectOscillationFailed"],
            "taskIndex": node["idx"],
            "queueID": node["queue_id"],
            "sample": node["sample"],
            "state": FAILED,
            "progress": 0,
        }

        logging.getLogger("HWR").debug("[TASK CALLBACK] " + str(msg))

        try:
            server.emit("task", msg, namespace="/hwr")
        except Exception:
            logging.getLogger("HWR").error("error sending message: " + str(msg))


def collect_oscillation_finished(owner, status, state, lims_id, osc_id, params):
    node = last_queue_node()
    mxcube.NODE_ID_TO_LIMS_ID[node["queue_id"]] = lims_id

    if not mxcube.queue.is_interleaved(node["node"]):
        msg = {
            "Signal": "collectOscillationFinished",
            "Message": task_signals["collectOscillationFinished"],
            "taskIndex": node["idx"],
            "queueID": node["queue_id"],
            "sample": node["sample"],
            "state": COLLECTED,
            "progress": 1,
        }

        logging.getLogger("HWR").debug("[TASK CALLBACK] " + str(msg))

        try:
            server.emit("task", msg, namespace="/hwr")
        except Exception:
            logging.getLogger("HWR").error("error sending message: " + str(msg))


def collect_ended(owner, success, message):
    node = last_queue_node()

    if not mxcube.queue.is_interleaved(node["node"]):
        state = COLLECTED if success else WARNING

        msg = {
            "Signal": "collectOscillationFinished",
            "Message": message,
            "taskIndex": node["idx"],
            "queueID": node["queue_id"],
            "sample": node["sample"],
            "state": state,
            "progress": 1,
        }

        logging.getLogger("HWR").debug("[TASK CALLBACK] " + str(msg))

        try:
            server.emit("task", msg, namespace="/hwr")
        except Exception:
            logging.getLogger("HWR").error("error sending message: " + str(msg))


def collect_started(*args, **kwargs):
    node = last_queue_node()

    if not mxcube.queue.is_interleaved(node["node"]):
        msg = {
            "Signal": kwargs["signal"],
            "Message": task_signals[kwargs["signal"]],
            "taskIndex": last_queue_node()["idx"],
            "queueID": last_queue_node()["queue_id"],
            "sample": last_queue_node()["sample"],
            "state": RUNNING,
            "progress": 0,
        }

        logging.getLogger("HWR").debug("[TASK CALLBACK] " + str(msg))

        try:
            server.emit("task", msg, namespace="/hwr")
        except Exception:
            logging.getLogger("HWR").error("error sending message: " + str(msg))


def grid_result_available(shape):
    server.emit("grid_result_available", {"shape": shape}, namespace="/hwr")


def energy_scan_finished(pk, ip, rm, sample):
    server.emit(
        "energy_scan_result",
        {"pk": pk, "ip": ip, "rm": rm},
        namespace="/hwr",
    )


def queue_interleaved_started():
    node = last_queue_node()

    msg = {
        "Signal": "queue_interleaved_started",
        "Message": "Interleaved collection started",
        "taskIndex": node["idx"],
        "queueID": node["queue_id"],
        "sample": node["sample"],
        "state": RUNNING,
        "progress": 0,
    }

    logging.getLogger("HWR").debug("[TASK CALLBACK] " + str(msg))

    try:
        server.emit("task", msg, namespace="/hwr")
    except Exception:
        logging.getLogger("HWR").error("error sending message: " + str(msg))


def queue_interleaved_finished():
    node = last_queue_node()

    msg = {
        "Signal": "queue_interleaved_finished",
        "Message": "Interleaved collection ended",
        "taskIndex": node["idx"],
        "queueID": node["queue_id"],
        "sample": node["sample"],
        "state": COLLECTED,
        "progress": 1,
    }

    logging.getLogger("HWR").debug("[TASK CALLBACK] " + str(msg))

    try:
        server.emit("task", msg, namespace="/hwr")
    except Exception:
        logging.getLogger("HWR").error("error sending message: " + str(msg))


def queue_interleaved_sw_done(data):
    node = last_queue_node()
    progress = mxcube.queue.get_task_progress(node["node"], data)

    msg = {
        "Signal": "collectImageTaken",
        "Message": task_signals["collectImageTaken"],
        "taskIndex": node["idx"],
        "queueID": node["queue_id"],
        "sample": node["sample"],
        "state": RUNNING if progress < 1 else COLLECTED,
        "progress": progress,
    }

    logging.getLogger("HWR").debug("[TASK CALLBACK] " + str(msg))

    try:
        server.emit("task", msg, namespace="/hwr")
    except Exception:
        logging.getLogger("HWR").error("error sending message: " + str(msg))


def xrf_task_progress(taskId, progress):
    node = last_queue_node()

    msg = {
        "Signal": "XRFTaskUpdate",
        "Message": "XRFTaskUpdate",
        "taskIndex": node["idx"],
        "queueID": node["queue_id"],
        "sample": node["sample"],
        "state": RUNNING if progress < 1 else COLLECTED,
        "progress": progress,
    }

    try:
        server.emit("task", msg, namespace="/hwr")
    except Exception:
        logging.getLogger("HWR").error("error sending message: " + str(msg))


def motor_position_callback(movable):
    server.emit("motor_position", movable, namespace="/hwr")


def new_plot(plot_info):
    try:
        server.emit("new_plot", plot_info, namespace="/hwr")
    except Exception:
        logging.getLogger("HWR").error("error sending new_plot message: %s", plot_info)


@RateLimited(1)
def plot_data(data, last_index=[0], **kwargs):
    data_data = data["data"]
    if last_index[0] > len(data_data):
        last_index = [0]

    data["data"] = data_data[last_index[0] :]

    try:
        server.emit("plot_data", data, namespace="/hwr")
    except Exception:
        logging.getLogger("HWR").exception(
            "error sending plot_data message for plot %s", data["id"]
        )
    else:
        last_index[0] += len(data_data)


def plot_end(data):
    try:
        server.emit("plot_end", data, namespace="/hwr")
    except Exception:
        logging.getLogger("HWR").error(
            "error sending plot_end message for plot %s", data["id"]
        )
