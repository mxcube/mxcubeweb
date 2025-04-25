import logging
import sys
import traceback

from mxcubecore import (
    HardwareRepository as HWR,  # noqa: N814 (should be disabled globaly)
)
from mxcubecore.utils.conversion import make_table

from mxcubeweb.core.adapter.adapter_base import AdapterBase
from mxcubeweb.core.adapter.beamline_adapter import BeamlineAdapter


class HardwareObjectAdapterManager:
    def __init__(self, app):
        self.app = app
        self.adapter_dict = {}

    def exit_with_error(self, msg: str) -> None:
        """
        Writes the traceback and msg to the log and exits the
        application

        :param msg: Additional message to write to log
        """
        logging.getLogger("HWR").error(traceback.format_exc())

        if msg:
            logging.getLogger("HWR").error(msg)

        logging.getLogger("HWR").error(
            "Could not initialize one or several hardware objects. Quitting server!"
        )
        sys.exit(-1)

    def init(self) -> None:
        """
        Initializes the HardwareRepository with XML files read from hwdir.

        The hwr module must be imported at the very beginning of the application
        start-up to function correctly.

        This method can however be called later, so that initialization can be
        done when one wishes.
        """
        try:
            self.beamline = BeamlineAdapter(HWR.beamline, self.app)
            self.adapt_hardware_objects()
        except Exception:  # noqa: BLE001
            msg = (
                "Could not initialize one or several hardware objects.\n"
                "Make sure that all device servers and detector software are running."
            )
            self.exit_with_error(msg)

    def _get_object_from_id(self, _id):
        return self.adapter_dict.get(_id, {}).get("adapter")

    def _get_adapter_id(self, ho):
        _id = HWR.beamline.get_id(ho)
        return _id.replace(" ", "_").lower()

    def _add_adapter(self, _id, adapter_cls, ho, adapter_instance):
        if _id not in self.adapter_dict:
            self.adapter_dict[_id] = {
                "id": str(_id),
                "adapter_cls": adapter_cls.__name__,
                "ho": ho.name()[1:],
                "adapter": adapter_instance,
            }
        else:
            msg = f"Skipping {ho.name()}, id: {_id} already exists"
            logging.getLogger("MX3.HWR").warning(msg)

    def get_adapter(self, _id):
        return self._get_object_from_id(_id)

    def get_match_depth(self, ho, supported_types):
        # Calculate the lowest index (most specific) of matching type in the MRO

        return min(
            (
                ho.__class__.mro().index(t)
                for t in supported_types
                if t in ho.__class__.mro()
            ),
            default=float("inf"),
        )

    def find_best_adapter(self, ho):
        """
        Rank adapters by the depth of their SUPPORTED_TYPES in the
        inheritance tree.

        Choose the adapter with the most specific match (deepest class
        in the hierarchy).
        """
        matches = []

        for adapter_cls in AdapterBase.SUBCLASSES:
            if "SUPPORTED_TYPES" in adapter_cls.__dict__ and adapter_cls.can_adapt(ho):
                depth = self.get_match_depth(ho, adapter_cls.SUPPORTED_TYPES)
                matches.append((depth, adapter_cls))

        if matches:
            matches.sort(key=lambda x: x[0])
            return matches[0][1]

        return None

    def adapt_hardware_objects(self):
        _hwr = HWR.get_hardware_repository()

        for ho_name in _hwr.hardware_objects:
            ho = _hwr.get_hardware_object(ho_name)
            if not ho:
                continue

            _id = HWR.beamline.get_id(ho)
            adapter_cls = self.find_best_adapter(ho)

            if adapter_cls:
                try:
                    adapter_instance = adapter_cls(ho, _id, self.app)
                    msg = f"Added adapter for {_id}"
                    logging.getLogger("MX3.HWR").info(msg)
                except Exception:
                    msg = f"Could not add adapter for {_id}"
                    logging.getLogger("MX3.HWR").exception(msg)
                    adapter_cls = AdapterBase
                    adapter_instance = AdapterBase(ho, _id, self.app)

                self._add_adapter(_id, adapter_cls, ho, adapter_instance)
            else:
                msg = f"No adapter for {_id}"
                logging.getLogger("MX3.HWR").info(msg)

        self._print_adapter_table()

    def _print_adapter_table(self):
        print(  # noqa: T201
            make_table(
                ["Beamline attribute (id)", "Adapter", "HO filename"],
                [
                    [item["id"], item["adapter_cls"], item["ho"]]
                    for item in self.adapter_dict.values()
                ],
            )
        )
