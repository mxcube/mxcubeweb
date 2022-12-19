import datetime

from flask_login import current_user

from mxcube3.core.components.component_base import ComponentBase


class Chat(ComponentBase):
    def __init__(self, app, config):
        super().__init__(app, config)

    def db_add_message(self, user, message):
        _m = self.app.server.user_datastore.create_message(message=message)
        self.app.server.user_datastore.add_message_to_user(user, _m)

    def append_message(self, message, username):
        user = current_user.nickname

        data = {
            "message": message,
            "username": username,
            "nickname": user,
            "host": current_user.current_login_ip,
            "date": datetime.datetime.now().strftime("%H:%M"),
        }

        self.db_add_message(current_user, message)
        self.app.server.emit("ra_chat_message", data, namespace="/hwr")

    def get_all_messages(self):
        message_list = []

        for _m in self.app.server.user_datastore.get_all_messages():
            user = _m.users.all()[0]

            message_list.append(
                {
                    "message": _m.message,
                    "username": user.username,
                    "nickname": user.nickname,
                    "host": user.current_login_ip,
                    "date": _m.at.strftime("%H:%M"),
                }
            )

        return message_list
