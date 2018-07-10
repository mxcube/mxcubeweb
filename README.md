<p align="center"><img src="http://mxcube.github.io/mxcube/img/mxcube_logo20.png" width="125"/></p>

# MXCuBE 3
MXCuBE3 is the latest version of the data acquisition software MXCuBE (Macromolecular Xtallography Customized Beamline Environment). The project started in 2005 at [ESRF](http://www.esrf.eu), and has since then been adopted by other institutes in Europe. In 2010, a collaboration agreement has been signed for the development of MXCuBE with the following partners:

* ESRF
* [Soleil](http://www.synchrotron-soleil.fr/)
* [Max lab](https://www.maxlab.lu.se/)
* [HZB](http://www.helmholtz-berlin.de/)
* [EMBL](http://www.embl.org/)
* [Global Phasing Ltd.](http://www.globalphasing.com/)
* [ALBA](https://www.cells.es/en)
* [DESY](https://www.desy.de)

Version 3 is developed as a web application and runs in any recent browser. The application is further built using standard web technologies and does not require any third party plugins to be installed in order to function. 

 Data collection           | Sample grid
:-------------------------:|:-------------------------:
![datacollection-view](https://user-images.githubusercontent.com/4331447/42496925-d983bf3e-8427-11e8-890e-898dda649101.png)|![samplegrid-view](https://user-images.githubusercontent.com/4331447/42496937-e8547b34-8427-11e8-9447-645e6d7f1dc5.png)

The underlaying beamline control layer is implemented using Hardware Objects. MXCuBE3 uses [Hardware Objects 2.2](https://github.com/mxcube/HardwareRepository/tree/2.2) which is compatable with both the older Qt3 application and the new Web application. The original project is based on Qt (Qt3 initially but moving to Qt4), see the [main repository](https://github.com/mxcube/mxcube). 

Latest information about the MXCuBE project can be found in the
[project webpage](http://mxcube.github.io/mxcube/).

### Technologies in use

The backend is built on a Python-flask micro-framework, a library called SocketIO is further used to provide a bi-directional communication channel between backend and client. The backend exposes a REST API to the client.

The client is implemented in ECMAScript6 and HTML5. React, Boostrap and FabricJS are the main libraries used for the UI development

### Installation and testing

Follow the instructions [here](https://github.com/mxcube/mxcube3/wiki)



