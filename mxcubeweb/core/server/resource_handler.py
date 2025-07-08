import contextlib
import logging
import re
from collections.abc import Callable
from functools import reduce
from typing import ClassVar

from flask import Blueprint, Response, jsonify, request
from pydantic.v1 import (
    BaseModel,
    ValidationError,
)

from mxcubeweb.core.server.openapidoc import OpenAPISpec


def valid_object_id(object_id: str) -> bool:
    """Validate that ``object_id`` contains only ``A-Z``, ``a-z``, and ``.`` , ``_``.

    Args:
        object_id (str): The string to validate.

    Returns:
        bool: ``True`` if the string is valid, ``False`` otherwise.
    """
    return bool(re.fullmatch(r"[A-Za-z._]+", object_id))


def validate_input_str(input_string: str) -> bool:
    """
    Validates that the input string contains only alphanumeric characters
    and/or dot (.).

    Args:
        input_string (str): The string to validate.

    Returns:
        bool: True if the string is valid, False otherwise.
    """
    pattern = r"^[a-zA-Z0-9._]+$"
    return bool(re.match(pattern, input_string))


def assert_valid_type_arguments(func):
    """Make sure that all the arguments of func are typehinted as pydantic model,
    float, int, str or bool
    """
    annotations = func.__annotations__

    # Loop through annotations and validate parameters from the request
    for param_name, param_type in annotations.items():
        if param_name == "return":
            continue

        # Raise RuntimerError If it's not a Pydantic model, float, int, str or bool
        if not issubclass(param_type, BaseModel | float | int | str | bool):
            msg = f"Argument {param_name} of {func} are not a pydantic model, float, \
                int or str"
            raise TypeError(msg)


log = logging.getLogger("MX3.HWR")


class ResourceHandlerFactory:
    _handlers: ClassVar[dict] = {}

    @classmethod
    def create_or_get(  # noqa: PLR0913
        cls,
        name: str,
        url_prefix: str,
        handler_dict: dict[str, object],
        app: object,
        exports: list[dict[str, str]],
        commands: list[str],
        attributes: list[str],
        handler_type="adapter",
    ) -> object:
        """
        Return existing handler if it exists, otherwise create and register a new one.
        """
        if name in cls._handlers:
            return cls._handlers[name]

        if handler_type == "component":
            resource_handler_cls = ComponentResourceHandler
        else:
            resource_handler_cls = AdapterResourceHandler

        handler = resource_handler_cls(
            name, url_prefix, handler_dict, app, exports, commands, attributes
        )
        cls._handlers[name] = handler
        return handler

    @classmethod
    def get_handler(cls, name: str) -> object | None:
        return cls._handlers.get(name)

    @classmethod
    def unregister(cls, name: str) -> bool:
        if name in cls._handlers:
            del cls._handlers[name]
            return True
        return False

    @classmethod
    def unregister_all(cls) -> bool:
        for key in cls.all_handlers():
            cls.unregister(key)

    @classmethod
    def all_handlers(cls) -> dict[str, object]:
        return cls._handlers.copy()

    @classmethod
    def register_with_server(cls, flask_server):
        for rh in cls.all_handlers().values():
            rh.register_blueprint(flask_server)


class ResourceHandler:
    openapi_spec = OpenAPISpec("docs", "/apidocs", "1.0.0", "MXCuBE Adapter API")

    def __init__(  # noqa: PLR0913
        self,
        name: str,
        url_prefix: str,
        handler_dict: dict[str, object],
        app: object,
        exports: list[dict[str, str]],
        commands: list[str],
        attributes: list[str],
    ) -> None:
        """
        Initialize the AdapterResourceHandler.

        Args:
            name: Name of the blueprint.
            url_prefix: URL prefix for the blueprint.
            handler_dict: Dictionary mapping object IDs to adapter objects.
            app: mxcube app object, providing acccess to mxcubecore and server
            exports: Predefined list of exported commands/attributes.
            commands: List of command names to export.
            attributes: List of attribute names to export.
        """
        self._bp = Blueprint(name, name, url_prefix=url_prefix)
        self._handler_dict = handler_dict
        self._server = app.server  # Store the server object to access its decorators
        self._app = app
        self._url_prefix = url_prefix
        self._exports = exports.copy()

        # Add export definitions for attributes and commands
        self._add_attribute_exports(attributes)
        self._add_command_exports(commands)

    @property
    def exports(self):
        return self._exports

    @property
    def commands(self):
        return [export for export in self._exports if export["method"] == "PUT"]

    @property
    def attributes(self):
        return [export for export in self._exports if export["method"] == "GET"]

    def _create_routes_for_exports(self) -> None:
        """
        Creates Flask routes dynamically for each exported command or attribute.
        """
        for export in self._exports:
            route = self._get_handler_object_route(export)
            # For the time being we enforce the usage of pydantic models, int, float or
            # str for arguments to ensure safe validation of input. We rely on that
            # the pydantic models used are well specified. We validate the actual data
            # later.
            self._assert_valid_type_arguments(export)

            # Create the api doc before the view functions are created
            self._create_openapi_doc_for_view(route, export)

            # Create the view function dynamically
            view_func = self._create_view_func(export)

            # Apply decorators to the view function
            view_func = self._apply_decorators(view_func, export["decorators"])

            # Register route
            self._bp.add_url_rule(
                route,
                view_func=view_func,
                methods=[export["method"]],
                endpoint=export["attr"],
            )
            msg = (
                f"Registerd {route} to blueprint '{self._bp.name}' ({self._url_prefix})"
            )
            log.debug(msg)

    def _apply_decorators(
        self, view_func: Callable, decorators: list[Callable]
    ) -> Callable:
        """
        Applies a list of decorators to a view function.

        Args:
            view_func (Callable): The view function.
            decorators (List[Callable]): List of decorators.

        Returns:
            Callable: Decorated function.
        """
        return reduce(lambda f, decorator: decorator(f), decorators, view_func)

    def _create_view_func(self, export: dict[str, str]) -> Callable:
        """
        Creates a Flask view function for handling requests dynamically.

        Args:
            route (str): URL route.
            export (dict): Export definition with method, attr, and decorators.

        Returns:
            Callable: The view function.
        """

    def _validate_params_and_call_handler_func(
        self,
        export: dict[str, str],
        handler_obj: object,
    ) -> dict | Response:
        """
        Validates parameters from the request and calls the handler function.
        Args:
            export: Export definition with method, attr, and decorators.
            handler_obj: The handler object to call.
        Returns:
            The result of the handler function call or an error response.
        """

        # Get the method and its annotations
        handler_func = getattr(handler_obj, export["attr"])
        annotations = handler_func.__annotations__
        http_method = export["method"]

        # Prepare data for all required arguments
        validated_data = {}
        param_data = self._extract_param_data(http_method)

        # Validate parameters from the request
        for param_name, param_type in annotations.items():
            if param_name == "return":  # Skip the return annotation
                continue

            try:
                if param_data is not None:
                    validated_data[param_name] = self._validate_param_data(
                        param_name, param_type, param_data
                    )
            except (ValueError, TypeError) as ex:
                log.error(str(ex))  # noqa: TRY400
                msg = f"Invalid input for '{param_name}'"
                return (
                    jsonify({"error": msg}),
                    400,
                )

        # Call the view function with validated data
        try:
            result = handler_func(**validated_data)
        except Exception:
            msg = "Exception raised when calling view function"
            log.exception(msg)
            return jsonify({"error": msg}), 500
        else:
            # Handle and serialize the result
            return self._handle_view_result(result)

    def _assert_valid_type_arguments(self, export):
        """
        Ensures the method referenced in the export uses Pydantic arguments.
        """
        obj = next(iter(self._handler_dict.values()))
        assert_valid_type_arguments(getattr(obj, export["attr"]))

    def _create_openapi_doc_for_view(self, route, export):
        """
        Adds OpenAPI documentation for a route.
        """
        # Get the first adapter object, the signature are all the same (same class) so
        # any will do for documentation purpose
        http_method = export["method"]
        obj = next(iter(self._handler_dict.values()))
        view_func = getattr(obj, export["attr"])
        annotations = view_func.__annotations__

        # Add OpenAPI documentation root for route
        self.openapi_spec.add_openapi_path(
            self._url_prefix, route, export, http_method, view_func
        )

        # Loop through annotations add response and arguments to OpenAPI spec for route
        for param_name, param_type in annotations.items():
            if param_name == "return":
                self.openapi_spec.add_openapi_response(
                    self._url_prefix, route, http_method, param_type
                )
                continue

            # If it's a Pydantic model, document
            if issubclass(param_type, BaseModel):
                self.openapi_spec.add_openapi_schema(
                    self._url_prefix, route, http_method, param_type
                )

    def _extract_param_data(self, http_method) -> dict:
        """
        Extracts parameter data from request (JSON, query params, or form).

        Returns:
            Extracted data
        """
        # Prioritize JSON body, then query params, then form data
        # We are not really using query or form data, but they are added for
        # completness
        if http_method == "GET":
            return request.args
        return request.json or request.args.to_dict() or request.form.to_dict()

    def _validate_param_data(
        self, param_name: str, param_type: type, param_data: any
    ) -> dict | int | float | bool | str:
        """
        Validates a single parameter based on its expected type.

        Raises:
            ValueError: If validation fails or type is unsupported.
        """
        # If it's a Pydantic model, validate it
        if issubclass(param_type, BaseModel):
            try:
                # We only handle a single argument when using Pydantic models
                # We handle complex structures by checking if param_data
                # contains a value or a dictionary.
                if isinstance(param_data[param_name], dict):
                    return param_type.parse_obj(param_data[param_name])

                # If its a single value and Pydantic model, pass the entire
                # Pydantic model
                return param_type.parse_obj(param_data)
            except ValidationError as e:
                msg = f"Invalid input for '{param_name}' '{e.errors}'"
                raise ValueError(msg) from e

        elif isinstance(param_data[param_name], int | float | bool):
            # We consider int, float and bool safe and limits handled
            # by adapter or HardwareObject
            return param_data[param_name]
        elif isinstance(param_data[param_name], str):
            # We consider str safe if it contains, alpha numerical
            # characters and dot "." and underscore "_"
            if validate_input_str(param_data[param_name]):
                return param_data[param_name]

            msg = f"Invalid string input for '{param_data[param_name]}'"
            raise ValueError(msg)

        else:
            # We could handle this case as well but we would need to be
            # carefull with how the data is validated
            msg = f"No model defined for '{param_name}'"
            raise TypeError(msg)

    def _handle_view_result(self, result: object) -> dict | Response:
        """
        Handles the result of a view function, ensuring that it is serializable and
        properly formatted.

        Returns:
            Flask Response: JSON response.
        """
        try:
            # Check if the result is a Pydantic model or any other serializable object
            if isinstance(result, BaseModel):
                # Convert Pydantic model to a dict
                result = result.dict()
            elif isinstance(result, dict):
                # If it's already a dictionary, it's ready for JSON serialization
                pass
            elif hasattr(result, "__dict__"):
                # If the result has __dict__ attribute (e.g., an object), convert to
                # dict
                result = result.__dict__
            elif isinstance(result, str | int | float | bool | list | tuple):
                # If it's already a simple type, no conversion needed
                result = {"return": result}
            else:
                return (
                    jsonify(
                        {
                            "error": (
                                f"Return value of type '{type(result)}' is not"
                                " serializable"
                            )
                        }
                    ),
                    500,
                )

            # Return the result as JSON (mime-type: application/json, code: 200)
            return jsonify(result)
        except Exception:
            msg = "An error occurred while processing the response."
            log.exception(msg)
            return (
                jsonify(
                    {
                        "error": msg,
                    }
                ),
                500,
            )

    def _add_exports(self, items: list[str], http_method: str) -> None:
        """
        Add export definitions to the EXPORTS list.

        Args:
            items: The list of commands or properties to add
            http_method: The HTTP method to use, GET, POST, PUT, DELETE
        """
        if http_method == "GET":
            decorators = [self._server.restrict]
        else:
            decorators = [self._server.require_control, self._server.restrict]

        for item in items:
            export = {
                "attr": item,
                "method": http_method,
                "decorators": decorators,
            }

            if not self.is_unique_export(export):
                msg = f"Export {export} already exists for {self._url_prefix}"
                raise ValueError(msg)

            self._exports.append(export)

    def is_unique_export(self, new_export):
        """
        Check if an export with the same 'attr' and 'method' already exists in the
        EXPORTS list.

        Args:
            new_export (dict): The new export to check.

        Returns:
            bool: True if unique (no duplicates), False if a duplicate exists.
        """
        for export in self._exports:
            if (
                export["attr"] == new_export["attr"]
                and export["method"] == new_export["method"]
            ):
                return False
        return True

    def _add_command_exports(self, command_list) -> None:
        """Add PUT exports for commands."""
        self._add_exports(command_list, "PUT")

    def _add_attribute_exports(self, attribute_list) -> None:
        """Add GET exports for attributes."""
        self._add_exports(attribute_list, "GET")

    def register_blueprint(self, parent_bp) -> None:
        """
        Registers the blueprint on the Flask server (server.flask). This allows the
        routes defined in the blueprint to be accessible on the server.
        """

        self._create_routes_for_exports()
        parent_bp.register_blueprint(self._bp)

        # Using try-except ot only register the documentation endpoint once
        with contextlib.suppress(ValueError):
            parent_bp.register_blueprint(self.openapi_spec.bp)

        msg = (
            f"Blueprint '{self._bp.name}' ({self._url_prefix}) registered with server."
        )
        log.debug(msg)


class ComponentResourceHandler(ResourceHandler):
    """
    AdapterResourceHandler is a Flask resource handler that dynamically creates routes
    for hardware objects based on their attributes and methods.
    It supports GET and PUT requests for attributes and commands respectively.
    """

    def __init__(  # noqa: PLR0913
        self,
        name: str,
        url_prefix: str,
        handler_dict: dict[str, object],
        app: object,
        exports: list[dict[str, str]],
        commands: list[str],
        attributes: list[str],
    ) -> None:
        super().__init__(
            name, url_prefix, handler_dict, app, exports, commands, attributes
        )

    def _get_handler_object_route(self, export) -> str:
        """
        Returns the base route for the resource handler.
        """
        return f"{export['url']}"

    def _create_view_func(self, export: dict[str, str]) -> Callable:
        """
        Creates a Flask view function for handling requests dynamically.

        Args:
            route (str): URL route.
            export (dict): Export definition with method, attr, and decorators.

        Returns:
            Callable: The view function.
        """

        def _view_func(*args, **kwargs) -> any:  # noqa: ARG001
            # Get component from handler_dict, there is only one handler object for
            # components
            component_obj = next(iter(self._handler_dict.values()))
            component_name = next(iter(self._handler_dict.keys()))

            # We ensure that the component has the desired method
            if not hasattr(component_obj, export["attr"]):
                return (
                    jsonify(
                        {
                            "error": (
                                f"Method '{export['attr']}' not found on object"
                                f" '{component_name}'"
                            )
                        }
                    ),
                    404,
                )

            return self._validate_params_and_call_handler_func(export, component_obj)

        return _view_func


class AdapterResourceHandler(ResourceHandler):
    """
    AdapterResourceHandler is a Flask resource handler that dynamically creates routes
    for hardware objects based on their attributes and methods.
    It supports GET and PUT requests for attributes and commands respectively.
    """

    def __init__(  # noqa: PLR0913
        self,
        name: str,
        url_prefix: str,
        handler_dict: dict[str, object],
        app: object,
        exports: list[dict[str, str]],
        commands: list[str],
        attributes: list[str],
    ) -> None:
        super().__init__(
            name, url_prefix, handler_dict, app, exports, commands, attributes
        )

    def _get_handler_object_route(self, export) -> str:
        """
        Returns the base route for the resource handler.
        """
        # Dynamic route for handler object with id object_id, i.e:
        # /<object_id>/set_value
        return f"/<string:object_id>/{export['attr']}"

    def _create_view_func(self, export: dict[str, str]) -> Callable:
        """
        Creates a Flask view function for handling requests dynamically.

        Args:
            route (str): URL route.
            export (dict): Export definition with method, attr, and decorators.

        Returns:
            Callable: The view function.
        """

        def _view_func(object_id: str, *args, **kwargs) -> any:  # noqa: ARG001
            # Validate object id
            if not valid_object_id(object_id):
                msg = f"Invalid object id '{object_id}'"
                log.error(msg)
                return jsonify({"error": msg}), 400

            # Check if the object_id exists in the handler_dict
            obj = self._app.mxcubecore.get_adapter(object_id)

            if not obj:
                msg = f"Object '{object_id}' not found"
                log.error(msg)
                return jsonify({"error": msg}), 404

            # We ensure that the object has the desired method
            if not hasattr(obj, export["attr"]):
                return (
                    jsonify(
                        {
                            "error": (
                                f"Method '{export['attr']}' not found on object"
                                f" '{object_id}'"
                            )
                        }
                    ),
                    404,
                )

            return self._validate_params_and_call_handler_func(export, obj)

        return _view_func
