from mxcube3 import app as mxcube
from flask import Response
from functools import wraps


def mxlogin_required(func):
    """
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
    """
    @wraps(func)
    def decorated_view(*args, **kwargs):
        if not mxcube.session.proposal_id:
            return Response(status=401)
        return func(*args, **kwargs)
    return decorated_view


def my_execute_entry(self, entry): 
    import queue_entry as qe
    import time
    import random
    from mxcube3 import app as mxcube
    print mxcube.collect
    self.emit('centringAllowed', (False, ))
    self._current_queue_entries.append(entry)
    print "executing on my waaaaay madarikatuak"
    print entry
    if isinstance(entry, qe.DataCollectionQueueEntry):
        time.sleep(1)
        mxcube.collect.emit('collectOscillationStarted')
        time.sleep(2)
        # logging.getLogger('HWR').info('[COLLECT] collectOscillationStarted')
        mxcube.collect.emit('collectStarted')
        time.sleep(2)
        mxcube.collect.emit('collectOscillationFinished')
        time.sleep(2) 
        foo = ['collectOscillationFinished', 'collectOscillationFailed', 'warning']
        mxcube.collect.emit(random.choice(foo))
    elif isinstance(entry, qe.CharacterisationGroupQueueEntry):
        time.sleep(1)
        mxcube.collect.emit('collectOscillationStarted')
        # logging.getLogger('HWR').info('[COLLECT] collectOscillationStarted')
        time.sleep(2)
        foo = ['collectOscillationFinished', 'collectOscillationFailed', 'warning']
        mxcube.collect.emit(random.choice(foo))
    elif isinstance(entry, qe.SampleCentringQueueEntry):
        time.sleep(1)
        mxcube.diffractometer.emit('centringStarted')
        time.sleep(2)
        foo = ['centringSuccessful', 'centringFailed', 'warning']
        mxcube.diffractometer.emit(str(random.choice(foo)))

    # logging.getLogger('HWR').info('Calling execute on my execute_entry method')
    # logging.getLogger('HWR').info('Calling execute on: ' + str(entry))
    # logging.getLogger('HWR').info('Using model: ' + str(entry.get_data_model()))

    for child in entry._queue_entry_list:
        self.my_execute_entry(child)

    self._current_queue_entries.remove(entry)
    print "executing on my waaaaay madarikatuak finished"
