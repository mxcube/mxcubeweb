from mxcubeweb.core.components.user.usermanager import BaseUserManager


class DummyUserManager(BaseUserManager):
    def __init__(self, app, config):
        super().__init__(app, config)

    def _login(self, login_id, password):
        # Assuming that ISPyB is used
        return self.app.lims.lims_login(login_id, password, create_session=False)

    def _signout(self):
        pass
