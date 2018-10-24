# -*- coding: utf-8 -*-
import logging

# We are patching queue_entry.mount_sample at the end of this file.
import queue_entry

from mxcube3 import mxcube
from mxcube3 import blcontrol

import limsutils
import qutils


from queue_entry import QueueSkippEntryException, CENTRING_METHOD


def init_signals():
    from mxcube3.routes import signals

    """Initialize hwobj signals."""
    blcontrol.sample_changer.connect('stateChanged', signals.sc_state_changed)
    blcontrol.sample_changer.connect(
        'loadedSampleChanged', signals.loaded_sample_changed)
    blcontrol.sample_changer.connect(
        'contentsUpdated', signals.sc_contents_update)

    if blcontrol.sc_maintenance is not None:
        blcontrol.sc_maintenance.connect(
            'globalStateChanged', signals.sc_maintenance_update)


def get_sample_list():
    samples_list = blcontrol.sample_changer.getSampleList()
    samples = {}
    samplesByCoords = {}
    order = []
    current_sample = {}

    for s in samples_list:
        if not s.isPresent():
            continue
        if s.isLoaded():
            state = qutils.SAMPLE_MOUNTED
        elif s.hasBeenLoaded():
            state = qutils.COLLECTED
        else:
            state = qutils.UNCOLLECTED
        sample_dm = s.getID() or ""
        coords = s.getCoords()
        sample_data = {"sampleID": s.getAddress(),
                       "location": s.getAddress(),
                       "sampleName": "Sample-%s" % s.getAddress(),
                       "code": sample_dm,
                       "loadable": True,
                       "state": state,
                       "tasks": [],
                       "type": "Sample"}
        order.append(coords)
        samplesByCoords[coords] = sample_data['sampleID']

        sample_data["defaultPrefix"] = limsutils.get_default_prefix(
            sample_data, False)
        sample_data["defaultSubDir"] = limsutils.get_default_subdir(
            sample_data)

        samples[s.getAddress()] = sample_data
        sc_contents_add(sample_data)

        if sample_data["state"] == qutils.SAMPLE_MOUNTED:
            current_sample = sample_data
            qutils.queue_add_item([current_sample])

    # sort by location, using coords tuple
    order.sort()
    sample_list = {'sampleList': samples,
                   'sampleOrder': [samplesByCoords[coords] for coords in order]}

    set_current_sample(current_sample["sampleID"])
    limsutils.sample_list_set(sample_list)


def get_sc_contents():
    def _getElementStatus(e):
        if e.isLeaf():
            if e.isLoaded():
                return "Loaded"
            if e.hasBeenLoaded():
                return "Used"
        if e.isPresent():
            return "Present"
        return ""

    def _getElementID(e):
        if e == blcontrol.sample_changer:
            if e.getToken() is not None:
                return e.getToken()
        else:
            if e.getID() is not None:
                return e.getID()
        return ""

    def _addElement(parent, element):
        new_element = {"name": element.getAddress(),
                       "status": _getElementStatus(element),
                       "id": _getElementID(element),
                       "selected": element.isSelected()}

        parent.setdefault("children", []).append(new_element)

        if not element.isLeaf():
            for e in element.getComponents():
                _addElement(new_element, e)

    root_name = blcontrol.sample_changer.getAddress()

    contents = {"name": root_name}

    for element in blcontrol.sample_changer.getComponents():
        if element.isPresent():
            _addElement(contents, element)

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
    msg = '[SC] Setting currenly mounted sample to %s' % sample_id
    logging.getLogger('MX3.HWR').info(msg)

    from mxcube3.routes.signals import set_current_sample
    set_current_sample(sample_id)


def get_current_sample():
    sample_id = mxcube.CURRENTLY_MOUNTED_SAMPLE
    sample = mxcube.SAMPLE_LIST["sampleList"].get(sample_id, {})
    msg = '[SC] Getting currently mounted sample %s' % sample

    logging.getLogger('MX3.HWR').info(msg)

    return sample


def get_sample_info(location):
    return {}


def set_sample_to_be_mounted(loc):
    mxcube.SAMPLE_TO_BE_MOUNTED = loc


def get_sample_to_be_mounted():
    return mxcube.SAMPLE_TO_BE_MOUNTED


def queue_mount_sample(beamline_setup_hwobj,
                       view, data_model,
                       centring_done_cb, async_result):
    from mxcube3.routes import signals

    logging.getLogger('user_level_log').info("Loading sample ...")
    log = logging.getLogger("user_level_log")

    loc = data_model.location
    holder_length = data_model.holder_length

    # This is a possible solution how to deal with two devices that
    # can move sample on beam (sample changer, plate holder, in future
    # also harvester)
    # TODO make sample_Changer_one, sample_changer_two
    if beamline_setup_hwobj.diffractometer_hwobj.in_plate_mode():
        sample_mount_device = beamline_setup_hwobj.plate_manipulator_hwobj
    else:
        sample_mount_device = beamline_setup_hwobj.sample_changer_hwobj

    if sample_mount_device.getLoadedSample() and \
            sample_mount_device.getLoadedSample().getAddress() == data_model.loc_str:
        return

    beamline_setup_hwobj.shape_history_hwobj.clear_all()

    if hasattr(sample_mount_device, '__TYPE__'):
        if sample_mount_device.__TYPE__ in ['Marvin', 'CATS']:
            element = '%d:%02d' % loc
            sample = {"location": element, "sampleID": element}
            mount_sample_clean_up(sample)
        elif sample_mount_device.__TYPE__ == "PlateManipulator":
            sample = {"location": loc, "sampleID": loc}
            mount_sample_clean_up(sample)
        else:
            sample = {"location": loc, "sampleID": loc}

            if mount_sample_clean_up(sample) is False:
                # WARNING: explicit test of False return value.
                # This is to preserve backward compatibility (load_sample was supposed to return None);
                # if sample could not be loaded, but no exception is raised, let's skip the sample
                raise QueueSkippEntryException(
                    "Sample changer could not load sample", "")

    if not sample_mount_device.hasLoadedSample():
        # Disables all related collections
        logging.getLogger('user_level_log').info("Sample not loaded")
        raise QueueSkippEntryException("Sample not loaded", "")
    else:
        signals.loaded_sample_changed(sample_mount_device.getLoadedSample())
        logging.getLogger('user_level_log').info("Sample loaded")
        dm = beamline_setup_hwobj.diffractometer_hwobj
        if dm is not None:
            try:
                dm.connect("centringAccepted", centring_done_cb)
                centring_method = mxcube.CENTRING_METHOD
                if centring_method == CENTRING_METHOD.MANUAL:
                    msg = "Manual centring used, waiting for" +\
                          " user to center sample"
                    log.warning(msg)
                    dm.startCentringMethod(dm.MANUAL3CLICK_MODE)
                elif centring_method in [CENTRING_METHOD.LOOP,
                                         CENTRING_METHOD.FULLY_AUTOMATIC]:
                    dm.startCentringMethod(dm.C3D_MODE)

                    if mxcube.AUTO_MOUNT_SAMPLE:
                        dm.acceptCentring()
                        msg = "Centring saved automatically"
                    else:
                        msg = "Centring in progress. Please save" +\
                              " the suggested centring or re-center"

                    log.warning(msg)
                else:
                    dm.start_centring_method(dm.MANUAL3CLICK_MODE)

                logging.getLogger('user_level_log').info("Centring ...")
                centring_result = async_result.get()
                if centring_result['valid']:
                    logging.getLogger('user_level_log').info("Centring done !")
                else:
                    if centring_method == CENTRING_METHOD.FULLY_AUTOMATIC:
                        raise QueueSkippEntryException(
                            "Could not center sample, skipping", "")
                    else:
                        raise RuntimeError("Could not center sample")
            except:
                import traceback
                log.info("centring did not pass %s" % traceback.format_exc())
                pass
            finally:
                dm.disconnect("centringAccepted", centring_done_cb)


def mount_sample_clean_up(sample):
    from mxcube3.routes import signals
    sc = blcontrol.sample_changer

    res = None

    try:
        msg = '[SC] mounting %s (%r)'
        msg = msg % (sample['location'], sample['sampleID'])
        logging.getLogger('MX3.HWR').info(msg)

        signals.sc_load(sample['location'])

        sid = get_current_sample().get("sampleID", False)
        current_queue = qutils.queue_to_dict()

        set_sample_to_be_mounted(sample['sampleID'])

        if sample['location'] != 'Manual':
            if not sc.getLoadedSample():
                res = sc.load(sample['sampleID'], wait=True)
            elif sc.getLoadedSample().getAddress() != sample['location']:
                res = sc.load(sample['sampleID'], wait=True)

            if res and mxcube.CENTRING_METHOD == CENTRING_METHOD.LOOP:
                msg = 'Starting autoloop centring ...'
                logging.getLogger('MX3.HWR').info(msg)
                C3D_MODE = blcontrol.diffractometer.C3D_MODE
                blcontrol.diffractometer.startCentringMethod(C3D_MODE)
            elif not sc.getLoadedSample():
                set_current_sample(None)
        else:
            set_current_sample(sample["sampleID"])
            res = True

    except Exception as ex:
        logging.getLogger('MX3.HWR').exception(
            '[SC] sample could not be mounted')

        raise RuntimeError(str(ex))
    else:
        # Clean up if the new sample was mounted or the current sample was
        # unmounted and the new one, for some reason, failed to mount
        if res or (not res and not sc.getLoadedSample()):
            blcontrol.shapes.clear_all()

            # We remove the current sample from the queue, if we are moving
            # from one sample to another and the current sample is in the queue
            if sid and current_queue[sid]:
                node_id = current_queue[sid]["queueID"]
                qutils.set_enabled_entry(node_id, False)
    finally:
        signals.sc_load_ready(sample['location'])

    return res


def unmount_sample_clean_up(sample):
    from mxcube3.routes import signals

    try:
        signals.sc_unload(sample['location'])

        if not sample['location'] == 'Manual':
            blcontrol.sample_changer.unload(sample['sampleID'], wait=False)
        else:
            set_current_sample(None)

        msg = '[SC] unmounted %s (%s)'
        msg = msg % (sample['location'], sample['sampleID'])
        logging.getLogger('MX3.HWR').info(msg)
    except Exception:
        msg = '[SC] sample could not be mounted'
        logging.getLogger('MX3.HWR').exception(msg)
        raise
    else:
        blcontrol.queue.mounted_sample = ''
        set_current_sample(None)
        blcontrol.shapes.clear_all()
    finally:
        signals.sc_load_ready(sample['location'])


def mount_sample(sample):
    res = mount_sample_clean_up(sample)

    if not res:
        msg = 'Could not mount sample: No sample on given '
        msg += 'position or empty vial ?'

        raise Exception(msg)

    return get_sc_contents()


def unmount_sample(sample):
    unmount_sample_clean_up(sample)
    return get_sc_contents()


def unmount_current():
    blcontrol.sample_changer.unload(None, wait=True)
    set_current_sample(None)

    return get_sc_contents()


def get_loaded_sample():
    sample = blcontrol.sample_changer.getLoadedSample()

    if sample is not None:
        address = sample.getAddress()
        barcode = sample.getID()
    else:
        address = ''
        barcode = ''

    return address, barcode


def get_maintenance_cmds():
    if blcontrol.sc_maintenance is not None:
        ret = blcontrol.sc_maintenance.get_cmd_info()
    else:
        ret = "SC maintenance controller not defined"

    return ret


def get_global_state():
    if blcontrol.sc_maintenance is not None:
        return blcontrol.sc_maintenance.get_global_state()
    else:
        return {}


def get_initial_state():
    if blcontrol.sc_maintenance is not None:
        ret = blcontrol.sc_maintenance.get_global_state()
        global_state, cmdstate, msg = ret

        cmds = blcontrol.sc_maintenance.get_cmd_info()

    else:
        global_state = {}
        cmdstate = "SC maintenance controller not defined"
        cmds = []
        msg = ''

    contents = get_sc_contents()
    sample = blcontrol.sample_changer.getLoadedSample()

    if sample is not None:
        address = sample.getAddress()
        barcode = sample.getID()
    else:
        address = ''
        barcode = ''

    loaded_sample = {'address': address, 'barcode': barcode}
    state = blcontrol.sample_changer.getStatus().upper()

    initial_state = {'state': state,
                     'loaded_sample': loaded_sample,
                     'contents': contents,
                     'global_state': {'global_state': global_state, 'commands_state': cmdstate},
                     'cmds': {'cmds': cmds},
                     'msg': msg
                     }

    return initial_state


# Important, patch queue_entry.mount_sample with the mount_sample defined above
queue_entry.mount_sample = queue_mount_sample
