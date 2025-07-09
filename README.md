[![Build and test](https://github.com/mxcube/mxcubeweb/actions/workflows/build_and_test.yml/badge.svg)](https://github.com/mxcube/mxcubeweb/actions/workflows/build_and_test.yml)
![PyPI](https://img.shields.io/pypi/v/mxcubeweb)

<p align="center"><img src="https://mxcube.github.io/img/mxcube_logo20.png" width="125"/></p>

# MXCuBE-Web

MXCuBE-Web is the latest generation of the data acquisition software MXCuBE (Macromolecular Xtallography Customized Beamline Environment). The project started in 2005 at [ESRF](https://www.esrf.eu), and has since then been adopted by other institutes in Europe. In 2010, a collaboration agreement has been signed for the development of MXCuBE with the following partners:

- [ESRF](https://www.esrf.fr/)
- [Soleil](https://www.synchrotron-soleil.fr/)
- [MAX IV](https://www.maxiv.lu.se/)
- [HZB](https://www.helmholtz-berlin.de/)
- [EMBL](https://www.embl.org/)
- [Global Phasing Ltd.](https://www.globalphasing.com/)
- [ALBA](https://www.cells.es/)
- [DESY](https://www.desy.de/)
- [LNLS](https://lnls.cnpem.br/)
- [Elettra](https://www.elettra.eu/)
- [NSRRC](https://www.nsrrc.org.tw/)
- [ANSTO](https://www.ansto.gov.au/facilities/australian-synchrotron)

MXCuBE-Web is developed as a web application and runs in any recent browser.
The application is built using standard web technologies
and does not require any third-party plugins to be installed in order to function.
Being a web application, it is naturally divided into server and client parts.
The communication between the client and server are made using HTTP/HTTPS and web-sockets.
It is strongly recommended to use HTTPS, SSL/TLS encrypted HTTP.
The traffic passes through the conventional HTTP/HTTPS ports,
minimizing the need for special firewall or proxy settings to get the application to work.

<img align="center" src="https://mxcube3.esrf.fr/img/client-server.png" width=300>

The underlying beamline control layer
is implemented using the library [`mxcubecore`](https://github.com/mxcube/mxcubecore)
previously known as [`HardwareRepository`](https://github.com/mxcube/HardwareRepository).
The `mxcubecore` library is compatible with
both the MXCuBE-Web and the [MXCuBE-Qt](https://github.com/mxcube/mxcubeqt) applications.

|                                                       Data collection                                                       |                                                       Sample grid                                                       |
| :-------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------: |
| ![datacollection-view](https://user-images.githubusercontent.com/4331447/42496925-d983bf3e-8427-11e8-890e-898dda649101.png) | ![samplegrid-view](https://user-images.githubusercontent.com/4331447/42496937-e8547b34-8427-11e8-9447-645e6d7f1dc5.png) |

Latest information about the MXCuBE project can be found on the
[MXCuBE project webpage](https://mxcube.github.io/mxcube/).

## Technologies in use

The backend is built on the Python [Flask](https://flask.palletsprojects.com/) web framework,
a library called [SocketIO](https://socket.io/) is further used to provide
a bidirectional communication channel between backend and client.
The backend exposes a REST API to the client.

The UI is implemented in HTML, CSS and JavaScript, mainly with the React, Redux, Boostrap, and FabricJS libraries.

## Information for developers

- [Contributing guidelines](https://github.com/mxcube/mxcubeweb/blob/master/CONTRIBUTING.md)
- [Developer documentation](https://mxcubeweb.readthedocs.io/)
- [Development install instructions](https://mxcubeweb.readthedocs.io/en/latest/dev/environment.html#install-with-conda)

## Information for users

- [User Manual MXCuBE Web](https://www.esrf.fr/mxcube3)
- [Feature overview](https://github.com/mxcube/mxcubeqt/blob/master/docs/source/feature_overview.rst)
- If you cite MXCuBE, please use the references:
  > Oscarsson, M. et al. 2019. “MXCuBE2: The Dawn of MXCuBE Collaboration.” Journal of Synchrotron Radiation 26 (Pt 2): 393–405.
  >
  > Gabadinho, J. et al. (2010). MxCuBE: a synchrotron beamline control environment customized for macromolecular crystallography experiments. J. Synchrotron Rad. 17, 700-707
