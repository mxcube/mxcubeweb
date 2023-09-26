[![Build and test](https://github.com/mxcube/mxcubeweb/actions/workflows/build_and_test.yml/badge.svg)](https://github.com/mxcube/mxcubeweb/actions/workflows/build_and_test.yml)
![PyPI](https://img.shields.io/pypi/v/mxcubeweb)
[![codecov](https://codecov.io/gh/mxcube/mxcube3/branch/master/graph/badge.svg)](https://codecov.io/gh/mxcube/mxcube3)

<p align="center"><img src="http://mxcube.github.io/mxcube/img/mxcube_logo20.png" width="125"/></p>

# MXCuBE-Web
MXCuBE-Web is the latest generation of the data acquisition software MXCuBE (Macromolecular Xtallography Customized Beamline Environment). The project started in 2005 at [ESRF](http://www.esrf.eu), and has since then been adopted by other institutes in Europe. In 2010, a collaboration agreement has been signed for the development of MXCuBE with the following partners:

- ESRF
- [Soleil](http://www.synchrotron-soleil.fr/)
- [MAX IV](https://www.maxiv.lu.se/)
- [HZB](http://www.helmholtz-berlin.de/)
- [EMBL](http://www.embl.org/)
- [Global Phasing Ltd.](http://www.globalphasing.com/)
- [ALBA](https://www.cells.es/en)
- [DESY](https://www.desy.de)
- [LNLS](https://www.lnls.cnpem.br/)
- [Elettra](https://www.elettra.trieste.it/)
- [NSRRC](https://www.nsrrc.org.tw/english/index.aspx)
- [ANSTO] (https://www.ansto.gov.au/facilities/australian-synchrotron)

MXCuBE-Web is developed as a web application and runs in any recent browser. The application is further built using standard web technologies and does not require any third party plugins to be installed in order to function. Being a web application, it's naturally divided into a server and client part. The communication between the client and server are made using HTTP/HTTPS and web-sockets. It's strongly recommended to use HTTPS, SSL/TLS encrypted HTTP. The traffic passes through the conventional HTTP/HTTPS ports minimizing the need for special firewall or proxy settings to get the application to work.

<img align="center" src="http://mxcube3.esrf.fr/img/client-server.png" width=300>

The underlaying beamline control layer is implemented using the library [**mxcubecore**](https://github.com/mxcube/mxcubecore) previously known as [HardwareRepository](https://github.com/mxcube/HardwareRepository). The **mxcubecore** module is compatable with both MXCuBE-Web and the [MXCuBE-Qt application](https://github.com/mxcube/mxcubeqt).


|                                                       Data collection                                                       |                                                       Sample grid                                                       |
| :-------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------: |
| ![datacollection-view](https://user-images.githubusercontent.com/4331447/42496925-d983bf3e-8427-11e8-890e-898dda649101.png) | ![samplegrid-view](https://user-images.githubusercontent.com/4331447/42496937-e8547b34-8427-11e8-9447-645e6d7f1dc5.png) |


Latest information about the MXCuBE project can be found on the
[project webpage](http://mxcube.github.io/mxcube/).

### Technologies in use

The backend is built on a Python-flask micro-framework, a library called SocketIO is further used to provide a bi-directional communication channel between backend and client. The backend exposes a REST API to the client.

The client is implemented in ECMAScript6 and HTML5. React, Boostrap and FabricJS are the main libraries used for the UI development

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

## Installation and testing

We recommend using conda to create an isolated environment, conda can be downloaded [here](https://docs.conda.io/en/latest/miniconda.html#linux-installers).

### 1. Create a folder that will contain both `mxcubeweb` and `mxcubecore`
```
mkdir mxcube
cd mxcube
```

### 2. Clone `mxcubeweb` and `mxcubecore`

```
git clone https://github.com/mxcube/mxcubeweb.git
git clone https://github.com/mxcube/mxcubecore.git
```

### 3. Create Conda environment `mxcubeweb`
We recommend using conda a convenience and create a seperate environemnt for libraries and python version. This, though, is not compulsory and one can use any other tool or configuration for installing the application and the necessary third party libraries.

Create Conda environment `mxcubeweb` using the conda environment file in mxcubeweb. The installation of the dependencies in the environment takes a few minutes.

The name of the environment is located at the top of file `conda-environment.yml`. It can be changed from the command line with `--name <env-name>`.

```
cd mxcubeweb
conda env create -f conda-environment.yml
# or (to pass a different name)
conda env create -f conda-environment.yml --name another_name
```

### 4. Activate the environment

```
conda activate mxcubeweb
```

### 5. Install remaining dependencies

```
poetry install
```

### 6. Install front-end dependencies and build the UI

```
npm install --legacy-peer-deps
# (NB --legacy-peer-deps is for the moment needed for the testing library Cypress)
npm run build
```

### 7. Running the application (server)
```
# Start redis-server (if not already running)
# Open a new terminal:
conda activate mxcubeweb
redis-server

# In the previous terminal:
# The paths passed below needs to be the full path (thats why there is an extra `$(pwd)` in the command below) 
# to the HardwareObjectsMockup.xml and build directories.
mxcubeweb-server -r $(pwd)/mxcubeweb/test/HardwareObjectsMockup.xml/ --static-folder $(pwd)/mxcubeweb/ui/build/ -L debug
```

_Running the above should give something similar to_
![mxcube-backend](https://github.com/mxcube/mxcubeweb/assets/4331447/33c01fd3-14fe-4437-a2d2-6525e739f9b3)

### 8. Running the MXCuBE-WEB front-end

All that is needed to run the application is to start the server and point your browser to http://localhost:8081, which will serve the prebuilt client (if any). 

_The test username is `idtest0` and the password can be any string (except `wrong` and `ispybDown`, those are used to emulate different behaviors), you can use `test` as a password for example:_
![mxcube-login](https://github.com/mxcube/mxcubeweb/assets/4331447/a29f9c55-a4e1-474e-89cc-854f1c3c24d8)

The client is not built if nothing appears or you get a "404 page not found" error when browsing localhost:8081. Follow the instructions in step 6 "Install front-end dependencies and build the UI" to build a client .

### 9. Installing MXCUBE-WEB for development
Please read the [contributing guidelines](https://github.com/mxcube/mxcubeweb/blob/develop/CONTRIBUTING.md) before getting started with the development.

The additional tools for development are in the conda-environment-dev.yml file, the environment created above needs to be updated with this.
```
# Make sure the environment created above is activated
conda activate mxcubeweb

# To install the additional dependencies run:
conda env update --file conda-environment-dev.yml
```

Its recommended to install mxcubeweb and mxcubecore as links to be able to add breakpoints and debug the application easier.
This can be done with `pip`.

```
# In the project root of mxcubeweb (please note that the . (period) is important):
pip install -e .

# In the project root of mxcubecore:
pip install -e .
```

The above makes it possible to add break points directly in the "checked out code".

Before running any test, make sure that the local *Redis* server is running. For example with the `mxcubeweb` *conda* environment activated in a terminal, run the `redis-server` command.

#### 9.1 Running tests

The tests are located in the test folder and are executed with `pytest`

```
# Run pytest In the root of the mxcubeweb directory
cd mxcubeweb
pytest
```

_The output should look something like the following:_
![image](https://github.com/mxcube/mxcubeweb/assets/4331447/379fa92e-566b-47e5-8522-cacfa9f8de2d)

#### 9.2 Running the front-end development server
The front end development server, webpack development server, listens to changes on the filesystem and builds (re-builds) the UI when a change are made. This makes it very easy and fast to see how a change effects the UI and makes debugging alot easier. The developmen server listens on port **3000**

```
# The front-end needs the backend to run so before starting the 
# development server open a new terminal and run (as in step 7):

conda activate mxcubeweb
mxcubeweb-server -r $(pwd)/mxcubeweb/test/HardwareObjectsMockup.xml/ --static-folder $(pwd)/mxcubeweb/ui/build/ -L debug

# Enter the `ui` folder and issue:
npm run start
```

The above will automatically open a browser with the URL: http://localhost:3000

#### 9.4 Running the end to end (e2e) tests

```
# Keep the backend running, and issue in the mxcubeweb root:
npm run --prefix ./ui e2e

```

_This should give a result looking something like:_
![image](https://github.com/mxcube/mxcubeweb/assets/4331447/e3d0eda7-caa1-44c2-9791-05ef482b81ad)


#### 9.5 Ready to develop
Use your favorite editor to start working with the code. Read the [contributing guidelines](https://github.com/mxcube/mxcubeweb/blob/develop/CONTRIBUTING.md) and check that linting tools are setup correctly. There are settings [files](https://github.com/mxcube/mxcubeweb/tree/develop/.vscode) for visual studio code in the repository.





