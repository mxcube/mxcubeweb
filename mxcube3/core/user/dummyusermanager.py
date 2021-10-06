
import flask_security

from mxcube3.core.user.usermanager import BaseUserManager
from mxcube3.core import limsutils

class DummyUserManager(BaseUserManager):
    def __init__(self, app, server, config):
        super().__init__(app, server, config)

    def _login(self, login_id, password):
        # Assuming that ISPyB is used
        login_res = limsutils.lims_login(login_id, password, create_session=False)
        return login_res

    def _signout(self):
        pass