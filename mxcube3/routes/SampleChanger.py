import signals

from flask import Response, jsonify, request
from mxcube3 import app as mxcube
from . import limsutils
from . import scutils

from .qutils import UNCOLLECTED, SAMPLE_MOUNTED, COLLECTED
from .scutils import set_current_sample


def init_signals():
    """Initialize hwobj signals."""
    mxcube.sample_changer.connect('stateChanged', signals.sc_state_changed)
    mxcube.sample_changer.connect('loadedSampleChanged', signals.loaded_sample_changed)
    mxcube.sample_changer.connect('contentsUpdated', signals.sc_contents_update)

    if mxcube.sc_maintenance is not None:
        mxcube.sc_maintenance.connect('globalStateChanged', signals.sc_maintenance_update)


def get_sc_contents():
    def _getElementStatus(e):
        if e.isLeaf():
            if e.isLoaded():
                return "Loaded"
            if e.hasBeenLoaded():
                return "Used"
        if e.isPresent():
            return "Present"
        return ""

    def _getElementID(e):
        if e == mxcube.sample_changer:
            if e.getToken() is not None:
                return e.getToken()
        else:
            if e.getID() is not None:
                return e.getID()
        return ""

    def _addElement(parent, element):
        new_element = {"name": element.getAddress(),
                       "status": _getElementStatus(element),
                       "id": _getElementID(element),
                       "selected": element.isSelected()}

        parent.setdefault("children", []).append(new_element)

        if not element.isLeaf():
            for e in element.getComponents():
                _addElement(new_element, e)

    root_name = mxcube.sample_changer.getAddress()

    contents = {"name": root_name}

    for element in mxcube.sample_changer.getComponents():
        if element.isPresent():
            _addElement(contents, element)

    return contents


@mxcube.route("/mxcube/api/v0.1/sample_changer/samples_list", methods=['GET'])
@mxcube.restrict
def get_sample_list():
    scutils.get_sample_list()
    return jsonify(limsutils.sample_list_get())


@mxcube.route("/mxcube/api/v0.1/sample_changer/state", methods=['GET'])
@mxcube.restrict
def get_sc_state():
    state = mxcube.sample_changer.getStatus().upper()

    return jsonify({'state': state})

@mxcube.route("/mxcube/api/v0.1/sample_changer/loaded_sample", methods=['GET'])
@mxcube.restrict
def get_loaded_sample():
    sample = mxcube.sample_changer.getLoadedSample()

    if sample is not None:
       address = sample.getAddress()
       barcode = sample.getID()
    else:
       address = ''
       barcode = ''

    return jsonify({'address': address, 'barcode': barcode})

@mxcube.route("/mxcube/api/v0.1/sample_changer/contents", methods=['GET'])
@mxcube.restrict
def get_sc_contents_view():
    return jsonify(get_sc_contents())

@mxcube.route("/mxcube/api/v0.1/sample_changer/select/<loc>", methods=['GET'])
@mxcube.restrict
def select_location(loc):
    mxcube.sample_changer.select(loc)
    return get_sc_contents()

@mxcube.route("/mxcube/api/v0.1/sample_changer/scan/<loc>", methods=['GET'])
@mxcube.restrict
def scan_location(loc):
    # do a recursive scan
    mxcube.sample_changer.scan(loc, True)
    return get_sc_contents()

@mxcube.route("/mxcube/api/v0.1/sample_changer/mount/<loc>", methods=['GET'])
@mxcube.restrict
def mount_sample(loc):
    scutils.set_sample_to_be_mounted(loc)
    mxcube.sample_changer.load(loc)
    set_current_sample(loc)

    return jsonify(get_sc_contents())

@mxcube.route("/mxcube/api/v0.1/sample_changer/unmount/<loc>", methods=['GET'])
@mxcube.restrict
def unmount_sample(loc):
    mxcube.sample_changer.unload(loc, wait=True)
    set_current_sample(None)
    return jsonify(get_sc_contents())

@mxcube.route("/mxcube/api/v0.1/sample_changer/unmount_current/", methods=['GET'])
@mxcube.restrict
def unmount_current():
    mxcube.sample_changer.unload(None, wait=True)
    set_current_sample(None)
    return jsonify(get_sc_contents())

@mxcube.route("/mxcube/api/v0.1/sample_changer/mount", methods=["POST"])
@mxcube.restrict
def mount_sample_clean_up():
    try:
        scutils.mount_sample_clean_up(request.get_json())
    except Exception:
        return Response(status=409)
    else:
        return Response(status=200)

@mxcube.route("/mxcube/api/v0.1/sample_changer/unmount", methods=['POST'])
@mxcube.restrict
def unmount_sample_clean_up():
    try:
        scutils.unmount_sample_clean_up(request.get_json())
    except Exception:
        return Response(status=409)
    else:
        return Response(status=200)

@mxcube.route("/mxcube/api/v0.1/sample_changer/get_maintenance_cmds", methods=['GET'])
@mxcube.restrict
def get_maintenance_cmds():
    try:
        if mxcube.sc_maintenance is not None:
            ret = mxcube.sc_maintenance.get_cmd_info()
        else:
            ret = "SC maintenance controller not defined"
    except Exception, exc:
        return Response(status=409)
    else:
        return jsonify(cmds=ret)

@mxcube.route("/mxcube/api/v0.1/sample_changer/get_global_state", methods=['GET'])
@mxcube.restrict
def get_global_state():
    try:
        if mxcube.sc_maintenance is not None:
            ret = mxcube.sc_maintenance.get_global_state()
            state, cmdstate, msg = ret
        else:
            return jsonify({})
    except Exception, exc:
        return Response(status=409)
    else:
        return jsonify(state=state, commands_state=cmdstate, message=msg)

@mxcube.route("/mxcube/api/v0.1/sample_changer/get_initial_state", methods=['GET'])
@mxcube.restrict
def get_initial_state():
    if mxcube.sc_maintenance is not None:
        ret = mxcube.sc_maintenance.get_global_state()
        global_state, cmdstate, msg = ret

        cmds = mxcube.sc_maintenance.get_cmd_info()

    else:
        global_state = {}
        cmdstate = "SC maintenance controller not defined"
        cmds = []
        msg = ''

    contents = get_sc_contents()
    sample = mxcube.sample_changer.getLoadedSample()

    if sample is not None:
       address = sample.getAddress()
       barcode = sample.getID()
    else:
       address = ''
       barcode = ''

    loaded_sample = {'address': address, 'barcode': barcode}
    state = mxcube.sample_changer.getStatus().upper()

    initial_state = {'state': state,
                     'loaded_sample': loaded_sample,
                     'contents': contents,
                     'global_state': {'global_state': global_state, 'commands_state': cmdstate},
                     'cmds': {'cmds': cmds},
                     'msg' : msg
                    }
    return jsonify(initial_state)

@mxcube.route("/mxcube/api/v0.1/sample_changer/send_command/<cmdparts>", methods=['GET'])
@mxcube.restrict
def send_command(cmdparts):
    try:
        ret = mxcube.sc_maintenance.send_command(cmdparts)
    except Exception, exc:
        msg = str(exc);
        msg = msg.replace("\n", " - ")
        return 'Cannot execute command', 406, {'Content-Type': 'application/json',
                                                'message': msg,
                                                }
    else:
        return jsonify(response=ret)
