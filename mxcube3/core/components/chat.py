import datetime

from flask_security import current_user

from mxcube3.core.components.component_base import ComponentBase
from mxcube3.core.util.networkutils import remote_addr


class Chat(ComponentBase):
    def __init__(self, app, config):
        super().__init__(app, config)
        self.MESSAGES = []

    def db_add_message(self, user, message):
        m = self.app.server.user_datastore.create_message(message=message)
        self.app.server.user_datastore.add_message_to_user(user, m)
        self.app.server.user_datastore.commit()

    def append_message(self, message, sid):
        user = current_user.name

        data = {
            "message": message,
            "sid": sid,
            "user": user,
            "host": remote_addr(),
            "date": datetime.datetime.now().strftime("%H:%M"),
        }

        self.MESSAGES.append(data)
        self.db_add_message(current_user, message)
        self.app.server.emit("ra_chat_message", data, namespace="/hwr")

    def get_all_messages(self):
        message_list = []

        for m in self.app.server.user_datastore.get_all_messages():
            user = m.users.all()[0]

            message_list.append(
                {
                    "message": m.message,
                    "sid": user.last_session_id,
                    "user": user.username,
                    "host": user.last_login_ip,
                    "date": m.at.strftime("%H:%M"),
                }
            )

        return message_list
