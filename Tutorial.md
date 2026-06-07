# The MXCuBE-Web Configurations Tutorial

Welcome to the configurations tutorial, in this tutorial, you will learn how to navigate different aspects of the configurations folder related to mxcubeweb.

First things first, you have to know that the web configuration files are always written as `yaml` files no matter if you use the `yaml` or `xml` format for the back-end structure.

For this tutorial, you are invited to use the `misconfigured_demo.yaml` to start the web application. In case that you are stuck with one of the exercises, you can take a look at the `solutions.yaml` folder, which contains the correct configurations. You can start your application using the intended files with:

```bash
mxcubeweb-server -r <path_to_mxcubeweb_repo>/misconfigured_demo.yaml --static-folder <path_to_mxcubeweb_repo>/ui/build -L debug
```

where you replace `<path_to_mxcubeweb_repo>` with the full path to your repository

## The Misconfigurations

A total of 4 misconfigurations can be found in this tutorial. This section explains the problems 1-by-1, please try to solve them all, before looking at the solution

### Missing Motor

The `Samp-X` motor dissapeared from the motors list in the UI. Try to put it back there by only changing the configuration. There should be a motor input for it, when you click on the `Show Motors` button on the left of the `Data Collection` tab.

Hint: the hardware object is already configured, use `diffractometer.sampx` as attribute, with the role `sampx`

### No Transmission

The transmission label at the top of the `Data Collection` panel is missing. Try to add it back.

Note: use `%` as suffix

### Zoom control dissappeared from the sample control panel

Normally, there should be a zoom control button in the sample control panel (the one on top of the camera image). However, it is missing here.

### No video-stream

The demo version normally comes with a test image to represent and test the video streamer. However, it looks like this one does not see any video. Try to fix this.

Hint: Before trying to fix it here, make sure that the video-streamer application is correctly installed and worked with previous test versions on your computer (or by using `solution.yaml`)

## Bonus Question

Take a look at `ui.yaml` at the `sample_view_motors` this list includes the zoom as a motor. However, when looking at the UI and especially the motor control panel, there is no zoom motor. It is correctly configured, so why do you think one cannot see the zoom?

<details>
<summary>Show Answer</summary>

The zoom object uses an `NStateAdapter` and not a `MotorAdapter`, both adapters have a different type (the type of an adapter is per default defined by it's name, i.e. `NStateAdapter` -> type = `NSTATE`). The motor panel only shows objects that use an adapter of type `MOTOR`. This becomes especially important, when you create a new Adapter, which you would like to add to this panel later on.

</details>
