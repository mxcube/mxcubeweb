# -*- coding: utf-8 -*-
import types

def convert_to_dict(ispyb_object):
    d = {}
    
    if type(ispyb_object) == types.DictType:
        d.update(ispyb_object)
    else:
        for key in ispyb_object.__keylist__:
            val = getattr(ispyb_object, key)
            if type(val) == types.InstanceType:
                val = convert_to_dict(val)
            elif type(val) == types.ListType:
                val = [convert_to_dict(x) if type(x) == types.InstanceType else x for x in val]
            elif type(val) == types.DictType:
                val = dict([(k, convert_to_dict(x) if type(x) == types.InstanceType else x) for k, x in val.iteritems()])
            d[key] = val

    return d


    
    
    
