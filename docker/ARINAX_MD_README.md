
# How to use ARINAX MD Docker

Release date `19/02/2025`

----------

### First step: Get Image

> This document assumes that you already have a functional Docker environment.

At this moment, the only way to get the `arinax:MD` Docker image is by using the `.tar` file provided.

#### Commands

To load the image, you just need to use the following command:

```bash
docker load --input <file.tar>
```

If everything went well, you should get something like this:

```bash
$ docker load --input arinaxMD.tar
Loaded image: arinax:MD
$ docker image ls
REPOSITORY   TAG       IMAGE ID       CREATED          SIZE
[....]
arinax       MD        ae4de4e3c760   58 minutes ago   2.62GB
[....]
```

----------

### Preparation

Before launching any container, you should set up an X11 server. The ARINAX MD application has a GUI interface, but the container can't handle it. If the ARINAX MD app starts without any indication about the X11 destination, the app will crash.

> Note: 
> For the creation of this image, MobaXterm has been used because it has an integrated X11 server. Link: [https://mobaxterm.mobatek.net/](https://mobaxterm.mobatek.net/)

To make the redirection possible, you need to ensure that the container can communicate with the OS containing the X11 server.

> Note: For tests, we used a Debian 11 VM containing the Docker environment. We used VirtualBox bridge access mode to communicate directly with the VM. We also used the default Docker network and port opening for our tests.

----------

**Optional step** The first test you can do is running:

```bash
docker run -it --rm --name arinaxMD arinax:MD nolaunch
```

> Note: The `nolaunch` option will be explained later.

If everything went well, you should get something like this:

```bash
$ docker run -it --rm --name arinaxMD arinax:MD nolaunch
Script launching skipped...
root@0c222da876b7:/opt/arinax/MD#
```

If you're not sure if the container can ping your X11 server, you can do the following:

```bash
# apt-get install -y iputils-ping
# ping <X11-server-ip>
```

----------

### First launch

If you now want to see the demo included in this image, proceed like this:

```bash
docker run -dit -e DISPLAY=<X11-server-ip>:0.0 arinax:MD
```

If it works as expected, you should get an incoming connection on your X11 server, and you should see the ARINAX MD display.

#### Common errors

If it doesn't work, you should try the following:

```bash
docker run -it -e DISPLAY=<X11-server-ip>:0.0 arinax:MD
```

> Important:
> Instead of using `-dit`, we use `-it` to see logs.

If you see something like this:

```bash
# docker run -it -e DISPLAY=<X11-server-ip>:0.0 arinax:MD
[....]
Exception in thread "main" java.awt.AWTError: Can't connect to X11 window server using '<X11-server-ip>' as the value of the DISPLAY variable.
[....]
```

This error occurs because the container can't contact the X11 server.

> You should go to [Optional step](#Optional-step)

**For any other errors, you should contact ARINAX support.**

----------

### Advanced options

> Important:
>  At this point, we assume that the basic demo works well and there are no problems launching the ARINAX MD app.

#### Custom environment variables

MD_GUI : 
**Values**: `true` / `false` | default: `true` 
**Description**: Defines in the launching script whether the ARINAX MD application GUI should be exposed. If `false` is selected, the startup script automatically redirects the X11 flux to an internal X11 server.

MD_BACKGROUND : 
**Values**: `true` / `false` | default: `false` 
**Description**: Defines whether the container should automatically exit after closing the ARINAX MD application. If it's set to `true`, the container will continue running after closing the ARINAX MD app.

> Important :
>  If there is any value different from `true` or `false` for these variables, the default choice will be executed.

#### Examples

To launch the container with custom variables, here is an example:

```bash
docker run -dit -e DISPLAY=<X11-server-ip>:0.0 -e MD_GUI=true -e MD_BACKGROUND=false arinax:MD

```

If you want to add your custom configurations for the MD app, there are two options. **First one**

```bash
docker run -it -e DISPLAY=<X11-server-ip>:0.0 -v /<Path-to-your-config-folder>/config:/opt/arinax/MD/config arinax:MD
```

> Important: Docker only accepts full paths for your host path.

This will override the demo config files with your custom ones.

**Second one**

```bash
docker run -it --name <Your custom name> arinax:MD nolaunch
```

This will give you access to a shell inside the container. You should see something like this:

```bash
$ docker run -it --name <Your custom name> arinax:MD nolaunch
Script launching skipped...
root@c9cc458565cd:/opt/arinax/MD#
```

> Note: 
> Using `nolaunch` is not a predefined word in the launching script. In fact, any other word will have the same effect. This launching script will automatically skip all launching steps if there is one or more arguments given to the startup script.

From this shell, you can edit and download your own configuration files.

If you have already created a container and you want to regain access to it, do the following:

```bash
$ docker start <Your custom name>
$ docker exec -it <Your custom name> bash
```

#### Opening ports for services

Depending on your configuration, you may want to use a client to remotely control the ARINAX MD application.

> Note: 
> In the demo version, the application is configured to use an exporter on port 9001.

To open ports, you have to add the following to your Docker launching command line:

```bash
<your command> -p <host-port>:<container-port> arinax:MD

```

> Important: Be careful! You must add it before the image name declaration!

This will bind and open a port on the machine running the container. All packets sent to the Docker machine on this specific port will be redirected to the container's IP on this port. To communicate with the container, don't use the IP given by the internal shell, use the IP of the machine executing Docker.

----------

### Information

Author: Romain Carlino | Email: [romain.carlino@arinax.com](mailto:romain.carlino@arinax.com)
