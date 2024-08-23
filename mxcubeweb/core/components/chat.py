import datetime

from flask_login import current_user

from mxcubeweb.core.components.component_base import ComponentBase


class Chat(ComponentBase):
    def __init__(self, app, config):
        super().__init__(app, config)

    def db_add_message(self, user, message, from_user):
        _m = self.app.server.user_datastore.create_message(
            message=message,
            from_username=from_user.username,
            from_nickname=from_user.nickname,
            from_host=from_user.current_login_ip,
        )

        active_users = self.app.usermanager.active_logged_in_users()

        for _username in active_users:
            _user = self.app.usermanager.get_user(_username)
            self.app.server.user_datastore.add_message_to_user(
                _user,
                _m,
            )

    def append_message(self, message, user):
        data = {
            "message": message,
            "username": user.username,
            "nickname": user.nickname,
            "host": user.current_login_ip,
            "date": datetime.datetime.now().strftime("%H:%M"),
        }

        self.db_add_message(user, message, user)
        self.app.server.emit("ra_chat_message", data, namespace="/hwr")

    def get_all_messages(self):
        message_list = []

        for _m in current_user.messages:
            message_list.append(
                {
                    "message": _m.message,
                    "username": _m.from_username,
                    "nickname": _m.from_nickname,
                    "host": _m.from_host,
                    "date": _m.at.strftime("%H:%M"),
                    "read": _m.read,
                }
            )

        return message_list[-100:]

    def set_all_messages_read(self):
        for _m in current_user.messages:
            _m.read = True

        self.app.server.user_datastore.commit()
