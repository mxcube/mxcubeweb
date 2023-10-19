import re


def convert_to_dict(ispyb_object):
    d = {}

    if isinstance(ispyb_object, dict):
        d.update(ispyb_object)
    else:
        for key in ispyb_object.__keylist__:
            val = getattr(ispyb_object, key)
            if not isinstance(val, dict):
                val = convert_to_dict(val)
            elif isinstance(val, list):
                val = [
                    (convert_to_dict(x) if not isinstance(x, dict) else x) for x in val
                ]
            elif isinstance(val, dict):
                val = dict(
                    [
                        (
                            k,
                            (convert_to_dict(x) if not isinstance(x, dict) else x),
                        )
                        for k, x in val.items()
                    ]
                )

            d[key] = val

    return d


def str_to_camel(name):
    if isinstance(name, str):
        components = name.split("_")
        # We capitalize the first letter of each component except the first one
        # with the 'title' method and join them together.
        name = components[0].lower() + "".join(x.title() for x in components[1:])

    return name


def str_to_snake(name):
    s = re.sub("(.)([A-Z][a-z]+)", r"\1_\2", name)
    return re.sub("([a-z0-9])([A-Z])", r"\1_\2", s).lower()


def _convert_dict_rec(fun, d, recurse=True):
    converted = {}

    for key, value in d.items():
        if isinstance(value, dict) and recurse:
            value = _convert_dict_rec(fun, value)

        converted[fun(key)] = value

    return converted


def to_camel(d):
    return _convert_dict_rec(str_to_camel, d)


def from_camel(d):
    return _convert_dict_rec(str_to_snake, d)
