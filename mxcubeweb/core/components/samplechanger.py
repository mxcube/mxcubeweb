# -*- coding: utf-8 -*-
import logging
import time
import gevent

from mxcubecore import queue_entry
from mxcubecore import HardwareRepository as HWR

from mxcubeweb.core.components.component_base import ComponentBase
from mxcubeweb.core.components.queue import COLLECTED, UNCOLLECTED


# TO CONSIDER:
# This should maybe be made into an adapter instead of a component
class SampleChanger(ComponentBase):
    def __init__(self, app, config):
        super().__init__(app, config)
        patch_queue_entry_mount_sample()

    def init_signals(self):
        from mxcubeweb.routes import signals

        """Initialize hwobj signals."""
        HWR.beamline.sample_changer.connect("stateChanged", signals.sc_state_changed)
        HWR.beamline.sample_changer.connect(
            "isCollisionSafe", signals.is_collision_safe
        )
        HWR.beamline.sample_changer.connect(
            "loadedSampleChanged", signals.loaded_sample_changed
        )
        HWR.beamline.sample_changer.connect(
            "contentsUpdated", signals.sc_contents_update
        )

        if HWR.beamline.sample_changer_maintenance is not None:
            HWR.beamline.sample_changer_maintenance.connect(
                "globalStateChanged", signals.sc_maintenance_update
            )

            HWR.beamline.sample_changer_maintenance.connect(
                "gripperChanged", self._gripper_changed
            )

    def get_sample_list(self):
        samples_list = HWR.beamline.sample_changer.get_sample_list()
        samples = {}
        samplesByCoords = {}
        order = []
        current_sample = {}

        loaded_sample = HWR.beamline.sample_changer.get_loaded_sample()

        for s in samples_list:
            if not s.is_present():
                continue
            if s.has_been_loaded():
                state = COLLECTED
            else:
                state = UNCOLLECTED
            sample_dm = s.get_id() or ""
            coords = s.get_coords()
            sample_data = {
                "sampleID": s.get_address(),
                "location": s.get_address(),
                "sampleName": s.get_name() or "Sample-%s" % s.get_address(),
                "crystalUUID": s.get_id() or s.get_address(),
                "proteinAcronym": (
                    s.proteinAcronym if hasattr(s, "proteinAcronym") else ""
                ),
                "code": sample_dm,
                "loadable": True,
                "state": state,
                "tasks": [],
                "type": "Sample",
                "cell_no": s.get_cell_no() if hasattr(s, "get_cell_no") else 1,
                "puck_no": s.get_basket_no() if hasattr(s, "get_basket_no") else 1,
            }
            order.append(coords)
            samplesByCoords[coords] = sample_data["sampleID"]

            sample_data["defaultPrefix"] = self.app.lims.get_default_prefix(sample_data)
            sample_data["defaultSubDir"] = self.app.lims.get_default_subdir(sample_data)

            samples[s.get_address()] = sample_data
            self.sc_contents_add(sample_data)

            if loaded_sample and sample_data["location"] == loaded_sample.get_address():
                current_sample = sample_data
                self.app.queue.queue_add_item([current_sample])

        # sort by location, using coords tuple
        order.sort()
        sample_list = {
            "sampleList": samples,
            "sampleOrder": [samplesByCoords[coords] for coords in order],
        }

        self.app.lims.sample_list_set(sample_list)

        if current_sample:
            self.set_current_sample(current_sample["sampleID"])

    def get_sc_contents(self):  # noqa: C901
        def _getElementStatus(e):
            if e.is_leaf():
                if e.is_loaded():
                    return "Loaded"
                if e.has_been_loaded():
                    return "Used"
            if e.is_present():
                return "Present"
            return ""

        def _getElementID(e):
            if e == HWR.beamline.sample_changer:
                if e.get_token() is not None:
                    return e.get_token()
            else:
                if e.get_id() is not None:
                    return e.get_id()
            return ""

        def _addElement(parent, element):
            new_element = {
                "name": element.get_address(),
                "status": _getElementStatus(element),
                "id": _getElementID(element),
                "selected": element.is_selected(),
            }

            parent.setdefault("children", []).append(new_element)

            if not element.is_leaf():
                for e in element.get_components():
                    _addElement(new_element, e)

        if HWR.beamline.sample_changer:
            root_name = HWR.beamline.sample_changer.get_address()

            contents = {"name": root_name}

            if hasattr(HWR.beamline.sample_changer, "get_room_temperature_mode"):
                contents[
                    "room_temperature_mode"
                ] = HWR.beamline.sample_changer.get_room_temperature_mode()

            for element in HWR.beamline.sample_changer.get_components():
                if element.is_present():
                    _addElement(contents, element)
        else:
            contents = {"name": "OFFLINE"}

        return contents

    def sc_contents_init(self):
        self.app.SC_CONTENTS = {"FROM_CODE": {}, "FROM_LOCATION": {}}

    def sc_contents_add(self, sample):
        code, location = sample.get("code", None), sample.get("sampleID")

        if code:
            self.app.SC_CONTENTS.get("FROM_CODE")[code] = sample
        if location:
            self.app.SC_CONTENTS.get("FROM_LOCATION")[location] = sample

    def sc_contents_from_code_get(self, code):
        return self.app.SC_CONTENTS["FROM_CODE"].get(code, {})

    def sc_contents_from_location_get(self, loc):
        return self.app.SC_CONTENTS["FROM_LOCATION"].get(loc, {})

    def set_current_sample(self, sample_id):
        self.app.CURRENTLY_MOUNTED_SAMPLE = sample_id
        msg = "[SC] Setting currenly mounted sample to %s" % sample_id
        logging.getLogger("MX3.HWR").info(msg)

        from mxcubeweb.routes.signals import set_current_sample

        set_current_sample(sample_id)

    def get_current_sample(self):
        sample_id = self.app.CURRENTLY_MOUNTED_SAMPLE
        sample = self.app.SAMPLE_LIST["sampleList"].get(sample_id, {})
        msg = "[SC] Getting currently mounted sample %s" % sample

        logging.getLogger("MX3.HWR").info(msg)

        return sample

    def mount_sample_clean_up(self, sample):
        from mxcubeweb.routes import signals

        sc = HWR.beamline.sample_changer

        mount_from_harvester = self.app.harvester.mount_from_harvester()

        res = None

        try:
            signals.sc_load(sample["location"])

            sid = self.get_current_sample().get("sampleID", False)
            current_queue = self.app.queue.queue_to_dict()

            # self.set_sample_to_be_mounted(sample["sampleID"])

            if sample["location"] != "Manual":
                msg = "Mounting sample: %s (%s)" % (
                    sample["location"],
                    sample.get("sampleName", ""),
                )
                logging.getLogger("user_level_log").info(msg)

                if not sc.get_loaded_sample():
                    res = sc.load(sample["sampleID"], wait=True)
                elif sc.get_loaded_sample().get_address() != sample["location"]:
                    res = sc.load(sample["sampleID"], wait=True)

                if res is None:
                    res = True
                if (
                    res
                    and self.app.CENTRING_METHOD == queue_entry.CENTRING_METHOD.LOOP
                    and not HWR.beamline.diffractometer.in_plate_mode()
                    and not mount_from_harvester
                ):
                    HWR.beamline.diffractometer.reject_centring()
                    msg = "Starting autoloop centring ..."
                    logging.getLogger("MX3.HWR").info(msg)
                    C3D_MODE = HWR.beamline.diffractometer.C3D_MODE
                    HWR.beamline.diffractometer.start_centring_method(C3D_MODE)
                elif HWR.beamline.diffractometer.in_plate_mode():
                    msg = "Starting autoloop Focusing ..."
                    logging.getLogger("MX3.HWR").info(msg)
                    sc.move_to_crystal_position(None)

            else:
                msg = "Mounting sample: %s" % sample["sampleName"]
                logging.getLogger("user_level_log").info(msg)

                self.set_current_sample(sample["sampleID"])
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
                    self.app.queue.set_enabled_entry(node_id, False)
                    signals.queue_toggle_sample(self.app.queue.get_entry(node_id)[1])
        finally:
            signals.sc_load_ready(sample["location"])

        return res

    def unmount_sample_clean_up(self, sample):
        from mxcubeweb.routes import signals

        try:
            signals.sc_unload(sample["location"])

            if not sample["location"] == "Manual":
                HWR.beamline.sample_changer.unload(sample["location"], wait=False)
            else:
                self.set_current_sample(None)
                signals.sc_load_ready(sample["location"])

            msg = "[SC] unmounted %s" % sample["location"]
            logging.getLogger("MX3.HWR").info(msg)
        except Exception:
            msg = "[SC] sample could not be mounted"
            logging.getLogger("MX3.HWR").exception(msg)
            raise
        else:
            HWR.beamline.queue_model.mounted_sample = ""
            HWR.beamline.sample_view.clear_all()

    def mount_sample(self, sample):
        gevent.spawn(self.mount_sample_clean_up, sample)
        return self.get_sc_contents()

    def unmount_sample(self, sample):
        self.unmount_sample_clean_up(sample)
        return self.get_sc_contents()

    def unmount_current(self):
        location = HWR.beamline.sample_changer.get_loaded_sample().get_address()
        self.unmount_sample_clean_up({"location": location})

        return self.get_sc_contents()

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

    def get_capacity(self):
        baskets = HWR.beamline.sample_changer.get_basket_list()
        num_samples = 0
        for basket in baskets:
            num_samples += basket.get_number_of_samples()
        res = {
            "num_baskets": len(baskets),
            "num_samples": num_samples,
        }
        return res

    def get_maintenance_cmds(self):
        if HWR.beamline.sample_changer_maintenance is not None:
            ret = HWR.beamline.sample_changer_maintenance.get_cmd_info()
        else:
            ret = "SC maintenance controller not defined"

        return ret

    def get_global_state(self):
        try:
            return HWR.beamline.sample_changer_maintenance.get_global_state()
        except Exception:
            return "OFFLINE", "OFFLINE", "OFFLINE"

    def get_initial_state(self):
        if HWR.beamline.sample_changer_maintenance is not None:
            global_state, cmdstate, msg = self.get_global_state()

            cmds = HWR.beamline.sample_changer_maintenance.get_cmd_info()

        else:
            global_state = {}
            cmdstate = "SC maintenance controller not defined"
            cmds = []
            msg = ""

        contents = self.get_sc_contents()
        address, barcode = self.get_loaded_sample()

        loaded_sample = {"address": address, "barcode": barcode}

        try:
            state = HWR.beamline.sample_changer.get_status().upper()
        except Exception:
            state = "OFFLINE"

        initial_state = {
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

        return initial_state

    def sync_with_crims(self):
        """
        To be use mostly when Diffractometer is in plate mode
        This retun a List of crystal dict available in Crims that have been Harvested
        With this user can visualize easier where the crystal are in Plate GUI
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
            res = {"xtal_list": xtal_list}
            return res
        except Exception:
            logging.getLogger("MX3.HWR").exception("Could not get crystal List")
            return {"xtal_list": xtal_list}

    def _gripper_changed(self):
        self.app.queue.queue_clear()
        self.app.server.emit(
            "queue", {"Signal": "update", "message": "all"}, namespace="/hwr"
        )


# Disabling C901 function is too complex (19)
def queue_mount_sample(view, data_model, centring_done_cb, async_result):  # noqa: C901
    from mxcubeweb.routes import signals
    from mxcubeweb.app import MXCUBEApplication as mxcube

    HWR.beamline.sample_view.clear_all()
    logging.getLogger("user_level_log").info("Loading sample ...")
    log = logging.getLogger("user_level_log")

    loc = data_model.location
    data_model.holder_length

    robot_action_dict = {
        "actionType": "LOAD",
        "containerLocation": loc[1],
        "dewarLocation": loc[0],
        "sampleBarcode": data_model.code,
        "sampleId": data_model.lims_id,
        "sessionId": HWR.beamline.session.session_id,
        "startTime": time.strftime("%Y-%m-%d %H:%M:%S"),
    }

    # devices that can move sample on beam
    # (sample changer, plate holder)
    sample_mount_device = HWR.beamline.sample_changer

    mount_from_harvester = mxcube.harvester.mount_from_harvester()

    if (
        sample_mount_device.get_loaded_sample()
        and sample_mount_device.get_loaded_sample().get_address() == data_model.loc_str
    ):
        return

    if hasattr(sample_mount_device, "__TYPE__"):
        if sample_mount_device.__TYPE__ in ["Marvin", "CATS"]:
            element = "%d:%02d" % loc
            sample = {"location": element, "sampleID": element}
            mxcube.sample_changer.mount_sample_clean_up(sample)
        else:
            sample = {
                "location": data_model.loc_str,
                "sampleID": data_model.loc_str,
            }

            # in this case the sample changer takes the sample from an Harvester
            # We Harvest the sample and make it ready to load
            if mount_from_harvester:
                mxcube.harvester.queue_harvest_sample(data_model)

            try:
                res = mxcube.sample_changer.mount_sample_clean_up(sample)
            except RuntimeError:
                res = False
            logging.getLogger("user_level_log").info(
                "Sample loading res: %s" % str(res)
            )

            # We need to investigate if the comment below is still valid
            if not res == False:  # noqa: E712
                # WARNING: explicit test of False return value.
                # This is to preserve backward compatibility (load_sample was
                # supposed to return None); if sample could not be loaded, but
                # no exception is raised, let's skip the sample

                raise queue_entry.QueueSkipEntryException(
                    "Sample changer could not load sample", ""
                )

    # Harvest Next sample while loading current
    if mount_from_harvester and not HWR.beamline.harvester.get_room_temperature_mode():
        mxcube.harvester.queue_harvest_next_sample(data_model)

    robot_action_dict["endTime"] = time.strftime("%Y-%m-%d %H:%M:%S")
    if sample_mount_device.has_loaded_sample():
        robot_action_dict["status"] = "SUCCESS"
    else:
        robot_action_dict["message"] = "Sample was not loaded"
        robot_action_dict["status"] = "ERROR"

    HWR.beamline.lims.store_robot_action(robot_action_dict)

    if not sample_mount_device.has_loaded_sample():
        # Disables all related collections
        logging.getLogger("user_level_log").info("Sample not loaded")
        raise queue_entry.QueueSkipEntryException("Sample not loaded", "")
    else:
        signals.loaded_sample_changed(sample_mount_device.get_loaded_sample())
        logging.getLogger("user_level_log").info("Sample loaded")
        dm = HWR.beamline.diffractometer

        if mount_from_harvester:
            try:
                logging.getLogger("user_level_log").info(
                    "Start Auto Harvesting Centring"
                )

                computed_offset = (
                    HWR.beamline.harvester.get_offsets_for_sample_centering()
                )
                dm.start_harvester_centring(computed_offset)

            except Exception:
                logging.getLogger("user_level_log").exception(
                    "Could not center sample, skipping"
                )
                raise queue_entry.QueueSkipEntryException(
                    "Could not center sample, skipping", ""
                )

        else:
            use_custom_centring_routine = dm.get_property(
                "use_custom_centring_script", False
            )

            if not use_custom_centring_routine:
                if dm is not None:
                    try:
                        dm.connect("centringAccepted", centring_done_cb)
                        centring_method = queue_entry.CENTRING_METHOD

                        if centring_method == queue_entry.CENTRING_METHOD.MANUAL:
                            msg = (
                                "Manual centring used, waiting for"
                                + " user to center sample"
                            )
                            log.warning(msg)
                            dm.start_centring_method(dm.MANUAL3CLICK_MODE)
                        elif centring_method in [
                            queue_entry.CENTRING_METHOD.LOOP,
                            queue_entry.CENTRING_METHOD.FULLY_AUTOMATIC,
                        ]:
                            if not dm.current_centring_procedure:
                                dm.start_centring_method(dm.C3D_MODE)

                            # NBNB  BUG . self and app are not available here
                            if mxcube.AUTO_MOUNT_SAMPLE:
                                msg = (
                                    "Going to save centring automatically, please wait"
                                )
                            else:
                                msg = (
                                    "Centring in progress. Please save"
                                    + " the suggested centring or re-center"
                                )

                            log.warning(msg)
                        else:
                            dm.start_centring_method(dm.MANUAL3CLICK_MODE)

                        logging.getLogger("user_level_log").info("Centring ...")
                        centring_result = async_result.get()
                        if centring_result["valid"]:
                            logging.getLogger("user_level_log").info("Centring done !")
                        else:
                            if (
                                centring_method
                                == queue_entry.CENTRING_METHOD.FULLY_AUTOMATIC
                            ):
                                raise queue_entry.QueueSkipEntryException(
                                    "Could not center sample, skipping",
                                    "",
                                )
                            else:
                                raise RuntimeError("Could not center sample")
                    except Exception:
                        log.exception("centring did not pass")
                    finally:
                        dm.disconnect("centringAccepted", centring_done_cb)
            else:
                dm.disconnect("centringAccepted", centring_done_cb)


def patch_queue_entry_mount_sample():
    # Important, patch queue_entry.mount_sample with the mount_sample defined above
    queue_entry.base_queue_entry.mount_sample = queue_mount_sample
