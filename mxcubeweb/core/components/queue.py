import contextlib
import json
import logging

from mxcubecore import HardwareRepository as HWR
from mxcubecore import queue_entry as qe
from mxcubecore.model import queue_model_objects as qmo
from mxcubecore.model.queue_model_enumerables import CENTRING_METHOD
from mxcubecore.queue_entry.base_queue_entry import QUEUE_ENTRY_STATUS
from mxcubecore.queuelib import (
    COLLECTED,
    FAILED,
    ORIGIN_MX3,
    RUNNING,
    UNCOLLECTED,
    VALID_PREFIX_TEMPLATE_FIELDS,
    VALID_SUBDIR_TEMPLATE_FIELDS,
    WARNING,
    QueueBuilder,
    QueueSerializer,
)

from mxcubeweb.core.components.component_base import ComponentBase
from mxcubeweb.core.models.adaptermodels import (
    SampleInputModel,
)
from mxcubeweb.core.models.generic import (
    ALLOWED_APP_SETTINGS,
    GroupFolderModel,
    SettingNameValue,
)
from mxcubeweb.core.util.convertutils import (
    str_to_camel,
    str_to_snake,
)

# Important: same constants as in constants.js
QUEUE_PAUSED = "QueuePaused"
QUEUE_RUNNING = "QueueRunning"
QUEUE_STOPPED = "QueueStopped"
QUEUE_FAILED = "QueueFailed"


class Queue(ComponentBase):
    def __init__(self, app, config):
        super().__init__(app, config)
        self.init_queue_settings()
        self._qb = QueueBuilder()
        self._qs = QueueSerializer(self._qb)

    def node_index(self, node):
        """Get the position (index) in the queue, sample and node id of node <node>.

        :returns: dictionary on the form:
                {'sample': sample, 'idx': index, 'queue_id': node_id}
        """
        return HWR.beamline.queue_model.node_index(node)

    def queue_to_dict(self):
        """Returns the dictionary representation of the whole queue.

        :returns: dictionary on the form:
                { sampleID_1:{ sampleID_1: sid_1,
                                queueID: qid_1,
                                location: location_n
                                tasks: [task1, ... taskn]},
                                .
                                .
                                .
                    sampleID_N:{ sampleID_N: sid_N,
                                queueID: qid_N,
                                location: location_n,
                                tasks: [task1, ... taskn]}

                where the contents of task is a dictionary, the content depends on
                the TaskNode type (DataCollection, Chracterisation, Sample). The
                task dict can be directly used with the set_from_dict methods of
                the corresponding node.
        """
        return self._qs.queue_to_dict()

    def node_to_dict(self, node: qmo.TaskNode):
        """Returns the dictionary representation of a single node itself
        (not the whole queue, not the node's children).

        :param node: the Node object to get a representation for.
        """
        return self._qs.node_to_dict(node)

    def get_node_state(self, node_id: int):
        """Get the state of the given node.

        :param node_id: Node id of node to get state for

        :returns: tuple containing (enabled, state)
                where state: {0, 1, 2, 3} = {in_queue, running, success, failed}
                {'sample': sample, 'idx': index, 'queue_id': node_id}
        """
        enabled, is_executed, running, status = (
            HWR.beamline.queue_manager.get_entry_status(node_id)
        )

        if status == QUEUE_ENTRY_STATUS.FAILED:
            state = FAILED
        elif status == QUEUE_ENTRY_STATUS.WARNING:
            # Same as QueueSerializer.get_node_state in mxcubecore.queuelib -
            # checked before is_executed()/SUCCESS below, since e.g. a
            # completed-without-diffraction-plan Characterisation is also
            # is_executed() but should be reported as WARNING, not COLLECTED.
            state = WARNING
        elif is_executed or status == QUEUE_ENTRY_STATUS.SUCCESS:
            state = COLLECTED
        elif running or status == QUEUE_ENTRY_STATUS.RUNNING:
            state = RUNNING
        else:
            state = UNCOLLECTED

        return (enabled, state)

    def get_queue_state(self):
        """Return the dictionary representation of the current queue and its state.

        :returns: dictionary on the form:
                {
                    loaded: ID of currently loaded sample,
                    queue: same format as queue_to_dict() but without sample_order,
                    queueStatus: one of [QUEUE_PAUSED, QUEUE_RUNNING, QUEUE_STOPPED]
                }
        """
        queue = self.queue_to_dict()
        sample_order = queue.get("sample_order", [])
        try:
            current = self.app.lims.get_current_sample().get("sampleID", "")
        except Exception as ex:
            logging.getLogger("MX3.HWR").warning(
                "Error retrieving current sample, {0}".format(ex.message)
            )
            current = ""

        settings = {}

        for setting_name in [
            "REMEMBER_PARAMETERS_BETWEEN_SAMPLES",
        ]:
            settings[str_to_camel(setting_name)] = getattr(self.app, setting_name)

        settings[str_to_camel("AUTO_ADD_DIFFPLAN")] = (
            HWR.beamline.queue_manager.auto_add_diff_plan
        )

        res = {
            "current": current,
            "autoMountNext": self.get_auto_mount_sample(),
            "groupFolder": HWR.beamline.session.get_group_name(),
            "queue": sample_order,
            "sampleList": self.app.lims.sample_list_get(current_queue=queue),
            "queueStatus": self.queue_exec_state(),
            "numSnapshots": HWR.beamline.collect.get_property(
                "num_snapshots", HWR.beamline.collect.number_of_snapshots
            ),
            "centringMethod": HWR.beamline.queue_manager.centring_method,
        }

        self.app.queue.set_num_snapshots(
            res.get("numSnapshots", HWR.beamline.collect.number_of_snapshots)
        )

        res.update(settings)
        return res

    def queue_exec_state(self):
        """Queue execution state.

        :returns: The queue execution state, one of QUEUE_STOPPED, QUEUE_PAUSED
        or QUEUE_RUNNING
        """
        state = QUEUE_STOPPED

        if HWR.beamline.queue_manager.is_paused():
            state = QUEUE_PAUSED
        elif HWR.beamline.queue_manager.is_executing():
            state = QUEUE_RUNNING

        return state

    def get_entry(self, _id: int) -> tuple:
        """Retrieve the model and the queue entry for the model node with id <id>.

        :param _id: Node id of node to retrieve
        :returns: The tuple model, entry or the root node and QueueManger if _id is None
        """
        return HWR.beamline.queue_manager.get_entry(_id)

    def delete_entry_at(self, item_pos_list):
        return HWR.beamline.queue_manager.delete_entry_at(item_pos_list)

    def enable_entry(self, id_or_qentry: int | qe.BaseQueueEntry, flag: bool):
        """Helper function that sets the enabled flag for the entry and its model.

        Helper function that sets the enabled flag to <flag> for the entry and associated model.
        Takes either the model node id or the QueueEntry object.

        Sets enabled flag on both the entry and model.

        :param id_or_qentry: Node id of model or QueueEntry object
        :param flag: True for enabled False for disabled
        """
        return HWR.beamline.queue_manager.enable_entry(id_or_qentry, flag)

    def queue_add_item(self, item_list):
        """Add queue items to the queue.

        Add the queue items in item_list to the queue. The items in the list can
        be either samples and or tasks. Samples are only added if they are not
        already in the queue  and tasks are appended to the end of an
        (already existing) sample. A task is ignored if the sample is not already
        in the queue.

        The items in item_list are dictionaries with the following structure:

        { "type": "Sample | DataCollection | Characterisation",
        "sampleID": sid
        ... task or sample specific data
        }

        Each item (dictionary) describes either a sample or a task.
        """
        return self._qs.queue_add_item(item_list)

    def add_task(self, parent, item):
        """Add a single task to an already-queued sample.

        :param parent: the sample's queueID, or its sampleID/loc_str
        :param item: task dict, e.g. {"type": "DataCollection",
            "parameters": {...}}
        :returns: the new task's queue id
        """
        return self._qs.add_task(parent, item)

    def notify_sample_added(self, sample):
        """Register a manually-added ("free pin") sample in the mxcubeweb
        sample list.

        Connected to QueueModel's "sample_added" signal (see init_signals)
        rather than called inline from add_sample, so this fires no matter
        which code path added the sample.
        """
        if not sample.free_pin_mode:
            return

        sample_dict = self._qs._build_sample_node(sample).model_dump()
        self.app.lims.sample_list_update_sample(sample.loc_str, sample_dict)

    def clear_queue(self):
        """Create a new queue.

        :returns: MxCuBE QueueModel Object
        """
        return HWR.beamline.queue_model.clear_queue()

    def queue_model_child_added(self, parent, child):
        """Listen to the addition of models to the queue model ('child_added').

        This is the single place a QueueEntry is created for a model node:
        QueueBuilder only ever calls add_child() to place a model in the
        tree, it never constructs or enqueues an entry itself.
        """
        return HWR.beamline.queue_model.queue_model_child_added(parent, child)

    def notify_task_added(self, parent, child):
        """Notify the client when a DataCollection is added to the queue
        model outside the of QueueBuilder (MXCuBE) (diffraction-plan collection)
        """
        if child.get_origin() == ORIGIN_MX3 or not isinstance(
            child, qmo.DataCollection
        ):
            return

        sample = parent.get_sample_node()
        task = self._qs._handle_dc_node(sample, child)

        self.app.server.emit("add_task", {"tasks": [task.dict()]}, namespace="/hwr")

    def queue_model_diff_plan_available(self, char, collection_list):
        cols = []
        for collection in collection_list:
            if isinstance(collection, qmo.DataCollection):
                if collection.get_origin():
                    origin_model, _ = self.get_entry(collection.get_origin())
                else:
                    origin_model, _ = self.get_entry(char._node_id)

                collection.set_enabled(False)

                dcg_model = char.get_parent()
                sample = dcg_model.get_sample_node()

                setattr(collection, "shape", origin_model.shape)

                task = self._qs._handle_dc_node(sample, collection).dict()
                task.update(
                    {
                        "isDiffractionPlan": True,
                        "originID": origin_model._node_id,
                    }
                )
                cols.append(task)

        self.app.server.emit("add_diff_plan", {"tasks": cols}, namespace="/hwr")

    def set_auto_add_diffplan(self, autoadd: bool):
        """Set auto add diffraction plan flag.

        Sets auto add diffraction plan flag, automatically add to the queue
        (True) or wait for user (False)

        :param autoadd: True autoadd, False wait for user
        """
        self.app.AUTO_ADD_DIFFPLAN = autoadd
        HWR.beamline.queue_manager.set_auto_add_diff_plan(autoadd)

    def execute_entry_with_id(self, sid: str, tindex: int | None = None):
        """Execute the entry at position (sampleID, task index) in queue.

        :param sid: sampleID
        :param tindex: task index of task within sample with id sampleID
        """
        current_queue = self.queue_to_dict()
        HWR.beamline.queue_manager.set_pause(False)

        if tindex in ["undefined", "None", "null", None]:
            # The queue does not run the mount defined by the sample entry if it has no
            # tasks, so in order function as expected; just mount the sample
            if (
                not len(current_queue[sid]["tasks"])
            ) and sid != self.app.lims.get_current_sample().get("sampleID", ""):
                try:
                    self.app.mxcubecore.get_adapter("sample_changer").mount_sample(
                        SampleInputModel(**current_queue[sid]), wait=True
                    )
                except Exception:
                    logging.getLogger("HWR").exception("")
                    HWR.beamline.queue_manager.emit("queue_execution_failed", (None,))
                else:
                    HWR.beamline.queue_manager.emit("queue_stopped", (None,))
            else:
                enabled_entries = []

                for sampleID in current_queue["sample_order"]:
                    if current_queue[sampleID].get("checked", False):
                        enabled_entries.append(sampleID)

                enabled_entries.pop(enabled_entries.index(sid))
                self.app.TEMP_DISABLED = enabled_entries
                self.enable_sample_entries(enabled_entries, False)
                self.enable_sample_entries([sid], True)

                HWR.beamline.queue_manager.execute()
        else:
            node_id = current_queue[sid]["tasks"][int(tindex)]["queueID"]

            node, entry = self.get_entry(node_id)
            # in order to fill lims data, we execute first the parent (group_id missing)
            parent_id = node.get_parent()._node_id
            node, entry = self.get_entry(parent_id)

            try:
                HWR.beamline.queue_manager.execute(entry)
            except Exception:
                HWR.beamline.queue_manager.emit("queue_execution_failed", (None,))

    def collect_started(self, *args, **kwargs):
        node = self.last_queue_node()

        if not self.is_interleaved(node["node"]):
            msg = {
                "Signal": "collectStarted",
                "Message": "Data collection has started",
                "taskIndex": self.last_queue_node()["idx"],
                "queueID": self.last_queue_node()["queue_id"],
                "sample": self.last_queue_node()["sample"],
                "state": RUNNING,
                "progress": 0,
            }

            logging.getLogger("HWR").debug(f"[TASK CALLBACK] {msg}")
            self.app.server.emit("task", msg, namespace="/hwr")

    def collect_oscillation_started(self, *args):
        node = self.last_queue_node()

        if not self.is_interleaved(node["node"]):
            msg = {
                "Signal": "collectOscillationStarted",
                "Message": "Data collection oscillation has started",
                "taskIndex": node["idx"],
                "queueID": node["queue_id"],
                "sample": node["sample"],
                "state": RUNNING,
                "progress": 0,
            }

            logging.getLogger("HWR").debug(f"[TASK CALLBACK] {msg}")
            self.app.server.emit("task", msg, namespace="/hwr")

    def collect_oscillation_failed(  # noqa: PLR0913
        self,
        owner=None,
        status=FAILED,
        state=None,
        lims_id="",
        osc_id=None,
        params=None,
    ):
        node = self.last_queue_node()

        self.app.NODE_ID_TO_LIMS_ID[node["queue_id"]] = lims_id

        if not self.app.queue.is_interleaved(node["node"]):
            with contextlib.suppress(Exception):
                HWR.beamline.get_dc(lims_id)

            msg = {
                "Signal": "collectOscillationFailed",
                "Message": "Data collection oscillacion has failed",
                "taskIndex": node["idx"],
                "queueID": node["queue_id"],
                "sample": node["sample"],
                "state": FAILED,
                "progress": 0,
            }

            logging.getLogger("HWR").debug(f"[TASK CALLBACK] {msg}")
            self.app.server.emit("task", msg, namespace="/hwr")

    def collect_image_taken(self, frame):
        try:
            node = self.last_queue_node()
        except IndexError:
            node = None

        if node and not self.is_interleaved(node["node"]):
            progress = self.get_task_progress(node["node"], frame)

            msg = {
                "Signal": "collectImageTaken",
                "Message": "Image acquired",
                "taskIndex": node["idx"],
                "queueID": node["queue_id"],
                "sample": node["sample"],
                "state": RUNNING if progress < 1 else COLLECTED,
                "progress": progress,
            }
            logging.getLogger("HWR").debug(f"[TASK CALLBACK] {msg}")
            self.app.server.emit("task", msg, namespace="/hwr")

    def collect_oscillation_finished(  # noqa: PLR0913
        self, owner, status, state, lims_id, osc_id, params
    ):
        node = self.last_queue_node()
        self.app.NODE_ID_TO_LIMS_ID[node["queue_id"]] = lims_id

        if not self.is_interleaved(node["node"]):
            msg = {
                "Signal": "collectOscillationFinished",
                "Message": "Data collection oscillacion has finished",
                "taskIndex": node["idx"],
                "queueID": node["queue_id"],
                "sample": node["sample"],
                "state": COLLECTED,
                "progress": 1,
            }

            logging.getLogger("HWR").debug(f"[TASK CALLBACK] {msg}")

            self.app.server.emit("task", msg, namespace="/hwr")

    def queue_execution_started(self, entry, queue_state=None):
        state = queue_state if queue_state else self.queue_exec_state()
        msg = {"Signal": state, "Message": "Queue execution started"}

        self.app.server.emit("queue", msg, namespace="/hwr")

    def collect_ended(self, owner, success, message):
        node = self.last_queue_node()

        if not self.is_interleaved(node["node"]):
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

            logging.getLogger("HWR").debug(f"[TASK CALLBACK] {msg}")
            self.app.server.emit("task", msg, namespace="/hwr")

    def energy_scan_finished(self, pk, ip, rm, sample):
        self.app.server.emit(
            "energy_scan_result",
            {"pk": pk, "ip": ip, "rm": rm},
            namespace="/hwr",
        )

    def queue_interleaved_started(self):
        node = self.last_queue_node()

        msg = {
            "Signal": "queue_interleaved_started",
            "Message": "Interleaved collection started",
            "taskIndex": node["idx"],
            "queueID": node["queue_id"],
            "sample": node["sample"],
            "state": RUNNING,
            "progress": 0,
        }

        logging.getLogger("HWR").debug(f"[TASK CALLBACK] {msg}")
        self.app.server.emit("task", msg, namespace="/hwr")

    def queue_interleaved_finished(self):
        node = self.last_queue_node()

        msg = {
            "Signal": "queue_interleaved_finished",
            "Message": "Interleaved collection ended",
            "taskIndex": node["idx"],
            "queueID": node["queue_id"],
            "sample": node["sample"],
            "state": COLLECTED,
            "progress": 1,
        }

        logging.getLogger("HWR").debug(f"[TASK CALLBACK] {msg}")
        self.app.server.emit("task", msg, namespace="/hwr")

    def queue_interleaved_sw_done(self, data):
        node = self.last_queue_node()
        progress = self.get_task_progress(node["node"], data)

        msg = {
            "Signal": "collectImageTaken",
            "Message": "Image acquired",
            "taskIndex": node["idx"],
            "queueID": node["queue_id"],
            "sample": node["sample"],
            "state": RUNNING if progress < 1 else COLLECTED,
            "progress": progress,
        }

        logging.getLogger("HWR").debug(f"[TASK CALLBACK] {msg}")
        self.app.server.emit("task", msg, namespace="/hwr")

    def queue_execution_failed(self, entry):
        msg = {
            "Signal": self.queue_exec_state(),
            "Message": "Queue execution stopped",
        }

        self.app.server.emit("queue", msg, namespace="/hwr")

    def get_task_state(self, entry):
        node_id = entry.get_data_model()._node_id
        _, state = self.get_node_state(node_id)
        node_index = self.node_index(entry.get_data_model())

        return {
            "Signal": "",
            "Message": "",
            "taskIndex": node_index["idx"],
            "queueID": node_id,
            "sample": node_index["sample"],
            "state": state,
            "progress": 1 if state == COLLECTED else 0,
        }

    def handle_auto_mount_next(self, entry):
        model = entry.get_data_model()

        if isinstance(model.get_parent(), qmo.TaskGroup):
            auto_mount = self.get_auto_mount_sample()
            tgroup = entry.get_data_model()
            tgroup_list = entry.get_data_model().get_parent().get_children()

            try:
                last_gentry = tgroup_list.index(tgroup) == (len(tgroup_list) - 1)
            except ValueError:
                last_gentry = None

            if not auto_mount and last_gentry:
                msg = "Not mounting next sample automatically (Auto mount next)"
                logging.getLogger("user_level_log").info(msg)

    def queue_execution_entry_started(self, entry, message=None):
        self.handle_auto_mount_next(entry)

        if not self.is_interleaved(entry.get_data_model()):
            self.app.server.emit("task", self.get_task_state(entry), namespace="/hwr")

    def queue_execution_entry_finished(self, entry, message):
        self.handle_auto_mount_next(entry)

        if not self.is_interleaved(entry.get_data_model()):
            self.app.server.emit("task", self.get_task_state(entry), namespace="/hwr")

        self.queue_toggle_sample(entry)

    def queue_execution_finished(self, entry, queue_state=None):
        state = queue_state if queue_state else self.queue_exec_state()
        msg = {"Signal": state, "Message": "Queue execution stopped"}

        self.enable_sample_entries(self.app.TEMP_DISABLED, True)
        self.app.TEMP_DISABLED = []

        self.app.server.emit("queue", msg, namespace="/hwr")

    def queue_execution_paused(self, state):
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

        self.app.server.emit("queue", msg, namespace="/hwr")

    def init_signals(self, queue):
        """Initialize queue hwobj related signals."""
        HWR.beamline.collect.connect(
            HWR.beamline.collect,
            "collectStarted",
            self.collect_started,
        )
        HWR.beamline.collect.connect(
            HWR.beamline.collect,
            "collectOscillationStarted",
            self.collect_oscillation_started,
        )
        HWR.beamline.collect.connect(
            HWR.beamline.collect,
            "collectOscillationFailed",
            self.collect_oscillation_failed,
        )
        HWR.beamline.collect.connect(
            HWR.beamline.collect,
            "collectImageTaken",
            self.collect_image_taken,
        )

        HWR.beamline.collect.connect(
            HWR.beamline.collect,
            "collectOscillationFinished",
            self.collect_oscillation_finished,
        )

        queue.connect(queue, "child_added", self.queue_model_child_added)
        queue.connect(queue, "child_added", self.notify_task_added)

        # sample_added is emitted by add_child after child_added, once this
        # sample's QueueEntry already exists (see queue_model_child_added).
        queue.connect(queue, "sample_added", self.notify_sample_added)

        queue.connect(
            queue,
            "diff_plan_available",
            self.queue_model_diff_plan_available,
        )

        HWR.beamline.queue_manager.connect(
            "queue_execute_started", self.queue_execution_started
        )

        HWR.beamline.queue_manager.connect(
            "queue_execution_finished",
            self.queue_execution_finished,
        )

        HWR.beamline.queue_manager.connect(
            "queue_stopped", self.queue_execution_finished
        )

        HWR.beamline.queue_manager.connect("queue_paused", self.queue_execution_paused)

        HWR.beamline.queue_manager.connect(
            "queue_entry_execute_finished",
            self.queue_execution_entry_finished,
        )

        HWR.beamline.queue_manager.connect(
            "queue_entry_execute_started",
            self.queue_execution_entry_started,
        )

        HWR.beamline.queue_manager.connect("collectEnded", self.collect_ended)

        HWR.beamline.queue_manager.connect(
            "queue_interleaved_started",
            self.queue_interleaved_started,
        )

        HWR.beamline.queue_manager.connect(
            "queue_interleaved_finished",
            self.queue_interleaved_finished,
        )

        HWR.beamline.queue_manager.connect(
            "queue_interleaved_sw_done",
            self.queue_interleaved_sw_done,
        )

        HWR.beamline.queue_manager.connect(
            "energy_scan_finished", self.energy_scan_finished
        )

    def queue_toggle_sample(self, entry):
        if isinstance(entry, qe.SampleQueueEntry):
            msg = {
                "Signal": "DisableSample",
                "sampleID": entry.get_data_model().loc_str,
            }
            self.app.server.emit("queue", msg, namespace="/hwr")

    def enable_sample_entries(self, sample_id_list, flag):
        return HWR.beamline.queue_manager.enable_sample_entries(sample_id_list, flag)

    def set_auto_mount_sample(self, automount: bool):
        """Set auto mount next flag.

        Sets auto mount next flag, automatically mount next sample in queue
        (True) or wait for user (False)

        :param automount: True auto-mount, False wait for user
        """
        self.app.AUTO_MOUNT_SAMPLE = automount

    def get_auto_mount_sample(self) -> bool:
        """Get auto-mount sample.

        :returns: Returns auto mount flag
        """
        return self.app.AUTO_MOUNT_SAMPLE

    def get_task_progress(self, node, pdata):
        progress = 0

        if node.is_executed():
            progress = 1
        elif self.is_interleaved(node):
            progress = (
                (pdata["current_idx"] + 1)
                * pdata["sw_size"]
                / float(pdata["nitems"] * pdata["sw_size"])
            )
        elif isinstance(node, qmo.Characterisation):
            dc = node.reference_image_collection
            total = float(dc.acquisitions[0].acquisition_parameters.num_images) * 2
            progress = pdata / total
        else:
            total = float(node.acquisitions[0].acquisition_parameters.num_images)
            progress = pdata / total

        return progress

    def is_interleaved(self, node):
        return (
            hasattr(node, "interleave_num_images")
            and node.interleave_num_images is not None
            and node.interleave_num_images > 0
        )

    def init_queue_settings(self):
        self.app.AUTO_MOUNT_SAMPLE = HWR.beamline.collect.get_property(
            "auto_mount_sample", False
        )
        # Change value of the parameter, without changing the hardware object property.
        # This allows to properly reset the value on logout when invoking init_queue_settings.
        self.app.REMEMBER_PARAMETERS_BETWEEN_SAMPLES = (
            HWR.beamline.queue_manager.get_property(
                "remember_parameters_between_samples", False
            )
        )

        centring_method_as_string = HWR.beamline.queue_manager.get_property(
            "default_centring_method", "NONE"
        )
        HWR.beamline.queue_manager.centring_method = getattr(
            CENTRING_METHOD,
            centring_method_as_string,
        )

    def queue_start(self, sid):
        """Start execution of the queue.

        :returns: Respons object, status code set to:
                200: On success
                409: Queue could not be started
        """
        logging.getLogger("MX3.HWR").info("[QUEUE] Queue going to start")

        try:
            # If auto mount sample is false, just run the sample
            # supplied in the call
            if not self.get_auto_mount_sample():
                if sid:
                    self.execute_entry_with_id(sid)
            else:
                # Making sure all sample entries are enabled before running the
                # queue self.app.queue.enable_sample_entries(queue["sample_order"],
                # True)
                HWR.beamline.queue_manager.set_pause(False)
                HWR.beamline.queue_manager.execute()

        except Exception as ex:
            self.queue_execution_failed(ex)
        else:
            logging.getLogger("MX3.HWR").info("[QUEUE] Queue started")

    def queue_stop(self):
        HWR.beamline.queue_manager.stop()

    def queue_pause(self):
        """Pause the execution of the queue."""
        HWR.beamline.queue_manager.pause(True)

        msg = {
            "Signal": self.queue_exec_state(),
            "Message": "Queue execution paused",
            "State": 1,
        }

        logging.getLogger("MX3.HWR").info("[QUEUE] Paused")

        return msg

    def queue_unpause(self):
        """Unpause execution of the queue.

        :returns: Response object, status code set to:
                200: On success
                409: Queue could not be unpause
        """
        HWR.beamline.queue_manager.pause(False)

        msg = {
            "Signal": self.queue_exec_state(),
            "Message": "Queue execution started",
            "State": 1,
        }

        logging.getLogger("MX3.HWR").info("[QUEUE] Resumed")

        return msg

    def queue_clear(
        self,
    ):
        self.app.lims.init_sample_list()
        self.clear_queue()
        msg = "[QUEUE] Cleared  " + str(HWR.beamline.queue_model.get_model_root()._name)
        logging.getLogger("MX3.HWR").info(msg)

    def set_queue(self, json_queue):
        self.queue_add_item(json_queue)

    def queue_update_item(self, sqid, tqid, data):
        return self._qb.queue_update_item(sqid, tqid, data)

    def queue_enable_item(self, qid_list, enabled):
        return HWR.beamline.queue_manager.enable_entry(qid_list, enabled)

    def update_dependent_field(self, task_name, data):
        return HWR.beamline.queue_model.update_dependent_field(task_name, data)

    def get_default_task_parameters(self, task_name):
        acq_parameters = HWR.beamline.get_default_acquisition_parameters(
            task_name
        ).as_dict()

        queue_entry = qe.get_queue_entry_from_task_name(task_name)
        data_model = getattr(queue_entry, "DATA_MODEL", None)
        requires = getattr(queue_entry, "REQUIRES", None)
        display_name = getattr(queue_entry, "NAME", None)
        # NB This logic should be moved so that the defualt parameters for
        # a task can be retreived from one place.

        if task_name == "characterisation":
            acq_parameters.update(
                HWR.beamline.characterisation.get_default_characterisation_parameters().as_dict()
            )

        schema = self.get_task_schema(data_model) if data_model else {}

        try:
            ui_schema = data_model.ui_schema() if data_model else json.dumps({})
        except AttributeError:
            ui_schema = json.dumps({})

        for parameter_name, parameter_data in schema.get("properties", {}).items():
            if "default" in parameter_data:
                acq_parameters[parameter_name] = parameter_data["default"]

        return {
            "acq_parameters": {
                **acq_parameters,
                "inverse_beam": False,
                "take_dark_current": True,
                "skip_existing_images": False,
                "take_snapshots": HWR.beamline.collect.get_property(
                    "num_snapshots", HWR.beamline.collect.number_of_snapshots
                ),
                "helical": False,
                "mesh": False,
                "prefixTemplate": "{PREFIX}_{POSITION}",
                "subDirTemplate": "{ACRONYM}/{ACRONYM}-{NAME}",
                "experiment_type": "",
            },
            "limits": HWR.beamline.config.acquisition_limit_values,
            "requires": requires if requires else [],
            "name": display_name if display_name else task_name,
            "queue_entry": task_name,
            "schema": schema,
            "ui_schema": ui_schema,
            # The valid {PLACEHOLDER} tokens for prefixTemplate/subDirTemplate
            "template_fields": {
                "prefix": list(VALID_PREFIX_TEMPLATE_FIELDS),
                "subdir": list(VALID_SUBDIR_TEMPLATE_FIELDS),
            },
        }

    def get_task_schema(self, data_model):
        """Return one flat JSON Schema for the parameters queue_add_item
        actually expects for this task.

        :param data_model: a queue entry's DATA_MODEL - a pydantic model
            with exactly those five fields.
        """
        nested_schema = data_model.model_json_schema()
        defs = nested_schema.get("$defs", {})
        resolved_def_keys = set()

        def sub_schema(field_name):
            field_schema = nested_schema["properties"][field_name]
            ref = field_schema.get("$ref")
            if ref:
                key = ref.rsplit("/", 1)[-1]
                resolved_def_keys.add(key)
                return defs[key]
            return field_schema

        properties = {}
        required = set()

        for field_name in (
            "path_parameters",
            "common_parameters",
            "collection_parameters",
            "user_collection_parameters",
            "legacy_parameters",
        ):
            sub = sub_schema(field_name)
            required.update(sub.get("required", []))

            for name, prop_schema in sub.get("properties", {}).items():
                if name not in properties:
                    properties[name] = prop_schema
                elif properties[name] != prop_schema:
                    combined = properties[name].get("allOf", [properties[name]])
                    if prop_schema not in combined:
                        combined = [*combined, prop_schema]
                    properties[name] = {"allOf": combined}

        schema = {
            "type": "object",
            "properties": properties,
            "required": sorted(required),
        }

        remaining_defs = {k: v for k, v in defs.items() if k not in resolved_def_keys}
        if remaining_defs:
            schema["$defs"] = remaining_defs

        return schema

    def get_available_tasks(self):
        task_info = {}

        for task, available in HWR.beamline.config.available_methods.items():
            if available:
                task_info[task] = self.get_default_task_parameters(task)

        return task_info

    def set_group_folder(self, group_folder: GroupFolderModel):
        path = group_folder.path

        if path and path[-1] != "/":
            path += "/"

        logging.getLogger("MX3.HWR").info(f"[QUEUE] Setting group folder to {path}")
        HWR.beamline.session.set_user_group(path)
        root_path = HWR.beamline.session.get_base_image_directory()
        return {"path": path, "rootPath": root_path}

    def set_setting(self, name_value: SettingNameValue) -> tuple:  # noqa: D417
        """Set the setting (on the MXCUBEApplication object) with name to value.

        Args:
           name: The name of the setting
           value The value

        Returns:
           A tuple with name, value on success else empty tuple
        """
        name = str_to_snake(name_value.name).upper()

        if name in ALLOWED_APP_SETTINGS.keys() and hasattr(self.app, name):
            logging.getLogger("HWR").debug(
                f"Setting application setting {name} to {name_value.value}"
            )
            expected_type = ALLOWED_APP_SETTINGS[name]
            val = name_value.value

            try:
                conv = expected_type(val)
            except Exception as exc:
                raise ValueError(f"Invalid value for setting {name}: {val!r}") from exc
            else:
                setattr(self.app, name, conv)
                result = name, conv
        else:
            raise ValueError(f"Invalid setting {name}")

        return result

    def set_num_snapshots(self, num_snapshots: int):
        """Set the number of snapshots to take during data collection.

        Args:
            num_snapshots: number of snapshots to be taken
        """
        HWR.beamline.collect.number_of_snapshots = num_snapshots

    def last_queue_node(self):
        return HWR.beamline.queue_manager.last_queue_node()
