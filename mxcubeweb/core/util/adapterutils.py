def export(func):
    func._export = True
    func._export_name = func.__name__

    return func


def get_adapter_cls_from_hardware_object(ho):
    # This needs to be a direct import of DataPublisher otherwise the
    # is instance check below fails due to different "import paths" It
    # inly works because mxcubecore adds mxcubecore.HardwareObjects to
    # sys path in __init__.py
    import DataPublisher
    from mxcubecore.HardwareObjects import (
        GenericDiffractometer,
        MiniDiff,
    )
    from mxcubecore.HardwareObjects.abstract import (
        AbstractActuator,
        AbstractBeam,
        AbstractDetector,
        AbstractEnergy,
        AbstractMachineInfo,
        AbstractMotor,
        AbstractNState,
        AbstractShutter,
    )

    from mxcubeweb.core.adapter.actuator_adapter import ActuatorAdapter
    from mxcubeweb.core.adapter.beam_adapter import BeamAdapter
    from mxcubeweb.core.adapter.data_publisher_adapter import DataPublisherAdapter
    from mxcubeweb.core.adapter.detector_adapter import DetectorAdapter
    from mxcubeweb.core.adapter.diffractometer_adapter import DiffractometerAdapter
    from mxcubeweb.core.adapter.energy_adapter import EnergyAdapter
    from mxcubeweb.core.adapter.machine_info_adapter import MachineInfoAdapter
    from mxcubeweb.core.adapter.motor_adapter import MotorAdapter
    from mxcubeweb.core.adapter.nstate_adapter import NStateAdapter

    if isinstance(ho, AbstractNState.AbstractNState | AbstractShutter.AbstractShutter):
        return NStateAdapter
    if isinstance(ho, MiniDiff.MiniDiff | GenericDiffractometer.GenericDiffractometer):
        return DiffractometerAdapter
    if isinstance(ho, AbstractEnergy.AbstractEnergy):
        return EnergyAdapter
    if isinstance(ho, AbstractDetector.AbstractDetector):
        return DetectorAdapter
    if isinstance(ho, AbstractMachineInfo.AbstractMachineInfo):
        return MachineInfoAdapter
    if isinstance(ho, AbstractBeam.AbstractBeam):
        return BeamAdapter
    if isinstance(ho, DataPublisher.DataPublisher):
        return DataPublisherAdapter
    if isinstance(ho, AbstractMotor.AbstractMotor):
        return MotorAdapter
    if isinstance(ho, AbstractActuator.AbstractActuator):
        return ActuatorAdapter
    return None
