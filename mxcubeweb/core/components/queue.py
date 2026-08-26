import contextlib
import itertools
import json
import logging
import os
import re

from mxcubecore import HardwareRepository as HWR
from mxcubecore import queue_entry as qe
from mxcubecore.model import queue_model_enumerables as qme
from mxcubecore.model import queue_model_objects as qmo
from mxcubecore.model.queue_model_enumerables import CENTRING_METHOD
from mxcubecore.queue_entry.base_queue_entry import QUEUE_ENTRY_STATUS
from pydantic import BaseModel, Field, ValidationError, field_validator, model_validator

from mxcubeweb.core.components.component_base import ComponentBase
from mxcubeweb.core.models.adaptermodels import (
    SampleInputModel,
)
from mxcubeweb.core.models.generic import (
    ALLOWED_APP_SETTINGS,
    GroupFolderModel,
    SettingNameValue,
)
from mxcubeweb.core.models.generic import (
    validate_path as validate_path_value,
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

SAMPLE_MOUNTED = 0x8
COLLECTED = 0x4
WARNING = 0x10
FAILED = 0x2
RUNNING = 0x1
UNCOLLECTED = 0x0
READY = 0

ORIGIN_MX3 = "MX3"

VALID_PREFIX_TEMPLATE_FIELDS = ("{PREFIX}", "{POSITION}")
VALID_SUBDIR_TEMPLATE_FIELDS = ("{ACRONYM}", "{NAME}", "{POSITION}")


def validate_safe_string(value: str | None, field_name: str) -> str | None:
    if value is None:
        return None

    if not isinstance(value, str):
        raise ValueError(f"{field_name} must be a string")

    value = value.strip()

    invalid_char = re.search(r"[^a-zA-Z0-9:+_. -]", value)
    if invalid_char:
        raise ValueError(
            f"{field_name} contains invalid character: {invalid_char.group(0)!r}"
        )

    return value


def validate_safe_template_prefix(value: str) -> str:
    if not isinstance(value, str):
        raise ValueError("prefix must be a string")

    value = value.strip()
    literal_value = value

    for field in VALID_PREFIX_TEMPLATE_FIELDS:
        literal_value = literal_value.replace(field, "")

    validate_safe_string(literal_value, "prefix")
    return value


def validate_safe_template_subdir(value: str) -> str:
    if not isinstance(value, str):
        raise ValueError("subdir must be a string")

    value = value.strip()
    literal_value = value

    for field in VALID_SUBDIR_TEMPLATE_FIELDS:
        literal_value = literal_value.replace(field, "")

    invalid_template = re.search(r"\{[^{}]*\}", literal_value)
    if invalid_template:
        raise ValueError(
            f"subdir contains invalid template variable: {invalid_template.group(0)!r}"
        )

    for part in literal_value.split("/"):
        validate_safe_string(part, "subdir")

    return value


def validate_position(value: str | int) -> str | int:
    if value in ("", None):
        return ""

    if value == -1:
        return value

    if not isinstance(value, str):
        raise ValueError(
            "shape must be -1 or a single letter followed by one or more digits"
        )

    value = value.strip()

    if value == "-1":
        return value

    if re.fullmatch(r"2DP(?:[0-9]+)?", value) or re.fullmatch(r"[a-zA-Z][0-9]+", value):
        return value

    raise ValueError(
        "shape must be -1 or a single letter followed by one or more digits"
    )


def validate_path(path: str) -> str:
    return validate_path_value(path)


class TaskDataPathModel(BaseModel):
    shape: str | int = ""
    directory: str = ""
    process_directory: str = ""
    xds_dir: str = ""
    base_prefix: str = ""
    mad_prefix: str = ""
    reference_image_prefix: str = ""
    wedge_prefix: str = ""
    run_number: int = 0
    suffix: str = ""
    precision: int = 0
    start_num: int = 0
    num_files: int = 0
    compression: str = ""
    path: str = ""
    prefix: str = ""

    # Optional added by mxcubeweb, used but the frontend
    fileName: str | None = ""  # noqa: N815
    fullPath: str | None = ""  # noqa: N815
    subdir: str = ""

    model_config = {
        "validate_assignment": True,
        "extra": "ignore",
        "str_strip_whitespace": True,
        "use_enum_values": True,
    }

    @field_validator("directory", "path", "process_directory", "xds_dir", mode="before")
    @classmethod
    def validate_path_fields(cls, value: str) -> str:
        return validate_path(value)

    @field_validator(
        "base_prefix",
        "mad_prefix",
        "reference_image_prefix",
        "wedge_prefix",
        "suffix",
        mode="before",
    )
    @classmethod
    def validate_safe_string_fields(cls, value: str, info) -> str:
        return validate_safe_string(value, info.field_name)

    @field_validator("prefix", mode="before")
    @classmethod
    def validate_prefix(cls, value: str) -> str:
        return validate_safe_template_prefix(value)

    @field_validator("subdir", mode="before")
    @classmethod
    def validate_subdir(cls, value: str) -> str:
        return validate_safe_template_subdir(value)

    @field_validator("shape", mode="before")
    @classmethod
    def validate_shape(cls, value: str | int) -> str | int:
        return validate_position(value)


class XRFParameters(TaskDataPathModel):
    # From mxcbecore xrf:
    countTime: float = 0  # noqa: N815


class EnergyScanParameters(TaskDataPathModel):
    # From mxcbecore energy scan:
    element: str = ""
    edge: str = ""

    @field_validator("element", "edge", mode="before")
    @classmethod
    def validate_energy_scan_strings(cls, value: str, info) -> str:
        return validate_safe_string(value, info.field_name)


class WorkflowParameters(TaskDataPathModel):
    beam_size: str | None = None
    cell_count: int | None = None
    doc: str = ""
    label: str = ""
    name: str | None = None
    numCols: int = 0  # noqa: N815
    numRows: int = 0  # noqa: N815
    requires: str | None = None
    type: str = ""
    wfname: str = ""
    wfpath: str = ""

    @field_validator(
        "wfname",
        "wfpath",
        "type",
        "requires",
        "name",
        "label",
        "doc",
        "beam_size",
        mode="before",
    )
    @classmethod
    def validate_energy_scan_strings(cls, value: str, info) -> str:
        return validate_safe_string(value, info.field_name)


def normalize_mesh_range(value):
    if value in (None, "", [], ()):
        return {}

    if isinstance(value, float) or isinstance(value, int):
        return {
            "horizontal_range": 0,
            "vertical_range": 0,
        }

    if isinstance(value, dict):
        return {
            "horizontal_range": float(value.get("horizontal_range", 0)),
            "vertical_range": float(value.get("vertical_range", 0)),
        }

    if isinstance(value, (list, tuple)):
        if len(value) != 2:
            raise ValueError("mesh_range must contain two values")
        return {
            "horizontal_range": float(value[0]),
            "vertical_range": float(value[1]),
        }

    raise ValueError("mesh_range must be a dictionary with horizontal/vertical ranges")


class DataCollectionParameters(TaskDataPathModel):
    # From mxcubecore Datacollection, osc, mesh, helical
    first_image: int = Field(0, description="First image number")
    num_images: int = Field(0, description="Total number of images")
    osc_start: float = Field(0, description="Starting oscillation angle")
    osc_range: float = Field(0, description="Oscillation range per image")
    osc_total_range: float = 0
    overlap: float = 0
    kappa: float | None = 0
    kappa_phi: float | None = 0
    exp_time: float = Field(0, description="Exposure time in seconds")
    num_lines: int = 1
    energy: float = Field(0, description="Energy in keV")
    resolution: float = Field(0, description="Resolution in Angstrom")
    detector_distance: float = 0
    transmission: float = 100
    shutterless: bool = True
    take_snapshots: int = 0
    detector_binning_mode: str | None = None
    detector_roi_mode: int = 0
    mesh_range: dict[str, float] = {}
    num_triggers: int = 0
    num_images_per_trigger: int = 0
    cell_counting: str | None = None
    mesh_center: str | None = None
    cell_spacing: tuple[float, float] | None = None
    sub_wedge_size: int = 10
    disable_processing: bool = False

    # Unit cell parameters, sent by the frontend as cellA/cellB/cellC/
    # cellAlpha/cellBeta/cellGamma
    cellA: float = 0  # noqa: N815
    cellB: float = 0  # noqa: N815
    cellC: float = 0  # noqa: N815
    cellAlpha: float = 0  # noqa: N815
    cellBeta: float = 0  # noqa: N815
    cellGamma: float = 0  # noqa: N815

    # From mxcubeweb"
    helical: bool = False
    mesh: bool = False

    # Only set for Interleaved data collections
    taskIndexList: list[int] | None = None  # noqa: N815
    wedges: list["DataCollectionNodeModel"] = []
    swNumImages: int = 0  # noqa: N815

    @field_validator("mesh_range", mode="before")
    @classmethod
    def validate_mesh_range(cls, value):
        return normalize_mesh_range(value)

    @field_validator(
        "detector_binning_mode",
        "cell_counting",
        "mesh_center",
        mode="before",
    )
    @classmethod
    def validate_safe_string_fields(cls, value: str | None, info) -> str | None:
        return validate_safe_string(value, info.field_name)


class CharacterisationParameters(DataCollectionParameters):
    # From mxcubecore Characterisation
    experiment_type: str = ""
    use_aimed_resolution: float = 0
    use_aimed_multiplicity: float = 0
    aimed_multiplicity: float = 0
    aimed_i_sigma: float = 0
    aimed_completness: float = 0
    strategy_complexity: str = ""
    strategy_program: str = ""
    induce_burn: bool = False
    use_permitted_rotation: bool = False
    permitted_phi_start: float = 0
    permitted_phi_end: float = 0
    low_res_pass_strat: bool = False
    max_crystal_vdim: float = 0
    min_crystal_vdim: float = 0
    max_crystal_vphi: float = 0
    min_crystal_vphi: float = 0
    space_group: str = ""
    use_min_dose: float = 0
    use_min_time: float = 0
    min_dose: float = 0
    min_time: float = 0
    account_rad_damage: bool = False
    auto_res: bool = False
    opt_sad: bool = False
    sad_res: float = 0
    determine_rad_params: bool = False
    burn_osc_start: float = 0
    burn_osc_interval: float = 0
    rad_suscept: float = 0
    beta: float = 0
    gamma: float = 0

    @field_validator(
        "experiment_type", "strategy_program", "space_group", mode="before"
    )
    @classmethod
    def validate_characterisation_strings(cls, value: str, info) -> str:
        return validate_safe_string(value, info.field_name)

    @field_validator("strategy_complexity", mode="before")
    @classmethod
    def strategy_complexity_to_int(cls, value: int | str) -> str:
        if isinstance(value, str):
            return value

        try:
            return [
                "SINGLE",
                "FEW",
                "MANY",
            ][value]
        except (IndexError, TypeError):
            return "SINGLE"


class QueueNodeModel(BaseModel):
    type: str = ""
    queueID: int = -1  # noqa: N815
    checked: bool = False
    state: int = UNCOLLECTED

    @field_validator("type", mode="before")
    @classmethod
    def validate_type(cls, value: str) -> str:
        return validate_safe_string(value, "type")


class TaskNodeModel(QueueNodeModel):
    label: str = ""
    sampleID: str  # noqa: N815
    sampleQueueID: int | None = None  # noqa: N815

    # Only known once queued (given by mxcubecore queue)
    taskIndex: int | None = None  # noqa: N815

    # Optional fields
    diffractionPlan: list["TaskNodeModel"] | None = None  # noqa: N815
    diffractionPlanID: int | None = None  # noqa: N815
    name: str | None = None

    @field_validator("sampleID", "name", mode="before")
    @classmethod
    def validate_task_strings(cls, value: str | None, info) -> str | None:
        return validate_safe_string(value, info.field_name)


class DataCollectionNodeModel(TaskNodeModel):
    parameters: DataCollectionParameters


class CharacterisationNodeModel(TaskNodeModel):
    parameters: CharacterisationParameters


class XRFNodeModel(TaskNodeModel):
    parameters: XRFParameters


class EnergyScanNodeModel(TaskNodeModel):
    parameters: EnergyScanParameters


class WorkflowNodeModel(TaskNodeModel):
    parameters: WorkflowParameters


def build_task_node_model(value: object):
    if not isinstance(value, dict):
        return value

    normalized = dict(value)
    task_type = normalized.get("type")

    if task_type == "Interleaved":
        # Interleaved tasks are shaped like a DataCollection (plus wedges/
        # taskIndexList), so validate against that schema, but restore the
        # original type afterwards so downstream routing (add_interleaved,
        # the interleave swap logic) still recognizes it as "Interleaved".
        normalized["type"] = "DataCollection"
        model = DataCollectionNodeModel.model_validate(normalized)
        model.type = "Interleaved"
        return model

    if task_type == "Characterisation":
        return CharacterisationNodeModel.model_validate(normalized)

    if task_type == "xrf_spectrum":
        return XRFNodeModel.model_validate(normalized)

    if task_type == "energy_scan":
        return EnergyScanNodeModel.model_validate(normalized)

    if task_type in {"Workflow", "GphlWorkflow"}:
        return WorkflowNodeModel.model_validate(normalized)

    return DataCollectionNodeModel.model_validate(normalized)


TaskNodeUnion = (
    DataCollectionNodeModel
    | CharacterisationNodeModel
    | XRFNodeModel
    | EnergyScanNodeModel
    | WorkflowNodeModel
)


class SampleNode(QueueNodeModel):
    sampleID: str  # noqa: N815
    code: str | None = None
    location: str
    cell_no: int = 0
    puck_no: int = 1
    sampleName: str  # noqa: N815
    proteinAcronym: str | None = ""  # noqa: N815
    defaultPrefix: str | None = ""  # noqa: N815
    defaultSubDir: str | None = ""  # noqa: N815
    tasks: list[TaskNodeUnion]

    @model_validator(mode="before")
    @classmethod
    def validate_tasks(cls, value):
        if isinstance(value, dict):
            tasks = value.get("tasks")
            if isinstance(tasks, list):
                normalized = dict(value)
                normalized["tasks"] = [build_task_node_model(task) for task in tasks]
                return normalized

        return value

    @field_validator("sampleID", "code", "location", "defaultPrefix", mode="before")
    @classmethod
    def validate_sample_safe_strings(cls, value: str | None, info) -> str | None:
        return validate_safe_string(value, info.field_name)

    @field_validator("sampleName", "proteinAcronym", mode="before")
    @classmethod
    def validate_sample_strings(cls, value: str, info) -> str:
        if value is None and info.field_name == "proteinAcronym":
            return ""

        return validate_safe_string(value, info.field_name)


class QueueSerializer:
    """Serializes the queue. Depends only on mxcubecore (HWR.beamline.*)
    and its sibling QueueBuilder - no self.app reference."""

    def __init__(self, builder):
        self.builder = builder

    def queue_to_dict(self, node=None) -> list[dict]:
        if node is None:
            node = HWR.beamline.queue_model.get_model_root()
            queue_dict = {
                _n.sampleID: _n.model_dump() for _n in self._queue_to_dict_rec(node)
            }

            if queue_dict:
                queue_dict["sample_order"] = list(queue_dict.keys())

        else:
            queue_dict = self._queue_to_dict_rec(node)[0].model_dump()

        return queue_dict

    def _build_sample_node(self, n) -> SampleNode:
        """Builds the SampleNode representation of the Sample model <n>."""
        return SampleNode(
            sampleID=n.loc_str,
            queueID=n._node_id,
            code=n.code,
            type="Sample",
            location="Manual" if n.free_pin_mode else n.loc_str,
            sampleName=n.get_name(),
            proteinAcronym=n.crystals[0].protein_acronym,
            defaultPrefix=self.builder.get_default_prefix(n),
            defaultSubDir=self.builder.get_default_subdir(n),
            cell_no=getattr(n, "cell_no", 0),
            puck_no=getattr(n, "puck_no", 1),
            checked=n.is_enabled(),
            state=self.get_node_state(n._node_id)[1],
            tasks=self._queue_to_dict_rec(n),
        )

    def _queue_to_dict_rec(self, node) -> list[QueueNodeModel]:
        result = []
        node_list = node if isinstance(node, list) else node.get_children()

        for n in node_list:
            sample_node = n.get_sample_node() if hasattr(n, "get_sample_node") else None

            if isinstance(n, qmo.Sample):
                result.append(self._build_sample_node(n))

            elif isinstance(n, qmo.Characterisation):
                result.append(self._handle_char_node(sample_node, n))

            elif isinstance(n, qmo.DataCollection):
                result.append(self._handle_dc_node(sample_node, n))

            elif isinstance(n, qmo.Workflow):
                result.append(self._handle_wf_node(sample_node, n))

            elif isinstance(n, qmo.GphlWorkflow):
                result.append(self._handle_gphl_node(sample_node, n))

            elif isinstance(n, qmo.XRFSpectrum):
                result.append(self._handle_xrf_node(sample_node, n))

            elif isinstance(n, qmo.EnergyScan):
                result.append(self._handle_energy_node(sample_node, n))

            elif isinstance(n, qmo.TaskGroup) and getattr(
                n, "interleave_num_images", 0
            ):
                result.append(self._handle_interleaved_node(sample_node, n))

            elif isinstance(n, qmo.TaskNode) and getattr(n, "task_data", None):
                result.append(self._handle_task_node(sample_node, n))

            else:
                result.extend(self._queue_to_dict_rec(n))

        return result

    def pretty_print_queue(self, msg: str | None = None) -> None:
        """Pretty print current queue state for debugging."""
        try:
            q = self.queue_to_dict()
            # Prefer devtools.debug for nice printing of pydantic models
            try:
                from devtools import debug

                header = msg or "Queue state after addition:"
                print(f"[QueueSerializer] {header}")
                debug(q)
                return
            except Exception:
                pretty = json.dumps(q, indent=2, sort_keys=True, ensure_ascii=False)
                header = msg or "Queue state after addition:"
                print(f"[QueueSerializer] {header}\n{pretty}")
        except Exception as e:
            try:
                logging.getLogger("MX3.QUEUE").exception(
                    "Failed to pretty print queue: %s", e
                )
            except Exception:
                # last resort fallback
                print("[QueueSerializer] Failed to pretty print queue:", e)

    def get_node_state(self, node_id):
        if node_id is None:
            return True, UNCOLLECTED

        node, entry = HWR.beamline.queue_manager.get_entry(node_id)

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

        return enabled, state

    def _subdir_from_path(self, path: str) -> str:
        try:
            base_path = HWR.beamline.session.get_base_image_directory()
            rel_path = os.path.relpath(path, base_path)

            if rel_path not in (".", "..") and not rel_path.startswith(f"..{os.sep}"):
                return rel_path.strip(os.sep).replace(os.sep, "/")

        except (TypeError, ValueError) as ex:
            raise RuntimeError(
                "Could not de-serialize subdir from path: %s" % path
            ) from ex

        raise RuntimeError("Could not de-serialize subdir from path: %s" % path)

    def _handle_char_node(self, sample_node, node) -> TaskNodeModel:
        enabled, state = self.get_node_state(node._node_id)
        originID, tasks = self._handle_diffraction_plan(node, sample_node)

        parameters = node.characterisation_parameters.as_dict()
        parameters["shape"] = node.get_point_index()
        refp = self._handle_dc_node(
            sample_node, node.reference_image_collection
        ).parameters.dict()

        parameters.update(refp)

        return CharacterisationNodeModel(
            label="CHARACTERISATION",
            type="Characterisation",
            parameters=parameters,
            checked=node.is_enabled(),
            sampleID=sample_node.loc_str,
            sampleQueueID=sample_node._node_id,
            taskIndex=HWR.beamline.queue_model.node_index(node)["idx"],
            queueID=node._node_id,
            state=state,
            diffractionPlan=tasks if isinstance(tasks, list) else None,
            diffractionPlanID=originID,
        )

    def _handle_dc_node(self, sample_node, node) -> TaskNodeModel:
        enabled, state = self.get_node_state(node._node_id)
        parameters = node.as_dict()
        parameters["shape"] = getattr(node, "shape", "")
        parameters["subdir"] = self._subdir_from_path(parameters["path"])

        pt = node.acquisitions[0].path_template

        # Remove python %s formatting for number of images and replace with #
        parameters["fileName"] = pt.get_image_file_name().replace(
            "%" + ("0%sd" % str(pt.precision)), int(pt.precision) * "#"
        )

        parameters["fullPath"] = os.path.join(
            parameters["path"], parameters["fileName"]
        )

        # Create a more user friendly label
        dtype_label = qme.EXPERIMENT_TYPE._fields[node.experiment_type]
        dtype_label = "OSCILLATION" if dtype_label == "NATIVE" else dtype_label
        dtype_label = (
            "LINE"
            if dtype_label == "HELICAL" and parameters["osc_range"] == 0
            else dtype_label
        )

        return DataCollectionNodeModel(
            label=dtype_label + " (" + parameters["fileName"] + ")",
            type="DataCollection",
            parameters=parameters,
            checked=node.is_enabled(),
            sampleID=sample_node.loc_str,
            sampleQueueID=sample_node._node_id,
            # node._node_id and taskIndex are None for reference collections for an
            # characterisation, we should default handle this case in mxcubecore
            taskIndex=HWR.beamline.queue_model.node_index(node)["idx"] or 0,
            queueID=node._node_id or -1,
            state=state,
        )

    def _handle_wf_node(self, sample_node, node) -> TaskNodeModel:
        enabled, state = self.get_node_state(node._node_id)
        parameters = node.parameters.copy()
        parameters.update(node.path_template.as_dict())
        parameters["path"] = parameters["directory"]
        parameters["subdir"] = self._subdir_from_path(parameters["path"])
        pt = node.path_template
        parameters["fileName"] = pt.get_image_file_name().replace(
            "%" + ("%sd" % str(pt.precision)), int(pt.precision) * "#"
        )
        parameters["fullPath"] = os.path.join(
            parameters["path"], parameters["fileName"]
        )
        return WorkflowNodeModel(
            label=parameters["label"],
            type="Workflow",
            name=node._type,
            parameters=parameters,
            checked=node.is_enabled(),
            sampleID=sample_node.loc_str,
            taskIndex=HWR.beamline.queue_model.node_index(node)["idx"],
            queueID=node._node_id,
            state=state,
        )

    def _handle_gphl_node(self, sample_node, node) -> TaskNodeModel:
        enabled, state = self.get_node_state(node._node_id)
        pt = node.path_template
        parameters = pt.as_dict()
        parameters["path"] = parameters["directory"]
        parameters["subdir"] = self._subdir_from_path(parameters["path"])
        parameters["strategy_name"] = node.strategy_name
        parameters["label"] = f"GPhL {parameters['strategy_name']}"
        parameters["shape"] = node.shape
        parameters["fileName"] = pt.get_image_file_name().replace(
            "%" + ("%sd" % str(pt.precision)), int(pt.precision) * "#"
        )
        parameters["fullPath"] = os.path.join(
            parameters["directory"], parameters["fileName"]
        )
        return DataCollectionNodeModel(
            label=parameters["label"],
            type="GphlWorkflow",
            parameters=parameters,
            checked=node.is_enabled(),
            sampleID=sample_node.loc_str,
            sampleQueueID=sample_node._node_id,
            taskIndex=HWR.beamline.queue_model.node_index(node)["idx"],
            queueID=node._node_id,
            state=state,
        )

    def _handle_xrf_node(self, sample_node, node) -> TaskNodeModel:
        enabled, state = self.get_node_state(node._node_id)
        # This should be moved to as_dict of the XRFSpectrum node in mxcubecore
        parameters = {"countTime": node.count_time, "shape": str(node.shape)}
        parameters.update(node.path_template.as_dict())
        parameters["path"] = parameters["directory"]
        parameters["subdir"] = self._subdir_from_path(parameters["path"])
        pt = node.path_template
        parameters["prefix"] = pt.get_prefix()
        parameters["fileName"] = pt.get_image_file_name().replace(
            "%" + ("%sd" % str(pt.precision)), int(pt.precision) * "#"
        )
        parameters["fullPath"] = os.path.join(
            parameters["path"], parameters["fileName"]
        )

        return XRFNodeModel(
            label="XRF Scan",
            type="xrf_spectrum",
            parameters=parameters,
            checked=node.is_enabled(),
            sampleID=sample_node.loc_str,
            sampleQueueID=sample_node._node_id,
            taskIndex=HWR.beamline.queue_model.node_index(node)["idx"],
            queueID=node._node_id,
            state=state,
        )

    def _handle_energy_node(self, sample_node, node) -> TaskNodeModel:
        enabled, state = self.get_node_state(node._node_id)
        parameters = {
            "element": node.element_symbol,
            "edge": node.edge,
            "shape": str(node.shape),
        }
        parameters.update(node.path_template.as_dict())
        parameters["path"] = parameters["directory"]
        parameters["subdir"] = self._subdir_from_path(parameters["path"])
        pt = node.path_template
        parameters["prefix"] = pt.get_prefix()
        parameters["fileName"] = pt.get_image_file_name().replace(
            "%" + ("%sd" % str(pt.precision)), int(pt.precision) * "#"
        )
        parameters["fullPath"] = os.path.join(
            parameters["path"], parameters["fileName"]
        )

        return EnergyScanNodeModel(
            label="Energy Scan",
            type="energy_scan",
            parameters=parameters,
            checked=node.is_enabled(),
            sampleID=sample_node.loc_str,
            sampleQueueID=sample_node._node_id,
            taskIndex=HWR.beamline.queue_model.node_index(node)["idx"],
            queueID=node._node_id,
            state=state,
        )

    def _handle_interleaved_node(self, sample_node, node) -> TaskNodeModel:
        wedges = [self._handle_dc_node(sample_node, c) for c in node.get_children()]
        _, state = self.get_node_state(node._node_id)
        return DataCollectionNodeModel(
            label="Interleaved",
            type="Interleaved",
            parameters={
                "wedges": [w.dict() for w in wedges],
                "swNumImages": node.interleave_num_images,
            },
            checked=node.is_enabled(),
            sampleID=sample_node.loc_str,
            sampleQueueID=sample_node._node_id,
            taskIndex=HWR.beamline.queue_model.node_index(node)["idx"],
            queueID=node._node_id,
            state=state,
        )

    def _handle_task_node(self, sample_node, node) -> TaskNodeModel:
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
        _, state = self.get_node_state(node._node_id)
        return DataCollectionNodeModel(
            label=parameters.get("label", "TaskNode"),
            type=parameters.get("type", "TaskNode"),
            parameters=parameters,
            checked=node.is_enabled(),
            sampleID=sample_node.loc_str,
            sampleQueueID=sample_node._node_id,
            taskIndex=HWR.beamline.queue_model.node_index(node)["idx"],
            queueID=node._node_id,
            state=state,
        )

    def _handle_diffraction_plan(self, node, sample_node):
        model, _ = HWR.beamline.queue_manager.get_entry(node._node_id)
        originID = model.get_origin()
        tasks = []
        if len(model.diffraction_plan) > 0:
            collections = model.diffraction_plan[0]
            for col in collections:
                t = self._handle_dc_node(sample_node, col)
                t_dict = t.dict()
                t_dict["isDiffractionPlan"] = True
                tasks.append(t_dict)
            return originID, tasks
        return -1, []

    def _queue_add_item_rec(self, parent_node_id: int | None, item: SampleNode):
        if item.type == "Sample":
            sample_node_id = self.builder.add_sample(item.sampleID, item.dict())

            for task in item.tasks or []:
                self._queue_add_item_rec(sample_node_id, task)

        elif item.type == "DataCollection":
            self.builder.add_data_collection(parent_node_id, item.dict())

        elif item.type == "Characterisation":
            self.builder.add_characterisation(parent_node_id, item.dict())

        elif item.type in ("Workflow", "GphlWorkflow"):
            self.builder.add_workflow(parent_node_id, item.dict())

        elif item.type == "Interleaved":
            self.builder.add_interleaved(parent_node_id, item.dict())

        elif item.type == "xrf_spectrum":
            self.builder.add_xrf_scan(parent_node_id, item.dict())

        elif item.type == "energy_scan":
            self.builder.add_energy_scan(parent_node_id, item.dict())

        else:
            self.builder.add_queue_entry(parent_node_id, item.dict(), item.type)

        # Print the queue after adding an item for easier debugging

        if logging.getLogger("MX3.QUEUE").isEnabledFor(logging.DEBUG):
            try:
                self.pretty_print_queue(
                    f"Added item type={item.type} parent={parent_node_id}"
                )
            except Exception:
                logging.getLogger("MX3.HWR").exception(
                    "Failed to pretty print queue after adding item"
                )

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
        try:
            parsed_items = [SampleNode.model_validate(i) for i in item_list]
        except ValidationError:
            logging.getLogger("MX3.QUEUE").exception(
                "Failed to validate queue item(s): %s" % item_list
            )
            raise
        for item in parsed_items:
            self._queue_add_item_rec(None, item)

        # Handling interleaved data collections, swap interleave task with
        # the first of the data collections that are used as wedges, and then
        # remove all collections that were used as wedges
        first_tasks = parsed_items[0].tasks or []
        for task in first_tasks:
            if (
                task.type == "Interleaved"
                and task.parameters
                and task.parameters.taskIndexList
            ):
                current_queue = self.queue_to_dict()
                sid = task.sampleID
                interleaved_tindex = len(current_queue[sid]["tasks"]) - 1
                tindex_list = sorted(task.parameters.taskIndexList)

                # Swap first "wedge task" and the actual interleaved collection
                # so that the interleaved task is the first task
                HWR.beamline.queue_manager.swap_task_entry(
                    sid, interleaved_tindex, tindex_list[0]
                )

                # We remove the swapped wedge index from the list, (now pointing
                # at the interleaved collection) and add its new position
                # (last task item) to the list.
                tindex_list = tindex_list[1:]
                tindex_list.append(interleaved_tindex)

                # The delete operation can be done all in one call if we make sure
                # that we remove the items starting from the end (not altering
                # previous indices)
                for ti in reversed(tindex_list):
                    HWR.beamline.queue_manager.delete_entry_at([[sid, int(ti)]])

        return self.queue_to_dict()


class QueueBuilder:
    """Creates queue models the creation of queue entries are handled
    in queue_model_child_added event handler"""

    def get_run_number(self, pt):
        # Path templates of files not yet written to disk, we are only
        # interested in the prefix path

        pt.run_number = HWR.beamline.queue_model.get_next_run_number(pt)
        start_fname, end_fname = pt.get_first_and_last_file()

        while os.path.isfile(start_fname) or os.path.isfile(end_fname):
            pt.run_number += 1

            if pt.run_number > 1000:
                msg = "Over a thousand runs of the same collection"
                raise RuntimeError(msg)

            start_fname, end_fname = pt.get_first_and_last_file()

        return pt.run_number

    def get_default_prefix(self, sample_data, generic_name=False):
        """Thin pass-through to HWR.beamline.session.get_default_prefix.

        Kept as its own method (rather than called inline) so
        apply_template can call it as self.get_default_prefix(...).
        """
        return HWR.beamline.session.get_default_prefix(sample_data, generic_name)

    def get_default_subdir(self, sample_data):
        """Thin pass-through to HWR.beamline.session.get_default_subdir."""
        return HWR.beamline.session.get_default_subdir(sample_data)

    def apply_template(self, params, sample_model, path_template):
        # Apply subdir template if used:
        if "{" in params.get("subdir", ""):
            if sample_model.crystals[0].protein_acronym:
                params["subdir"] = params["subdir"].format(
                    NAME=sample_model.get_name(),
                    ACRONYM=sample_model.crystals[0].protein_acronym,
                )
            else:
                stripped = params["subdir"][0 : params["subdir"].find("{")]
                params["subdir"] = stripped + sample_model.get_name()

            # The template was only applied partially if subdir ends with '-'
            # probably because either acronym or protein name is null in LIMS
            if params["subdir"].endswith("-"):
                params["subdir"] = sample_model.get_name()

        # Making sure that there are no ":" left from the sample name incase
        # no synchronisation with LIMS was done
        params["subdir"] = params["subdir"].replace(":", "-")

        if "{" in params.get("prefix", ""):
            # sample_model is already the authoritative, up-to-date copy of
            # this sample's identity (see the design doc's step 4 item 2
            # investigation: every path that refreshes the web UI's sample
            # list also syncs onto sample_model before this can run), so
            # read directly from it instead of the web-only sample list.
            prefix = self.get_default_prefix(sample_model)
            shape = params.get("shape") or ""
            params["prefix"] = params["prefix"].format(PREFIX=prefix, POSITION=shape)

            if params["prefix"].endswith("_"):
                params["prefix"] = params["prefix"][:-1]

        # mxcube web passes entire prefix as prefix, including reference, mad and wedge
        # prefix. So we strip those before setting the actual base_prefix.
        params["prefix"] = self.strip_prefix(path_template, params["prefix"])

    def strip_prefix(self, pt, prefix):
        """Strip the reference, wedge and mad prefix from a given prefix.

        For example,
        remove ``ref-`` from the beginning
        and ``_w[n]`` and ``-pk``, ``-ip``, ``-ipp`` from the end.

        :param PathTemplate pt: path template used to create the prefix
        :param str prefix: prefix from the client
        :returns: stripped prefix
        """
        if (
            pt.reference_image_prefix
            and pt.reference_image_prefix == prefix[0 : len(pt.reference_image_prefix)]
        ):
            prefix = prefix[len(pt.reference_image_prefix) + 1 :]

        if pt.wedge_prefix and pt.wedge_prefix == prefix[-len(pt.wedge_prefix) :]:
            prefix = prefix[: -(len(pt.wedge_prefix) + 1)]

        if pt.mad_prefix and pt.mad_prefix == prefix[-len(pt.mad_prefix) :]:
            prefix = prefix[: -(len(pt.mad_prefix) + 1)]

        return prefix

    def add_sample(self, sample_id: str, item):
        """Add a sample with sample id <sample_id> the queue.

        :param sample_id: Sample id (often sample changer location)
        :returns: SampleQueueEntry
        """
        # Sample is already in the queue, just enable it (incase it was disabled)
        if item.get("queueID", -1) != -1:
            HWR.beamline.queue_manager.enable_entry(item["queueID"], True)
            return item["queueID"]

        sample_model = qmo.Sample()
        sample_model.set_origin(ORIGIN_MX3)
        sample_model.set_from_dict(item)

        # Explicitly set parameters that are not sent by the client
        sample_model.loc_str = sample_id
        sample_model.free_pin_mode = item["location"] == "Manual"
        sample_model.cell_no = item.get("cell_no", 0)
        sample_model.puck_no = item.get("puck_no", 1)
        sample_model.set_name(item["sampleName"])
        sample_model.name = item["sampleName"]

        if sample_model.free_pin_mode:
            sample_model.location = (None, sample_id)
        elif HWR.beamline.diffractometer.in_plate_mode:
            component = HWR.beamline.sample_changer._resolve_component(item["location"])
            sample_model.location = component.get_coords()
        else:
            sample_model.location = tuple(map(int, item["location"].split(":")))

        # The matching SampleQueueEntry is created and enqueued automatically
        # by Queue.queue_model_child_added
        HWR.beamline.queue_model.add_child(
            HWR.beamline.queue_model.get_model_root(), sample_model
        )

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

    def set_dc_params(
        self,
        model: qmo.DataCollection,
        entry: qe.BaseQueueEntry,
        task_data: dict,
        sample_model,
    ):
        """Helper method that sets the data collection parameters for a DataCollection.

        :param model: The model to set parameters of
        :param entry: The queue entry of the model
        :param task_data: Dictionary with new parameters
        """
        acq = model.acquisitions[0]
        params = task_data["parameters"]
        acq.acquisition_parameters.set_from_dict(params)

        self._set_processing_params(model.processing_parameters, params)

        ftype = HWR.beamline.detector.get_property("file_suffix")
        ftype = ftype if ftype else ".?"

        acq.path_template.set_from_dict(params)
        # certain attributes have to be updated explicitly,
        # like precision, suffix ...
        acq.path_template.start_num = params["first_image"]
        acq.path_template.num_files = params["num_images"]
        acq.path_template.suffix = ftype
        acq.path_template.precision = "0" + str(qmo.PathTemplate.precision)

        self.apply_template(params, sample_model, acq.path_template)

        self._set_default_prefix(acq.path_template, params, sample_model)

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

        full_path, process_path = HWR.beamline.session.get_full_paths(
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
            mesh_center = HWR.beamline.get_default_acquisition_parameters(
                "mesh"
            ).mesh_center
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

    def set_gphl_wf_params(
        self,
        model: qmo.GphlWorkflow,
        entry: qe.BaseQueueEntry,
        task_data: dict,
        sample_model,
    ):
        """Helper method that sets the parameters for a GPhL workflow task.

        :param model: The model to set parameters of
        :param entry: The queue entry of the model
        :param task_data: Dictionary with new parameters
        :param sample_model: The Sample queueModelObject
        """
        params = task_data["parameters"]
        self.apply_template(params, sample_model, model.path_template)

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

    def set_wf_params(
        self,
        model: qmo.Workflow,
        entry: qe.BaseQueueEntry,
        task_data: dict,
        sample_model,
    ):
        """Helper method that sets the parameters for a workflow task.

        :param model: The model to set parameters of
        :param entry: The queue entry of the model
        :param task_data: Dictionary with new parameters
        """
        params = task_data["parameters"]
        model.parameters = params
        model.path_template.set_from_dict(params)
        model.path_template.num_files = 0
        model.path_template.precision = "0" + str(qmo.PathTemplate.precision)

        self.apply_template(params, sample_model, model.path_template)
        self._set_default_prefix(model.path_template, params, sample_model)

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

    def set_char_params(
        self,
        model: qmo.Characterisation,
        entry: qe.BaseQueueEntry,
        task_data: dict,
        sample_model,
    ):
        """Helper method that sets the characterisation parameters.

        Helper method that sets the characterisation parameters for a Characterisation.

        :param model: The mode to set parameters of
        :param entry: The queue entry of the model
        :param task_data: Dictionary with new parameters
        """
        params = task_data["parameters"]
        self.set_dc_params(
            model.reference_image_collection,
            entry,
            task_data,
            sample_model,
        )

        model.characterisation_parameters.set_from_dict(params)

        # MXCuBE Web specific shape attribute
        # TODO: Please consider defining shape attribute properly !
        model.shape = params["shape"]

        model.set_enabled(task_data["checked"])
        entry.set_enabled(task_data["checked"])

    def set_xrf_params(
        self,
        model: qmo.XRFSpectrum,
        entry: qe.BaseQueueEntry,
        task_data: dict,
        sample_model,
    ):
        """Helper method that sets the xrf scan parameters for a XRF spectrum Scan.

        :param model: The model to set parameters of
        :param entry: The queue entry of the model
        :param task_data: Dictionary with new parameters
        """
        params = task_data["parameters"]

        ftype = HWR.beamline.xrf_spectrum.get_property("file_suffix", "dat").strip()

        model.path_template.set_from_dict(params)
        model.path_template.suffix = ftype
        model.path_template.precision = "0" + str(qmo.PathTemplate.precision)
        self._set_default_prefix(model.path_template, params, sample_model)

        full_path, process_path = HWR.beamline.session.get_full_paths(
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

    def set_energy_scan_params(
        self,
        model: qmo.EnergyScan,
        entry: qe.BaseQueueEntry,
        task_data: dict,
        sample_model,
    ):
        """Helper method that sets the xrf scan parameters for a XRF spectrum Scan.

        :param model: The model to set parameters of
        :param entry: The queue entry of the model
        :param task_data: Dictionary with new parameters
        """
        params = task_data["parameters"]

        ftype = HWR.beamline.energy_scan.get_property("file_suffix", "raw").strip()

        model.path_template.set_from_dict(params)
        model.path_template.suffix = ftype
        model.path_template.precision = "0" + str(qmo.PathTemplate.precision)
        self._set_default_prefix(model.path_template, params, sample_model)

        full_path, process_path = HWR.beamline.session.get_full_paths(
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

        # MXCuBE Web specific shape attribute
        model.shape = params["shape"]

        model.set_enabled(task_data["checked"])
        entry.set_enabled(task_data["checked"])

    def _create_dc(self) -> qmo.DataCollection:
        """Create a data collection model.

        Its corresponding DataCollectionQueueEntry is created and enqueued
        automatically once the model is added to the tree - see
        Queue.queue_model_child_added.

        :returns: The data collection model.
        """
        dc_model = qmo.DataCollection()
        dc_model.set_origin(ORIGIN_MX3)
        dc_model.center_before_collect = True
        dc_model.take_snapshots = HWR.beamline.collect.get_property(
            "num_snapshots", HWR.beamline.collect.number_of_snapshots
        )

        return dc_model

    def _create_queue_entry(self, task: dict, task_name):  # noqa: D417
        """Create the data model for a queue entry.

        Its corresponding QueueEntry is created and enqueued automatically
        once the model is added to the tree - see
        Queue.queue_model_child_added.

        Args:
            task: Collection parameters
        Return:
            The data model.
        """
        if not task["parameters"]["osc_range"]:
            task["parameters"]["osc_range"] = None

        queue_entry_name = task_name.title().replace("_", "") + "QueueEntry"
        entry_cls = getattr(qe, queue_entry_name)
        data = entry_cls.DATA_MODEL(
            path_parameters=task["parameters"],
            common_parameters=task["parameters"],
            user_collection_parameters=task["parameters"],
            collection_parameters=task["parameters"],
            legacy_parameters=task["parameters"],
        )

        model = entry_cls.QMO(task_data=data)
        model.set_origin(ORIGIN_MX3)

        return model

    def _create_wf(self) -> qmo.Workflow:
        """Create a workflow model.

        :returns: The workflow model.
        """
        wf_model = qmo.Workflow()
        wf_model.set_origin(ORIGIN_MX3)

        return wf_model

    def _create_gphl_wf(self) -> qmo.GphlWorkflow:
        """Create a gphl workflow model.

        :returns: The GPhL workflow model.
        """
        wf_model = qmo.GphlWorkflow()
        wf_model.set_origin(ORIGIN_MX3)

        return wf_model

    def _create_xrf(self, sample_model: qmo.Sample) -> qmo.XRFSpectrum:
        """Create a XRFSpectrum model.

        :param sample_model: The sample the collection belongs to
        :returns: The XRFSpectrum model.
        """
        xrf_model = qmo.XRFSpectrum(sample=sample_model)
        xrf_model.set_origin(ORIGIN_MX3)

        return xrf_model

    def _create_energy_scan(self, sample_model: qmo.Sample) -> qmo.EnergyScan:
        """Create an energy scan model.

        :param sample_model: The sample the collection belongs to
        :returns: The energy scan model.
        """
        escan_model = qmo.EnergyScan(sample=sample_model)
        escan_model.set_origin(ORIGIN_MX3)

        return escan_model

    def _create_and_enqueue_task_group(self, parent_model, group_model=None):
        """Create a task group and add it as a child of parent_model.

        The matching TaskGroupQueueEntry is created and enqueued
        automatically, see Queue.queue_model_child_added.
        """
        if group_model is None:
            group_model = qmo.TaskGroup()

        group_model.set_origin(ORIGIN_MX3)
        group_model.set_enabled(True)
        HWR.beamline.queue_model.add_child(parent_model, group_model)

        group_entry = HWR.beamline.queue_manager.get_entry_with_model(group_model)

        return group_model, group_entry

    def _attach_model_to_group(self, group_model, model):
        """Add model as a child of group_model.

        The matching QueueEntry is created and enqueued automatically, see
        Queue.queue_model_child_added.

        :returns: The automatically created QueueEntry for model.
        """
        HWR.beamline.queue_model.add_child(group_model, model)

        return HWR.beamline.queue_manager.get_entry_with_model(model)

    def _set_processing_params(self, processing_params, params):
        processing_params.space_group = params.get("space_group", "")
        processing_params.cell_a = params.get("cellA", "")
        processing_params.cell_alpha = params.get("cellAlpha", "")
        processing_params.cell_b = params.get("cellB", "")
        processing_params.cell_beta = params.get("cellBeta", "")
        processing_params.cell_c = params.get("cellC", "")
        processing_params.cell_gamma = params.get("cellGamma", "")

    def _set_default_prefix(self, path_template, params, sample_model):
        prefix = params.get("prefix", "")
        path_template.base_prefix = (
            prefix if prefix else HWR.beamline.session.get_default_prefix(sample_model)
        )

    def add_characterisation(self, node_id: int, task: dict) -> int:
        """Add a data characterisation task to the sample with id: <id>.

        :param node_id: id of the sample to which the task belongs
        :param task: Task data (parameters)

        :returns: The queue id of the Data collection
        """
        sample_model, sample_entry = HWR.beamline.queue_manager.get_entry(node_id)
        params = task["parameters"]

        refdc_model = self._create_dc()
        refdc_model.acquisitions[0].path_template.reference_image_prefix = "ref"
        refdc_model.set_name("refdc")
        char_params = qmo.CharacterisationParameters().set_from_dict(params)

        char_model = qmo.Characterisation(refdc_model, char_params)
        char_model.set_origin(ORIGIN_MX3)

        # A characterisation has two TaskGroups one for the characterisation itself
        # and its reference collection and one for the resulting diffraction plans.
        # But we only create a reference group if there is a result !
        refgroup_model, refgroup_entry = self._create_and_enqueue_task_group(
            sample_model
        )
        char_entry = self._attach_model_to_group(refgroup_model, char_model)
        char_entry.queue_model = HWR.beamline.queue_model

        # Set the characterisation and reference collection parameters
        self.set_char_params(char_model, char_entry, task, sample_model)

        # the default value is True, here we adapt to mxcube Web needs
        char_model.auto_add_diff_plan = HWR.beamline.queue_manager.auto_add_diff_plan
        char_entry.auto_add_diff_plan = HWR.beamline.queue_manager.auto_add_diff_plan

        char_model.set_enabled(task["checked"])
        char_entry.set_enabled(task["checked"])

        return char_model._node_id

    def add_data_collection(self, node_id: int, task: dict) -> int:
        """Add a data collection task to the sample with id: <id>.

        :param node_id: id of the sample to which the task belongs
        :param task: task data

        :returns: The queue id of the data collection
        """
        sample_model, _sample_entry = HWR.beamline.queue_manager.get_entry(node_id)
        dc_model = self._create_dc()

        group_model, _group_entry = self._create_and_enqueue_task_group(sample_model)
        dc_entry = self._attach_model_to_group(group_model, dc_model)
        self.set_dc_params(dc_model, dc_entry, task, sample_model)

        return dc_model._node_id

    def add_queue_entry(self, node_id: int, task: dict, task_name: str):
        """Add a queue entry to the sample with id <node_id>.

        Args:
            node_id: id of the sample to which the task belongs
            task: task data
            task_name: The task name
        """
        sample_model, _sample_entry = HWR.beamline.queue_manager.get_entry(node_id)
        model = self._create_queue_entry(task, task_name)
        model.set_origin(ORIGIN_MX3)

        acq = model.acquisitions[0]
        params = task["parameters"]

        self._set_processing_params(model.processing_parameters, params)

        ftype = HWR.beamline.detector.get_property("file_suffix")
        ftype = ftype if ftype else ".?"

        acq.path_template.set_from_dict(params)
        # certain attributes have to be updated explicitly,
        # like precision, suffix ...
        acq.path_template.start_num = params["first_image"]
        acq.path_template.num_files = params["num_images"]
        acq.path_template.suffix = ftype
        acq.path_template.precision = "0" + str(qmo.PathTemplate.precision)

        self._set_default_prefix(acq.path_template, params, sample_model)

        full_path, process_path = HWR.beamline.session.get_full_paths(
            # Note that 'experiment_name' field can either be omitted, set to None
            # or some string value. For cases it is not defined (omitted or None)
            # the "" will be used for the path generation.
            os.path.join(
                params.get("subdir", ""), params.get("experiment_name", "") or ""
            ),
            task_name,
        )
        acq.path_template.directory = full_path
        acq.path_template.process_directory = process_path

        model.shape = params["shape"]

        group_model, _group_entry = self._create_and_enqueue_task_group(sample_model)
        self._attach_model_to_group(group_model, model)

        return model._node_id

    def add_workflow(self, node_id: int, task: dict) -> int:
        """Add a worklfow task to the parent node with id: <id>.

        For adding GPhL Auto workflow, call with node_id==parent_node_id
        and all required parameters in task["parameters"]

        :param node_id: id of the parent node to which the task belongs
        :param task: task data

        :returns: The queue id of the data collection
        """
        parent_model, _parent_entry = HWR.beamline.queue_manager.get_entry(node_id)
        sample_model = parent_model.get_sample_node()

        group_model, _group_entry = self._create_and_enqueue_task_group(parent_model)

        if task["parameters"]["wfpath"] == "Gphl":
            wf_model = self._create_gphl_wf()
            dc_entry = self._attach_model_to_group(group_model, wf_model)
            self.set_gphl_wf_params(
                wf_model,
                dc_entry,
                task,
                sample_model,
            )
        else:
            wf_model = self._create_wf()
            dc_entry = self._attach_model_to_group(group_model, wf_model)
            self.set_wf_params(wf_model, dc_entry, task, sample_model)

        return wf_model._node_id

    def add_interleaved(self, node_id: int, task: dict) -> int:
        """Add a interleaved data collection task to the sample with id: <id>.

        :param node_id: id of the sample to which the task belongs
        :param task: task data

        :returns: The queue id of the data collection
        """
        sample_model, _sample_entry = HWR.beamline.queue_manager.get_entry(node_id)

        group_model, _group_entry = self._create_and_enqueue_task_group(sample_model)
        group_model.interleave_num_images = task["parameters"]["swNumImages"]

        wc = 0

        for wedge in task["parameters"]["wedges"]:
            wc = wc + 1
            dc_model = self._create_dc()
            dc_entry = self._attach_model_to_group(group_model, dc_model)
            self.set_dc_params(dc_model, dc_entry, wedge, sample_model)

            # Add wedge prefix to path
            dc_model.acquisitions[0].path_template.wedge_prefix = "wedge-%s" % wc

            # Disable snapshots for sub-wedges
            dc_model.acquisitions[0].acquisition_parameters.take_snapshots = False

        return group_model._node_id

    def add_xrf_scan(self, node_id: int, task: dict) -> int:
        """Add a XRF Scan task to the sample with id: <id>.

        :param node_id: id of the sample to which the task belongs
        :param task: task data

        :returns: The queue id of the data collection
        """
        sample_model, _sample_entry = HWR.beamline.queue_manager.get_entry(node_id)
        xrf_model = self._create_xrf(sample_model)

        group_model, _group_entry = self._create_and_enqueue_task_group(sample_model)
        xrf_entry = self._attach_model_to_group(group_model, xrf_model)
        self.set_xrf_params(xrf_model, xrf_entry, task, sample_model)

        return xrf_model._node_id

    def add_energy_scan(self, node_id: int, task: dict) -> int:
        """Add a energy scan task to the sample with id: <id>.

        :param node_id: id of the sample to which the task belongs
        :param task: task data

        :returns: The queue id of the data collection
        """
        sample_model, _sample_entry = HWR.beamline.queue_manager.get_entry(node_id)
        escan_model = self._create_energy_scan(sample_model)

        group_model, _group_entry = self._create_and_enqueue_task_group(sample_model)
        escan_entry = self._attach_model_to_group(group_model, escan_model)
        self.set_energy_scan_params(escan_model, escan_entry, task, sample_model)

        return escan_model._node_id

    def queue_update_item(self, sqid, tqid, data):
        model, entry = HWR.beamline.queue_manager.get_entry(tqid)
        sample_model, _ = HWR.beamline.queue_manager.get_entry(sqid)

        if data["type"] == "DataCollection":
            self.set_dc_params(model, entry, data, sample_model)
        elif data["type"] == "Characterisation":
            self.set_char_params(model, entry, data, sample_model)

        return model


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

    def queue_to_dict(self, node: qmo.TaskNode | None = None):
        """Returns the dictionary representation of the queue.

        :param node: list of Node objects to get representation for,
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
        return self._qs.queue_to_dict(node)

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
        }

    def get_task_schema(self, data_model):
        return {
            "path_parameters": (
                data_model.__signature__.parameters[
                    "path_parameters"
                ].annotation.schema()
            ),
            "common_parameters": (
                data_model.__signature__.parameters[
                    "common_parameters"
                ].annotation.schema()
            ),
            "collection_parameters": (
                data_model.__signature__.parameters[
                    "collection_parameters"
                ].annotation.schema()
            ),
            "user_collection_parameters": (
                data_model.__signature__.parameters[
                    "user_collection_parameters"
                ].annotation.schema()
            ),
            "legacy_parameters": (
                data_model.__signature__.parameters[
                    "legacy_parameters"
                ].annotation.schema()
            ),
        }

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
