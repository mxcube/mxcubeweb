
from suds.sudsobject import asdict
from suds import WebFault
from suds.client import Client
from suds.transport.http import HttpAuthenticated

_WS_SHIPPING_URL = 'http://10.30.61.230/ispyb/ispyb-ws/ispybWS/ToolsForShippingWebService?wsdl'
t1 = HttpAuthenticated(
    username='zhangsan',
    password='zhangsan',
    proxy={},
)
try:
    shipping = Client(
        _WS_SHIPPING_URL,
        timeout=3,
        transport=t1,
        cache=None,
        proxy={},
    )
except Exception as ex:
    print(ex)
print(shipping)