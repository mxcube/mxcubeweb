[![Build and test](https://github.com/mxcube/mxcubeweb/actions/workflows/build_and_test.yml/badge.svg)](https://github.com/mxcube/mxcubeweb/actions/workflows/build_and_test.yml)
![PyPI](https://img.shields.io/pypi/v/mxcubeweb)
[![codecov](https://codecov.io/gh/mxcube/mxcube3/branch/master/graph/badge.svg)](https://codecov.io/gh/mxcube/mxcube3)


<p align="center"><img src="http://mxcube.github.io/mxcube/img/mxcube_logo20.png" width="125"/></p>

# MXCuBE-Web
MXCuBE-Web is the latest generation of the data acquisition software MXCuBE (Macromolecular Xtallography Customized Beamline Environment). The project started in 2005 at [ESRF](http://www.esrf.eu), and has since then been adopted by other institutes in Europe. In 2010, a collaboration agreement has been signed for the development of MXCuBE with the following partners:

* ESRF
* [Soleil](http://www.synchrotron-soleil.fr/)
* [MAX IV](https://www.maxiv.lu.se/)
* [HZB](http://www.helmholtz-berlin.de/)
* [EMBL](http://www.embl.org/)
* [Global Phasing Ltd.](http://www.globalphasing.com/)
* [ALBA](https://www.cells.es/en)
* [DESY](https://www.desy.de)
* [LNLS](https://www.lnls.cnpem.br/)
* [Elettra](https://www.elettra.trieste.it/)
* [NSRRC](https://www.nsrrc.org.tw/english/index.aspx)

MXCuBE-Web is developed as a web application and runs in any recent browser. The application is further built using standard web technologies and does not require any third party plugins to be installed in order to function. 

 Data collection           | Sample grid
:-------------------------:|:-------------------------:
![datacollection-view](https://user-images.githubusercontent.com/4331447/42496925-d983bf3e-8427-11e8-890e-898dda649101.png)|![samplegrid-view](https://user-images.githubusercontent.com/4331447/42496937-e8547b34-8427-11e8-9447-645e6d7f1dc5.png)

The underlaying beamline control layer is implemented using the library [**mxcubecore**](https://github.com/mxcube/mxcubecore) previously known as [HardwareRepository](https://github.com/mxcube/HardwareRepository). The **mxcubecore** module is compatable with both MXCuBE-Web and the [MXCuBE-Qt application](https://github.com/mxcube/mxcubeqt). The earlier versions of MXCuBE-Web (upto 3.2.x) uses [HardwareRepository](https://github.com/mxcube/HardwareRepository) while versions after 4.x uses [**mxcubecore**](https://github.com/mxcube/mxcubecore).

Latest information about the MXCuBE project can be found on the
[project webpage](http://mxcube.github.io/mxcube/).

### Technologies in use

The backend is built on a Python-flask micro-framework, a library called SocketIO is further used to provide a bi-directional communication channel between backend and client. The backend exposes a REST API to the client.

The client is implemented in ECMAScript6 and HTML5. React, Boostrap and FabricJS are the main libraries used for the UI development

### Installation and testing
Follow the instructions [here](https://github.com/mxcube/mxcube3/wiki)

## Information for developers
- [Contributing guidelines](https://github.com/mxcube/mxcube3/blob/master/CONTRIBUTING.md)

## Information for users

- [User Manual MXCuBE3](https://www.esrf.fr/mxcube3)
- [Feature overview](https://github.com/mxcube/mxcubeqt/blob/master/docs/source/feature_overview.rst)
- If you cite MXCuBE, please use the references:

```
Oscarsson, M. et al. 2019. “MXCuBE2: The Dawn of MXCuBE Collaboration.” Journal of Synchrotron Radiation 26 (Pt 2): 393–405.

Gabadinho, J. et al. (2010). MxCuBE: a synchrotron beamline control environment customized for macromolecular crystallography experiments. J. Synchrotron Rad. 17, 700-707
```

