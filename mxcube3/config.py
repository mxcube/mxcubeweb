import os
import ruamel.yaml


class Config:
    SECRET_KEY = b"o`\xb5\xa5\xc2\x8c\xb2\x8c-?\xe0,/i#c"
    SESSION_TYPE = "redis"
    SESSION_KEY_PREFIX = "mxcube:session:"
    DEBUG: False

    def __init__(self, fpath=None):
        if not fpath:
            fpath = os.path.abspath("./mxcube-server-config.yml")

        with open(fpath) as f:
            config = ruamel.yaml.load(f.read(), ruamel.yaml.RoundTripLoader)

            for key, value in config["server"].items():
                setattr(self, key, value)
