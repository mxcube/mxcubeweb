import logging
import math
import re
import sys

from flask_login import current_user
from mxcubecore import HardwareRepository as HWR
from mxcubecore.model import queue_model_objects as qmo
from mxcubecore.model.lims_session import LimsSessionManager

from mxcubeweb.core.components.component_base import ComponentBase

VALID_SAMPLE_NAME_REGEXP = re.compile("^[a-zA-Z0-9:+_-]+$")


class Lims(ComponentBase):
    def __init__(self, app, config):
        super().__init__(app, config)

    def new_sample_list(self):
        return {"sampleList": {}, "sampleOrder": []}

    def init_sample_list(self):
        self.sample_list_set(self.new_sample_list())

    def sample_list_set(self, sample_list):
        self.app.SAMPLE_LIST = sample_list

    def sample_list_set_order(self, sample_order):
        self.app.SAMPLE_LIST["sampleOrder"] = sample_order

    def sample_list_get(self, loc=None, current_queue=None):
        self.synch_sample_list_with_queue(current_queue)
        res = self.app.SAMPLE_LIST

        if loc:
            res = self.app.SAMPLE_LIST.get("sampleList").get(loc, {})

        return res

    def sample_list_sync_sample(self, lims_sample):
        lims_code = lims_sample.get("code", None)
        lims_location = lims_sample.get("lims_location")
        sample_to_update = None

        # LIMS sample has code, check if the code was read by SC
        if lims_code and self.app.sample_changer.sc_contents_from_code_get(lims_code):
            sample_to_update = self.app.sample_changer.sc_contents_from_code_get(
                lims_code
            )
        elif lims_location:
            # Asume that the samples have been put in the right place of the SC
            sample_to_update = self.app.sample_changer.sc_contents_from_location_get(
                lims_location
            )

        if sample_to_update:
            loc = sample_to_update["sampleID"]
            self.sample_list_update_sample(loc, lims_sample)

    def synch_sample_list_with_queue(self, current_queue=None):
        if not current_queue:
            current_queue = self.app.queue.queue_to_dict(include_lims_data=True)

        current_queue.get("sample_order", [])

        for loc, data in self.app.SAMPLE_LIST["sampleList"].items():
            if loc in current_queue:
                sample = current_queue[loc]

                # Don't synchronize, lims attributes from queue sample, if
                # they are already set by sc or lims
                if data.get("sampleName", ""):
                    sample.pop("sampleName")

                if data.get("proteinAcronym", ""):
                    sample.pop("proteinAcronym")

                # defaultSubDir and prefix are derived from proteinAcronym
                # and/or sampleName so make sure that those are removed from
                # queue sample so that they can be updated if changed.
                if data.get("proteinAcronym", "") or data.get("sampleName", ""):
                    sample.pop("defaultPrefix")
                    sample.pop("defaultSubDir")

                # Make sure that sample in queue is updated with lims information
                model, entry = self.app.queue.get_entry(sample["queueID"])
                model.set_from_dict(data)

                # Update sample location, location is Manual for free pin mode
                # in MXCuBE Web
                model.loc_str = data.get("sampleID", -1)
                model.free_pin_mode = data.get("location", "") == "Manual"

                self.sample_list_update_sample(loc, sample)

    def sample_list_update_sample(self, loc, sample):
        _sample = self.app.SAMPLE_LIST["sampleList"].get(loc, {})

        # If sample exists in sample list update it, otherwise add it
        if _sample:
            _sample.update(sample)
        else:
            self.app.SAMPLE_LIST["sampleList"][loc] = sample
            self.app.SAMPLE_LIST["sampleOrder"].append(loc)

        return self.app.SAMPLE_LIST["sampleList"].get(loc, {})

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
            sample = self.app.SAMPLE_LIST["sampleList"].get(sample_model.loc_str, {})
            prefix = self.get_default_prefix(sample)
            shape = params["shape"] if params["shape"] > 0 else ""
            params["prefix"] = params["prefix"].format(PREFIX=prefix, POSITION=shape)

            if params["prefix"].endswith("_"):
                params["prefix"] = params["prefix"][:-1]

        # mxcube web passes entire prefix as prefix, including reference, mad and wedge
        # prefix. So we strip those before setting the actual base_prefix.
        params["prefix"] = self.strip_prefix(path_template, params["prefix"])

    def strip_prefix(self, pt, prefix):
        """
        Strips the reference, wedge and mad prefix from a given prefix. For example
        removes ref- from the beginning and _w[n] and -pk, -ip, -ipp from the end.

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

    def get_session_manager(self) -> LimsSessionManager:
        return HWR.beamline.lims.session_manager

    def is_rescheduled_session(self, session):
        """
        Returns true is the session is rescheduled. That means that either currently is not the expected timeslot
        or because it is not in the expected beamline
        """
        return not (session.is_scheduled_beamline and session.is_scheduled_time)

    def allow_session(self, session):
        HWR.beamline.lims.allow_session(session)

    def select_session(self, session_id: str) -> bool:
        """
        param session_id : this is a identifier that could be proposal name or session_id depending of the type of LIMS login type
        """
        logging.getLogger("MX3.HWR").debug("select_session session_id=%s" % session_id)

        # Selecting the active session in the LIMS object
        try:
            session = HWR.beamline.lims.set_active_session_by_id(session_id)
            if session is None:
                raise "No session selected on LIMS"
        except BaseException as e:
            import traceback

            traceback.print_exc(file=sys.stdout)
            logging.getLogger("MX3.HWR").info(
                "No session candidate. Force signout. e=%s" % str(e)
            )
            self.app.usermanager.signout()
            return False

        if (
            HWR.beamline.lims.is_user_login_type()
            and "Commissioning" in session.title
            and hasattr(HWR.beamline.session, "set_in_commissioning")
        ):
            HWR.beamline.session.set_in_commissioning(self.get_proposal_info())
            logging.getLogger("MX3.HWR").info("[LIMS] Commissioning proposal flag set.")

        if HWR.beamline.session.session_id != HWR.beamline.lims.get_session_id():
            # ruff: noqa: G004
            logging.getLogger("MX3.HWR").info(
                f"[LIMS] New session, clearing queue and sample list for {session.code}{session.number}"
            )

            # Clear data collection queue (HardwareObject)
            self.app.queue.clear_queue()

            # Remove any items on the sample view (shapes)
            HWR.beamline.sample_view.clear_all()

            # Re-initialize the samplelist
            self.app.lims.init_sample_list()

            # Get sample list and send update to client
            self.app.sample_changer.get_sample_list()
            self.app.server.emit("update_queue", {}, namespace="/hwr")

            HWR.beamline.session.proposal_code = session.code
            HWR.beamline.session.proposal_number = session.number
            HWR.beamline.session.session_id = HWR.beamline.lims.get_session_id()
            HWR.beamline.session.proposal_id = session.proposal_id
            HWR.beamline.session.set_session_start_date(session.start_date)

        logging.getLogger("MX3.HWR").info(
            "[LIMS] Selected session. proposal=%s session_id=%s.",
            session.proposal_name,
            session.session_id,
        )

        if self.is_rescheduled_session(session):
            logging.getLogger("MX3.HWR").info(
                "[LIMS] Session is rescheduled in time or beamline."
            )
            self.allow_session(session)

        if hasattr(HWR.beamline.session, "prepare_directories"):
            try:
                logging.getLogger("MX3.HWR").info(
                    "[LIMS] Creating data directories for proposal %s%s" % session.code,
                    session.number,
                )
                raise "To be implemented for those using prepare_directories"
            except Exception:
                logging.getLogger("MX3.HWR").info(
                    "[LIMS] Error creating data directories, %s" % sys.exc_info()[1]
                )

        # save selected proposal in users db
        current_user.selected_proposal = session.session_id
        self.app.usermanager.update_user(current_user)

        logging.getLogger("user_log").info(
            "[LIMS] Proposal selected session_id=%s.", session_id
        )

        return True

    def get_default_prefix(self, sample_data, generic_name=False):
        if isinstance(sample_data, dict):
            sample = qmo.Sample()
            sample.code = sample_data.get("code", "")
            sample.name = sample_data.get("sampleName", "").replace(":", "-")
            sample.location = sample_data.get("location", "").split(":")
            sample.lims_id = sample_data.get("limsID", -1)
            sample.crystals[0].protein_acronym = sample_data.get("proteinAcronym", "")
        else:
            sample = sample_data

        return HWR.beamline.session.get_default_prefix(sample, generic_name)

    def get_default_subdir(self, sample_data):
        return HWR.beamline.session.get_default_subdir(sample_data)

    def synch_with_lims(self, lims_name):
        self.app.queue.queue_clear()
        self.app.sample_changer.get_sample_list()

        samples_info_list = HWR.beamline.lims.get_samples(lims_name)
        for sample_info in samples_info_list:
            sample_info["limsID"] = sample_info.pop("sampleId")
            sample_info["defaultPrefix"] = self.get_default_prefix(sample_info)
            sample_info["defaultSubDir"] = self.get_default_subdir(sample_info)

            if not VALID_SAMPLE_NAME_REGEXP.match(sample_info["sampleName"]):
                raise AttributeError(
                    "sample name for sample %s contains an incorrect character"
                    % sample_info
                )

            try:
                basket = int(sample_info["containerSampleChangerLocation"])
            except (TypeError, ValueError, KeyError):
                continue
            else:
                if HWR.beamline.sample_changer.__class__.__TYPE__ in [
                    "Flex Sample Changer",
                    "FlexHCD",
                    "RoboDiff",
                ]:
                    cell = int(math.ceil((basket) / 3.0))
                    puck = basket - 3 * (cell - 1)
                    sample_info["containerSampleChangerLocation"] = "%d:%d" % (
                        cell,
                        puck,
                    )

            try:
                lims_location = sample_info[
                    "containerSampleChangerLocation"
                ] + ":%02d" % int(sample_info["sampleLocation"])
            except Exception:
                logging.getLogger("MX3.HWR").info(
                    "[LIMS] Could not parse sample loaction from"
                    " LIMS, (perhaps not set ?)"
                )
            else:
                sample_info["lims_location"] = lims_location

                self.sample_list_sync_sample(sample_info)

        return self.sample_list_get()
