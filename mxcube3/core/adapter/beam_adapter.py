from mxcube3.core.adapter.adapter_base import AdapterBase


class BeamAdapter(AdapterBase):
    def __init__(self, ho, name, **kwargs):
        super(BeamAdapter, self).__init__(ho, name, **kwargs)
