# -*- coding: utf-8 -*-
import logging
import gevent
from typing import Optional

from mxcubecore import queue_entry
from mxcubecore import HardwareRepository as HWR

from mxcubeweb.core.components.component_base import ComponentBase
from mxcubeweb.core.components.queue import COLLECTED, UNCOLLECTED

from mxcubecore.HardwareObjects.abstract.sample_changer import Crims


# TO CONSIDER:
# This should maybe be made into a adapter instead of a component
class Harvester(ComponentBase):
    def __init__(self, app, config):
        super().__init__(app, config)

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
            contents = {
                "name": root_name,
                "harvester_crystal_list": crystal_list,
                "number_of_pins": number_of_pins,
                "calibration_state": self.get_calibration_state(),
                "room_temperature_mode": room_temperature_mode,
            }
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
            harvester_device = HWR.beamline.harvester
            crystal_uuids = harvester_device.get_crystal_uuids()
            crystal_names = harvester_device.get_sample_names()
            crystal_acronymes = harvester_device.get_sample_acronyms()
            sample_states = harvester_device.get_samples_state()
            for index, x_tal in enumerate(crystal_uuids):
                img_url = HWR.beamline.harvester.get_crystal_images_urls(x_tal)
                img_target_x = HWR.beamline.harvester.get_image_target_x(x_tal)
                img_target_y = HWR.beamline.harvester.get_image_target_y(x_tal)

                if len(crystal_acronymes) > 0 and len(crystal_acronymes) == len(
                    crystal_uuids
                ):
                    proteinAcronym = crystal_acronymes[index]
                else:
                    proteinAcronym = (
                        crystal_acronymes[0] if len(crystal_acronymes) > 0 else ""
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
            logging.getLogger("user_level_log").info("Could not get Crystal List")
            # TEMP return a fake list for test
            crystal_list = [
                {
                    "crystal_uuid": "c9ca5e0d-35fd-4ff9-9ad2-4de9fd47fd83",
                    "name": "TEST1",
                    "state": "ready_to_execute",
                    "acronym": "cryoprotectant",
                    "img_url": "https://htxlab.embl.org//rawimages/2021//CD032401/6/FORMULATRIX_CD032401_6_08-09-2021_05_02_01_00_99_Vis.jpg",
                    "img_target_x": 26.868617890692,
                    "img_target_y": 50.122652377553,
                },
                {
                    "crystal_uuid": "94730c39-bf66-416f-ab97-f755e45f6a3a",
                    "name": "TEST12",
                    "state": "needs_repositionning",
                    "acronym": "cryoprotectant",
                    "img_url": "https://htxlab.embl.org//rawimages/2021//CD032401/6/FORMULATRIX_CD032401_6_08-09-2021_06_04_01_00_99_Vis.jpg",
                    "img_target_x": 54.466230936819,
                    "img_target_y": 58.026175213675,
                },
                {
                    "crystal_uuid": "5d5dfc88-009d-4486-8526-33bf58c4d5d9",
                    "name": "TEST13",
                    "state": "failed",
                    "acronym": "cryoprotectant",
                    "img_url": "https://htxlab.embl.org//rawimages/2021//CD032401/6/FORMULATRIX_CD032401_6_08-09-2021_06_02_01_00_99_Vis.jpg",
                    "img_target_x": 32.710943173566,
                    "img_target_y": 51.110576923077,
                },
                {
                    "crystal_uuid": "46aca4a4-0c00-4685-b1e1-53071bdcb66d",
                    "name": "TEST4",
                    "state": "harvested",
                    "acronym": "cryoprotectant",
                    "img_url": "https://htxlab.embl.org//rawimages/2021//CD032401/6/FORMULATRIX_CD032401_6_08-09-2021_06_04_01_00_99_Vis.jpg",
                    "img_target_x": 38.632400075415,
                    "img_target_y": 41.762286324786,
                },
            ]

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
        harvester_device = HWR.beamline.harvester

        try:
            rest_token = HWR.beamline.lims.lims_rest.get_rest_token()
            proposal = HWR.beamline.session.get_proposal()

            crims_url = harvester_device.crims_upload_url
            crims_key = harvester_device.crims_upload_key

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

    def get_calibration_state(self) -> bool:
        return HWR.beamline.harvester.calibrate_state

    def calibrate_pin(self) -> bool:
        """
            Pin Calibration Procedure
            In other for the Centring procedure to work on a Harvested Pin
            a Calibration Procedure need to be execute

        Return (bool): whether the calibration procedure goes to end (True)
        or had and exception (False)
        """
        harvester_device = HWR.beamline.harvester

        harvester_device.load_calibrated_pin()
        harvester_device._wait_sample_transfer_ready(None)
        print("waiting 40 seconds before mount")
        # For some reason the Harvester return READY too soon
        # approximately 40 Second sooner
        gevent.sleep(40)
        sample_mount_device = HWR.beamline.sample_changer
        mount_current_sample = sample_mount_device.load_a_pin_for_calibration()

        if mount_current_sample:
            try:
                md = HWR.beamline.diffractometer
                md._wait_ready()

                sample_drift_x = float(
                    harvester_device.get_last_sample_drift_offset_x()
                )
                sample_drift_y = float(
                    harvester_device.get_last_sample_drift_offset_y()
                )
                sample_drift_z = float(
                    -harvester_device.get_last_sample_drift_offset_z()
                )

                motor_pos_dict = {
                    "kappa": float(
                        md["HacentringReferencePosition"].get_property("kappa_ref")
                    ),
                    "kappa_phi": float(
                        md["HacentringReferencePosition"].get_property("phi_ref")
                    ),
                    "phi": float(
                        md["HacentringReferencePosition"].get_property("omega_ref")
                    ),
                    "phiy": md.phiyMotor.get_value() + sample_drift_x,
                }

                md.move_motors(motor_pos_dict)
                md._wait_ready()
                md.centringFocus.set_value_relative(sample_drift_z, None)
                md.centringVertical.set_value_relative(sample_drift_y, None)

                md.save_current_motor_position()
                harvester_device.set_calibrate_state(True)

                logging.getLogger("user_level_log").info(
                    "Pin Calibration Step 1 Succeed"
                )
                logging.getLogger("user_level_log").info(
                    "User Need to Perform an  3 click centring"
                )
                return True
            except Exception:
                logging.getLogger("user_level_log").exception("Pin Calibration Failed")
                return False
        else:
            logging.getLogger("user_level_log").error("Pin Calibration Failed")
            logging.getLogger("user_level_log").error(
                "Sample Changer could not mount Pin"
            )
            return False

    def cancel_calibration(self) -> None:
        harvester_device = HWR.beamline.harvester
        harvester_device.set_calibrate_state(False)
        logging.getLogger("user_level_log").warning("Pin Calibration Canceled")

    def validate_calibration(self) -> bool:
        """
        finish Calibration Procedure step 2
        after user ran a 3 click centring
        Return (bool): whether the step 2 of calibration procedure
        goes to end (True)
        or had and exception (False)
        """
        try:
            harvester_device = HWR.beamline.harvester
            md = HWR.beamline.diffractometer

            motor_pos_dict = {
                "focus": md.focusMotor.get_value(),
                "phiy": md.phiyMotor.get_value(),
                "phiz": md.phizMotor.get_value(),
                "centring_focus": md.centringFocus.get_value(),
                "centring_vertical": md.centringVertical.get_value(),
            }

            saved_position = md.saved_motor_position
            # find offset position based on old and new motor position
            new_motor_offset = {
                "focus": motor_pos_dict["focus"] - saved_position["focus"],
                "phiy": motor_pos_dict["phiy"] - saved_position["phiy"],
                "phiz": motor_pos_dict["phiz"] - saved_position["phiz"],
                "centring_focus": (
                    motor_pos_dict["centring_focus"] - saved_position["centring_focus"]
                ),
                "centring_vertical": (
                    motor_pos_dict["centring_vertical"]
                    - saved_position["centring_vertical"]
                ),
            }

            calibrated_motor_offset = {
                "focus": new_motor_offset["focus"] + new_motor_offset["centring_focus"],
                "phiy": new_motor_offset["phiy"],
                "phiz": (
                    new_motor_offset["phiz"] + new_motor_offset["centring_vertical"]
                ),
            }

            # we store the motor offset in the Harvester, to be used for sample centering
            harvester_device.store_calibrated_pin(
                calibrated_motor_offset["focus"],
                calibrated_motor_offset["phiy"],
                calibrated_motor_offset["phiz"],
            )

            harvester_device.set_calibrate_state(False)
        except Exception:
            logging.getLogger("user_level_log").exception(
                "Pin Calibration / validation Failed"
            )
            return False

        return True

    def get_sample_info(self, location: str) -> dict[str]:
        samples_list = HWR.beamline.sample_changer.get_sample_list()
        sample_data = {}
        for s in samples_list:
            if s.get_address() == location or s.get_id() == location:
                sample_data = {
                    "location": s.get_address(),
                    "sampleID": s.get_address(),
                    "crystalUUID": s.get_id(),
                    "sampleName": s.get_name(),
                }
                return sample_data

        return sample_data

    def harvest_and_mount_sample(self, xtal_uuid: str) -> dict[str, bool, int]:
        try:
            harvester_device = HWR.beamline.harvester
            self.harvest_crystal(xtal_uuid)
            harvester_device._wait_sample_transfer_ready(None)

            sample = self.get_sample_info(xtal_uuid)
            self.app.sample_changer.mount_sample(sample)
        except Exception:
            logging.getLogger("user_level_log").exception("Could not Harvest Crystal")
            return "Could not Harvest Crystal"

        self.init_signals()
        return self.get_harvester_contents()

    def harvest_sample_before_mount(
        self, sample_uuid: str, wait_before_load: bool = False
    ) -> bool:
        """
        Return (bool): whether the sample has been harvest then mount -> (True)
        or had and exception -> (False)
        """
        harvester_device = HWR.beamline.harvester

        if harvester_device:
            return harvester_device.harvest_sample_before_mount(
                sample_uuid, wait_before_load
            )
        else:
            msg = harvester_device.get_status()
            logging.getLogger("user_level_log").error(
                "ERROR: No Harvester Device Found"
            )
            logging.getLogger("user_level_log").error(msg)
            # Try an abort and move to next sample
            return False

    def current_queue_index(self, current_sample: str) -> Optional[int]:
        current_queue_dict = self.app.queue.queue_to_dict()
        current_queue_list = list(current_queue_dict)
        res = None
        try:
            res = current_queue_list.index(current_sample)
        except (ValueError, IndexError):
            res = None

        return res

    def get_next_sample(self, current_sample: str) -> Optional[str]:
        current_queue_dict = self.app.queue.queue_to_dict()
        current_queue_list = list(current_queue_dict)
        res = None
        try:
            res = current_queue_list[current_queue_list.index(current_sample) + 1]
        except (ValueError, IndexError):
            res = None

        return res

    def queue_harvest_sample(self, data_model, sample: str) -> None:
        """
        While queue execution send harvest request
        """
        current_queue = self.app.queue.queue_to_dict()
        harvester_device = HWR.beamline.harvester
        wait_before_load = (
            False if harvester_device.get_room_temperature_mode() else True
        )
        if harvester_device.get_number_of_available_pin() > 0:
            gevent.sleep(2)
            sample_uuid = current_queue[sample["sampleID"]]["code"]
            if self.current_queue_index(data_model.loc_str) == 1:
                logging.getLogger("user_level_log").info("Harvesting First Sample")
                if sample_uuid in ["undefined", "", None]:
                    sample_info = self.get_sample_info(sample["location"])
                    sample_uuid = sample_info["crystalUUID"]
                harvest_res = self.harvest_sample_before_mount(
                    sample_uuid, wait_before_load
                )
                if harvest_res is False:
                    # if sample could not be Harvest, but no exception is raised, let's skip the sample
                    logging.getLogger("user_level_log").error(
                        "There is no more Pins in the Harvester, Stopping queue"
                    )
                    raise queue_entry.QueueSkippEntryException(
                        "Harvester could not Harvest sample", ""
                    )
            else:
                logging.getLogger("user_level_log").info("checking last Harvesting")
                harvest_res = self.harvest_sample_before_mount(
                    sample_uuid, wait_before_load
                )
                if harvest_res is False:
                    # if sample could not be Harvest, but no exception is raised, let's skip the sample
                    logging.getLogger("user_level_log").error(
                        "There is no more Pins in the Harvester, Stopping queue"
                    )
                    raise queue_entry.QueueSkippEntryException(
                        "Harvester could not Harvest sample", ""
                    )
        elif (
            harvester_device.get_number_of_available_pin() == 0
            and harvester_device._ready_to_transfer()
        ):
            logging.getLogger("user_level_log").warning(
                "Warning: Harvester pins is approaching to ZERO"
            )
            logging.getLogger("user_level_log").warning(
                "Warning: Mounting last Sample, Queue will stop on next one"
            )
        else:
            # raise Not enough pins available in the pin provider
            logging.getLogger("user_level_log").error(
                "There is no more Pins in the Harvester, Stopping queue"
            )
            raise queue_entry.QueueSkippEntryException(
                "There is no more Pins in the Harvester, Stopping queue", ""
            )

    def queue_harvest_next_sample(self, data_model, sample: str):
        next_sample = self.get_next_sample(data_model.loc_str)
        harvester_device = HWR.beamline.harvester
        current_queue = self.app.queue.queue_to_dict()
        if (
            next_sample is not None
            and harvester_device.get_number_of_available_pin() > 0
        ):
            logging.getLogger("user_level_log").info("Harvesting Next Sample")
            sample_uuid = current_queue[next_sample]["code"]
            if sample_uuid in ["undefined", "", None]:
                sample_info = self.get_sample_info(sample["location"])
                sample_uuid = sample_info["crystalUUID"]
            harvester_device._wait_ready(None)
            self.harvest_sample_before_mount(sample_uuid, False)
        else:
            logging.getLogger("user_level_log").warning(
                "Warning: Could not harvest next sample"
            )

    def harvest_crystal(self, xtal_uuid: str) -> str:
        try:
            HWR.beamline.harvester.harvest_crystal(xtal_uuid)
            return "Crystal Harvested properly"
        except Exception:
            logging.getLogger("user_level_log").warning(
                "Warning: Could not harvest next sample"
            )
            return "Could not Harvest Crystal"
