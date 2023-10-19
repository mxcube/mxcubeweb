def export(func):
    func._export = True
    func._export_name = func.__name__

    return func


def get_adapter_cls_from_hardware_object(ho):
    from mxcubecore.HardwareObjects.abstract import (
        AbstractActuator,
        AbstractDetector,
        AbstractMachineInfo,
        AbstractBeam,
        AbstractNState,
        AbstractShutter,
        AbstractEnergy,
        AbstractMotor,
    )

    from mxcubecore.HardwareObjects import (
        MiniDiff,
        GenericDiffractometer,
    )

    # This needs to be a direct import of DataPublisher otherwise the
    # is instance check below fails due to different "import paths" It
    # inly works because mxcubecore adds mxcubecore.HardwareObjects to
    # sys path in __init__.py
    import DataPublisher

    from mxcubeweb.core.adapter.actuator_adapter import ActuatorAdapter
    from mxcubeweb.core.adapter.motor_adapter import MotorAdapter
    from mxcubeweb.core.adapter.detector_adapter import DetectorAdapter
    from mxcubeweb.core.adapter.machine_info_adapter import (
        MachineInfoAdapter,
    )
    from mxcubeweb.core.adapter.beam_adapter import BeamAdapter
    from mxcubeweb.core.adapter.data_publisher_adapter import (
        DataPublisherAdapter,
    )
    from mxcubeweb.core.adapter.energy_adapter import EnergyAdapter
    from mxcubeweb.core.adapter.diffractometer_adapter import (
        DiffractometerAdapter,
    )
    from mxcubeweb.core.adapter.nstate_adapter import NStateAdapter

    if isinstance(ho, AbstractNState.AbstractNState) or isinstance(
        ho, AbstractShutter.AbstractShutter
    ):
        return NStateAdapter
    elif isinstance(ho, MiniDiff.MiniDiff) or isinstance(
        ho, GenericDiffractometer.GenericDiffractometer
    ):
        return DiffractometerAdapter
    elif isinstance(ho, AbstractEnergy.AbstractEnergy):
        return EnergyAdapter
    elif isinstance(ho, AbstractDetector.AbstractDetector):
        return DetectorAdapter
    elif isinstance(ho, AbstractMachineInfo.AbstractMachineInfo):
        return MachineInfoAdapter
    elif isinstance(ho, AbstractBeam.AbstractBeam):
        return BeamAdapter
    elif isinstance(ho, DataPublisher.DataPublisher):
        return DataPublisherAdapter
    elif isinstance(ho, AbstractMotor.AbstractMotor):
        return MotorAdapter
    elif isinstance(ho, AbstractActuator.AbstractActuator):
        return ActuatorAdapter
    else:
        return None
