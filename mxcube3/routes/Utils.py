from mxcube3 import app as mxcube
from flask import Response
from functools import wraps

def mxlogin_required(func):
    '''
    If you decorate a view with this, it will ensure that the current user is
    logged in calling the actual view. It checks the session hardware object
    to see if the proposal_id has a number (the routes.login does that)
    TODO: how much secure is this? need to implement OAuth2 as well
    For example::

        @app.route('/post')
        @mxlogin_required
        def post():
            pass

    :param func: The view function to decorate.
    :type func: function
    '''
    @wraps(func)
    def decorated_view(*args, **kwargs):
        if not mxcube.session.proposal_id:
            return Response(status = 401)
        return func(*args, **kwargs)
    return decorated_view