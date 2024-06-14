#


import datetime
import importlib.metadata

import mxcubeweb

MXCUBE_NAME = "MXCuBE"
MXCUBE_CORE_NAME = f"{MXCUBE_NAME}-Web"
MXCUBE_WEB_NAME = f"{MXCUBE_NAME}-Web"
PROJECT_PACKAGE_NAME = "mxcubeweb"  # Distribution package (not import package)
PROJECT_PACKAGE_METADATA = importlib.metadata.metadata(PROJECT_PACKAGE_NAME)

# This is necessary to for the `autoflask` directive to get access to the routes
server, _ = mxcubeweb.build_server_and_config(test=True, argv=[])
# This is to avoid `Server.kill_processes`, that makes the build return non-zero
server.flask.testing = True


# -- General configuration ------------------------------------------------

extensions = []

source_suffix = {
    ".rst": "restructuredtext",
    ".md": "markdown",
}

root_doc = "contents"

project = MXCUBE_WEB_NAME
author = PROJECT_PACKAGE_METADATA["Author"]
copyright = f"{datetime.datetime.today().year}, {author}"

# The version info for the project you're documenting, acts as replacement for
# |version| and |release|, also used in various other places throughout the
# built documents.
version = PROJECT_PACKAGE_METADATA["Version"]
release = version

rst_prolog = f"""
.. |mxcube| replace:: {MXCUBE_NAME}
.. |mxcubecore| replace:: {MXCUBE_CORE_NAME}
.. |mxcubeweb| replace:: {MXCUBE_WEB_NAME}
.. |project| replace:: {project}
"""


# -- Options for HTML output ----------------------------------------------

html_theme = "furo"


# -- Extensions ---------------------------------------------------------------

# -- myst_parser
# https://myst-parser.readthedocs.io

extensions.append("myst_parser")

myst_enable_extensions = ("substitution",)

myst_substitutions = {
    "mxcube": MXCUBE_NAME,
    "mxcubecore": MXCUBE_CORE_NAME,
    "mxcubeweb": MXCUBE_WEB_NAME,
    "project": project,
}


# -- sphinx.ext.autodoc
# https://www.sphinx-doc.org/en/master/usage/extensions/autodoc.html

extensions.append("sphinx.ext.autodoc")

autodoc_default_options = {
    "members": True,
    "show-inheritance": True,
}

autodoc_typehints = "both"


# -- sphinx.ext.autosummary
# https://www.sphinx-doc.org/en/master/usage/extensions/autosummary.html

extensions.append("sphinx.ext.autosummary")

autosummary_generate = True


# -- sphinx.ext.intersphinx
# https://www.sphinx-doc.org/en/master/usage/extensions/intersphinx.html

extensions.append("sphinx.ext.intersphinx")

intersphinx_mapping = {
    "python": ("https://docs.python.org/3/", None),
}


# -- Options for sphinx.ext.napoleon
# https://www.sphinx-doc.org/en/master/usage/extensions/napoleon.html

# We use Google style docstrings
# https://google.github.io/styleguide/pyguide.html#38-comments-and-docstrings

extensions.append("sphinx.ext.napoleon")


# -- sphinx.ext.viewcode
# https://www.sphinx-doc.org/en/master/usage/extensions/viewcode.html

extensions.append("sphinx.ext.viewcode")


# -- sphinxcontrib.autohttp.flask
# https://sphinxcontrib-httpdomain.readthedocs.io

extensions.append("sphinxcontrib.autohttp.flask")


# -- Options for sphinx_last_updated_by_git
# https://pypi.org/project/sphinx-last-updated-by-git/

extensions.append("sphinx_last_updated_by_git")


# EOF
