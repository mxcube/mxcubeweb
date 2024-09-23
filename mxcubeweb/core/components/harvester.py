# -*- coding: utf-8 -*-
from __future__ import annotations
import logging

from mxcubecore import HardwareRepository as HWR

from mxcubeweb.core.components.component_base import ComponentBase
from mxcubeweb.core.components.queue import COLLECTED, UNCOLLECTED

from mxcubecore.HardwareObjects.abstract.sample_changer import Crims


# TO CONSIDER:
# This should maybe be made into a adapter instead of a component
class Harvester(ComponentBase):
    def __init__(self, app, config):
        super().__init__(app, config)
        self.harvester_device = HWR.beamline.harvester

    def init_signals(self):
        from mxcubeweb.routes import signals

        """Initialize hwobj signals."""
        if HWR.beamline.harvester:
            HWR.beamline.harvester.connect(
                "stateChanged", signals.harvester_state_changed
            )

            HWR.beamline.harvester.connect(
                "harvester_contents_update", signals.harvester_contents_update
            )

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

        initial_state = {
            "state": state,
            "contents": contents,
            "global_state": {"global_state": global_state, "commands_state": cmdstate},
            "cmds": {"cmds": cmds},
            "msg": msg,
            "plate_mode": HWR.beamline.diffractometer.in_plate_mode(),
        }

        return initial_state

    def mount_from_harvester(self):
        sc = HWR.beamline.sample_changer

        try:
            return sc.mount_from_harvester()
        except AttributeError:
            return False

    def get_harvester_contents(self):
        """Get the Harvester contents info

        Return (Dict): Dict content, object name etc..
        crystal_list and number of available pins"
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
        """Get the Harvester Sample List info

        Return (List):  list of dict content
        state , name etc.. of the current processing plan"
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
            logging.getLogger("user_level_log").exception("Could not get Crystal List")

        return crystal_list

    def get_global_state(self):
        try:
            return HWR.beamline.harvester_maintenance.get_global_state()
        except Exception:
            logging.getLogger("user_level_log").exception("Could not get global state")
            return "OFFLINE", "OFFLINE", "OFFLINE"

    def send_data_collection_info_to_crims(self) -> bool:
        """Send Data collected to CRIMS

        Return (bool): Whether the request failed (false) or not (true)
        """
        dataCollectionGroupId = ""
        crystal_uuid = ""

        try:
            rest_token = HWR.beamline.lims.lims_rest.get_rest_token()
            proposal = HWR.beamline.session.get_proposal()

            crims_url = self.harvester_device.crims_upload_url
            crims_key = self.harvester_device.crims_upload_key

            queue_entries = HWR.beamline.queue_model.get_all_dc_queue_entries()
            dc_id = ""
            for qe in queue_entries:
                dataCollectionGroupId = qe.get_data_model().lims_group_id
                crystal_uuid = (
                    qe.get_data_model().get_sample_node().crystals[0].crystal_uuid
                )
                dc_id = qe.get_data_model().id

                Crims.send_data_collection_info_to_crims(
                    crims_url,
                    crystal_uuid,
                    dataCollectionGroupId,
                    dc_id,
                    proposal,
                    rest_token,
                    crims_key,
                )
            return True
        except Exception:
            msg = "Could not send data collection to crims"
            logging.getLogger("user_level_log").exception(msg)
            return False

    def get_sample_info(self, sampleID: str) -> dict[str]:
        samples_list = HWR.beamline.sample_changer.get_sample_list()
        sample_data = {}
        for s in samples_list:
            if s.get_address() == sampleID or s.get_id() == sampleID:
                sample_data = {
                    "location": s.get_address(),
                    "sampleID": s.get_address(),
                    "crystalUUID": s.get_id(),
                    "sampleName": s.get_name(),
                }
                return sample_data

        return sample_data

    def queue_harvest_sample(self, data_model) -> None:
        """
        While queue execution send harvest request
        """
        current_queue = self.app.queue.queue_to_dict()

        sample_info = self.get_sample_info(data_model.loc_str)
        sample_uuid = sample_info["crystalUUID"]

        self.harvester_device.queue_harvest_sample(
            data_model, sample_uuid, current_queue
        )

    def queue_harvest_next_sample(self, data_model) -> None:
        """
        While queue execution send harvest request
        on next sample of the queue list
        """

        current_queue = self.app.queue.queue_to_dict()

        sample_info = self.get_sample_info(data_model.loc_str)
        sample_uuid = sample_info["crystalUUID"]

        self.harvester_device.queue_harvest_next_sample(
            data_model, sample_uuid, current_queue
        )
