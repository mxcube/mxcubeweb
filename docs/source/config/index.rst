=============
Configuration
=============

MXCuBE must be configured for each beamline where it is deployed.
It is configured using a series of config files in the so-called hardware repository directory.
The directory is specified by a command line argument to ``mxcubeweb-server``, or if omitted a default path is used.

The hardware repository directory must contain the following files:

* beamline_config.yml
* :doc:`mxcube-web/server.yaml <server>`
* :doc:`mxcube-web/ui.yaml <ui>`

``beamline_config.yml`` configures the features and hardware provided by the beamline.
``server.yaml`` contains the HTTP back-end related settings.
``ui.yaml`` specifies the UI that is presented to the user.

.. toctree::
    :glob:
    :maxdepth: 2
    :hidden:

    *
