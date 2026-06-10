# The MXCuBE-Web Adapter Tutorial

Welcome to the adapter tutorial, in this tutorial, you will learn how to create an adapter from scratch, to be able to connect your hardware objects to the mxcube UI.

For this tutorial, you are invited to checkout the `bessy_codecamp` branch on mxcubecore and install it on your computer before starting the mxcubeweb demo version. As the tutorial makes use of the `DoseRate` hardware object.

The goal of the tutorial is to create a specific adapter for the dose rate and show the dose rate in the ui. This tutorial will guide you step-by-step through this process. If you are stuck, you can take a look at the `solutions` folder, it contains possible solutions for each of the files, you are interacting with. Additionally, please use the `demo.yaml` folder, when starting the server, as it already contains the configuration files for the hardware object.

## Step-By-Step Guide

### 1. Take advantage of the MXCuBE magic

Start the mxcube server and you might already see, that not only does the dose rate hardware object load, but an adapter is already defined for the object. This can be observed by checking the first two tables that appear in the logs, when you launch the server, you should see lines like these

![Dose Rate Hardware Object](./tutorial%20assets/doseRateObject.png)

![Dose Rate Actuator Adapter](./tutorial%20assets/doseRateActuatorAdapter.png)

It is important to check, that these exists to verify, that your object is correctly loaded (first image) and to check which type of adapter is used with the object (second image).

Since object and adapter exist, in a first step, we only want to show the dose rate in the beamline setup in the UI on the `data collection` tab. The result should look like this:

![Beamline Setup with Dose Rate](./tutorial%20assets/beamlineSetup.png)

<details>
<summary>Hint</summary>

You can simply add the dose rate in the `ui.yaml` under `beamline_setup`. If something is unclear, check out the `ui.yaml` in the solutions folder.

</details>

### 2. Changing the adapter class and type

In the previous step, we learned that MXCuBE automatically assigns adapters to hardware objects, but how does this work and what are the limitations?

MXCuBE traverses the object's type hierarchy and assigns it to the adapter whose supported type is the closest matching ancestor of the object's type. In this case the closest ancestor of the `DoseRate` class, which is supported by any adapter is the `AbstractActuator`.

This seems perfect for the use case of the dose rate, but for the sake of this exercise, let's assume we need some additional functionalities in the adapter. We should not change the `ActuatorAdapter` because this would change the behaviour of all other actuators as well. Hence, let's try to create a new adapter specific for the `DoseRate` object. For now, no additional functionality needed, just create a new subclass of the `AbstractActuator` and modify it, so that the `DoseRate` object is loaded with your new adapter, i.e. your initial load table should look like this

![DoseRateAdapter](./tutorial%20assets/doseRateAdapter.png)

Doing this you might realize something: the dose rate disappeared from the UI! Well that is expected, as the UI needs to know how to handle different types of objects and adapters, the component that renders the setup on the top of the page only renders something if the corresponding adapter has the correct type. For this exercise there are two different options on how to solve this either change the UI Component to allow the new type as well or change the type of the Adapter (different from the `Supported_types`). For simplicity, we go with the second option in this case but remember that in long term development it might make sense to change it in the UI instead, since an additonal type of adapter might increase the filtering options in other locations.

To change the type add `self._type = "ACTUATOR"` to the `__init__` function of your adapter (and put it after the `super.__init__` call)

Note: per default the type of an adapter is derived from its name. Hence a class called `DoseRateAdapter` would get the type `"DOSERATE"` for example.

<details>
<summary>Hint</summary>

First make sure that your adapter file is created in the right location, i.e. inside `mxcubeweb/core/adapter/` folder and that the python file ends with `_adapter.py`. Otherwise MXCuBE might not recognize the file.

Make use of the `SUPPORTED_TYPES` attribute of your new adapter, to ensure, that only your new object is loaded with it.

For the solution checkout `/solutions/doserate_type_only_adapter.py`

</details>
