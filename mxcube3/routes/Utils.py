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
    self.emit('centringAllowed', (False, ))
    self._current_queue_entries.append(entry)
    print "executing on my waaaaay madarikatuak"
    print entry
    if isinstance(entry, qe.DataCollectionQueueEntry):
        time.sleep(1)
        # mxcube.collect.emit('collectOscillationStarted')
        # time.sleep(2)
        #logging.getLogger('HWR').info('[COLLECT] collectOscillationStarted')
        mxcube.collect.emit('collectStarted')
        time.sleep(2)
        # mxcube.collect.emit('collectOscillationFinished')
        # time.sleep(2)
        foo = ['collectOscillationFinished', 'collectOscillationFailed', 'warning']
        mxcube.collect.emit(random.choice(foo))
    elif isinstance(entry, qe.CharacterisationGroupQueueEntry):
        time.sleep(1)
        mxcube.collect.emit('collectOscillationStarted')
        #logging.getLogger('HWR').info('[COLLECT] collectOscillationStarted')
        time.sleep(2)
        foo = ['collectOscillationFinished', 'collectOscillationFailed', 'warning']
        mxcube.collect.emit(random.choice(foo))
    elif isinstance(entry, qe.SampleCentringQueueEntry):
        time.sleep(1)
        mxcube.diffractometer.emit('centringStarted')
        time.sleep(2)
        foo = ['centringSuccessful', 'centringFailed', 'warning']
        mxcube.diffractometer.emit(random.choice(foo))
        #mxcube.diffractometer.emit('centringSuccessful')

    #logging.getLogger('HWR').info('Calling execute on my execute_entry method')
    #logging.getLogger('HWR').info('Calling execute on: ' + str(entry))
    #logging.getLogger('HWR').info('Using model: ' + str(entry.get_data_model()))

    for child in entry._queue_entry_list:
        self.my_execute_entry(child)

    self._current_queue_entries.remove(entry)
    print "executing on my waaaaay madarikatuak finished"

def __execute_entry(self, entry):
    print "my execute_entry"
    from routes.Queue import queueList, lastQueueNode
    import logging
    logging.getLogger('queue_exec').info('Executing mxcube3 customized entry')

    node = entry.get_data_model()
    nodeId = node._node_id
    parentId = int(node.get_parent()._node_id)
    #if this is a sample, parentId will be '0'
    if parentId == 0:  # Sample... 0 is your father...
        parentId = nodeId
    lastQueueNode.update({'id': nodeId, 'sample': queueList[parentId]['SampleId']})
    print "enabling....", entry
    #entry.set_enabled(True)
    if not entry.is_enabled() or self._is_stopped:
        logging.getLogger('queue_exec').info('Cannot excute entry: ' + str(nodeId) + '. Entry not enabled or stopped.')
        return
    self.emit('centringAllowed', (False, ))
    self._current_queue_entries.append(entry)
    logging.getLogger('queue_exec').info('Calling execute on: ' + str(entry))
    logging.getLogger('queue_exec').info('Using model: ' + str(entry.get_data_model()))
    if self.is_paused():
        logging.getLogger('user_level_log').info('Queue paused, waiting ...')
        entry.get_view().setText(1, 'Queue paused, waiting')
    self.wait_for_pause_event()
    try:
        # Procedure to be done before main implmentation
        # of task.
        entry.pre_execute()
        entry.execute()

        for child in entry._queue_entry_list:
            self.__execute_entry(child)

    except queue_entry.QueueSkippEntryException:
        # Queue entry, failed, skipp.
        pass
    except (queue_entry.QueueAbortedException, Exception) as ex:
        # Queue entry was aborted in a controlled, way.
        # or in the exception case:
        # Definetly not good state, but call post_execute
        # in anyways, there might be code that cleans up things
        # done in _pre_execute or before the exception in _execute.
        entry.post_execute()
        entry.handle_exception(ex)
        raise ex
    else:
        entry.post_execute()

    self._current_queue_entries.remove(entry)
