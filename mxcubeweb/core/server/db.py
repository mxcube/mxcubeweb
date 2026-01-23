from mxcubeweb.core.components.user.database import UserDatastore, init_db
from mxcubeweb.core.models.usermodels import Message, Role, User


def init_database(cfg):
    db_session = init_db(cfg.flask.USER_DB_PATH)

    user_datastore = UserDatastore(
        db_session,
        User,
        Role,
        message_model=Message,
    )

    return db_session, user_datastore
