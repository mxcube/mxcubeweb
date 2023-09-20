import logging
import json

from mxcube3.server import Server as server
from mxcube3.app import MXCUBEApplication as mxcube

from flask import Response

from mxcubecore.HardwareObjects.abstract.AbstractSampleChanger import SampleChangerState

from mxcube3.core.adapter.beamline_adapter import BeamlineAdapter
from mxcube3.core.components.queue import READY, RUNNING, FAILED, COLLECTED, WARNING

from mxcubecore.model import queue_model_objects as qmo
from mxcubecore import queue_entry as qe

from mxcube3.core.util.networkutils import RateLimited

from mxcubecore import HardwareRepository as HWR


def last_queue_node():
    node = HWR.beamline.queue_manager._current_queue_entries[-1].get_data_model()

    # Reference collections are orphans, the node we want is the
    # characterisation not the reference collection itself
    if "refdc" in node.get_name():
        parent = node.get_parent()
        node = parent._children[0]

    res = mxcube.queue.node_index(node)
    res["node"] = node

    return res


beam_signals = ["beamPosChanged", "beamInfoChanged", "valueChanged", "stateChanged"]

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
        tgroup = model.get_parent()
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


def diffractometer_phase_changed(*args):
    data = {"msg": "Diffractometer phase changed", "phase": args}
    logging.getLogger("user_level_log").info(
        "Diffractometer phase changed to %s" % args
    )
    server.emit("diff_phase_changed", data, namespace="/hwr")


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
        msg = {"signal": "isCollisionSafe", "message": "Sample moved to safe area"}
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

            if sample:
                address = sample.get_address()
            else:
                address = None

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
    server.emit("sc_contents_update")


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
    elif method in ["Manual 3-click"]:
        msg = {"method": qe.CENTRING_METHOD.MANUAL}

    server.emit("sample_centring", msg, namespace="/hwr")


def get_task_state(entry):
    node_id = entry.get_data_model()._node_id
    _, state = mxcube.queue.get_node_state(node_id)
    node_index = mxcube.queue.node_index(entry.get_data_model())
    lims_id = mxcube.NODE_ID_TO_LIMS_ID.get(node_id, "null")

    try:
        limsres = HWR.beamline.lims.lims_rest.get_dc(lims_id)
    except Exception:
        limsres = {}

    try:
        limsres["limsTaskLink"] = mxcube.lims.get_dc_link(lims_id)
    except Exception:
        limsres["limsTaskLink"] = "#"
        msg = "Could not get lims link for collection with id: %s" % lims_id
        logging.getLogger("HWR").error(msg)

    msg = {
        "Signal": "",
        "Message": "",
        "taskIndex": node_index["idx"],
        "queueID": node_id,
        "sample": node_index["sample"],
        "limsResultData": limsres,
        "state": state,
        "progress": 1 if state == COLLECTED else 0,
    }

    return msg


def update_task_result(entry):
    node_index = mxcube.queue.node_index(entry.get_data_model())
    node_id = entry.get_data_model()._node_id
    lims_id = mxcube.NODE_ID_TO_LIMS_ID.get(node_id, "null")

    try:
        limsres = HWR.beamline.lims_rest.get_dc(lims_id)
    except Exception:
        limsres = {}

    try:
        limsres["limsTaskLink"] = mxcube.lims.get_dc_link(lims_id)
    except Exception:
        limsres["limsTaskLink"] = "#"
        msg = "Could not get lims link for collection with id: %s" % lims_id
        logging.getLogger("HWR").error(msg)

    msg = {
        "sample": node_index["sample"],
        "taskIndex": node_index["idx"],
        "limsResultData": limsres,
    }

    server.emit("update_task_lims_data", msg, namespace="/hwr")


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
        msg = {"Signal": "DisableSample", "sampleID": entry.get_data_model().loc_str}
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
    msg = {"Signal": "QueueStopped", "Message": "Queue execution stopped"}

    server.emit("queue", msg, namespace="/hwr")


def queue_execution_paused(state):
    if state:
        msg = {"Signal": "QueuePaused", "Message": "Queue execution paused"}
    else:
        msg = {"Signal": "QueueRunning", "Message": "Queue execution paused"}

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
    node = last_queue_node()

    if not mxcube.queue.is_interleaved(node["node"]):
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
    owner=None, status=FAILED, state=None, lims_id="", osc_id=None, params=None
):
    node = last_queue_node()

    mxcube.NODE_ID_TO_LIMS_ID[node["queue_id"]] = lims_id

    if not mxcube.queue.is_interleaved(node["node"]):
        try:
            HWR.beamline.lims_rest.get_dc(lims_id)
        except Exception:
            pass

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
    server.emit("energy_scan_result", {"pk": pk, "ip": ip, "rm": rm}, namespace="/hwr")


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


def beam_changed(*args, **kwargs):

    beam_info = HWR.beamline.beam

    if beam_info is None:
        logging.getLogger("HWR").error("beamInfo is not defined")
        # TODO fix error
        return Response(status=409)

    beam_info_dict = {"position": [], "shape": "", "size_x": 0, "size_y": 0}
    _beam = beam_info.get_value()
    beam_info_dict.update(
        {
            "position": beam_info.get_beam_position_on_screen(),
            "size_x": _beam[0],
            "size_y": _beam[1],
            "shape": _beam[2].value,
        }
    )
    try:
        server.emit("beam_changed", {"data": beam_info_dict}, namespace="/hwr")
    except Exception:
        logging.getLogger("HWR").exception(
            "error sending beam_changed signal: %s" % beam_info_dict
        )


def beamline_action_start(name):
    msg = {"name": name, "state": RUNNING}
    try:
        server.emit("beamline_action", msg, namespace="/hwr")
    except Exception:
        logging.getLogger("HWR").exception(
            "error sending beamline action message: %s", msg
        )


def beamline_action_done(name, result):
    try:
        msg = {"name": name, "state": READY, "data": result}
        server.emit("beamline_action", msg, namespace="/hwr")
    except Exception:
        logging.getLogger("HWR").exception(
            "error sending beamline action message: %s", msg
        )
    else:
        logging.getLogger("user_level_log").info("%s done.", name)


def beamline_action_failed(name):
    msg = {"name": name, "state": FAILED}
    try:
        server.emit("beamline_action", msg, namespace="/hwr")
    except Exception:
        logging.getLogger("HWR").exception(
            "error sending beamline action message: %s", msg
        )
    else:
        logging.getLogger("user_level_log").error("Action %s failed !", name)


def safety_shutter_state_changed(values):
    ho = BeamlineAdapter(HWR.beamline).get_object_by_role("safety_shutter")
    data = ho.dict()
    try:
        server.emit("hardware_object_changed", data, namespace="/hwr")
    except Exception:
        logging.getLogger("HWR").error("error sending message: %s" + str(data))


def mach_info_changed(values):
    try:
        server.emit("mach_info_changed", values, namespace="/hwr")
    except Exception:
        logging.getLogger("HWR").error(
            "error sending mach_info_changed signal: &s" % values
        )


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
