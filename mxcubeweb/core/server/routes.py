from mxcubeweb.core.server.resource_handler import ResourceHandlerFactory
from mxcubeweb.routes.csp_report import init_route as init_csp_route
from mxcubeweb.routes.harvester import init_route as init_harvester_route
from mxcubeweb.routes.login import init_route as init_login_route
from mxcubeweb.routes.main import init_route as init_main_route
from mxcubeweb.routes.queue import init_route as init_queue_route
from mxcubeweb.routes.ra import init_route as init_ra_route
from mxcubeweb.routes.workflow import init_route as init_workflow_route


def register_routes(server, mxcube_app, cfg):  # noqa: ARG001
    url_root_prefix = "/mxcube/api/v0.1"  # cfg.flask.API_PREFIX

    _register_route(server, init_csp_route, mxcube_app, f"{url_root_prefix}/csp")
    _register_route(server, init_login_route, mxcube_app, f"{url_root_prefix}/login")
    _register_route(server, init_main_route, mxcube_app, f"{url_root_prefix}")
    _register_route(server, init_queue_route, mxcube_app, f"{url_root_prefix}/queue")
    _register_route(server, init_ra_route, mxcube_app, f"{url_root_prefix}/ra")
    _register_route(
        server, init_workflow_route, mxcube_app, f"{url_root_prefix}/workflow"
    )
    _register_route(
        server, init_harvester_route, mxcube_app, f"{url_root_prefix}/harvester"
    )

    ResourceHandlerFactory.register_with_server(server.flask)


def _register_route(server, init_blueprint_fn, app, url_prefix):
    bp = init_blueprint_fn(app, server, url_prefix)
    server.flask.register_blueprint(bp)

    for key, function in server.flask.view_functions.items():
        if key.startswith(bp.name) and not hasattr(function, "tags"):
            function.tags = [bp.name.title().replace("_", " ")]

    return bp
