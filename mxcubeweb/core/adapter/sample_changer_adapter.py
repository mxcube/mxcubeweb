import json
import logging
from typing import ClassVar

import gevent
from markupsafe import escape
from mxcubecore import HardwareRepository as HWR
from mxcubecore import queue_entry
from mxcubecore.HardwareObjects.abstract.AbstractSampleChanger import (
    SampleChanger,
    SampleChangerState,
)

from mxcubeweb.core.adapter.adapter_base import AdapterBase
from mxcubeweb.core.models.adaptermodels import (
    SampleChangerCommandInputModel,
    SampleInputModel,
)
from mxcubeweb.core.models.configmodels import ResourceHandlerConfigModel

logger = logging.getLogger("MX3.HWR")

resource_handler_config = ResourceHandlerConfigModel(
    name="sample_changer",
    url_prefix="/mxcube/api/v0.1/sample_changer",
    attributes=[
        "loaded_sample",
        "get_contents",
        "get_value",
        "sync_with_crims",
    ],
    commands=[
        "select_location",
        "scan_location",
        "unmount_current",
        "mount_sample",
        "send_command",
    ],
)


class SampleChangerAdapter(AdapterBase):
    """Adapter for AbstractSampleChanger."""

    SUPPORTED_TYPES: ClassVar[list[object]] = [SampleChanger]

    def __init__(self, ho, role, app):
        super().__init__(ho, role, app, resource_handler_config)
        self.app = app

        sc = HWR.beamline.sample_changer

        # Initialize hwobj signals
        sc.connect("stateChanged", self._sc_state_changed)
        sc.connect("isCollisionSafe", self._is_collision_safe)
        sc.connect("loadedSampleChanged", self._loaded_sample_changed)
        sc.connect("contentsUpdated", self._sc_contents_update)

        if HWR.beamline.sample_changer_maintenance is not None:
            HWR.beamline.sample_changer_maintenance.connect(
                "globalStateChanged", self._sc_maintenance_update
            )

            HWR.beamline.sample_changer_maintenance.connect(
                "gripperChanged", self._gripper_changed
            )

    def _sc_state_changed(self, *args):
        new_state = args[0]
        state_str = SampleChangerState.STATE_DESC.get(new_state, "Unknown").upper()
        self.app.server.emit("sc_state", state_str, namespace="/hwr")

    def _is_collision_safe(self, *args):
        new_state = args[0]
        # we are only interested when it becames true
        if new_state:
            msg = {
                "signal": "isCollisionSafe",
                "message": "Sample moved to safe area",
            }
            self.app.server.emit("sc", msg, namespace="/hwr")

    def _loaded_sample_changed(self, sample):
        if hasattr(sample, "get_address"):
            address = sample.get_address()
            barcode = sample.get_id()
        else:
            address = ""
            barcode = ""

        logging.getLogger("HWR").info("Loaded sample changed: %s", address)

        try:
            sample_id = address

            if HWR.beamline.sample_changer.has_loaded_sample():
                self.app.lims.set_current_sample(sample_id)
            else:
                sample = HWR.beamline.sample_changer.get_loaded_sample()
                address = sample.get_address() if sample else None
                self.app.lims.set_current_sample(address)

            self.app.server.emit(
                "loaded_sample_changed",
                {"address": address, "barcode": barcode},
                namespace="/hwr",
            )

            self._sc_load_ready(address)
        except Exception:
            logging.getLogger("HWR").exception("Error setting loaded sample")

    def _sc_load_ready(self, location):
        msg = {
            "signal": "loadReady",
            "location": location,
            "message": "Sample changer, loaded sample",
        }

        self.app.server.emit("sc", msg, namespace="/hwr")

    def _sc_unload(self, location):
        msg = {
            "signal": "operatingSampleChanger",
            "location": location,
            "message": "Please wait, unloading sample",
        }

        self.app.server.emit("sc", msg, namespace="/hwr")

    def _sc_contents_update(self):
        self.app.server.emit("sc_contents_update", {}, namespace="/hwr")

    def _sc_maintenance_update(self, *args):
        if len(args) == 3:
            # Restore the `global_state` parameter removed in this commit 337efd37
            global_state, cmd_state, message = args
        else:
            # Be backward compatible with HW objects which are emitting signal with
            # 2 arguments
            global_state = {}
            cmd_state, message = args

        try:
            self.app.server.emit(
                "sc_maintenance_update",
                {
                    "global_state": global_state,
                    "commands_state": json.dumps(cmd_state),
                    "message": message,
                },
                namespace="/hwr",
            )
        except Exception:
            logging.getLogger("HWR").exception("error sending message")

    def _gripper_changed(self):
        self.app.queue.queue_clear()
        self.app.server.emit(
            "queue", {"Signal": "update", "message": "all"}, namespace="/hwr"
        )

    def _mount_sample(self, sample: SampleInputModel):
        sc = HWR.beamline.sample_changer
        res = False

        try:
            msg = {
                "signal": "operatingSampleChanger",
                "location": sample.location,
                "message": "Please wait, loading sample",
            }

            self.app.server.emit("sc", msg, namespace="/hwr")

            sid = self.app.lims.get_current_sample().get("sampleID", False)
            current_queue = self.app.queue.queue_to_dict()

            if sample.location != "Manual":
                msg = f"Mounting sample: {sample.location} ({sample.sample_name})"
                logging.getLogger("user_level_log").info(msg)

                if (
                    not sc.get_loaded_sample()
                    or sc.get_loaded_sample().get_address() != sample.location
                ):
                    res = sc.load(sample.sample_id, wait=True)

                if (
                    res
                    and HWR.beamline.queue_manager.centring_method
                    == queue_entry.CENTRING_METHOD.LOOP
                    and not HWR.beamline.diffractometer.in_plate_mode()
                    and not self.app.harvester.mount_from_harvester()
                ):
                    HWR.beamline.diffractometer.reject_centring()
                    msg = "Starting autoloop centring ..."
                    logging.getLogger("MX3.HWR").info(msg)
                    HWR.beamline.diffractometer.start_centring_method(
                        HWR.beamline.diffractometer.C3D_MODE
                    )
                elif HWR.beamline.diffractometer.in_plate_mode():
                    msg = "Starting autoloop Focusing ..."
                    logging.getLogger("MX3.HWR").info(msg)
                    sc.move_to_crystal_position(None)

            else:
                msg = f"Mounting sample: {sample.sample_name}"
                logging.getLogger("user_level_log").info(msg)

                self.app.lims.set_current_sample(sample.sample_id)
                res = True

        except Exception as ex:
            logging.getLogger("MX3.HWR").exception("[SC] sample could not be mounted")
            raise RuntimeError(str(ex)) from ex
        else:
            # Clean up if the new sample was mounted or the current sample was
            # unmounted and the new one, for some reason, failed to mount
            if res or (not res and not sc.get_loaded_sample()):
                HWR.beamline.sample_view.clear_all()

                # We remove the current sample from the queue, if we are moving
                # from one sample to another and the current sample is in the queue

                if sid and current_queue.get(sid, False):
                    node_id = current_queue[sid]["queueID"]
                    self.app.queue.set_enabled_entry(node_id, False)  # noqa: FBT003
                    self.app.queue.queue_toggle_sample(
                        self.app.queue.get_entry(node_id)[1]
                    )
        finally:
            self._sc_load_ready(sample.location)

        return res

    def _unmount_sample(self, location):
        try:
            self._sc_unload(location)

            if location != "Manual":
                HWR.beamline.sample_changer.unload(location, wait=False)
            else:
                self.app.lims.set_current_sample(None)
                self._sc_load_ready(location)

            msg = f"[SC] unmounted {location}"
            logging.getLogger("MX3.HWR").info(msg)
        except Exception:
            msg = "[SC] sample could not be mounted"
            logging.getLogger("MX3.HWR").exception(msg)
            raise
        else:
            HWR.beamline.queue_model.mounted_sample = ""
            HWR.beamline.sample_view.clear_all()

    def get_value(self) -> dict:
        if HWR.beamline.sample_changer_maintenance is not None:
            global_state, cmdstate, msg = self.get_global_state()

            cmds = HWR.beamline.sample_changer_maintenance.get_cmd_info()

        else:
            global_state = {}
            cmdstate = "SC maintenance controller not defined"
            cmds = []
            msg = ""

        contents = self._ho.get_contents_as_dict()
        address, barcode = self.get_loaded_sample()

        loaded_sample = {"address": address, "barcode": barcode}

        try:
            state = HWR.beamline.sample_changer.get_status().upper()
        except Exception:
            logging.getLogger("MX3.HWR").exception("")
            state = "OFFLINE"

        return {
            "state": state,
            "loaded_sample": loaded_sample,
            "contents": contents,
            "global_state": {
                "global_state": global_state,
                "commands_state": cmdstate,
            },
            "cmds": {"cmds": cmds},
            "msg": msg,
            "plate_mode": HWR.beamline.diffractometer.in_plate_mode(),
        }

    def state(self):
        return "READY" if self._ho.is_ready() else "BUSY"

    def loaded_sample(self) -> dict:
        if self._ho.has_loaded_sample():
            address, barcode = self._ho.get_loaded_sample()
        else:
            address, barcode = "", ""

        return {"address": address, "barcode": barcode}

    def get_contents(self):
        return self._ho.get_contents_as_dict()

    def get_loaded_sample(self):
        try:
            sample = HWR.beamline.sample_changer.get_loaded_sample()
        except Exception:
            logging.getLogger("MX3.HWR").exception("")
            sample = None

        if sample is not None:
            address = sample.get_address()
            barcode = sample.get_id()
        else:
            address = ""
            barcode = ""

        return address, barcode

    def get_global_state(self):
        try:
            return HWR.beamline.sample_changer_maintenance.get_global_state()
        except Exception:
            logging.getLogger("MX3.HWR").exception("Could not get sc global state")
            return (
                {},
                "SC maintenance controller doesn't response",
                "Can't retrieve the global state",
            )

    def select_location(self, loc: str):
        self._ho.select(loc)
        return self._ho.get_contents_as_dict()

    def scan_location(self, loc: str):
        loc = None if loc == "" else loc
        self._ho.scan(loc, recursive=True)
        return self._ho.get_contents_as_dict()

    def mount_sample(self, sample: SampleInputModel, wait=True):  # noqa: FBT002
        if wait:
            self._mount_sample(sample)
        else:
            gevent.spawn(self._mount_sample, sample)

        return HWR.beamline.sample_changer.get_contents_as_dict()

    def unmount_current(self):
        sc_sample = HWR.beamline.sample_changer.get_loaded_sample()
        if sc_sample:
            location = sc_sample.get_address()
            self._unmount_sample(location)
        else:
            self._unmount_sample("Manual")

        return HWR.beamline.sample_changer.get_contents_as_dict()

    def send_command(self, command: SampleChangerCommandInputModel):
        try:
            return {
                "response": HWR.beamline.sample_changer_maintenance.send_command(
                    command.cmd, command.arguments
                )
            }
        except Exception as _ex:
            logger.exception("SC cannot execute command %s", command.cmd)
            msg = f"Cannot execute command {escape(command.cmd)}"
            raise RuntimeError(msg) from _ex

    def sync_with_crims(self):
        """Synchronize with Crims.

        To be used mostly when diffractometer is in plate mode.
        This returns a list of crystal dicts available in Crims
        that have been harvested.
        With this, the user can visualize more easily
        where the crystals are in the plate GUI.
        """
        xtal_list = []
        try:
            processing_plan = HWR.beamline.sample_changer.sync_with_crims()
            for x in processing_plan.plate.xtal_list:
                response = {
                    "crystal_uuid": x.crystal_uuid,
                    "row": x.row,
                    "column": x.column,
                    "shelf": x.shelf,
                    "offset_x": x.offset_x,
                    "offset_y": x.offset_y,
                    "image_url": x.image_url,
                    "image_date": x.image_date,
                    "sample": x.sample,
                }
                xtal_list.append(response)
        except Exception:
            logging.getLogger("MX3.HWR").exception("Could not get crystal List")

        return {"xtal_list": xtal_list}
