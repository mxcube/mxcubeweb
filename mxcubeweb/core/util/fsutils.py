import contextlib
import os

from scandir import scandir


def scantree(path, include):
    res = []

    with contextlib.suppress(OSError):
        res = _scantree_rec(path, include, [])

    return res


def _scantree_rec(path, include=[], files=[]):
    for entry in scandir(path):
        if entry.is_dir(follow_symlinks=False):
            _scantree_rec(entry.path, include, files)
        elif entry.is_file() and os.path.splitext(entry.path)[1][1:] in include:
            files.append(entry.path)

    return files
