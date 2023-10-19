[![Build and test](https://github.com/mxcube/mxcubeweb/actions/workflows/build_and_test.yml/badge.svg)](https://github.com/mxcube/mxcubeweb/actions/workflows/build_and_test.yml)
![PyPI](https://img.shields.io/pypi/v/mxcubeweb)

<p align="center"><img src="http://mxcube.github.io/mxcube/img/mxcube_logo20.png" width="125"/></p>

# MXCuBE-Web

MXCuBE-Web is the latest generation of the data acquisition software MXCuBE (Macromolecular Xtallography Customized Beamline Environment). The project started in 2005 at [ESRF](http://www.esrf.eu), and has since then been adopted by other institutes in Europe. In 2010, a collaboration agreement has been signed for the development of MXCuBE with the following partners:

- [ESRF](https://www.esrf.fr/)
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
- [ANSTO](https://www.ansto.gov.au/facilities/australian-synchrotron)

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

- [Contributing guidelines](https://github.com/mxcube/mxcubeweb/blob/master/CONTRIBUTING.md)

## Information for users

- [User Manual MXCuBE Web](https://www.esrf.fr/mxcube3)
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

We recommend using conda for convenience and to create a seperate environemnt. This, though, is not compulsory and one can use any other method for installing the application and the necessary third party libraries.

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

### 5. Install MXCuBE-Web back-end dependencies

```
poetry install
```

### 6. Install MXCuBE-Web front-end dependencies and build the web front-end UI

```
pnpm --prefix ui install
pnpm --prefix ui build
```

### 7. Starting the MXCuBE-Web server

```
# Activate the conda environement and start the Redis server (if not already running)
conda activate mxcubeweb
redis-server

# In a separate terminal, start the MXCuBE server (note the use of `$(pwd)` to specify absolute paths):
mxcubeweb-server -r $(pwd)/test/HardwareObjectsMockup.xml/ --static-folder $(pwd)/ui/build/ -L debug
```

_Running the above should give something similar to_
![mxcube-backend](https://github.com/mxcube/mxcubeweb/assets/4331447/33c01fd3-14fe-4437-a2d2-6525e739f9b3)

### 8. Serving the MXCuBE-Web front-end application

All that is needed to run the application is to start the server and point your browser to http://localhost:8081, which will serve the prebuilt client (if any).

_The test username is `idtest0` and the password can be any string (except `wrong` and `ispybDown`, those are used to emulate different behaviors), you can use `test` as a password for example:_
![mxcube-login](https://github.com/mxcube/mxcubeweb/assets/4331447/a29f9c55-a4e1-474e-89cc-854f1c3c24d8)

The client is not built if nothing appears or you get a "404 page not found" error when browsing localhost:8081. Follow the instructions in step 6 "Install front-end dependencies and build the UI" to build a client .

### 9. Installing additional MXCUBE-Web dependencies for development

Please read the [contributing guidelines](https://github.com/mxcube/mxcubeweb/blob/develop/CONTRIBUTING.md) before getting started with the development.

The additional tools for development are in the conda-environment-dev.yml file, the environment created above needs to be updated with this.

```
# Make sure the environment created above is activated
conda activate mxcubeweb

# To install the additional dependencies run:
conda env update --file conda-environment-dev.yml
```

It's recommended to install mxcubeweb and mxcubecore as links to be able to add breakpoints and debug the application more easily.
This can be done with `pip`.

```
# In the project root of mxcubeweb (please note that the . (period) is important):
pip install -e .

# In the project root of mxcubecore:
pip install -e .
```

#### 9.1 Running the MXCuBE-Web back-end tests

The tests are located in the test folder and are executed with `pytest`.

```
# Make sure that the conda environment is activated and that the local Redis server is running:
conda activate mxcubeweb
redis-server

# In a separate terminal, activate the environment again and run pytest from the project root of mxcubeweb:
conda activate mxcubeweb
pytest
```

_The output should look something like the following:_
![image](https://github.com/mxcube/mxcubeweb/assets/4331447/379fa92e-566b-47e5-8522-cacfa9f8de2d)

#### 9.2 Starting the MXCuBE-Web front-end development server

The front-end development server listens to changes on the file system and re-builds the UI when changes are made. This makes it very easy and fast to see how changes affect the UI. The development server listens on port **3000**.

```
# Activate the Conda environment and start the MXCuBE server (cf. step 7)
conda activate mxcubeweb
mxcubeweb-server -r $(pwd)/test/HardwareObjectsMockup.xml/ --static-folder $(pwd)/ui/build/ -L debug

# Enter the `ui` folder and start the front-end developement server:
cd ui
pnpm start

# Note that you can also run any pnpm script from the root folder with:
pnpm --prefix ui <script>
```

Your default browser will open automatically at http://localhost:3000.

#### 9.4 Running the end-to-end tests (E2E)

```
# With the MXCuBE server still running, run:
pnpm e2e
```

_This should give a result looking something like:_
![image](https://github.com/mxcube/mxcubeweb/assets/4331447/e3d0eda7-caa1-44c2-9791-05ef482b81ad)

#### 9.5 Ready to develop

Use your favorite editor to start working with the code. Read the [contributing guidelines](https://github.com/mxcube/mxcubeweb/blob/develop/CONTRIBUTING.md) and check that linting tools are setup correctly. There are settings [files](https://github.com/mxcube/mxcubeweb/tree/develop/.vscode) for visual studio code in the repository.

Check [tutorial](https://github.com/mxcube/mxcubeweb/wiki/Tutorial) for code examples for starting with mxcube development.
