import logging

import gevent
from mxcubecore import HardwareRepository as HWR
from mxcubecore import queue_entry

from mxcubeweb.core.components.component_base import ComponentBase


# TO CONSIDER:
# This should maybe be made into an adapter instead of a component
class SampleChanger(ComponentBase):
    def __init__(self, app, config):
        super().__init__(app, config)

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
                contents["room_temperature_mode"] = (
                    HWR.beamline.sample_changer.get_room_temperature_mode()
                )

            for element in HWR.beamline.sample_changer.get_components():
                if element.is_present():
                    _addElement(contents, element)
        else:
            contents = {"name": "OFFLINE"}

        return contents

    def mount_sample_clean_up(self, sample):
        from mxcubeweb.routes import signals

        sc = HWR.beamline.sample_changer

        res = False

        try:
            signals.sc_load(sample["location"])

            sid = self.app.lims.get_current_sample().get("sampleID", False)
            current_queue = self.app.queue.queue_to_dict()

            if sample["location"] != "Manual":
                msg = "Mounting sample: %s (%s)" % (
                    sample["location"],
                    sample.get("sampleName", ""),
                )
                logging.getLogger("user_level_log").info(msg)

                if (
                    not sc.get_loaded_sample()
                    or sc.get_loaded_sample().get_address() != sample["location"]
                ):
                    res = sc.load(sample["sampleID"], wait=True)

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
                    C3D_MODE = HWR.beamline.diffractometer.C3D_MODE
                    HWR.beamline.diffractometer.start_centring_method(C3D_MODE)
                elif HWR.beamline.diffractometer.in_plate_mode():
                    msg = "Starting autoloop Focusing ..."
                    logging.getLogger("MX3.HWR").info(msg)
                    sc.move_to_crystal_position(None)

            else:
                msg = "Mounting sample: %s" % sample["sampleName"]
                logging.getLogger("user_level_log").info(msg)

                self.app.lims.set_current_sample(sample["sampleID"])
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

            if sample["location"] != "Manual":
                HWR.beamline.sample_changer.unload(sample["location"], wait=False)
            else:
                self.app.lims.set_current_sample(None)
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

    def unmount_current(self):
        sc_sample = HWR.beamline.sample_changer.get_loaded_sample()
        if sc_sample:
            location = sc_sample.get_address()
            self.unmount_sample_clean_up({"location": location})
        else:
            self.unmount_sample_clean_up({"location": "Manual"})
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
        return {
            "num_baskets": len(baskets),
            "num_samples": num_samples,
        }

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
            logging.getLogger("MX3.HWR").exception("Could not get sc global state")
            return (
                {},
                "SC maintenance controller doesn't response",
                "Can't retrieve the global state",
            )

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
            return {"xtal_list": xtal_list}
        except Exception:
            logging.getLogger("MX3.HWR").exception("Could not get crystal List")
            return {"xtal_list": xtal_list}

    def _gripper_changed(self):
        self.app.queue.queue_clear()
        self.app.server.emit(
            "queue", {"Signal": "update", "message": "all"}, namespace="/hwr"
        )
