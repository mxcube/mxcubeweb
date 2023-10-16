#


import datetime
import importlib.metadata

import mxcube3


PROJECT_PACKAGE_NAME = "mxcubeweb"  # Distribution package (not import package)
PROJECT_PACKAGE_METADATA = importlib.metadata.metadata(PROJECT_PACKAGE_NAME)

PROJECT_SLUG_NAME = PROJECT_PACKAGE_NAME

# This is necessary to for the `autoflask` directive to get access to the routes
server, _ = mxcube3.build_server_and_config(test=True, argv=[])
# This is to avoid `Server.kill_processes`, that makes the build return non-zero
server.flask.testing = True


# -- General configuration ------------------------------------------------

extensions = [
    "myst_parser",
]

templates_path = ["_templates"]

source_suffix = {
    ".rst": "restructuredtext",
    ".md": "markdown",
}

root_doc = "contents"

project = "MXCuBE-Web"
author = PROJECT_PACKAGE_METADATA["Author"]
copyright = f"{datetime.datetime.today().year}, {author}"

DOCUMENT_DESCRIPTION = f"{project} documentation"

# The version info for the project you're documenting, acts as replacement for
# |version| and |release|, also used in various other places throughout the
# built documents.
version = PROJECT_PACKAGE_METADATA["Version"]
release = version

rst_prolog = f"""
.. |project| replace:: {project}
"""


# -- Options for HTML output ----------------------------------------------

html_theme = "alabaster"

html_theme_options = {
    "description": DOCUMENT_DESCRIPTION,
    "github_banner": "true",
    "github_button": "true",
    "github_repo": "mxcubeweb",
    "github_user": "mxcube",
}

html_sidebars = {
    "**": [
        "about.html",
        "globaltoc.html",
        "searchbox.html",
    ],
}


# -- Extensions ---------------------------------------------------------------

# -- sphinx.ext.autodoc
# https://www.sphinx-doc.org/en/master/usage/extensions/autodoc.html

extensions.append("sphinx.ext.autodoc")

autodoc_default_options = {
    "members": True,
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


# -- sphinx.ext.viewcode
# https://www.sphinx-doc.org/en/master/usage/extensions/viewcode.html

extensions.append("sphinx.ext.viewcode")


# -- sphinxcontrib.autohttp.flask
# https://sphinxcontrib-httpdomain.readthedocs.io

extensions.append("sphinxcontrib.autohttp.flask")


# EOF
