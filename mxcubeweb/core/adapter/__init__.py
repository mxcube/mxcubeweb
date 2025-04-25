import importlib
import inspect
import pkgutil

PACKAGE_NAME = __name__


def auto_import_adapters():
    for _, module_name, is_pkg in pkgutil.iter_modules(__path__):
        if is_pkg or not module_name.endswith("_adapter"):
            continue

        importlib.import_module(f"{PACKAGE_NAME}.{module_name}")


def get_all_adapter_classes():
    adapter_classes = []

    for _, module_name, _ in pkgutil.iter_modules(__path__):
        if not module_name.endswith("_adapter"):
            continue

        module = importlib.import_module(f"{PACKAGE_NAME}.{module_name}")

        for name, obj in inspect.getmembers(module, inspect.isclass):
            if name.endswith("Adapter") and obj.__module__ == module.__name__:
                adapter_classes.append(obj)

    return adapter_classes


# Auto import all adapter modules on package import
auto_import_adapters()
ALL = get_all_adapter_classes()

__all__ = ["ALL"] + [cls.__name__ for cls in ALL]
