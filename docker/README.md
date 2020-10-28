# MXCuBE3 Docker Container

Development Docker container for MXCuBE3 based on Debian 9 with a desktop environment (Mate)
VNC server and some development tools like Emacs and VIM.

## Building

The docker file can be built by simply issuing:

```
docker build -t mxcube3-dev .
```

The name of the image will be mxcube3-dev

## Running

After being built the docker file can be executed with:

```
docker run -p 5901:5901 -p 8090:8090 -dt mxcube3-dev
```
This container runs the MXCuBE backend in the foreground for easier debugging,
browsing can be done from either the local system or via VNC.

MXCuBE is installed in /opt/mxcube3

The status can be viewed with:

```
docker ps
```

A simple shell can be launched by:

```
docker exec -it <container-id> /bin/bash
```

## Connecting to the VNC server
This docker container comes with a pre-configured desktop enviroment that can be accessed
by using VNC. Simply connect to *ip:1* and give the password "mxcube"

To get the container id run
```
docker ps
```

To get the container ip address issue:
```
docker inspect <container id>
```

Connect with a VNC client (for isntance vncviewer) PASSWORD IS: mxcube
```
vncviewer <ip-address>:1
```

Chrome can be launched, once connected, from a terminal window, by typing

```
google-chrome --no-sandbox
```

Point the browser to localhost:8090 to start using MXCuBE3

The test credentials are:
username: idtest0
password: 000