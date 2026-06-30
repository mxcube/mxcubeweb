from __future__ import annotations

import logging

import gevent
from mxcubecore import HardwareRepository as HWR
from mxcubecore.HardwareObjects.abstract.sample_changer import Crims
from mxcubecore.HardwareObjects.Harvester import HarvesterState
from mxcubecore.queue_entry.data_collection import DataCollectionQueueEntry

from mxcubeweb.core.components.component_base import ComponentBase


# TO CONSIDER:
# This should maybe be made into a adapter instead of a component
class Harvester(ComponentBase):
    def __init__(self, app, config):
        super().__init__(app, config)
        self.harvester_device = HWR.beamline.harvester

    def init_signals(self):
        """Initialize hwobj signals."""
        if HWR.beamline.harvester:
            HWR.beamline.harvester.connect("stateChanged", self.harvester_state_changed)

            HWR.beamline.harvester.connect(
                "harvester_contents_update", self.harvester_contents_update
            )

            HWR.beamline.queue_manager.connect(
                "queue_entry_execute_finished", self.queue_entry_execute_finished
            )

    def harvester_state_changed(self, *args):
        new_state = args[0]
        state_str = HarvesterState.STATE_DESC.get(new_state, "Unknown").upper()
        self.app.server.emit("harvester_state", state_str, namespace="/hwr")

    def harvester_contents_update(self):
        self.app.server.emit("harvester_contents_update")

    def queue_entry_execute_finished(self, entry, status):
        """Forward a finished data collection to CRIMS, since the sample
        came from the Harvester."""
        if not isinstance(entry, DataCollectionQueueEntry) or status != "Successful":
            return

        gevent.spawn(self._send_collection_to_crims, entry.get_data_model())

    def get_initial_state(self):
        if HWR.beamline.harvester_maintenance is not None:
            (
                global_state,
                cmdstate,
                msg,
            ) = HWR.beamline.harvester_maintenance.get_global_state()

            cmds = HWR.beamline.harvester_maintenance.get_cmd_info()
        else:
            global_state = {}
            cmdstate = "harvester maintenance controller not defined"
            cmds = []
            msg = ""

        contents = self.get_harvester_contents()

        try:
            state = HWR.beamline.harvester.get_status().upper()
        except Exception:
            state = "OFFLINE"

        return {
            "state": state,
            "contents": contents,
            "global_state": {"global_state": global_state, "commands_state": cmdstate},
            "cmds": {"cmds": cmds},
            "msg": msg,
            "plate_mode": HWR.beamline.diffractometer.in_plate_mode,
        }

    def mount_from_harvester(self):
        sc = HWR.beamline.sample_changer

        try:
            return sc.mount_from_harvester()
        except AttributeError:
            return False

    def get_harvester_contents(self):
        """Get the Harvester contents info.

        Returns:
            dict: Dict containing name, crystal_list, number of available pins, etc.
        """
        if HWR.beamline.harvester:
            root_name = HWR.beamline.harvester.__TYPE__
            crystal_list = self.get_crystal_list()
            room_temperature_mode = HWR.beamline.harvester.get_room_temperature_mode()
            number_of_pins = HWR.beamline.harvester.get_number_of_available_pin()
            calibration_state = HWR.beamline.harvester.calibration_state
            contents = {
                "name": root_name,
                "harvester_crystal_list": crystal_list,
                "number_of_pins": number_of_pins,
                "calibration_state": calibration_state,
                "room_temperature_mode": room_temperature_mode,
            }

            use_harvester = self.mount_from_harvester()
            if use_harvester:
                contents["use_harvester"] = True

        else:
            contents = {"name": "OFFLINE"}

        return contents

    def get_crystal_list(self):
        """Get the Harvester Sample List info.

        Returns:
            list: List of dicts containing state, name, etc.
                of the current processing plan.
        """
        crystal_list = []

        try:
            crystal_uuids = self.harvester_device.get_crystal_uuids()
            crystal_names = self.harvester_device.get_sample_names()
            crystal_acronyms = self.harvester_device.get_sample_acronyms()
            sample_states = self.harvester_device.get_samples_state()
            for index, x_tal in enumerate(crystal_uuids):
                img_url = HWR.beamline.harvester.get_crystal_images_urls(x_tal)
                img_target_x = HWR.beamline.harvester.get_image_target_x(x_tal)
                img_target_y = HWR.beamline.harvester.get_image_target_y(x_tal)

                if len(crystal_acronyms) > 0 and len(crystal_acronyms) == len(
                    crystal_uuids
                ):
                    proteinAcronym = crystal_acronyms[index]
                else:
                    proteinAcronym = (
                        crystal_acronyms[0] if len(crystal_acronyms) > 0 else ""
                    )
                lst = {
                    "crystal_uuid": x_tal,
                    "name": crystal_names[index],
                    "state": sample_states[index],
                    "acronym": proteinAcronym,
                    "img_url": img_url,
                    "img_target_x": img_target_x,
                    "img_target_y": img_target_y,
                }
                crystal_list.append(lst)
        except Exception:
            logging.getLogger("user_level_log").error("Could not get Crystal List")
            logging.getLogger("HWR").exception("")

        return crystal_list

    def get_global_state(self):
        try:
            return HWR.beamline.harvester_maintenance.get_global_state()
        except Exception:
            logging.getLogger("user_level_log").error("Could not get global state")
            logging.getLogger("HWR").exception("")
            return "OFFLINE", "OFFLINE", "OFFLINE"

    def _send_collection_to_crims(self, data_model) -> None:
        """Send a single data collection's info to CRIMS.

        Args:
            data_model: The `DataCollection` queue model object to report.
        """
        try:
            crims_url = self.harvester_device.crims_upload_url
            crims_key = self.harvester_device.crims_upload_key

            crystal_uuid = data_model.get_sample_node().crystals[0].crystal_uuid
            sample_name = data_model.get_sample_node().name
            instrument_name = HWR.beamline.session.beamline_name
            facility_name = HWR.beamline.session.synchrotron_name
            investigation_id = HWR.beamline.session.session_id

            sent = Crims.send_data_collection_info_to_crims(
                crims_url,
                crystal_uuid,
                sample_name,
                instrument_name,
                facility_name,
                investigation_id,
                crims_key,
            )
            if not sent:
                logging.getLogger("user_level_log").warning(
                    "Data collection was not sent to CRIMS: crystal=%s sample=%s",
                    crystal_uuid,
                    sample_name,
                )
        except Exception:
            logging.getLogger("user_level_log").error(
                "Could not send data collection to CRIMS"
            )
            logging.getLogger("HWR").exception("")

    def get_sample_by_id(self, sampleID: str):
        samples_list = HWR.beamline.sample_changer.get_sample_list()
        for sample in samples_list:
            if sample.get_address() == sampleID or sample.get_id() == sampleID:
                return sample

        return None
