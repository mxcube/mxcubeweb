# -*- coding: utf-8 -*-
import re

def str_to_camel(name):
    if isinstance(name, str):
        components = name.split('_')
        # We capitalize the first letter of each component except the first one
        # with the 'title' method and join them together.
        name = components[0] + "".join(x.title() for x in components[1:])
    
    return name


def str_to_snake(name):
    s = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s).lower()


def convert_dict(fun, d, recurse=True):
    converted = {}

    for key, value in d.iteritems():
        if isinstance(value, dict) and recurse:
            value = convert_dict(fun, value)

        converted[fun(key)] = value

    return converted


def to_camel(d):
    return convert_dict(str_to_camel, d)


def from_camel(d):
    return convert_dict(str_to_snake, d)
