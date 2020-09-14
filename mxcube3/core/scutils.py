# -*- coding: utf-8 -*-
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import logging
import time

# We are patching queue_entry.mount_sample at the end of this file.
#import queue_entry

from mxcube3 import mxcube
from mxcube3 import blcontrol

from . import limsutils
from . import qutils

from queue_entry import QueueSkippEntryException, CENTRING_METHOD
from HardwareRepository.HardwareObjects import queue_entry

def init_signals():
    from mxcube3.routes import signals

    """Initialize hwobj signals."""
    blcontrol.beamline.sample_changer.connect("stateChanged", signals.sc_state_changed)
    blcontrol.beamline.sample_changer.connect(
        "isCollisionSafe", signals.is_collision_safe
    )
    blcontrol.beamline.sample_changer.connect(
        "loadedSampleChanged", signals.loaded_sample_changed
    )
    blcontrol.beamline.sample_changer.connect(
        "contentsUpdated", signals.sc_contents_update
    )

    if blcontrol.beamline.sample_changer_maintenance is not None:
        blcontrol.beamline.sample_changer_maintenance.connect(
            "globalStateChanged", signals.sc_maintenance_update
        )


def get_sample_list():
    samples_list = blcontrol.beamline.sample_changer.get_sample_list()
    samples = {}
    samplesByCoords = {}
    order = []
    current_sample = {}

    for s in samples_list:
        if not s.is_present():
            continue
        if s.is_loaded():
            state = qutils.SAMPLE_MOUNTED
        elif s.has_been_loaded():
            state = qutils.COLLECTED
        else:
            state = qutils.UNCOLLECTED
        sample_dm = s.get_id() or ""
        coords = s.get_coords()
        sample_data = {
            "sampleID": s.get_address(),
            "location": s.get_address(),
            "sampleName": "Sample-%s" % s.get_address(),
            "code": sample_dm,
            "loadable": True,
            "state": state,
            "tasks": [],
            "type": "Sample",
        }
        order.append(coords)
        samplesByCoords[coords] = sample_data["sampleID"]

        sample_data["defaultPrefix"] = limsutils.get_default_prefix(sample_data, False)
        sample_data["defaultSubDir"] = limsutils.get_default_subdir(sample_data)

        samples[s.get_address()] = sample_data
        sc_contents_add(sample_data)

        if sample_data["state"] == qutils.SAMPLE_MOUNTED:
            current_sample = sample_data
            qutils.queue_add_item([current_sample])

    # sort by location, using coords tuple
    order.sort()
    sample_list = {
        "sampleList": samples,
        "sampleOrder": [samplesByCoords[coords] for coords in order],
    }

    limsutils.sample_list_set(sample_list)

    if current_sample:
        set_current_sample(current_sample["sampleID"])


def get_sc_contents():
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
        if e == blcontrol.beamline.sample_changer:
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

    if blcontrol.beamline.sample_changer:
        root_name = blcontrol.beamline.sample_changer.get_address()

        contents = {"name": root_name}

        for element in blcontrol.beamline.sample_changer.get_components():
            if element.is_present():
                _addElement(contents, element)
    else:
        contents = {"name": "OFFLINE"}

    return contents


def sc_contents_init():
    mxcube.SC_CONTENTS = {"FROM_CODE": {}, "FROM_LOCATION": {}}


def sc_contents_add(sample):
    code, location = sample.get("code", None), sample.get("sampleID")

    if code:
        mxcube.SC_CONTENTS.get("FROM_CODE")[code] = sample
    if location:
        mxcube.SC_CONTENTS.get("FROM_LOCATION")[location] = sample


def sc_contents_from_code_get(code):
    return mxcube.SC_CONTENTS["FROM_CODE"].get(code, {})


def sc_contents_from_location_get(loc):
    return mxcube.SC_CONTENTS["FROM_LOCATION"].get(loc, {})


def set_current_sample(sample_id):
    mxcube.CURRENTLY_MOUNTED_SAMPLE = sample_id
    msg = "[SC] Setting currenly mounted sample to %s" % sample_id
    logging.getLogger("MX3.HWR").info(msg)

    from mxcube3.routes.signals import set_current_sample

    set_current_sample(sample_id)


def get_current_sample():
    sample_id = mxcube.CURRENTLY_MOUNTED_SAMPLE
    sample = mxcube.SAMPLE_LIST["sampleList"].get(sample_id, {})
    msg = "[SC] Getting currently mounted sample %s" % sample

    logging.getLogger("MX3.HWR").info(msg)

    return sample


def get_sample_info(location):
    return {}


def set_sample_to_be_mounted(loc):
    mxcube.SAMPLE_TO_BE_MOUNTED = loc


def get_sample_to_be_mounted():
    return mxcube.SAMPLE_TO_BE_MOUNTED


def queue_mount_sample(view, data_model, centring_done_cb, async_result):
    from mxcube3.routes import signals

    blcontrol.beamline.sample_view.clear_all()
    logging.getLogger("user_level_log").info("Loading sample ...")
    log = logging.getLogger("user_level_log")

    loc = data_model.location
    holder_length = data_model.holder_length

    robot_action_dict = {
        "actionType": "LOAD",
        "containerLocation": loc[1],
        "dewarLocation": loc[0],
        "sampleBarcode": data_model.code,
        "sampleId": data_model.lims_id,
        "sessionId": blcontrol.beamline.session.session_id,
        "startTime": time.strftime("%Y-%m-%d %H:%M:%S"),
    }

    # This is a possible solution how to deal with two devices that
    # can move sample on beam (sample changer, plate holder, in future
    # also harvester)
    # TODO make sample_Changer_one, sample_changer_two
    if blcontrol.beamline.diffractometer.in_plate_mode():
        sample_mount_device = blcontrol.beamline.plate_manipulator
    else:
        sample_mount_device = blcontrol.beamline.sample_changer

    if (
        sample_mount_device.get_loaded_sample()
        and sample_mount_device.get_loaded_sample().get_address() == data_model.loc_str
    ):
        return

    if hasattr(sample_mount_device, "__TYPE__"):
        if sample_mount_device.__TYPE__ in ["Marvin", "CATS"]:
            element = "%d:%02d" % loc
            sample = {"location": element, "sampleID": element}
            mount_sample_clean_up(sample)
        elif sample_mount_device.__TYPE__ == "PlateManipulator":
            sample = {"location": data_model.loc_str, "sampleID": data_model.loc_str}
            mount_sample_clean_up(sample)
        else:
            sample = {"location": data_model.loc_str, "sampleID": data_model.loc_str}

            if mount_sample_clean_up(sample) is False:
                # WARNING: explicit test of False return value.
                # This is to preserve backward compatibility (load_sample was supposed to return None);
                # if sample could not be loaded, but no exception is raised, let's skip
                # the sample
                raise QueueSkippEntryException(
                    "Sample changer could not load sample", ""
                )

    robot_action_dict["endTime"] = time.strftime("%Y-%m-%d %H:%M:%S")
    if sample_mount_device.has_loaded_sample():
        robot_action_dict["status"] = "SUCCESS"
    else:
        robot_action_dict["message"] = "Sample was not loaded"
        robot_action_dict["status"] = "ERROR"

    blcontrol.beamline.lims.store_robot_action(robot_action_dict)

    if not sample_mount_device.has_loaded_sample():
        # Disables all related collections
        logging.getLogger("user_level_log").info("Sample not loaded")
        raise QueueSkippEntryException("Sample not loaded", "")
    else:
        signals.loaded_sample_changed(sample_mount_device.get_loaded_sample())
        logging.getLogger("user_level_log").info("Sample loaded")
        dm = blcontrol.beamline.diffractometer
        if dm is not None:
            try:
                dm.connect("centringAccepted", centring_done_cb)
                centring_method = mxcube.CENTRING_METHOD

                if centring_method == CENTRING_METHOD.MANUAL:
                    msg = "Manual centring used, waiting for" + " user to center sample"
                    log.warning(msg)
                    dm.start_centring_method(dm.MANUAL3CLICK_MODE)
                elif centring_method in [
                    CENTRING_METHOD.LOOP,
                    CENTRING_METHOD.FULLY_AUTOMATIC,
                ]:

                    if not dm.currentCentringMethod:
                        dm.start_centring_method(dm.C3D_MODE)

                    if mxcube.AUTO_MOUNT_SAMPLE:
                        msg = "Going to save centring automatically, please wait"
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
                    if centring_method == CENTRING_METHOD.FULLY_AUTOMATIC:
                        raise QueueSkippEntryException(
                            "Could not center sample, skipping", ""
                        )
                    else:
                        raise RuntimeError("Could not center sample")
            except BaseException:
                import traceback

                log.info("centring did not pass %s" % traceback.format_exc())
            finally:
                dm.disconnect("centringAccepted", centring_done_cb)


def mount_sample_clean_up(sample):
    from mxcube3.routes import signals

    sc = blcontrol.beamline.sample_changer

    res = None

    try:
        msg = "[SC] mounting %s" % sample["location"]
        logging.getLogger("MX3.HWR").info(msg)

        signals.sc_load(sample["location"])

        sid = get_current_sample().get("sampleID", False)
        current_queue = qutils.queue_to_dict()

        set_sample_to_be_mounted(sample["sampleID"])

        if sample["location"] != "Manual":
            if not sc.get_loaded_sample():
                res = sc.load(sample["sampleID"], wait=True)
            elif sc.get_loaded_sample().get_address() != sample["location"]:
                res = sc.load(sample["sampleID"], wait=True)

            if res is None:
                res = True

            if (
                res
                and mxcube.CENTRING_METHOD == CENTRING_METHOD.LOOP
                and not blcontrol.beamline.diffractometer.in_plate_mode()
            ):
                msg = "Starting autoloop centring ..."
                logging.getLogger("MX3.HWR").info(msg)
                C3D_MODE = blcontrol.beamline.diffractometer.C3D_MODE
                blcontrol.beamline.diffractometer.start_centring_method(C3D_MODE)
            elif not sc.get_loaded_sample():
                set_current_sample(None)
        else:
            set_current_sample(sample["sampleID"])
            res = True

    except Exception as ex:
        logging.getLogger("MX3.HWR").exception("[SC] sample could not be mounted")

        raise RuntimeError(str(ex))
    else:
        # Clean up if the new sample was mounted or the current sample was
        # unmounted and the new one, for some reason, failed to mount
        if res or (not res and not sc.get_loaded_sample()):
            blcontrol.beamline.sample_view.clear_all()

            # We remove the current sample from the queue, if we are moving
            # from one sample to another and the current sample is in the queue
            if sid and current_queue[sid]:
                node_id = current_queue[sid]["queueID"]
                qutils.set_enabled_entry(node_id, False)
    finally:
        signals.sc_load_ready(sample["location"])

    return res


def unmount_sample_clean_up(sample):
    from mxcube3.routes import signals

    try:
        signals.sc_unload(sample["location"])

        if not sample["location"] == "Manual":
            blcontrol.beamline.sample_changer.unload(sample["location"], wait=False)
        else:
            set_current_sample(None)
            signals.sc_load_ready(sample["location"])

        msg = "[SC] unmounted %s" % sample["location"]
        logging.getLogger("MX3.HWR").info(msg)
    except Exception:
        msg = "[SC] sample could not be mounted"
        logging.getLogger("MX3.HWR").exception(msg)
        raise
    else:
        blcontrol.beamline.queue_model.mounted_sample = ""
        blcontrol.beamline.sample_view.clear_all()


def mount_sample(sample):
    res = mount_sample_clean_up(sample)

    if not res:
        msg = "Could not mount sample: No sample on given "
        msg += "position or empty vial ?"

        raise Exception(msg)

    return get_sc_contents()


def unmount_sample(sample):
    unmount_sample_clean_up(sample)
    return get_sc_contents()


def unmount_current():
    unmount_sample_clean_up(get_current_sample())

    return get_sc_contents()


def get_loaded_sample():
    try:
        sample = blcontrol.beamline.sample_changer.get_loaded_sample()
    except Exception as ex:
        logging.getLogger("MX3.HWR").exception("")
        sample = None

    if sample is not None:
        address = sample.get_address()
        barcode = sample.get_id()
    else:
        address = ""
        barcode = ""

    return address, barcode


def get_capacity():
    baskets = blcontrol.beamline.sample_changer.get_basket_list()
    num_samples = 0
    for basket in baskets:
        num_samples += basket.get_number_of_samples()
    res = {"num_baskets": len(baskets), "num_samples": num_samples}
    return res


def get_maintenance_cmds():
    if blcontrol.beamline.sample_changer_maintenance is not None:
        ret = blcontrol.beamline.sample_changer_maintenance.get_cmd_info()
    else:
        ret = "SC maintenance controller not defined"

    return ret


def get_global_state():
    try:
        return blcontrol.beamline.sample_changer_maintenance.get_global_state()
    except:
        return "OFFLINE", "OFFLINE", "OFFLINE"


def get_initial_state():
    if blcontrol.beamline.sample_changer_maintenance is not None:
        global_state, cmdstate, msg = get_global_state()

        cmds = blcontrol.beamline.sample_changer_maintenance.get_cmd_info()

    else:
        global_state = {}
        cmdstate = "SC maintenance controller not defined"
        cmds = []
        msg = ""

    contents = get_sc_contents()
    address, barcode = get_loaded_sample()

    loaded_sample = {"address": address, "barcode": barcode}

    try:
        state = blcontrol.beamline.sample_changer.get_status().upper()
    except:
        state = "OFFLINE"

    initial_state = {
        "state": state,
        "loaded_sample": loaded_sample,
        "contents": contents,
        "global_state": {"global_state": global_state, "commands_state": cmdstate},
        "cmds": {"cmds": cmds},
        "msg": msg,
        "plate_mode": blcontrol.beamline.diffractometer.in_plate_mode(),
    }

    return initial_state


# Important, patch queue_entry.mount_sample with the mount_sample defined above
queue_entry.mount_sample = queue_mount_sample
