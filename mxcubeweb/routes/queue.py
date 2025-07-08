import json

from flask import (
    Blueprint,
    Response,
    jsonify,
    request,
)
from mxcubecore import HardwareRepository as HWR

from mxcubeweb.core.models.generic import SimpleNameValue


# Disabling C901 function is too complex (19)
def init_route(app, server, url_prefix):  # noqa: C901
    bp = Blueprint("queue", __name__, url_prefix=url_prefix)

    @bp.route("/start", methods=["PUT"])
    @server.require_control
    @server.restrict
    def queue_start():
        """
        Start execution of the queue.

        :returns: Respons object, status code set to:
                200: On success
                409: Queue could not be started
        """
        sid = request.get_json().get("sid", None)
        app.queue.queue_start(sid)

        return Response(status=200)

    @bp.route("/stop", methods=["PUT"])
    @server.require_control
    @server.restrict
    def queue_stop():
        """
        Stop execution of the queue.

        :returns: Response object status code set to:
                200: On success
                409: Queue could not be stopped
        """
        app.queue.queue_stop()
        return Response(status=200)

    @bp.route("/abort", methods=["PUT"])
    @server.require_control
    @server.restrict
    def queue_abort():
        """
        Abort execution of the queue.

        :returns: Response object, status code set to:
                200 On success
                409 queue could not be aborted
        """
        HWR.beamline.queue_manager.stop()
        return Response(status=200)

    @bp.route("/pause", methods=["PUT"])
    @server.require_control
    @server.restrict
    def queue_pause():
        """
        Pause the execution of the queue

        :returns: Response object, status code set to:
                200: On success
                409: Queue could not be paused
        """
        msg = app.queue.queue_pause()
        server.emit("queue", msg, namespace="/hwr")
        return Response(status=200)

    @bp.route("/unpause", methods=["PUT"])
    @server.require_control
    @server.restrict
    def queue_unpause():
        """
        Unpause execution of the queue

        :returns: Response object, status code set to:
                200: On success
                409: Queue could not be unpause
        """
        msg = app.queue.queue_unpause()
        server.emit("queue", msg, namespace="/hwr")
        return Response(status=200)

    @bp.route("/clear", methods=["PUT"])
    @server.require_control
    @server.restrict
    def queue_clear():
        """
        Clear the queue.

        :returns: Response object, status code set to:
                200: On success
                409: Queue could not be started
        """
        app.queue.queue_clear()
        return Response(status=200)

    @bp.route("/", methods=["GET"])
    @server.restrict
    def queue_get():
        """
        Get the queue
        :returns: Response object response Content-Type: application/json, json
                object containing the queue on the format returned by
                queue_to_dict. The status code is set to:

                200: On success
                409: On error, could not retrieve queue
        """
        resp = jsonify(app.queue.queue_to_dict(include_lims_data=True))
        resp.status_code = 200
        return resp

    @bp.route("/queue_state", methods=["GET"])
    @server.restrict
    def queue_get_state():
        """
        Get the queue.

        :returns: Response object response Content-Type: application/json, json
                object containing the queue state. The status code is set to:

                200: On success
                409: On error, could not retrieve queue
        """
        resp = jsonify(app.queue.get_queue_state())
        resp.status_code = 200
        return resp

    @bp.route("/<sid>/<tindex>/execute", methods=["PUT"])
    @server.require_control
    @server.restrict
    def execute_entry_with_id(sid, tindex):
        """
        Execute the entry at position (sampleID, task index) in queue
        :param str sid: sampleID
        :param int tindex: task index of task within sample with id sampleID

        :statuscode: 200, no error
                    409, queue entry could not be executed
        """
        try:
            app.queue.execute_entry_with_id(sid, tindex)
        except Exception:
            return Response(status=409)
        else:
            return Response(status=200)

    @bp.route("/", methods=["PUT"])
    @server.require_control
    @server.restrict
    def set_queue():
        app.queue.set_queue(request.get_json())
        return Response(status=200)

    @bp.route("/", methods=["POST"])
    @server.require_control
    @server.restrict
    def queue_add_item():
        tasks = request.get_json()

        queue = app.queue.queue_add_item(tasks)
        sample_list = app.lims.sample_list_get(current_queue=queue)

        resp = jsonify(
            {
                "sampleOrder": queue.get("sample_order", []),
                "sampleList": sample_list.get("sampleList", {}),
            }
        )
        resp.status_code = 200

        server.emit(
            "queue", {"Signal": "update", "message": "observers"}, namespace="/hwr"
        )

        return resp

    @bp.route("/<sqid>/<tqid>", methods=["POST"])
    @server.require_control
    @server.restrict
    def queue_update_item(sqid, tqid):
        data = request.get_json()

        model = app.queue.queue_update_item(sqid, tqid, data)

        resp = jsonify(app.queue.queue_to_dict([model]))
        resp.status_code = 200

        server.emit(
            "queue", {"Signal": "update", "message": "observers"}, namespace="/hwr"
        )

        return resp

    @bp.route("/delete", methods=["POST"])
    @server.require_control
    @server.restrict
    def queue_delete_item():
        item_pos_list = request.get_json()

        app.queue.delete_entry_at(item_pos_list)
        server.emit(
            "queue", {"Signal": "update", "message": "observers"}, namespace="/hwr"
        )

        return Response(status=200)

    @bp.route("/set_enabled", methods=["POST"])
    @server.require_control
    @server.restrict
    def queue_enable_item():
        params = request.get_json()
        qid_list = params.get("qidList", None)
        enabled = params.get("enabled", False)
        app.queue.queue_enable_item(qid_list, enabled)
        server.emit(
            "queue", {"Signal": "update", "message": "observers"}, namespace="/hwr"
        )

        return Response(status=200)

    @bp.route("/<sid>/<ti1>/<ti2>/swap", methods=["POST"])
    @server.require_control
    @server.restrict
    def queue_swap_task_item(sid, ti1, ti2):
        app.queue.swap_task_entry(sid, int(ti1), int(ti2))
        server.emit(
            "queue", {"Signal": "update", "message": "observers"}, namespace="/hwr"
        )

        return Response(status=200)

    @bp.route("/<sample_id>", methods=["PUT"])
    @server.require_control
    @server.restrict
    def update_sample(sample_id):
        """
        Update a sample info
            :parameter node_id: entry identifier, integer. It can be a sample
                or a task within a sample
            :request Content-Type: application/json, object containing the
                parameter(s) to be updated, any parameter not sent will
                not be modified.
            :statuscode: 200: no error
            :statuscode: 409: sample info could not be updated, possibly because
                the given sample does not exist in the queue
        """
        params = json.loads(request.data)
        node_id = int(sample_id)

        try:
            app.queue.update_sample(node_id, params)
            resp = jsonify({"QueueId": node_id})
            resp.status_code = 200
            return resp
        except Exception:
            return Response(status=409)

    @bp.route("/available_tasks", methods=["GET"])
    @server.restrict
    def get_avilable_tasks():
        """
        Returns a list of all available tasks
        """
        resp = jsonify(app.queue.get_available_tasks())

        resp.status_code = 200
        return resp

    @bp.route("/update_dependent_field", methods=["POST"])
    @server.restrict
    def update_dependent_field():
        """
        Updates the dependent fields of the given task
        """
        args = request.get_json()
        resp = jsonify(
            app.queue.update_dependent_field(args["task_name"], args["field_data"])
        )

        resp.status_code = 200
        return resp

    @bp.route("/automount", methods=["POST"])
    @server.require_control
    @server.restrict
    def set_autmount():
        data = request.get_json()
        app.queue.set_auto_mount_sample(data.get("automount", False))
        resp = jsonify(data)
        resp.status_code = 200
        return resp

    @bp.route("/num_snapshots", methods=["PUT"])
    @server.require_control
    @server.restrict
    def set_num_snapshots():
        data = request.get_json()
        app.queue.set_num_snapshots(data.get("numSnapshots", app.DEFAULT_NUM_SNAPSHOTS))
        resp = jsonify(
            {"numSnapshots": data.get("numSnapshots", app.DEFAULT_NUM_SNAPSHOTS)}
        )
        resp.status_code = 200

        return resp

    @bp.route("/group_folder", methods=["POST"])
    @server.require_control
    @server.restrict
    def set_group_folder():
        path = request.get_json().get("path", "")

        resp = jsonify(app.queue.set_group_folder(path))
        resp.status_code = 200

        return resp

    @bp.route("/group_folder", methods=["GET"])
    @server.restrict
    def get_group_folder():
        resp = jsonify({"path": HWR.beamline.session.get_group_name()})
        resp.status_code = 200

        return resp

    @bp.route("/auto_add_diffplan", methods=["POST"])
    @server.require_control
    @server.restrict
    def set_autoadd():
        data = request.get_json()
        app.queue.set_auto_add_diffplan(data.get("autoadddiffplan", False))
        resp = jsonify(data)
        resp.status_code = 200
        return resp

    @bp.route("/setting", methods=["POST"])
    @server.require_control
    @server.restrict
    def set_setting():
        result = app.queue.set_setting(SimpleNameValue(**request.json))

        return jsonify({result[0]: result[1]}) if result else Response(status=409)

    return bp
