# -*- coding: utf-8 -*-
import os
import json
import pickle as pickle
import redis
import itertools
import logging
import re

from mock import Mock

from flask_login import current_user

from mxcubecore import HardwareRepository as HWR

from mxcubecore.model import queue_model_objects as qmo
from mxcubecore.model import queue_model_enumerables as qme

from mxcubecore import queue_entry as qe
from mxcubecore.queue_entry.base_queue_entry import QUEUE_ENTRY_STATUS

from mxcubecore.HardwareObjects.Gphl import GphlQueueEntry

from mxcubeweb.core.components.component_base import ComponentBase
from mxcubeweb.core.util.convertutils import str_to_camel, str_to_snake
from mxcubeweb.core.models.generic import SimpleNameValue

from functools import reduce

# Important: same constants as in constants.js
QUEUE_PAUSED = "QueuePaused"
QUEUE_RUNNING = "QueueRunning"
QUEUE_STOPPED = "QueueStopped"
QUEUE_FAILED = "QueueFailed"

SAMPLE_MOUNTED = 0x8
COLLECTED = 0x4
WARNING = 0x10
FAILED = 0x2
RUNNING = 0x1
UNCOLLECTED = 0x0
READY = 0

ORIGIN_MX3 = "MX3"


class Queue(ComponentBase):
    def __init__(self, app, config):
        super().__init__(app, config)

    def build_prefix_path_dict(self, path_list):
        prefix_path_dict = {}

        for path in path_list:
            try:
                path, run_number, img_number = qmo.PathTemplate.interpret_path(path)
            except ValueError:
                logging.getLogger("MX3.HWR").info(
                    '[QUEUE] Warning, failed to interpret path: "%s", please check path'
                    % path
                )
                path, run_number = (path, 0)
            if path in prefix_path_dict:
                prefix_path_dict[path] = max(prefix_path_dict[path], run_number)
            else:
                prefix_path_dict[path] = run_number

        return prefix_path_dict

    def get_run_number(self, pt):
        # Path templates of files not yet written to to disk, we are only
        # interested in the prefix path

        pt.run_number = HWR.beamline.queue_model.get_next_run_number(pt)
        start_fname, end_fname = pt.get_first_and_last_file()

        while os.path.isfile(start_fname) or os.path.isfile(end_fname):
            pt.run_number += 1

            if pt.run_number > 1000:
                raise RuntimeError("Over a thousand runs of the same collection")

            start_fname, end_fname = pt.get_first_and_last_file()

        return pt.run_number

    def node_index(self, node):
        """
        Get the position (index) in the queue, sample and node id of node <node>.

        :returns: dictionary on the form:
                {'sample': sample, 'idx': index, 'queue_id': node_id}
        """
        sample, index, sample_model = None, None, None

        # RootNode nothing to return
        if isinstance(node, qmo.RootNode):
            sample = None
        # For samples simply return the sampleID
        elif isinstance(node, qmo.Sample):
            sample = node.loc_str
        # TaskGroup just return the sampleID
        elif node.get_parent():
            # NB under GPhL workflow, nodes do not have predictable distance
            # to their sample node
            sample_model = node.get_sample_node()

            sample = sample_model.loc_str
            task_groups = sample_model.get_children()
            tlist = []

            for group in task_groups:
                if group.interleave_num_images:
                    tlist.append(group)
                else:
                    tlist.extend(group.get_children())

            try:
                index = tlist.index(node)
            except Exception:
                pass

        return {
            "sample": sample,
            "idx": index,
            "queue_id": node._node_id,
            "sample_node": sample_model,
        }

    def load_queue_from_dict(self, queue_dict):
        """
        Loads the queue in queue_dict in to the current HWR.beamline.queue_model (HWR.beamline.queue_model)

        :param dict queue_dict: Queue dictionary, on the same format as returned by
                                queue_to_dict
        """
        if queue_dict:
            item_list = []

            for sid in queue_dict["sample_order"]:
                item_list.append(queue_dict[sid])

            self.queue_add_item(item_list)

    def queue_to_dict(self, node=None, include_lims_data=False):
        """
        Returns the dictionary representation of the queue

        :param TaskNode node: list of Node objects to get representation for,
                            queue root used if nothing is passed.

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
        if not node:
            node = HWR.beamline.queue_model.get_model_root()

        res = reduce(
            lambda x, y: x.update(y) or x,
            self.queue_to_dict_rec(node, include_lims_data),
            {},
        )

        return res

    def queue_to_json(self, node=None, include_lims_data=False):
        """
        Returns the json representation of the queue

        :param TaskNode node: list of Node objects to get representation for,
                            queue root used if nothing is passed.

        :returns: json str on the form:
                [ { sampleID_1: sid_1,
                    queueID: qid_1,
                    location: location_n
                    tasks: [task1, ... taskn]},
                    .
                    .
                    .
                    { sampleID_N: sid_N,
                    queueID: qid_N,
                    location: location_n,
                    tasks: [task1, ... taskn]} ]

                where the contents of task is a dictionary, the content depends on
                the TaskNode type (Datacollection, Chracterisation, Sample). The
                task dict can be directly used with the set_from_dict methods of
                the corresponding node.
        """
        if not node:
            node = HWR.beamline.queue_model.get_model_root()

        res = reduce(
            lambda x, y: x.update(y) or x,
            self.queue_to_dict_rec(node, include_lims_data),
            {},
        )

        return json.dumps(res, sort_keys=True, indent=4)

    def get_node_state(self, node_id):
        """
        Get the state of the given node.

        :param TaskNode node: Node to get state for

        :returns: tuple containing (enabled, state)
                where state: {0, 1, 2, 3} = {in_queue, running, success, failed}
                {'sample': sample, 'idx': index, 'queue_id': node_id}
        """
        try:
            node, entry = self.get_entry(node_id)
        except Exception:
            return (True, UNCOLLECTED)

        enabled = node.is_enabled()
        curr_entry = HWR.beamline.queue_manager.get_current_entry()
        running = HWR.beamline.queue_manager.is_executing() and (
            curr_entry == entry or curr_entry == entry._parent_container
        )

        if entry.status == QUEUE_ENTRY_STATUS.FAILED:
            state = FAILED
        elif node.is_executed() or entry.status == QUEUE_ENTRY_STATUS.SUCCESS:
            state = COLLECTED
        elif running or entry.status == QUEUE_ENTRY_STATUS.RUNNING:
            state = RUNNING
        else:
            state = UNCOLLECTED

        return (enabled, state)

    def get_queue_state(self):
        """
        Return the dictionary representation of the current queue and its state

        :returns: dictionary on the form:
                {
                    loaded: ID of currently loaded sample,
                    queue: same format as queue_to_dict() but without sample_order,
                    queueStatus: one of [QUEUE_PAUSED, QUEUE_RUNNING, QUEUE_STOPPED]
                }
        """
        queue = self.queue_to_dict(include_lims_data=True)
        sample_order = queue.get("sample_order", [])
        try:
            current = self.app.sample_changer.get_current_sample().get("sampleID", "")
        except Exception as ex:
            logging.getLogger("MX3.HWR").warning(
                "Error retrieving current sample, {0}".format(ex.message)
            )
            current = ""

        settings = {}

        for setting_name in [
            "NUM_SNAPSHOTS",
            "REMEMBER_PARAMETERS_BETWEEN_SAMPLES",
            "CENTRING_METHOD",
            "AUTO_ADD_DIFFPLAN",
        ]:
            settings[str_to_camel(setting_name)] = getattr(self.app, setting_name)

        res = {
            "current": current,
            "autoMountNext": self.get_auto_mount_sample(),
            "groupFolder": HWR.beamline.session.get_group_name(),
            "queue": sample_order,
            "sampleList": self.app.lims.sample_list_get(current_queue=queue),
            "queueStatus": self.queue_exec_state(),
        }

        res.update(settings)
        return res

    def _handle_task_node(self, sample_node, node, include_lims_data=False):
        parameters = {
            **node.task_data.collection_parameters.dict(),
            **node.task_data.user_collection_parameters.dict(),
            **node.task_data.path_parameters.dict(),
            **node.task_data.common_parameters.dict(),
            **node.task_data.legacy_parameters.dict(),
        }
        pt = node.acquisitions[0].path_template
        parameters["path"] = pt.directory

        parameters["subdir"] = os.path.join(
            *parameters["path"].split(HWR.beamline.session.raw_data_folder_name)[1:]
        ).lstrip("/")

        parameters["fileName"] = pt.get_image_file_name().replace(
            "%" + ("%sd" % str(pt.precision)), int(pt.precision) * "#"
        )

        parameters["fullPath"] = os.path.join(
            parameters["path"], parameters["fileName"]
        )

        return {
            "label": parameters["label"],
            "type": parameters["type"],
            "parameters": parameters,
            "sampleID": sample_node.loc_str,
            "sampleQueueID": sample_node._node_id,
            "taskIndex": self.node_index(node)["idx"],
            "queueID": node._node_id,
            "checked": node.is_enabled(),
            "state": self.get_node_state(node._node_id)[1],
            "limsResultData": "",
        }

    def _handle_dc(self, sample_node, node, include_lims_data=False):
        parameters = node.as_dict()
        parameters["shape"] = getattr(node, "shape", "")
        parameters["helical"] = node.experiment_type == qme.EXPERIMENT_TYPE.HELICAL
        parameters["mesh"] = node.experiment_type == qme.EXPERIMENT_TYPE.MESH

        parameters.pop("sample")
        parameters.pop("acquisitions")
        parameters.pop("acq_parameters")
        parameters.pop("centred_position")

        queueID = node._node_id
        enabled, state = self.get_node_state(queueID)

        parameters["subdir"] = os.path.join(
            *parameters["path"].split(HWR.beamline.session.raw_data_folder_name)[1:]
        ).lstrip("/")

        pt = node.acquisitions[0].path_template

        parameters["fileName"] = pt.get_image_file_name().replace(
            "%" + ("%sd" % str(pt.precision)), int(pt.precision) * "#"
        )

        parameters["fullPath"] = os.path.join(
            parameters["path"], parameters["fileName"]
        )

        limsres = {}
        lims_id = self.app.NODE_ID_TO_LIMS_ID.get(node._node_id, "null")

        # Only add data from lims if explicitly asked for, since
        # its a operation that can take some time.
        if include_lims_data and HWR.beamline.lims.lims_rest:
            limsres = HWR.beamline.lims.lims_rest.get_dc(lims_id)

        # Always add link to data, (no request made)
        limsres["limsTaskLink"] = self.app.lims.get_dc_link(lims_id)

        dtype_label = qme.EXPERIMENT_TYPE._fields[node.experiment_type]
        dtype_label = "OSCILLATION" if dtype_label == "NATIVE" else dtype_label
        dtype_label = (
            "LINE"
            if dtype_label == "HELICAL" and parameters["osc_range"] == 0
            else dtype_label
        )

        res = {
            "label": dtype_label + " (" + parameters["fileName"] + ")",
            "type": "DataCollection",
            "parameters": parameters,
            "sampleID": sample_node.loc_str,
            "sampleQueueID": sample_node._node_id,
            "taskIndex": self.node_index(node)["idx"],
            "queueID": queueID,
            "checked": node.is_enabled(),
            "state": state,
            "limsResultData": limsres,
        }

        return res

    def _handle_gphl_wf(self, sample_node, node, include_lims_data=False):
        pt = node.path_template
        parameters = pt.as_dict()
        parameters["path"] = parameters["directory"]

        parameters["strategy_name"] = node.strategy_name
        parameters["label"] = "GΦL " + parameters["strategy_name"]
        parameters["shape"] = node.shape

        queueID = node._node_id
        enabled, state = self.get_node_state(queueID)

        raw_data = HWR.beamline.session.raw_data_folder_name
        ddir = parameters["directory"]
        if raw_data in ddir:
            parameters["subdir"] = os.path.join(*ddir.split(raw_data)[1:]).lstrip("/")
        else:
            # We are given a relative directory. Thisa might or mightnto work.
            parameters["subdir"] = ddir

        parameters["fileName"] = pt.get_image_file_name().replace(
            "%" + ("%sd" % str(pt.precision)), int(pt.precision) * "#"
        )

        parameters["fullPath"] = os.path.join(
            parameters["directory"], parameters["fileName"]
        )

        limsres = {}
        lims_id = self.app.NODE_ID_TO_LIMS_ID.get(node._node_id, "null")

        # Only add data from lims if explicitly asked for, since
        # its a operation that can take some time.
        if include_lims_data and HWR.beamline.lims.lims_rest:
            limsres = HWR.beamline.lims.lims_rest.get_dc(lims_id)

        # Always add link to data, (no request made)
        limsres["limsTaskLink"] = self.app.lims.get_dc_link(lims_id)

        res = {
            "label": parameters["label"],
            "strategy_name": parameters["strategy_name"],
            "type": "GphlWorkflow",
            "parameters": parameters,
            "sampleID": sample_node.loc_str,
            "sampleQueueID": sample_node._node_id,
            "taskIndex": self.node_index(node)["idx"],
            "queueID": queueID,
            "checked": node.is_enabled(),
            "state": state,
            "limsResultData": limsres,
        }

        return res

    def _handle_wf(self, sample_node, node, include_lims_data):
        queueID = node._node_id
        enabled, state = self.get_node_state(queueID)
        parameters = node.parameters
        parameters.update(node.path_template.as_dict())

        parameters["path"] = parameters["directory"]

        parameters["subdir"] = os.path.join(
            *parameters["path"].split(HWR.beamline.session.raw_data_folder_name)[1:]
        ).lstrip("/")

        pt = node.path_template

        parameters["fileName"] = pt.get_image_file_name().replace(
            "%" + ("%sd" % str(pt.precision)), int(pt.precision) * "#"
        )

        parameters["fullPath"] = os.path.join(
            parameters["path"], parameters["fileName"]
        )

        limsres = {}
        lims_id = self.app.NODE_ID_TO_LIMS_ID.get(node._node_id, "null")

        # Only add data from lims if explicitly asked for, since
        # its a operation that can take some time.
        if include_lims_data and HWR.beamline.lims.lims_rest:
            limsres = HWR.beamline.lims.lims_rest.get_dc(lims_id)

        # Always add link to data, (no request made)
        limsres["limsTaskLink"] = self.app.lims.get_dc_link(lims_id)

        res = {
            "label": parameters["label"],
            "type": "Workflow",
            "name": node._type,
            "parameters": parameters,
            "sampleID": sample_node.loc_str,
            "taskIndex": self.node_index(node)["idx"],
            "queueID": queueID,
            "checked": node.is_enabled(),
            "state": state,
            "limsResultData": limsres,
        }

        return res

    def _handle_xrf(self, sample_node, node):
        queueID = node._node_id
        enabled, state = self.get_node_state(queueID)
        parameters = {
            "countTime": node.count_time,
            "shape": node.shape,
        }
        parameters.update(node.path_template.as_dict())
        parameters["path"] = parameters["directory"]

        parameters["subdir"] = os.path.join(
            *parameters["path"].split(HWR.beamline.session.raw_data_folder_name)[1:]
        ).lstrip("/")

        pt = node.path_template

        parameters["fileName"] = pt.get_image_file_name().replace(
            "%" + ("%sd" % str(pt.precision)), int(pt.precision) * "#"
        )

        parameters["fullPath"] = os.path.join(
            parameters["path"], parameters["fileName"]
        )
        model, entry = self.get_entry(queueID)

        res = {
            "label": "XRF Scan",
            "type": "xrf_spectrum",
            "parameters": parameters,
            "sampleID": sample_node.loc_str,
            "taskIndex": self.node_index(node)["idx"],
            "queueID": queueID,
            "sampleQueueID": sample_node._node_id,
            "checked": node.is_enabled(),
            "state": state,
        }

        return res

    def _handle_energy_scan(self, sample_node, node):
        queueID = node._node_id
        enabled, state = self.get_node_state(queueID)
        parameters = {
            "element": node.element_symbol,
            "edge": node.edge,
            "shape": -1,
        }

        parameters.update(node.path_template.as_dict())
        parameters["path"] = parameters["directory"]

        parameters["subdir"] = os.path.join(
            *parameters["path"].split(HWR.beamline.session.raw_data_folder_name)[1:]
        ).lstrip("/")

        pt = node.path_template

        parameters["fileName"] = pt.get_image_file_name().replace(
            "%" + ("%sd" % str(pt.precision)), int(pt.precision) * "#"
        )

        parameters["fullPath"] = os.path.join(
            parameters["path"], parameters["fileName"]
        )

        res = {
            "label": "Energy Scan",
            "type": "energy_scan",
            "parameters": parameters,
            "sampleID": sample_node.loc_str,
            "sampleQueueID": sample_node._node_id,
            "taskIndex": self.node_index(node)["idx"],
            "queueID": queueID,
            "checked": node.is_enabled(),
            "state": state,
        }

        return res

    def _handle_char(self, parent_node, node, include_lims_data=False):
        sample_node = parent_node.get_sample_node()
        parameters = node.characterisation_parameters.as_dict()
        parameters["shape"] = node.get_point_index()
        refp = self._handle_dc(sample_node, node.reference_image_collection)[
            "parameters"
        ]

        parameters.update(refp)

        queueID = node._node_id
        enabled, state = self.get_node_state(queueID)

        limsres = {}
        lims_id = self.app.NODE_ID_TO_LIMS_ID.get(node._node_id, "null")

        # Only add data from lims if explicitly asked for, since
        # its a operation that can take some time.
        if include_lims_data and HWR.beamline.lims.lims_rest:
            limsres = HWR.beamline.lims.lims_rest.get_dc(lims_id)

        # Always add link to data, (no request made)
        limsres["limsTaskLink"] = self.app.lims.get_dc_link(lims_id)

        originID, task = self._handle_diffraction_plan(node, sample_node)

        res = {
            "label": "CHARACTERISATION",
            "type": "Characterisation",
            "parameters": parameters,
            "checked": node.is_enabled(),
            "sampleID": sample_node.loc_str,
            "sampleQueueID": sample_node._node_id,
            "taskIndex": self.node_index(node)["idx"],
            "queueID": node._node_id,
            "state": state,
            "limsResultData": limsres,
            "diffractionPlan": task,
            "diffractionPlanID": originID,
        }

        return res

    def _handle_diffraction_plan(self, node, sample_node):
        model, entry = self.get_entry(node._node_id)
        originID = model.get_origin()
        tasks = []

        if len(model.diffraction_plan) == 0:
            return (-1, {})
        else:
            collections = model.diffraction_plan[0]  # a list of lists

            for col in collections:
                t = self._handle_dc(sample_node, col)
                if t is None:
                    tasks.append({})
                    continue

                t["isDiffractionPlan"] = True
                tasks.append(t)

            return (originID, tasks)

        return (-1, {})

    def _handle_interleaved(self, sample_node, node):
        wedges = []

        for child in node.get_children():
            wedges.append(self._handle_dc(sample_node, child))

        queueID = node._node_id
        enabled, state = self.get_node_state(queueID)

        res = {
            "label": "Interleaved",
            "type": "Interleaved",
            "parameters": {
                "wedges": wedges,
                "swNumImages": node.interleave_num_images,
            },
            "checked": node.is_enabled(),
            "sampleID": sample_node.loc_str,
            "sampleQueueID": sample_node._node_id,
            "taskIndex": self.node_index(node)["idx"],
            "queueID": node._node_id,
            "state": state,
        }

        return res

    def _handle_sample(self, node, include_lims_data=False):
        location = "Manual" if node.free_pin_mode else node.loc_str
        enabled, state = self.get_node_state(node._node_id)
        children_states = []

        for child in node.get_children():
            for _c in child.get_children():
                child_enabled, child_state = self.get_node_state(_c._node_id)
                children_states.append(child_state)

        if RUNNING in children_states:
            state = RUNNING & SAMPLE_MOUNTED
        elif 3 in children_states:
            state = FAILED & SAMPLE_MOUNTED
        elif all(i == COLLECTED for i in children_states) and len(children_states) > 0:
            state = COLLECTED & SAMPLE_MOUNTED
        else:
            state = UNCOLLECTED

        sample = {
            "sampleID": node.loc_str,
            "queueID": node._node_id,
            "code": node.code,
            "location": location,
            "sampleName": node.get_name(),
            "proteinAcronym": node.crystals[0].protein_acronym,
            "defaultPrefix": self.app.lims.get_default_prefix(node),
            "defaultSubDir": self.app.lims.get_default_subdir(node),
            "type": "Sample",
            "checked": enabled,
            "state": state,
            "tasks": self.queue_to_dict_rec(node, include_lims_data),
        }

        return {node.loc_str: sample}

    def queue_to_dict_rec(self, node, include_lims_data=False):
        """
        Parses node recursively and builds a representation of the queue based on
        python dictionaries.

        :param TaskNode node: The node to parse
        :returns: A list on the form:
                [ { sampleID_1: sid_1,
                    queueID: qid_1,
                    location: location_n
                    tasks: [task1, ... taskn]},
                    .
                    .
                    .
                    { sampleID_N: sid_N,
                    queueID: qid_N,
                    location: location_n,
                    tasks: [task1, ... taskn]} ]
        """
        result = []

        if isinstance(node, list):
            node_list = node
        else:
            node_list = node.get_children()

        for node in node_list:
            # NB under GPhL workflow, nodes do not have predictable distance
            # to their sample node
            sample_node = node.get_sample_node()
            if isinstance(node, qmo.Sample):
                if len(result) == 0:
                    result = [{"sample_order": []}]

                result.append(self._handle_sample(node, include_lims_data))

                if node.is_enabled():
                    result[0]["sample_order"].append(node.loc_str)

            elif isinstance(node, qmo.Characterisation):
                result.append(self._handle_char(sample_node, node, include_lims_data))
            elif (
                node.__class__ is qmo.DataCollection
            ):  # isinstance(node, qmo.DataCollection):
                result.append(self._handle_dc(sample_node, node, include_lims_data))
            elif isinstance(node, qmo.Workflow):
                result.append(self._handle_wf(sample_node, node, include_lims_data))
            elif isinstance(node, qmo.GphlWorkflow):
                result.append(
                    self._handle_gphl_wf(sample_node, node, include_lims_data)
                )
            elif isinstance(node, qmo.XRFSpectrum):
                result.append(self._handle_xrf(sample_node, node))
            elif isinstance(node, qmo.EnergyScan):
                result.append(self._handle_energy_scan(sample_node, node))
            elif isinstance(node, qmo.TaskGroup) and node.interleave_num_images:
                result.append(self._handle_interleaved(sample_node, node))
            elif isinstance(node, qmo.TaskNode) and node.task_data:
                result.append(
                    self._handle_task_node(sample_node, node, include_lims_data)
                )
            else:
                result.extend(self.queue_to_dict_rec(node, include_lims_data))

        return result

    def queue_exec_state(self):
        """
        :returns: The queue execution state, one of QUEUE_STOPPED, QUEUE_PAUSED
                or QUEUE_RUNNING

        """
        state = QUEUE_STOPPED

        if HWR.beamline.queue_manager.is_paused():
            state = QUEUE_PAUSED
        elif HWR.beamline.queue_manager.is_executing():
            state = QUEUE_RUNNING

        return state

    def get_entry(self, _id):
        """
        Retrieves the model and the queue entry for the model node with id <id>

        :param int id: Node id of node to retrieve
        :returns: The tuple model, entry
        :rtype: Tuple
        """
        model = HWR.beamline.queue_model.get_node(int(_id))
        entry = HWR.beamline.queue_manager.get_entry_with_model(model)
        return model, entry

    def set_enabled_entry(self, qid, enabled):
        model, entry = self.get_entry(qid)
        model.set_enabled(enabled)
        entry.set_enabled(enabled)

    def delete_entry(self, entry):
        """
        Helper function that deletes an entry and its model from the queue
        """
        parent_entry = entry.get_container()
        parent_entry.dequeue(entry)
        model = entry.get_data_model()
        HWR.beamline.queue_model.del_child(model.get_parent(), model)
        logging.getLogger("MX3.HWR").info(
            "[DELETE QUEUE] FROM:\n%s " % model.get_parent().get_name()
        )

    def delete_entry_at(self, item_pos_list):
        current_queue = self.queue_to_dict()

        for sid, tindex in item_pos_list:
            if tindex in ["undefined", None]:
                node_id = current_queue[sid]["queueID"]
                model, entry = self.get_entry(node_id)
            else:
                node_id = current_queue[sid]["tasks"][int(tindex)]["queueID"]
                model, entry = self.get_entry(node_id)

                # Get the TaskGroup of the item, there is currently only one
                # task per TaskGroup so we have to remove the entire TaskGroup
                # with its task.
                if not isinstance(entry, qe.TaskGroupQueueEntry):
                    entry = entry.get_container()

            self.delete_entry(entry)

    def enable_entry(self, id_or_qentry, flag):
        """
        Helper function that sets the enabled flag to <flag> for the entry
        and associated model. Takes either the model node id or the QueueEntry
        object.

        Sets enabled flag on both the entry and model.

        :param object id_or_qentry: Node id of model or QueueEntry object
        :param bool flag: True for enabled False for disabled
        """
        if isinstance(id_or_qentry, qe.BaseQueueEntry):
            id_or_qentry.set_enabled(flag)
            id_or_qentry.get_data_model().set_enabled(flag)
        else:
            model, entry = self.get_entry(id_or_qentry)
            entry.set_enabled(flag)
            model.set_enabled(flag)

    def swap_task_entry(self, sid, ti1, ti2):
        """
        Swaps order of two queue entries in the queue, with the same sample <sid>
        as parent

        :param str sid: Sample id
        :param int ti1: Position of task1 (old position)
        :param int ti2: Position of task2 (new position)
        """
        current_queue = self.queue_to_dict()

        node_id = current_queue[sid]["queueID"]
        smodel, sentry = self.get_entry(node_id)

        # Swap the order in the queue model
        ti2_temp_model = smodel.get_children()[ti2]
        smodel._children[ti2] = smodel._children[ti1]
        smodel._children[ti1] = ti2_temp_model

        # Swap queue entry order
        ti2_temp_entry = sentry._queue_entry_list[ti2]
        sentry._queue_entry_list[ti2] = sentry._queue_entry_list[ti1]
        sentry._queue_entry_list[ti1] = ti2_temp_entry

        logging.getLogger("MX3.HWR").info("[QUEUE] is:\n%s " % self.queue_to_json())

    def move_task_entry(self, sid, ti1, ti2):
        """
        Swaps order of two queue entries in the queue, with the same sample <sid>
        as parent

        :param str sid: Sample id
        :param int ti1: Position of task1 (old position)
        :param int ti2: Position of task2 (new position)
        """
        current_queue = self.queue_to_dict()

        node_id = current_queue[sid]["queueID"]
        smodel, sentry = self.get_entry(node_id)

        # Swap the order in the queue model
        smodel._children.insert(ti2, smodel._children.pop(ti1))

        # Swap queue entry order
        sentry._queue_entry_list.insert(ti2, sentry._queue_entry_list.pop(ti1))

        logging.getLogger("MX3.HWR").info("[QUEUE] is:\n%s " % self.queue_to_json())

    def set_sample_order(self, order):
        """
        Set the sample order of the queue
        :param list sample_order: List of sample ids
        """
        current_queue = self.queue_to_dict()
        sid_list = list([sid for sid in order if current_queue.get(sid, False)])

        if sid_list:
            queue_id_list = [current_queue[sid]["queueID"] for sid in sid_list]
            model_entry_list = [self.get_entry(qid) for qid in queue_id_list]
            model_list = [model_entry[0] for model_entry in model_entry_list]
            entry_list = [model_entry[1] for model_entry in model_entry_list]

            # Set the order in the queue model
            HWR.beamline.queue_model.get_model_root()._children = model_list
            # Set queue entry order
            HWR.beamline.queue_manager._queue_entry_list = entry_list

        self.app.lims.sample_list_set_order(order)

        logging.getLogger("MX3.HWR").info("[QUEUE] is:\n%s " % self.queue_to_json())

    def queue_add_item(self, item_list):
        """
        Adds the queue items in item_list to the queue. The items in the list can
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
        self._queue_add_item_rec(item_list, None)

        # Handling interleaved data collections, swap interleave task with
        # the first of the data collections that are used as wedges, and then
        # remove all collections that were used as wedges
        for task in item_list[0]["tasks"]:
            if task["type"] == "Interleaved" and task["parameters"].get(
                "taskIndexList", False
            ):
                current_queue = self.queue_to_dict()

                sid = task["sampleID"]
                interleaved_tindex = len(current_queue[sid]["tasks"]) - 1

                tindex_list = sorted(task["parameters"]["taskIndexList"])

                # Swap first "wedge task" and the actual interleaved collection
                # so that the interleaved task is the first task
                self.swap_task_entry(sid, interleaved_tindex, tindex_list[0])

                # We remove the swapped wedge index from the list, (now pointing
                # at the interleaved collection) and add its new position
                # (last task item) to the list.
                tindex_list = tindex_list[1:]
                tindex_list.append(interleaved_tindex)

                # The delete operation can be done all in one call if we make sure
                # that we remove the items starting from the end (not altering
                # previous indices)
                for ti in reversed(tindex_list):
                    self.delete_entry_at([[sid, int(ti)]])

        res = self.queue_to_dict()

        return res

    def _queue_add_item_rec(self, item_list, sample_node_id=None):
        """
        Adds the queue items in item_list to the queue. The items in the list can
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
        children = []

        for item in item_list:
            item_t = item["type"]
            # If the item a sample, then add it and its tasks. If its not, get the
            # node id for the sample of the new task and append it to the sample
            sample_id = str(item["sampleID"])

            if item_t == "Sample":
                # Do not add samples that are already in the queue
                if not item.get("queueID", False):
                    sample_node_id = self.add_sample(sample_id, item)
                else:
                    self.set_enabled_entry(item["queueID"], True)
                    sample_node_id = item["queueID"]

                tasks = item.get("tasks")

                if tasks:
                    self._queue_add_item_rec(tasks, sample_node_id)
                    children.extend(tasks)

            else:
                if not sample_node_id:
                    sample_node_id = item.get("sampleQueueID", None)

            if item_t == "DataCollection":
                self.add_data_collection(sample_node_id, item)
            elif item_t == "Interleaved":
                self.add_interleaved(sample_node_id, item)
            elif item_t == "Characterisation":
                self.add_characterisation(sample_node_id, item)
            elif item_t == "Workflow" or item_t == "GphlWorkflow":
                self.add_workflow(sample_node_id, item)
            elif item_t == "xrf_spectrum":
                self.add_xrf_scan(sample_node_id, item)
            elif item_t == "energy_scan":
                self.add_energy_scan(sample_node_id, item)
            elif item_t == "Sample":
                pass
            else:
                self.add_queue_entry(sample_node_id, item, item_t)

    def add_sample(self, sample_id, item):
        """
        Adds a sample with sample id <sample_id> the queue.

        :param str sample_id: Sample id (often sample changer location)
        :returns: SampleQueueEntry
        """
        sample_model = qmo.Sample()
        sample_model.set_origin(ORIGIN_MX3)
        sample_model.set_from_dict(item)

        # Explicitly set parameters that are not sent by the client
        sample_model.loc_str = sample_id
        sample_model.free_pin_mode = item["location"] == "Manual"
        sample_model.set_name(item["sampleName"])
        sample_model.name = item["sampleName"]

        if sample_model.free_pin_mode:
            sample_model.location = (None, sample_id)
        elif HWR.beamline.diffractometer.in_plate_mode():
            component = HWR.beamline.sample_changer._resolve_component(item["location"])
            sample_model.location = component.get_coords()
        else:
            sample_model.location = tuple(map(int, item["location"].split(":")))

        # Manually added sample, make sure that i'ts on the server side sample list
        if item["location"] == "Manual":
            item["defaultSubDir"] = self.app.lims.get_default_subdir(item)
            self.app.lims.sample_list_update_sample(sample_id, item)

        sample_entry = qe.SampleQueueEntry(view=Mock(), data_model=sample_model)
        self.enable_entry(sample_entry, True)

        HWR.beamline.queue_model.add_child(
            HWR.beamline.queue_model.get_model_root(), sample_model
        )
        HWR.beamline.queue_manager.enqueue(sample_entry)

        return sample_model._node_id

    def get_folder_tag(self, params):
        tag = "datacollection"

        if params["helical"] and params["osc_range"] == 0:
            tag = "line"
        elif params["helical"]:
            tag = "helical"
        elif params.get("mesh"):
            tag = "mesh"
        elif params.get("type") == "Characterisation":
            tag = "characterisation"

        return tag

    def set_dc_params(self, model, entry, task_data, sample_model):
        """
        Helper method that sets the data collection parameters for a DataCollection.

        :param DataCollectionQueueModel: The model to set parameters of
        :param DataCollectionQueueEntry: The queue entry of the model
        :param dict task_data: Dictionary with new parameters
        """
        acq = model.acquisitions[0]
        params = task_data["parameters"]
        acq.acquisition_parameters.set_from_dict(params)

        ftype = HWR.beamline.detector.get_property("file_suffix")
        ftype = ftype if ftype else ".?"

        acq.path_template.set_from_dict(params)
        # certain attributes have to be updated explicitly,
        # like precision, suffix ...
        acq.path_template.start_num = params["first_image"]
        acq.path_template.num_files = params["num_images"]
        acq.path_template.suffix = ftype
        acq.path_template.precision = "0" + str(
            HWR.beamline.session["file_info"].get_property("precision", 4)
        )

        self.app.lims.apply_template(params, sample_model, acq.path_template)

        if params["prefix"]:
            acq.path_template.base_prefix = params["prefix"]
        else:
            acq.path_template.base_prefix = HWR.beamline.session.get_default_prefix(
                sample_model
            )

        run_number_dir_parts = (
            params.get("subdir", "").strip("/").split("/")[-1].split("_")
        )

        # When duplicating an item the "run number" directory of the original
        # item is already part of the data subfolder, so we need to strip ita
        # to avoid nesting.

        # Sub directory is a run number directory if it starts
        # with run folowed by a number and a tag spereated by a
        # underscore (_) for instance, run_01_datacollection
        # The run number directory is passed as the last folder of the
        # data sub direecotry when and item is duplicated. We strip
        # the run number folder in this case to remove duplication
        if (
            len(run_number_dir_parts) == 3
            and run_number_dir_parts[0] == "run"
            and run_number_dir_parts[1].isnumeric()
            and run_number_dir_parts[2] == self.get_folder_tag(params)
        ):
            params["subdir"] = "/".join(
                params.get("subdir", "").strip("/").split("/")[0:-1]
            )

        full_path, process_path = HWR.beamline.session.get_full_path(
            params.get("subdir", ""), self.get_folder_tag(params)
        )

        acq.path_template.directory = full_path
        acq.path_template.process_directory = process_path

        # MXCuBE Web specific shape attribute
        model.shape = params["shape"]

        # If there is a centered position associated with this data collection, get
        # the necessary data for the position and pass it to the collection.
        if params["helical"]:
            model.experiment_type = qme.EXPERIMENT_TYPE.HELICAL
            acq2 = qmo.Acquisition()
            model.acquisitions.append(acq2)

            line = HWR.beamline.sample_view.get_shape(params["shape"])
            p1, p2 = line.refs
            p1, p2 = (
                HWR.beamline.sample_view.get_shape(p1),
                HWR.beamline.sample_view.get_shape(p2),
            )
            cpos1 = p1.get_centred_position()
            cpos2 = p2.get_centred_position()

            acq.acquisition_parameters.centred_position = cpos1
            acq2.acquisition_parameters.centred_position = cpos2
        elif params.get("mesh", False):
            grid = HWR.beamline.sample_view.get_shape(params["shape"])
            acq.acquisition_parameters.mesh_range = (
                grid.width,
                grid.height,
            )
            mesh_center = HWR.beamline.default_acquisition_parameters["mesh"].get(
                "mesh_center", "top-left"
            )
            if mesh_center == "top-left":
                acq.acquisition_parameters.centred_position = (
                    grid.get_centred_positions()[0]
                )
            else:
                acq.acquisition_parameters.centred_position = (
                    grid.get_centred_positions()[1]
                )
            acq.acquisition_parameters.mesh_steps = grid.get_num_lines()
            acq.acquisition_parameters.num_images = task_data["parameters"][
                "num_images"
            ]

            model.experiment_type = qme.EXPERIMENT_TYPE.MESH
            model.set_requires_centring(False)
        elif params["shape"] != -1:
            point = HWR.beamline.sample_view.get_shape(params["shape"])
            cpos = point.get_centred_position()
            acq.acquisition_parameters.centred_position = cpos

        # Only get a run number for new tasks, keep the already existing
        # run number for existing items.
        if not task_data.get("queueID", ""):
            acq.path_template.run_number = self.get_run_number(acq.path_template)

        model.set_enabled(task_data["checked"])
        entry.set_enabled(task_data["checked"])

    def set_gphl_wf_params(self, model, entry, task_data, sample_model):
        """
        Helper method that sets the parameters for a GPhL workflow task.

        :param queue_model_objectsGphlWorkflow: The model to set parameters of
        :param GphlWorkflowQueueEntry: The queue entry of the model
        :param dict task_data: Dictionary with new parameters
        :param dict sample_model: The Sample queueModelObject
        """
        params = task_data["parameters"]
        self.app.lims.apply_template(params, sample_model, model.path_template)

        # params include only path_template-related parametes and strategy_name
        model.init_from_task_data(sample_model, params)

        # # NBNB
        # # These two calls seems to be needed by the Global phasing workflows
        # # Adding them resolves the current conflict
        # # NBNB CHECK REMOVAL
        # model.set_pre_strategy_params(**params)
        # model.set_pre_acquisition_params(**params)

        model.set_enabled(task_data["checked"])
        entry.set_enabled(task_data["checked"])

    def set_wf_params(self, model, entry, task_data, sample_model):
        """
        Helper method that sets the parameters for a workflow task.

        :param WorkflowQueueModel: The model to set parameters of
        :param GenericWorkflowQueueEntry: The queue entry of the model
        :param dict task_data: Dictionary with new parameters
        """
        params = task_data["parameters"]
        model.parameters = params
        model.path_template.set_from_dict(params)
        model.path_template.base_prefix = params["prefix"]
        model.path_template.num_files = 0
        model.path_template.precision = "0" + str(
            HWR.beamline.session["file_info"].get_property("precision", 4)
        )

        self.app.lims.apply_template(params, sample_model, model.path_template)

        if params["prefix"]:
            model.path_template.base_prefix = params["prefix"]
        else:
            model.path_template.base_prefix = HWR.beamline.session.get_default_prefix(
                sample_model
            )

        full_path = os.path.join(
            HWR.beamline.session.get_base_image_directory(),
            params.get("subdir", ""),
        )

        model.path_template.directory = full_path

        process_path = os.path.join(
            HWR.beamline.session.get_base_process_directory(),
            params.get("subdir", ""),
        )
        model.path_template.process_directory = process_path

        model.set_name("Workflow task")
        model.set_type(params["wfname"])

        beamline_params = {}
        beamline_params["directory"] = model.path_template.directory
        beamline_params["prefix"] = model.path_template.get_prefix()
        beamline_params["run_number"] = model.path_template.run_number
        beamline_params["collection_software"] = "MXCuBE - 3.0"
        beamline_params["sample_node_id"] = sample_model._node_id
        beamline_params["workflow_node_id"] = model._node_id
        beamline_params["sample_lims_id"] = sample_model.lims_id
        beamline_params["beamline"] = HWR.beamline.session.endstation_name
        beamline_params["shape"] = params["shape"]

        params_list = list(
            map(
                str,
                list(itertools.chain(*iter(beamline_params.items()))),
            )
        )
        params_list.insert(0, params["wfpath"])
        params_list.insert(0, "modelpath")

        model.params_list = params_list

        model.set_enabled(task_data["checked"])
        entry.set_enabled(task_data["checked"])

    def set_char_params(self, model, entry, task_data, sample_model):
        """
        Helper method that sets the characterisation parameters for a
        Characterisation.

        :param CharacterisationQueueModel: The mode to set parameters of
        :param CharacterisationQueueEntry: The queue entry of the model
        :param dict task_data: Dictionary with new parameters
        """
        params = task_data["parameters"]
        self.set_dc_params(
            model.reference_image_collection,
            entry,
            task_data,
            sample_model,
        )

        try:
            params["strategy_complexity"] = [
                "SINGLE",
                "FEW",
                "MANY",
            ].index(params["strategy_complexity"])
        except ValueError:
            params["strategy_complexity"] = 0

        model.characterisation_parameters.set_from_dict(params)

        # MXCuBE Web specific shape attribute
        # TODO: Please consider defining shape attribute properly !
        model.shape = params["shape"]

        model.set_enabled(task_data["checked"])
        entry.set_enabled(task_data["checked"])

    def set_xrf_params(self, model, entry, task_data, sample_model):
        """
        Helper method that sets the xrf scan parameters for a XRF spectrum Scan.

        :param XRFSpectrum QueueModel: The model to set parameters of
        :param XrfSpectrumQueueEntry: The queue entry of the model
        :param dict task_data: Dictionary with new parameters
        """
        params = task_data["parameters"]

        ftype = HWR.beamline.xrf_spectrum.get_property("file_suffix", "dat").strip()

        model.path_template.set_from_dict(params)
        model.path_template.suffix = ftype
        model.path_template.precision = "0" + str(
            HWR.beamline.session["file_info"].get_property("precision", 4)
        )

        if params["prefix"]:
            model.path_template.base_prefix = params["prefix"]
        else:
            model.path_template.base_prefix = HWR.beamline.session.get_default_prefix(
                sample_model
            )

        full_path, process_path = HWR.beamline.session.get_full_path(
            params.get("subdir", ""), "xrf"
        )
        model.path_template.directory = full_path
        model.path_template.process_directory = process_path

        # Only get a run number for new tasks, keep the already existing
        # run number for existing items.
        if not params.get("queueID", ""):
            model.path_template.run_number = self.get_run_number(model.path_template)

        # Set count time, and if any, other paramters
        model.count_time = params.get("exp_time", 0)

        # MXCuBE Web specific shape attribute
        model.shape = params["shape"]

        model.set_enabled(task_data["checked"])
        entry.set_enabled(task_data["checked"])

    def set_energy_scan_params(self, model, entry, task_data, sample_model):
        """
        Helper method that sets the xrf scan parameters for a XRF spectrum Scan.

        :param EnergyScan QueueModel: The model to set parameters of
        :param EnergyScanQueueEntry: The queue entry of the model
        :param dict task_data: Dictionary with new parameters
        """
        params = task_data["parameters"]

        ftype = HWR.beamline.energy_scan.get_property("file_suffix", "raw").strip()

        model.path_template.set_from_dict(params)
        model.path_template.suffix = ftype
        model.path_template.precision = "0" + str(
            HWR.beamline.session["file_info"].get_property("precision", 4)
        )

        if params["prefix"]:
            model.path_template.base_prefix = params["prefix"]
        else:
            model.path_template.base_prefix = HWR.beamline.session.get_default_prefix(
                sample_model
            )

        full_path, process_path = HWR.beamline.session.get_full_path(
            params.get("subdir", ""), "energy_scan"
        )
        model.path_template.directory = full_path
        model.path_template.process_directory = process_path

        # Only get a run number for new tasks, keep the already existing
        # run number for existing items.
        if not params.get("queueID", ""):
            model.path_template.run_number = self.get_run_number(model.path_template)

        # Set element, and if any, other parameters
        model.element_symbol = params.get("element", "")
        model.edge = params.get("edge", "")

        model.set_enabled(task_data["checked"])
        entry.set_enabled(task_data["checked"])

    def _create_dc(self, task):
        """
        Creates a data collection model and its corresponding queue entry from
        a dict with collection parameters.

        :param dict task: Collection parameters
        :returns: The tuple (model, entry)
        :rtype: Tuple
        """
        dc_model = qmo.DataCollection()
        dc_model.set_origin(ORIGIN_MX3)
        dc_model.center_before_collect = True
        dc_entry = qe.DataCollectionQueueEntry(Mock(), dc_model)

        return dc_model, dc_entry

    def _create_queue_entry(self, task, task_name):
        """Creates a queue entry and its corresponding data model

        Args:
            task (dict): Collection parameters
        Return:
            (tuple): (model, entry)
        """
        if not task["parameters"]["osc_range"]:
            task["parameters"]["osc_range"] = None

        queue_entry_name = task_name.title().replace("_", "") + "QueueEntry"
        entry_cls = getattr(qe, queue_entry_name)
        data = entry_cls.DATA_MODEL(
            **{
                "path_parameters": task["parameters"],
                "common_parameters": task["parameters"],
                "user_collection_parameters": task["parameters"],
                "collection_parameters": task["parameters"],
                "legacy_parameters": task["parameters"],
            }
        )

        entry = entry_cls(Mock(), entry_cls.QMO(task_data=data))
        entry.set_enabled(True)
        return entry.get_data_model(), entry

    def _create_wf(self, task):
        """
        Creates a workflow model and its corresponding queue entry from
        a dict with collection parameters.

        :param dict task: Collection parameters
        :returns: The tuple (model, entry)
        :rtype: Tuple
        """
        dc_model = qmo.Workflow()
        dc_model.set_origin(ORIGIN_MX3)
        dc_entry = qe.GenericWorkflowQueueEntry(Mock(), dc_model)

        return dc_model, dc_entry

    def _create_gphl_wf(self, task):
        """
        Creates a gphl workflow model and its corresponding queue entry from
        a dict with collection parameters.

        :param dict task: Collection parameters
        :returns: The tuple (model, entry)
        :rtype: Tuple
        """
        from mxcubecore.HardwareObjects.Gphl.GphlQueueEntry import (
            GphlWorkflowQueueEntry,
        )

        dc_model = qmo.GphlWorkflow()
        dc_model.set_origin(ORIGIN_MX3)
        dc_entry = GphlWorkflowQueueEntry(view=Mock(), data_model=dc_model)

        return dc_model, dc_entry

    def _create_xrf(self, task):
        """
        Creates a XRFSpectrum model and its corresponding queue entry from
        a dict with collection parameters.

        :param dict task: Collection parameters
        :returns: The tuple (model, entry)
        :rtype: Tuple
        """
        xrf_model = qmo.XRFSpectrum()
        xrf_model.set_origin(ORIGIN_MX3)
        xrf_entry = qe.XrfSpectrumQueueEntry(Mock(), xrf_model)

        return xrf_model, xrf_entry

    def _create_energy_scan(self, task, sample_model):
        """
        Creates a energy scan model and its corresponding queue entry from
        a dict with collection parameters.

        :param dict task: Collection parameters
        :returns: The tuple (model, entry)
        :rtype: Tuple
        """
        escan_model = qmo.EnergyScan(sample=sample_model)
        escan_model.set_origin(ORIGIN_MX3)
        escan_entry = qe.EnergyScanQueueEntry(Mock(), escan_model)

        return escan_model, escan_entry

    def add_characterisation(self, node_id, task):
        """
        Adds a data characterisation task to the sample with id: <id>

        :param int id: id of the sample to which the task belongs
        :param dict task: Task data (parameters)

        :returns: The queue id of the Data collection
        :rtype: int
        """
        sample_model, sample_entry = self.get_entry(node_id)
        params = task["parameters"]

        refdc_model, refdc_entry = self._create_dc(task)
        refdc_model.acquisitions[0].path_template.reference_image_prefix = "ref"
        refdc_model.set_name("refdc")
        char_params = qmo.CharacterisationParameters().set_from_dict(params)

        char_model = qmo.Characterisation(refdc_model, char_params)

        char_model.set_origin(ORIGIN_MX3)
        char_entry = qe.CharacterisationGroupQueueEntry(Mock(), char_model)
        char_entry.queue_model = HWR.beamline.queue_model
        # Set the characterisation and reference collection parameters
        self.set_char_params(char_model, char_entry, task, sample_model)

        # the default value is True, here we adapt to mxcube Web needs
        char_model.auto_add_diff_plan = self.app.AUTO_ADD_DIFFPLAN
        char_entry.auto_add_diff_plan = self.app.AUTO_ADD_DIFFPLAN

        # A characterisation has two TaskGroups one for the characterisation itself
        # and its reference collection and one for the resulting diffraction plans.
        # But we only create a reference group if there is a result !
        refgroup_model = qmo.TaskGroup()
        refgroup_model.set_origin(ORIGIN_MX3)

        HWR.beamline.queue_model.add_child(sample_model, refgroup_model)
        HWR.beamline.queue_model.add_child(refgroup_model, char_model)
        refgroup_entry = qe.TaskGroupQueueEntry(Mock(), refgroup_model)

        refgroup_entry.set_enabled(True)
        sample_entry.enqueue(refgroup_entry)
        refgroup_entry.enqueue(char_entry)

        char_model.set_enabled(task["checked"])
        char_entry.set_enabled(task["checked"])

        return char_model._node_id

    def add_data_collection(self, node_id, task):
        """
        Adds a data collection task to the sample with id: <id>

        :param int id: id of the sample to which the task belongs
        :param dict task: task data

        :returns: The queue id of the data collection
        :rtype: int
        """
        sample_model, sample_entry = self.get_entry(node_id)
        dc_model, dc_entry = self._create_dc(task)
        self.set_dc_params(dc_model, dc_entry, task, sample_model)

        group_model = qmo.TaskGroup()
        group_model.set_origin(ORIGIN_MX3)
        group_model.set_enabled(True)
        HWR.beamline.queue_model.add_child(sample_model, group_model)
        HWR.beamline.queue_model.add_child(group_model, dc_model)

        group_entry = qe.TaskGroupQueueEntry(Mock(), group_model)
        group_entry.set_enabled(True)
        sample_entry.enqueue(group_entry)
        group_entry.enqueue(dc_entry)

        return dc_model._node_id

    def add_queue_entry(self, node_id, task, task_name):
        """Adds a queue entry to the sample with id <node_id>

        Args:
            node_id (int): id of the sample to which the task belongs
            task (dict): task data
            task_name (str): The task name
        """
        sample_model, sample_entry = self.get_entry(node_id)
        model, entry = self._create_queue_entry(task, task_name)

        acq = model.acquisitions[0]
        params = task["parameters"]

        ftype = HWR.beamline.detector.get_property("file_suffix")
        ftype = ftype if ftype else ".?"

        acq.path_template.set_from_dict(params)
        # certain attributes have to be updated explicitly,
        # like precision, suffix ...
        acq.path_template.start_num = params["first_image"]
        acq.path_template.num_files = params["num_images"]
        acq.path_template.suffix = ftype
        acq.path_template.precision = "0" + str(
            HWR.beamline.session["file_info"].get_property("precision", 4)
        )

        if params["prefix"]:
            acq.path_template.base_prefix = params["prefix"]
        else:
            acq.path_template.base_prefix = HWR.beamline.session.get_default_prefix(
                sample_model
            )

        full_path, process_path = HWR.beamline.session.get_full_path(
            params.get("subdir", ""), task_name
        )
        acq.path_template.directory = full_path
        acq.path_template.process_directory = process_path

        model.shape = params["shape"]

        group_model = qmo.TaskGroup()
        group_model.set_origin(ORIGIN_MX3)
        group_model.set_enabled(True)
        HWR.beamline.queue_model.add_child(sample_model, group_model)
        HWR.beamline.queue_model.add_child(group_model, model)

        group_entry = qe.TaskGroupQueueEntry(Mock(), group_model)
        group_entry.set_enabled(True)
        sample_entry.enqueue(group_entry)
        group_entry.enqueue(entry)

        return model._node_id

    def add_workflow(self, node_id, task):
        """
        Adds a worklfow task to the parent node with id: <id>

        For adding GPhL Auto workflow, call with node_id==parent_node_id
        and all required parameters in task["parameters"]

        :param int node_id: id of the parent node to which the task belongs
        :param dict task: task data

        :returns: The queue id of the data collection
        :rtype: int
        """
        parent_model, parent_entry = self.get_entry(node_id)
        sample_model = parent_model.get_sample_node()
        if task["parameters"]["wfpath"] == "Gphl":
            wf_model, dc_entry = self._create_gphl_wf(task)
            self.set_gphl_wf_params(
                wf_model,
                dc_entry,
                task,
                parent_model.get_sample_node(),
            )
        else:
            wf_model, dc_entry = self._create_wf(task)

        group_model = qmo.TaskGroup()
        group_model.set_origin(ORIGIN_MX3)
        group_model.set_enabled(True)
        HWR.beamline.queue_model.add_child(parent_model, group_model)
        HWR.beamline.queue_model.add_child(group_model, wf_model)

        if not task["parameters"]["wfpath"] == "Gphl":
            self.set_wf_params(wf_model, dc_entry, task, sample_model)

        group_entry = qe.TaskGroupQueueEntry(Mock(), group_model)
        group_entry.set_enabled(True)
        parent_entry.enqueue(group_entry)
        group_entry.enqueue(dc_entry)

        return wf_model._node_id

    def add_interleaved(self, node_id, task):
        """
        Adds a interleaved data collection task to the sample with id: <id>

        :param int node_id: id of the sample to which the task belongs
        :param dict task: task data

        :returns: The queue id of the data collection
        :rtype: int
        """
        sample_model, sample_entry = self.get_entry(node_id)

        group_model = qmo.TaskGroup()
        group_model.set_origin(ORIGIN_MX3)
        group_model.set_enabled(True)
        group_model.interleave_num_images = task["parameters"]["swNumImages"]

        group_entry = qe.TaskGroupQueueEntry(Mock(), group_model)
        group_entry.set_enabled(True)
        sample_entry.enqueue(group_entry)
        HWR.beamline.queue_model.add_child(sample_model, group_model)

        wc = 0

        for wedge in task["parameters"]["wedges"]:
            wc = wc + 1
            dc_model, dc_entry = self._create_dc(wedge)
            self.set_dc_params(dc_model, dc_entry, wedge, sample_model)

            # Add wedge prefix to path
            dc_model.acquisitions[0].path_template.wedge_prefix = "wedge-%s" % wc

            # Disable snapshots for sub-wedges
            dc_model.acquisitions[0].acquisition_parameters.take_snapshots = False

            HWR.beamline.queue_model.add_child(group_model, dc_model)
            group_entry.enqueue(dc_entry)

        return group_model._node_id

    def add_xrf_scan(self, node_id, task):
        """
        Adds a XRF Scan task to the sample with id: <id>

        :param int id: id of the sample to which the task belongs
        :param dict task: task data

        :returns: The queue id of the data collection
        :rtype: int
        """
        sample_model, sample_entry = self.get_entry(node_id)
        xrf_model, xrf_entry = self._create_xrf(task)
        self.set_xrf_params(xrf_model, xrf_entry, task, sample_model)

        group_model = qmo.TaskGroup()
        group_model.set_origin(ORIGIN_MX3)
        group_model.set_enabled(True)
        HWR.beamline.queue_model.add_child(sample_model, group_model)
        HWR.beamline.queue_model.add_child(group_model, xrf_model)

        group_entry = qe.TaskGroupQueueEntry(Mock(), group_model)
        group_entry.set_enabled(True)
        sample_entry.enqueue(group_entry)
        group_entry.enqueue(xrf_entry)

        return xrf_model._node_id

    def add_energy_scan(self, node_id, task):
        """
        Adds a energy scan task to the sample with id: <id>

        :param int id: id of the sample to which the task belongs
        :param dict task: task data

        :returns: The queue id of the data collection
        :rtype: int
        """
        sample_model, sample_entry = self.get_entry(node_id)
        escan_model, escan_entry = self._create_energy_scan(task, sample_model)
        self.set_energy_scan_params(escan_model, escan_entry, task, sample_model)

        group_model = qmo.TaskGroup()
        group_model.set_origin(ORIGIN_MX3)
        group_model.set_enabled(True)
        HWR.beamline.queue_model.add_child(sample_model, group_model)
        HWR.beamline.queue_model.add_child(group_model, escan_model)

        group_entry = qe.TaskGroupQueueEntry(Mock(), group_model)
        group_entry.set_enabled(True)
        sample_entry.enqueue(group_entry)
        group_entry.enqueue(escan_entry)

        return escan_model._node_id

    def clear_queue(self):
        """
        Creates a new queue
        :returns: MxCuBE QueueModel Object
        """
        from mxcubecore import HardwareRepository as HWR

        # queue = pickle.loads(self.app.mxcubecore.empty_queue)
        # queue.diffraction_plan = {}
        HWR.beamline.queue_model.diffraction_plan = {}
        HWR.beamline.queue_model.clear_model("ispyb")
        HWR.beamline.queue_model.clear_model("free-pin")
        HWR.beamline.queue_model.clear_model("plate")
        HWR.beamline.queue_model.select_model("ispyb")

    def save_queue(self, session, redis=redis.Redis()):
        """
        Saves the current HWR.beamline.queue_model (HWR.beamline.queue_model) into a redis database.
        The queue that is saved is the pickled result returned by queue_to_dict

        :param session: Session to save queue for
        :param redis: Redis database

        """
        proposal_id = getattr(current_user, "proposal", None)

        if proposal_id is not None:
            # List of samples dicts (containing tasks) sample and tasks have same
            # order as the in queue HO
            queue = self.queue_to_dict(HWR.beamline.queue_model.get_model_root())
            redis.set("self.app.queue:%d" % proposal_id, pickle.dumps(queue))

    def load_queue(self, session, redis=redis.Redis()):
        """
        Loads the queue belonging to session <session> into redis db <redis>

        :param session: Session for queue to load
        :param redis: Redis database
        """
        proposal_id = getattr(current_user, "proposal", None)

        if proposal_id is not None:
            serialized_queue = redis.get("self.app.queue:%d" % proposal_id)
            queue = pickle.loads(serialized_queue)
            self.load_queue_from_dict(queue)

    def queue_model_child_added(self, parent, child):
        """
        Listen to the addition of elements to the queue model ('child_added').
        Add the corresponding entries to the queue if they are not already
        added. Handels for instance the addition of reference collections for
        characterisations and workflows.
        """
        parent_model, parent_entry = self.get_entry(parent._node_id)
        child_model, child_entry = self.get_entry(child._node_id)

        # Origin is ORIGIN_MX3 if task comes from MXCuBE-3
        if child_model.get_origin() != ORIGIN_MX3:
            if isinstance(child, qmo.DataCollection):
                dc_entry = qe.DataCollectionQueueEntry(Mock(), child)

                self.enable_entry(dc_entry, True)
                self.enable_entry(parent_entry, True)
                parent_entry.enqueue(dc_entry)
                sample = parent.get_sample_node()

                task = self._handle_dc(sample, child)

                self.app.server.emit("add_task", {"tasks": [task]}, namespace="/hwr")

            elif isinstance(child, qmo.TaskGroup):
                dcg_entry = qe.TaskGroupQueueEntry(Mock(), child)
                self.enable_entry(dcg_entry, True)
                parent_entry.enqueue(dcg_entry)

            elif isinstance(child, qmo.SampleCentring):
                # Added rhfogh 20211001
                entry = qe.SampleCentringQueueEntry(Mock(), child)
                self.enable_entry(entry, True)
                parent_entry.enqueue(entry)

            elif isinstance(child, qmo.XrayCentring2):
                # Added rhfogh 20211001
                entry = qe.XrayCentering2QueueEntry(Mock(), child)
                self.enable_entry(entry, True)
                parent_entry.enqueue(entry)

            elif isinstance(child, qmo.GphlWorkflow):
                # Added olofsvensson 20220504
                entry = GphlQueueEntry.GphlWorkflowQueueEntry(Mock(), child)
                self.enable_entry(entry, True)
                parent_entry.enqueue(entry)

            elif isinstance(child, qmo.DelayTask):
                # Added rhfogh 20220331
                entry = qe.DelayQueueEntry(Mock(), child)
                self.enable_entry(entry, True)
                parent_entry.enqueue(entry)

    def queue_model_diff_plan_available(self, char, collection_list):
        cols = []
        for collection in collection_list:
            if isinstance(collection, qmo.DataCollection):
                if collection.get_origin():
                    origin_model, origin_entry = self.get_entry(collection.get_origin())
                else:
                    origin_model, origin_entry = self.get_entry(char._node_id)

                collection.set_enabled(False)

                dcg_model = char.get_parent()
                sample = dcg_model.get_sample_node()

                setattr(collection, "shape", origin_model.shape)

                task = self._handle_dc(sample, collection)
                task.update(
                    {
                        "isDiffractionPlan": True,
                        "originID": origin_model._node_id,
                    }
                )
                cols.append(task)

        self.app.server.emit("add_diff_plan", {"tasks": cols}, namespace="/hwr")

    def set_auto_add_diffplan(self, autoadd, current_sample=None):
        """
        Sets auto add diffraction plan flag, automatically add to the queue
        (True) or wait for user (False)

        :param bool autoadd: True autoadd, False wait for user
        """
        self.app.AUTO_ADD_DIFFPLAN = autoadd
        current_queue = self.queue_to_dict()

        if "sample_order" in current_queue:
            current_queue.pop("sample_order")

        sampleIDs = list(current_queue.keys())
        for sample in sampleIDs:
            # this would be a sample
            tasks = current_queue[sample]["tasks"]
            for t in tasks:
                if t["type"] == "Characterisation":
                    model, entry = self.get_entry(t["queueID"])
                    entry.auto_add_diff_plan = autoadd

    def execute_entry_with_id(self, sid, tindex=None):
        """
        Execute the entry at position (sampleID, task index) in queue

        :param str sid: sampleID
        :param int tindex: task index of task within sample with id sampleID
        """
        current_queue = self.queue_to_dict()
        HWR.beamline.queue_manager.set_pause(False)

        if tindex in ["undefined", "None", "null", None]:
            node_id = current_queue[sid]["queueID"]

            # The queue does not run the mount defined by the sample entry if it has no
            # tasks, so in order function as expected; just mount the sample
            if (
                not len(current_queue[sid]["tasks"])
            ) and sid != self.app.sample_changer.get_current_sample().get(
                "sampleID", ""
            ):
                try:
                    self.app.sample_changer.mount_sample_clean_up(current_queue[sid])
                except Exception:
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

    def init_signals(self, queue):
        """
        Initialize queue hwobj related signals.
        """
        from mxcubeweb.routes import signals

        HWR.beamline.collect.connect(
            HWR.beamline.collect,
            "collectStarted",
            signals.collect_started,
        )
        HWR.beamline.collect.connect(
            HWR.beamline.collect,
            "collectOscillationStarted",
            signals.collect_oscillation_started,
        )
        HWR.beamline.collect.connect(
            HWR.beamline.collect,
            "collectOscillationFailed",
            signals.collect_oscillation_failed,
        )
        HWR.beamline.collect.connect(
            HWR.beamline.collect,
            "collectImageTaken",
            signals.collect_image_taken,
        )

        HWR.beamline.collect.connect(
            HWR.beamline.collect,
            "collectOscillationFinished",
            signals.collect_oscillation_finished,
        )

        queue.connect(queue, "child_added", self.queue_model_child_added)

        queue.connect(
            queue,
            "diff_plan_available",
            self.queue_model_diff_plan_available,
        )

        HWR.beamline.queue_manager.connect(
            "queue_execute_started", signals.queue_execution_started
        )

        HWR.beamline.queue_manager.connect(
            "queue_execution_finished",
            signals.queue_execution_finished,
        )

        HWR.beamline.queue_manager.connect(
            "queue_stopped", signals.queue_execution_finished
        )

        HWR.beamline.queue_manager.connect(
            "queue_paused", signals.queue_execution_paused
        )

        HWR.beamline.queue_manager.connect(
            "queue_entry_execute_finished",
            signals.queue_execution_entry_finished,
        )

        HWR.beamline.queue_manager.connect(
            "queue_entry_execute_started",
            signals.queue_execution_entry_started,
        )

        HWR.beamline.queue_manager.connect("collectEnded", signals.collect_ended)

        HWR.beamline.queue_manager.connect(
            "queue_interleaved_started",
            signals.queue_interleaved_started,
        )

        HWR.beamline.queue_manager.connect(
            "queue_interleaved_finished",
            signals.queue_interleaved_finished,
        )

        HWR.beamline.queue_manager.connect(
            "queue_interleaved_sw_done",
            signals.queue_interleaved_sw_done,
        )

        HWR.beamline.queue_manager.connect(
            "energy_scan_finished", signals.energy_scan_finished
        )

    def enable_sample_entries(self, sample_id_list, flag):
        current_queue = self.queue_to_dict()

        for sample_id in sample_id_list:
            sample_data = current_queue[sample_id]
            self.enable_entry(sample_data["queueID"], flag)

    def set_auto_mount_sample(self, automount, current_sample=None):
        """
        Sets auto mount next flag, automatically mount next sample in queue
        (True) or wait for user (False)

        :param bool automount: True auto-mount, False wait for user
        """
        self.app.AUTO_MOUNT_SAMPLE = automount

    def get_auto_mount_sample(self):
        """
        :returns: Returns auto mount flag
        :rtype: bool
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
        self.app.NUM_SNAPSHOTS = HWR.beamline.collect.get_property("num_snapshots", 4)
        self.app.AUTO_MOUNT_SAMPLE = HWR.beamline.collect.get_property(
            "auto_mount_sample", False
        )
        self.app.AUTO_ADD_DIFFPLAN = HWR.beamline.collect.get_property(
            "auto_add_diff_plan", False
        )

    def queue_start(self, sid):
        """
        Start execution of the queue.

        :returns: Respons object, status code set to:
                200: On success
                409: Queue could not be started
        """
        logging.getLogger("MX3.HWR").info("[QUEUE] Queue going to start")
        from mxcubeweb.routes import signals

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
            signals.queue_execution_failed(ex)
        else:
            logging.getLogger("MX3.HWR").info("[QUEUE] Queue started")

    def queue_stop(self):
        HWR.beamline.queue_manager.stop()

    def queue_pause(self):
        """
        Pause the execution of the queue
        """
        HWR.beamline.queue_manager.pause(True)

        msg = {
            "Signal": self.queue_exec_state(),
            "Message": "Queue execution paused",
            "State": 1,
        }

        logging.getLogger("MX3.HWR").info("[QUEUE] Paused")

        return msg

    def queue_unpause(self):
        """
        Unpause execution of the queue

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

    def set_queue(self, json_queue, session):
        # Clear queue
        # HWR.beamline.queue_model = clear_queue()

        # Set new queue
        self.queue_add_item(json_queue)
        self.save_queue(session)

    def queue_update_item(self, sqid, tqid, data):
        model, entry = self.get_entry(tqid)
        sample_model, sample_entry = self.get_entry(sqid)

        if data["type"] == "DataCollection":
            self.set_dc_params(model, entry, data, sample_model)
        elif data["type"] == "Characterisation":
            self.set_char_params(model, entry, data, sample_model)

        logging.getLogger("MX3.HWR").info("[QUEUE] is:\n%s " % self.queue_to_json())

        return model

    def queue_enable_item(self, qid_list, enabled):
        for qid in qid_list:
            self.set_enabled_entry(qid, enabled)

    def update_sample(self, sid, params):
        sample_node = HWR.beamline.queue_model.get_node(sid)

        if sample_node:
            sample_entry = HWR.beamline.queue_manager.get_entry_with_model(sample_node)
            # TODO: update here the model with the new 'params'
            # missing lines...
            sample_entry.set_data_model(sample_node)
            logging.getLogger("MX3.HWR").info("[QUEUE] sample updated")
        else:
            msg = "[QUEUE] Sample with id %s not in queue, can't update" % sid
            logging.getLogger("MX3.HWR").error(msg)
            raise Exception(msg)

    def toggle_node(self, node_id):
        node = HWR.beamline.queue_model.get_node(node_id)
        entry = HWR.beamline.queue_manager.get_entry_with_model(node)
        queue = self.queue_to_dict()

        if isinstance(entry, qe.SampleQueueEntry):
            # this is a sample entry, thus, go through its checked children and
            # toggle those
            if entry.is_enabled():
                entry.set_enabled(False)
                node.set_enabled(False)
            else:
                entry.set_enabled(True)
                node.set_enabled(True)

            new_state = entry.is_enabled()
            for elem in queue[node_id]:
                child_node = HWR.beamline.queue_model.get_node(elem["queueID"])
                child_entry = HWR.beamline.queue_manager.get_entry_with_model(
                    child_node
                )
                if new_state:
                    child_entry.set_enabled(True)
                    child_node.set_enabled(True)
                else:
                    child_entry.set_enabled(False)
                    child_node.set_enabled(False)

        else:
            # not a sample so find the parent and toggle directly
            logging.getLogger("MX3.HWR").info(
                "[QUEUE] toggling entry with id: %s" % node_id
            )
            # this is a TaskGroup, so it is not in the parsed queue
            parent_node = node.get_parent()
            # go a level up,
            # this is a TaskGroup for a Char, a sampleQueueEntry if DataCol
            parent_node = parent_node.get_parent()
            if isinstance(parent_node, qmo.TaskGroup):
                parent_node = parent_node.get_parent()
            parent = parent_node._node_id
            parent_entry = HWR.beamline.queue_manager.get_entry_with_model(parent_node)
            # now that we know the sample parent no matter what is the entry
            # (char, dc) check if the brother&sisters are enabled (and enable the
            # parent)
            checked = 0

            for i in queue[parent]:
                # at least one brother is enabled, no need to change parent
                if i["queueID"] != node_id and i["checked"] == 1:
                    checked = 1
                    break
            if entry.is_enabled():
                entry.set_enabled(False)
                node.set_enabled(False)

            else:
                entry.set_enabled(True)
                node.set_enabled(True)

            new_state = entry.is_enabled()
            for met in queue[parent]:
                if int(met.get("queueID")) == node_id:
                    if new_state == 0 and checked == 0:
                        parent_entry.set_enabled(False)
                        parent_node.set_enabled(False)
                    elif new_state == 1 and checked == 0:
                        parent_entry.set_enabled(True)
                        parent_node.set_enabled(True)

    def add_centring(self, _id, params):
        msg = "[QUEUE] centring add requested with data: " + str(params)
        logging.getLogger("MX3.HWR").info(msg)

        cent_node = qmo.SampleCentring()
        cent_entry = qe.SampleCentringQueueEntry()
        cent_entry.set_data_model(cent_node)
        cent_entry.set_queue_controller(self.app.mxcubecore.qm)
        node = HWR.beamline.queue_model.get_node(int(_id))
        entry = HWR.beamline.queue_manager.get_entry_with_model(node)
        entry._set_background_color = Mock()

        new_node = HWR.beamline.queue_model.add_child_at_id(int(_id), cent_node)
        entry.enqueue(cent_entry)

        logging.getLogger("MX3.HWR").info("[QUEUE] centring added to sample")

        return {
            "QueueId": new_node,
            "Type": "Centring",
            "Params": params,
        }

    def update_dependent_field(self, task_name, data):
        try:
            queue_entry = qe.get_queue_entry_from_task_name(task_name)
            data_model = getattr(queue_entry, "DATA_MODEL", None)
            new_data = json.dumps(data_model.update_dependent_fields(data))
        except Exception:
            logging.getLogger("MX3.HWR").exception(
                f"Could not update depedant fields for {task_name}"
            )

        return new_data

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
            ui_schema = data_model.ui_schema() if data_model else {}
        except Exception:
            ui_schema = {}

        if schema:
            for parameter_group in schema.values():
                for parameter_name, parameter_data in parameter_group[
                    "properties"
                ].items():
                    if "default" in parameter_data:
                        acq_parameters[parameter_name] = parameter_data["default"]

        return {
            "acq_parameters": {
                **acq_parameters,
                "inverse_beam": False,
                "take_dark_current": True,
                "skip_existing_images": False,
                "take_snapshots": True,
                "helical": False,
                "mesh": False,
                "prefixTemplate": "{PREFIX}_{POSITION}",
                "subDirTemplate": "{ACRONYM}/{ACRONYM}-{NAME}",
                "experiment_type": "",
            },
            "limits": HWR.beamline.acquisition_limit_values,
            "requires": requires if requires else [],
            "name": display_name if display_name else task_name,
            "queue_entry": task_name,
            "schema": schema,
            "ui_schema": ui_schema,
        }

    def get_task_schema(self, data_model):
        return {
            "path_parameters": data_model.__signature__.parameters[
                "path_parameters"
            ].annotation.schema(),
            "common_parameters": data_model.__signature__.parameters[
                "common_parameters"
            ].annotation.schema(),
            "collection_parameters": data_model.__signature__.parameters[
                "collection_parameters"
            ].annotation.schema(),
            "user_collection_parameters": data_model.__signature__.parameters[
                "user_collection_parameters"
            ].annotation.schema(),
            "legacy_parameters": data_model.__signature__.parameters[
                "legacy_parameters"
            ].annotation.schema(),
        }

    def get_available_tasks(self):
        task_info = {}

        for task, available in HWR.beamline.available_methods.items():
            if available:
                task_info[task] = self.get_default_task_parameters(task)

        return task_info

    def get_sample(self, _id):
        sample = self.queue_to_dict().get(_id, None)

        if not sample:
            msg = "[QUEUE] sample info could not be retrieved"
            logging.getLogger("MX3.HWR").error(msg)

        return sample

    def get_method(self, sample_id, method_id):
        sample = self.queue_to_dict().get(int(sample_id), None)

        if not sample:
            msg = "[QUEUE] sample info could not be retrieved"
            logging.getLogger("MX3.HWR").error(msg)
            raise Exception(msg)
        else:
            # Find task with queue id method_id
            for task in sample.tasks:
                if task["queueID"] == int(method_id):
                    return task

        msg = "[QUEUE] method info could not be retrieved, it does not exits for"
        msg += " the given sample"
        logging.getLogger("MX3.HWR").exception(msg)

        raise Exception(msg)

    def set_group_folder(self, path):
        if path and path[0] in ["/", "."]:
            path = path[1:]

        if path and path[-1] != "/":
            path += "/"

        path = "".join([c for c in path if re.match(r"^[a-zA-Z0-9_/-]*$", c)])

        HWR.beamline.session.set_user_group(path)
        root_path = HWR.beamline.session.get_base_image_directory()
        return {"path": path, "rootPath": root_path}

    def set_setting(self, name_value: SimpleNameValue) -> tuple:
        """
        Sets the setting (on the MXCUBEApplication object)
        with name to value

        Args:
           name: The name of the setting
           value The value

        Returns:
           A tuple with name, value on success else empty tuple
        """
        name = str_to_snake(name_value.name).upper()

        if hasattr(self.app, name):
            logging.getLogger("HWR").debug(f"Setting {name} to {name_value.value}")
            setattr(self.app, name, name_value.value)
            result = name, name_value.value
        else:
            result = ()

        return result
