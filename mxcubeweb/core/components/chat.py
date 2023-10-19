import datetime

from flask_login import current_user

from mxcubeweb.core.components.component_base import ComponentBase


class Chat(ComponentBase):
    def __init__(self, app, config):
        super().__init__(app, config)

    def db_add_message(self, user, message):
        _m = self.app.server.user_datastore.create_message(message=message)

        active_users = self.app.usermanager.active_logged_in_users()

        for _username in active_users:
            _user = self.app.usermanager.get_user(_username)
            self.app.server.user_datastore.add_message_to_user(_user, _m)

    def append_message(self, message, user):
        data = {
            "message": message,
            "username": user.username,
            "nickname": user.nickname,
            "host": user.current_login_ip,
            "date": datetime.datetime.now().strftime("%H:%M"),
        }

        self.db_add_message(user, message)
        self.app.server.emit("ra_chat_message", data, namespace="/hwr")

    def get_all_messages(self):
        message_list = []

        for _m in current_user.messages:
            message_list.append(
                {
                    "message": _m.message,
                    "username": _m.username,
                    "nickname": _m.nickname,
                    "host": _m.host,
                    "date": _m.at.strftime("%H:%M"),
                }
            )

        return message_list
