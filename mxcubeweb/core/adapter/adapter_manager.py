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
        return ho.id.replace(" ", "_").lower()

    def _add_adapter(self, _id, adapter_cls, ho, adapter_instance):
        if _id not in self.adapter_dict:
            self.adapter_dict[_id] = {
                "id": str(_id),
                "adapter_cls": adapter_cls.__name__,
                "ho": ho.name,
                "adapter": adapter_instance,
            }
        else:
            msg = f"Skipping {ho.name}, id: {_id} already exists"
            logging.getLogger("MX3.HWR").warning(msg)

    def get_adapter(self, _id):
        return self._get_object_from_id(_id)

    def find_best_adapter(self, ho):
        """
        Rank adapters by the depth of their SUPPORTED_TYPES in the
        inheritance tree.

        Choose the adapter with the most specific match (deepest class
        in the hierarchy).

        Args:
            ho: HardwareObject to adapt
        Returns:
            The best adapter class for the hardware object
        Raises:
            RuntimeError: If multiple adapters suit the hardware object
        """
        if ho.__class__ in AdapterBase.SUPPORTED_TYPES_TO_ADAPTERS:
            return AdapterBase.SUPPORTED_TYPES_TO_ADAPTERS[ho.__class__]

        superclasses = [
            ho_class
            for ho_class in AdapterBase.SUPPORTED_TYPES_TO_ADAPTERS
            if issubclass(ho.__class__, ho_class)
        ]

        if len(superclasses) == 0:
            logging.getLogger("MX3.HWR").warning("No adapter for %s", ho)
            return None

        # filter superclasses to only those that are not subclasses of each other
        result = [
            cls
            for cls in superclasses
            if not any(
                issubclass(other_cls, cls)
                for other_cls in superclasses
                if cls != other_cls
            )
        ]

        if len(result) == 1:
            return AdapterBase.SUPPORTED_TYPES_TO_ADAPTERS[result[0]]

        msg = (
            "Multiple adapters found for %s: %s",
            ho,
            {", ".join([cls.__name__ for cls in result])},
        )
        logging.getLogger("MX3.HWR").error(msg)
        raise RuntimeError(msg)

    def adapt_hardware_objects(self):
        _hwr = HWR.get_hardware_repository()

        for ho_name in _hwr.hardware_objects:
            ho = _hwr.get_hardware_object(ho_name)
            if not ho:
                continue

            _id = ho.id
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
