# Development tutorial

## Exercise 1: Setup environment

Launch the web UI, sign in, and play...

Useful links:

- React Developer Tools: [installation](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) and [usage](https://react.dev/learn/react-developer-tools)
- Redux DevTools: [installation](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd) and [usage](https://github.com/reduxjs/redux-devtools)
- Swagger link once `mxcubeweb` is running: <http://localhost:8081/apidocs/docs_swagger>

![Swagger UI](assets/swagger.png)

## Exercise 2: Create a new beamline action and trigger it from the UI

For procedures that are frequently used and involve more than a simple command.
Try it out, play with multiple hardware objects.

### Solution

Edit the XML so MXCuBE is aware of the new action:

```xml
<object class="BeamlineActionsMockup">
    <commands>[
        {"type": "controller", "name": "SuperAction", "command": "HardwareObjects.mockup.BeamlineActionsMockup.SuperAction"},
        ...
    ]
    </commands>
</object>
```

Or edit the YAML if using the `demo.yml` folder:

```yaml
%YAML 1.2
---
class: BeamlineActionsMockup.BeamlineActionsMockup
configuration:
  commands: "
  [
    {'type': 'controller', 'name': 'SuperAction',
    'command': 'HardwareObjects.mockup.BeamlineActionsMockup.SuperAction'},
    ...
  ]"
```

And implement the actual action in `mxcubecore/mxcubecore/HardwareObjects/mockup/BeamlineActionsMockup.py`:

```python
class SuperAction:
    def __call__(self, *args, **kw):
        logging.getLogger("HWR").info("Running super action")

        from mxcubecore import HardwareRepository as HWR

        logging.getLogger("HWR").info("Setting diff to transfer")

        HWR.beamline.diffractometer.set_phase("TRANSFER")
        gevent.sleep(3)
        logging.getLogger("HWR").info("Restarting detector")

        HWR.beamline.detector.restart()
        logging.getLogger("HWR").info("Running super action")
```

## Exercise 3: Add a custom action for the detector and make it appear in the UI (custom equipment tab)

For not so often used or temporary instrumentation commands

![Trigger UI](assets/trigger.png)

### Solution

We add the method to the hardware object:

```python
    def trigger(self, exp_time: float ) -> None:
      self.update_state(HardwareObjectState.BUSY)
      time.sleep(exp_time)
      self.update_state(HardwareObjectState.READY)
```

and define as exportable in the detector.xml

```xml
  <exports>["restart", "trigger"]</exports>
```

## Exercise 4: Humidity controller

- Create a new hardware object that emulates a humidity controller:
  it emits periodically an updated value, and the reference value can be changed
- Display this value in the sample view area
- The UI can control the reference

![Humidity UI](assets/humidity-ui.png)

### Solution

First, we need to write the hardware object:

```python
"""
[Name] Humidity Controller

[Description]
Humidity Controller Mockup

[Emited signals]
valueChanged

"""

import random
import gevent
from mxcubecore.HardwareObjects.abstract import AbstractActuator


class HumidityControllerMockup(AbstractActuator.AbstractActuator):
    """HumidityControllerMockup implementation"""

    def __init__(self, name):
        super().__init__(name)

    def init(self):
        """Initialisation method"""
        super().init()
        self._nominal_value = 33.3
        # self.humidity_list = self.get_property('humidity_list', None)
        self.update_state(self.STATES.READY)
        self._run()

    def _run(self):
        """Spawn update routine."""
        gevent.spawn(self._update)

    def get_value(self):
        """Read the humidity.
        Returns:
            float: humidity value.
        """
        # _nominal_value comes from AbstractActuator
        noise = random.random()
        return self._nominal_value + noise

    def set_value(self, value, timeout=0):
        """Set humidity reference.
        Args:
            value: target value
            timeout (float): optional - timeout [s],
                             If timeout == 0: return at once and do not wait
                                              (default);
                             if timeout is None: wait forever.
        Raises:
            ValueError: Invalid value or attemp to set read only actuator.
            RuntimeError: Timeout waiting for status ready  # From wait_ready
        """
        print("set_value")
        self._nominal_value = value
        return self.get_value()

    def get_humidity_list(self):
        return self.humidity_list

    def _update(self):
        while True:
            gevent.sleep(5)
            value = self.get_value()
            print("new humidity value {}".format(value))
            self.emit("valueChanged", (value,))
```

with the `humidity.xml`:

```xml
<object class="HumidityControllerMockup">
</object>
```

or the `humidity.yaml` if you are using `demo.yaml`:

```yaml
%YAML 1.2
---
class: HumidityControllerMockup.HumidityControllerMockup
```

and an extra line in `mxcubeweb/demo/beamline_config.yml`:

```yaml
    - humidity: humidity.xml
```

or in `mxcubeweb/demo.yaml/beamline.yaml`:

```yaml
    - humidity: humidity.yaml
```

And we need to let the beamline class know about it:

`Beamline.py`

```python
    @property
    def humidity(self) -> HardwareObject | None:
      return self.get_object_by_role("humidity")
```

And finally, let the UI know that there is a new hardware object that needs rendering.

In `ui.yaml` under `sample_view`:

```yaml
    - attribute: humidity
      label: Humidity
      tooltip: >
        Use this widget to set the humidity
```

This made the UI provide the functionality out of the box,
but we did not really play with web development.
The extra dropdown menu gives us some extra knowledge.

First, we need to create the React component.
Create the new file `mxcubeweb/ui/src/components/SampleView/HumidityInput.jsx`:

```jsx
import { useDispatch, useSelector } from 'react-redux';
import { changeHumidity } from '../../actions/sampleview';
import { NStateSelect } from './NStateSelect';

const HUMIDITY_LIST = [20, 30, 40];

/**
 * @typedef {Object} Props
 * @property {string?} tooltip - Optional hover tooltip text.
 *
 * @param {Props} props
 */
export default function HumidityInput({ tooltip }) {
  const dispatch = useDispatch();

  return (
    <NStateSelect
      id="HumidityInput"
      value={useSelector((state) => state.sampleview.currentHumidity)}
      options={HUMIDITY_LIST}
      isBusy={useSelector(
        (state) =>
          state.beamline.hardwareObjects.humidity?.state === 'BUSY',
      )}
      onSelect={(value) => dispatch(changeHumidity(parseFloat(value)))}
      tooltip={tooltip}
    />
  );
}
```

You can see that we are hard-coding the options for the humidity.
Now we need to call this component in `mxcubeweb/ui/src/containers/SampleViewContainer.js`

```jsx
import HumidityInput from '../components/SampleView/HumidityInput';

// and
  const humidity = components.find((c) => c.attribute === 'humidity');


// and between phase control and beam size
            {humidity !== undefined && (
              <div className={motorInputStyles.container}>
                <label className={motorInputStyles.label} htmlFor="HumidityInput">
                  {humidity.label}
                </label>
                <HumidityInput tooltip={humidity.tooltip} />
              </div>)
            }
```

Just find your way through the code. ;)

We still need to define what happens when we select an option.
`sendHumidity` would be called...
if we had created it first in `mxcubeweb/ui/src/actions/sampleview.js`:

```jsx
export function setHumidity(humidity) {
  return { type: 'SET_HUMIDITY', humidity}
}

export function changeHumidity(humidity) {
  return async (dispatch) => {
    await sendExecuteCommand('actuator', 'humidity', 'set_value', {
      value: humidity
    });
    dispatch(setHumidity(humidity))
  };
}
```

We will also need to set the 'SET_HUMIDITY' case in the `mxcubeweb/ui/src/reducers/sampleview.js`

```js
    // set initial state:
    const INITIAL_STATE = {
        ...
        currentHumidity: 0,
        ...
    }

    ...
    case 'SET_HUMIDITY': {
      return { ...state, currentHumidity: action.humidity }
    }
    ...
    case 'SET_INITIAL_STATE': {
      return {
        ...state,
        ...
        currentHumidity: action.data.humidity,
        ...
      };
    }
```

## Exercise 5: New React component from scratch

This shows how to create and use a minimal component.
Don't pay too much attention to the functionality.

```jsx
import { Button } from 'react-bootstrap';
import { useDispatch } from 'react-redux';

/**
 * @typedef {Object} Props
 * @property {string} name - Name to display in the component.
 * @property {function(string): void} sendCurrentPhase - Set current phase to the given value
 *
 * @param {Props} props
 */
function NewComponent({ name, sendCurrentPhase }) {
  const dispatch = useDispatch();

  return (
    <div>
      <Button
        variant="danger"
        onClick={() => dispatch(sendCurrentPhase('TRANSFER'))}
      >
        boo
      </Button>
      <h1>Hello, {name}</h1>
    </div>
  );
}

export default NewComponent;
```

And in `BeamlineSetupContainer.jsx` add the following lines:

```jsx
import NewComponent from '../components/NewComponent/NewComponent';
import { changeCurrentPhase } from '../actions/sampleview';

// in the return:
        <Nav className="me-3">
          <NewComponent
            name={hardwareObjects['diffractometer.omega'].value}
            sendCurrentPhase={changeCurrentPhase}
          />
        </Nav>
```
