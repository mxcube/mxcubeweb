from mxcube3.core.adapter.adapter_base import AdapterBase
from mxcube3.core.adapter.utils import export
from mxcube3.core.models import HOBeamModel

class BeamAdapter(AdapterBase):
    def __init__(self, ho, *args, **kwargs):
        super(BeamAdapter, self).__init__(ho, *args, **kwargs)

    def _get_value(self) -> HOBeamModel:
        pass

    @export
    def get_size(self) -> HOBeamModel:
        pass

    @export
    def set_size(self, value: HOBeamModel) -> HOBeamModel:
        pass