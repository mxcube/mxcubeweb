# -*- coding: utf-8 -*-
import sys
import logging
import copy
import io
import math
import re
import json

from mxcubecore import HardwareRepository as HWR
from mxcubecore.model import queue_model_objects as qmo

from mxcubeweb.core.components.component_base import ComponentBase
from mxcubeweb.core.util import fsutils

from flask import session
from flask_login import current_user


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

    def lims_existing_session(self, login_res):
        res = False

        try:
            res = (
                login_res.get("Session", {}).get("session", {}).get("sessionId", False)
                and True
            )
        except KeyError:
            res = False

        return res

    def lims_valid_login(self, login_res):
        return login_res["status"]["code"] == "ok"

    def lims_login(self, loginID, password, create_session):
        """
        :param str loginID: Username
        :param str password: Password
        :returns dict: On the format:

        {'status': { 'code': 'ok', 'msg': msg },
        'proposalList':[]
        }
        """
        login_res = {}
        # If this is used often, it could be moved to a better place.
        ERROR_CODE = dict({"status": {"code": "0"}})

        if HWR.beamline.lims.loginType.lower() == "user":
            try:
                connection_ok = HWR.beamline.lims.echo()
                if not connection_ok:
                    HWR.beamline.lims.init()
            except Exception:
                msg = "[LIMS] Connection Error!"
                logging.getLogger("MX3.HWR").error(msg)
                return ERROR_CODE

            try:
                HWR.beamline.lims.lims_rest.authenticate(loginID, password)
            except Exception:
                logging.getLogger("MX3.HWR").error("[LIMS-REST] Could not authenticate")
                return ERROR_CODE

            try:
                proposals = HWR.beamline.lims.get_proposals_by_user(loginID)

                logging.getLogger("MX3.HWR").info(
                    "[LIMS] Retrieving proposal list for user: %s, proposals: %s"
                    % (loginID, proposals)
                )
                session["proposal_list"] = copy.deepcopy(proposals)
            except Exception:
                logging.getLogger("MX3.HWR").error(
                    "[LIMS] Could not retreive proposal list, %s" % sys.exc_info()[1]
                )
                return ERROR_CODE

            for prop in session["proposal_list"]:
                todays_session = HWR.beamline.lims.get_todays_session(prop)
                prop["Session"] = [todays_session["session"]]

            login_res["proposalList"] = session["proposal_list"]
            login_res["status"] = {
                "code": "ok",
                "msg": "Successful login",
            }
        else:
            try:
                login_res = HWR.beamline.lims.login(
                    loginID, password, create_session=create_session
                )
                proposal = HWR.beamline.lims.get_proposal(
                    login_res["Proposal"]["code"],
                    login_res["Proposal"]["number"],
                )

            except Exception:
                logging.getLogger("MX3.HWR").error("[LIMS] Could not login to LIMS")
                return ERROR_CODE

            session["proposal_list"] = [proposal]
            login_res["proposalList"] = [proposal]

            logging.getLogger("MX3.HWR").info(
                "[LIMS] Logged in, valid proposal: %s%s"
                % (
                    login_res["Proposal"]["code"],
                    login_res["Proposal"]["number"],
                )
            )

        return login_res

    def create_lims_session(self, login_res):
        for prop in session["proposal_list"]:
            todays_session = HWR.beamline.lims.get_todays_session(prop)
            prop["Session"] = [todays_session["session"]]

        login_res["proposalList"] = session["proposal_list"]

        return login_res

    def get_proposal_info(self, proposal):
        """
        Search for the given proposal in the proposal list.
        """
        limsdata = json.loads(current_user.limsdata)

        for prop in limsdata.get("proposalList", []):
            _p = "%s%s" % (
                prop.get("Proposal").get("code", "").lower(),
                prop.get("Proposal").get("number", ""),
            )

            if _p == proposal.lower():
                return prop

        return {}

    def get_proposal(self, user):
        limsdata = json.loads(user.limsdata)

        proposal = "%s%s" % (
            limsdata.get("Proposal").get("code", "").lower(),
            limsdata.get("Proposal").get("number", ""),
        )

        return proposal

    def select_proposal(self, proposal):
        proposal_info = self.get_proposal_info(proposal)

        if (
            HWR.beamline.lims.loginType.lower() == "user"
            and "Commissioning" in proposal_info["Proposal"]["title"]
        ):
            if hasattr(HWR.beamline.session, "set_in_commissioning"):
                HWR.beamline.session.set_in_commissioning(proposal_info)
                logging.getLogger("MX3.HWR").info(
                    "[LIMS] Commissioning proposal flag set."
                )

        if proposal_info:
            HWR.beamline.session.proposal_code = proposal_info.get("Proposal").get(
                "code", ""
            )
            HWR.beamline.session.proposal_number = proposal_info.get("Proposal").get(
                "number", ""
            )

            todays_session = HWR.beamline.lims.get_todays_session(
                proposal_info, create_session=False
            )
            HWR.beamline.session.session_id = todays_session.get("session").get(
                "sessionId"
            )

            HWR.beamline.session.proposal_id = todays_session.get("session").get(
                "proposalId"
            )

            HWR.beamline.session.set_session_start_date(
                todays_session.get("session").get("startDate")
            )

            session["proposal"] = proposal_info

            if hasattr(HWR.beamline.session, "prepare_directories"):
                try:
                    logging.getLogger("MX3.HWR").info(
                        "[LIMS] Creating data directories for proposal %s" % proposal
                    )
                    HWR.beamline.session.prepare_directories(proposal_info)
                except Exception:
                    logging.getLogger("MX3.HWR").info(
                        "[LIMS] Error creating data directories, %s" % sys.exc_info()[1]
                    )

            # save selected proposal in users db
            current_user.selected_proposal = proposal
            self.app.usermanager.update_user(current_user)

            logging.getLogger("user_log").info("[LIMS] Proposal selected.")

            return True
        else:
            return False

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

    def get_dc_link(self, col_id):
        link = HWR.beamline.lims.dc_link(col_id)

        return link

    def get_dc_thumbnail(self, image_id):
        fname, data = HWR.beamline.lims.lims_rest.get_dc_thumbnail(image_id)
        data = io.BytesIO(data)

        return fname, data

    def get_dc_image(self, image_id):
        fname, data = HWR.beamline.lims.lims_rest.get_dc_image(image_id)
        data = io.BytesIO(data)

        return fname, data

    def get_quality_indicator_plot(self, dc_id):
        data = HWR.beamline.lims.lims_rest.get_quality_indicator_plot(dc_id)
        data = io.BytesIO(data)

        return "qind", data

    def synch_with_lims(self):
        proposal_id = HWR.beamline.session.proposal_id

        # session_id is not used, so we can pass None as second argument to
        # 'db_connection.get_samples'
        lims_samples = HWR.beamline.lims.get_samples(proposal_id, None)

        samples_info_list = lims_samples

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
