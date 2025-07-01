import re

from flask import Blueprint, jsonify
from pydantic.v1 import (
    BaseModel,
)

DEFAULT_RESPONSES = {
    "200": {"description": "Success"},
    "400": {"description": "Invalid input data"},
    "404": {"description": "Invalid or non existing object"},
    "500": {"description": "Error calling method on adapter"},
}


def to_openapi_path(route: str) -> str:
    """
    Adds the "{" "}" to the route arguments that OpenAPI requires

    Args:
        route(str): The route

    Returns:
        returns: the openapi path, with the {} srounding the arguments
    """
    _s = re.sub(r"<[^:]+:", "{", route)

    # Replace closing ">" with "}"
    return _s.replace(">", "}")


class OpenAPISpec:
    def __init__(self, name: str, url_prefix, api_version: str, api_title: str):
        self.bp = Blueprint(name, __name__, url_prefix=url_prefix)

        self._openapi_spec = {
            "openapi": "3.0.0",
            "info": {"title": api_title, "version": api_version},
            "paths": {},
            "components": {"schemas": {}},
        }

        self.bp.add_url_rule(
            "/openapi.json", "openapi", self._serve_openapi, methods=["GET"]
        )
        self.bp.add_url_rule("/docs", "redoc_ui", self._serve_redoc_ui, methods=["GET"])
        self.bp.add_url_rule(
            "/docs_redoc", "redoc_ui", self._serve_redoc_ui, methods=["GET"]
        )
        self.bp.add_url_rule(
            "/docs_swagger", "swagger_ui", self._serve_swagger_ui, methods=["GET"]
        )
        self.bp.add_url_rule(
            "/docs_elements", "elements_ui", self._serve_elements_ui, methods=["GET"]
        )

    def add_openapi_path(
        self,
        prefix: str,
        route: str,
        export: dict[str, str],
        http_method: str,
        view_func,
    ):
        """Adds API endpoints to OpenAPI spec."""
        open_api_path = to_openapi_path(prefix + route)

        self._openapi_spec["paths"].setdefault(open_api_path, {})[
            http_method.lower()
        ] = {
            "summary": f"{http_method} {export['attr']}",
            "description": str(view_func.__doc__),
            "tags": [prefix],
            "parameters": [
                {
                    "name": "object_id",
                    "in": "path",
                    "required": True,
                    "schema": {"type": "string"},
                }
            ],
            "requestBody": {},
            "responses": dict(DEFAULT_RESPONSES),
        }

    def add_openapi_schema(
        self, prefix: str, route: str, http_method: str, model: type[BaseModel]
    ):
        """Adds Pydantic model definitions to OpenAPI schema."""

        open_api_path = to_openapi_path(prefix + route)
        schema_name = model.__name__

        if schema_name not in self._openapi_spec["components"]["schemas"]:
            self._openapi_spec["components"]["schemas"][schema_name] = model.schema()

        self._openapi_spec["paths"][open_api_path][http_method.lower()][
            "requestBody"
        ].update(
            {
                "description": model.__name__,
                "required": True,
                "content": {
                    "application/json": {
                        "schema": {"$ref": f"#/components/schemas/{model.__name__}"}
                    }
                },
            }
        )

    def add_openapi_response(
        self, prefix: str, route: str, http_method: str, model: type[BaseModel]
    ):
        """Adds response schema to OpenAPI documentation."""

        open_api_path = to_openapi_path(prefix + route)
        schema_name = model.__name__ if isinstance(model, BaseModel) else None

        if schema_name:
            if schema_name not in self._openapi_spec["components"]["schemas"]:
                self._openapi_spec["components"]["schemas"][schema_name] = (
                    model.schema()
                )

            self._openapi_spec["paths"][open_api_path][http_method.lower()][
                "responses"
            ]["200"] = {
                "description": "Successful response",
                "content": {
                    "application/json": {
                        "schema": {"$ref": f"#/components/schemas/{model.__name__}"}
                    }
                },
            }

    def _serve_openapi(self):
        return jsonify(self._openapi_spec)

    def _serve_redoc_ui(self):
        """Serves the ReDoc UI for OpenAPI documentation."""
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Redoc</title>
            <!-- needed for adaptive design -->
            <meta charset="utf-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">

            <!--
            Redoc doesn't change outer page styles
            -->
            <style>
            body {
                margin: 0;
                padding: 0;
            }
            </style>
        </head>
        <body>
            <redoc spec-url='openapi.json'></redoc>
            <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"> </script>
        </body>
        </html>
        """  # noqa: E501

    def _serve_swagger_ui(self):
        """Serves the Swagger UI for OpenAPI documentation."""
        return """
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="SwaggerUI" />
        <title>SwaggerUI</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
        </head>
        <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
        <script>
        window.onload = () => {
            window.ui = SwaggerUIBundle({
            url: 'openapi.json',
            dom_id: '#swagger-ui',
            });
        };
        </script>
        </body>
        </html>
        """  # noqa: E501

    def _serve_elements_ui(self):
        """Serves the Elements UI for OpenAPI documentation."""
        return """
            <!doctype html>
            <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
                <title>Elements in HTML</title>

                <script src="https://unpkg.com/@stoplight/elements/web-components.min.js"></script>
                <link rel="stylesheet" href="https://unpkg.com/@stoplight/elements/styles.min.css">
            </head>
            <body>

                <elements-api
                apiDescriptionUrl="openapi.json"
                router="hash"
                />

            </body>
            </html>
        """  # noqa: E501
