from mxcube3.core.adapter.actuator_adapter import ActuatorAdapter
from mxcube3.core.adapter.duo_state_adapter import DuoStateAdapter

def get_adapter_cls(ho):
    if isinstance(ho, (
        AbstractNState.AbstractNState,
        TangoShutter.TangoShutter,
        MicrodiffInOutMockup.MicrodiffInOutMockup,
        ShutterMockup.ShutterMockup,
    )):
        return DuoStateAdapter
    elif isinstance(ho, (AbstractActuator.AbstractActuator)):
        return ActuatorAdapter

    
