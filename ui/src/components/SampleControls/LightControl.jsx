import { useEffect, useState } from 'react';
import { Button, Form, OverlayTrigger } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { setAttribute } from '../../actions/beamline';
import { showErrorPanel } from '../../actions/general';
import { HW_STATE } from '../../constants';
import styles from './SampleControls.module.css';

function LightControl(props) {
  const { label, hwoId } = props;
  const dispatch = useDispatch();

  const [localValue, setLocalValue] = useState(null);

  const light = useSelector((state) => state.beamline.hardwareObjects[hwoId]);

  const lightSwitch = useSelector(
    (state) => state.beamline.hardwareObjects[`${hwoId}switch`],
  );

  const isReady = light.state === HW_STATE.READY;

  function handleToggleClick() {
    dispatch(
      setAttribute(
        `${hwoId}switch`,
        lightSwitch.commands.find((state) => state !== lightSwitch.value),
      ),
    );
  }
  function handleSliderChange(evt) {
    setLocalValue(Number(evt.target.value));
  }

  async function handleSliderChangeEnd(evt) {
    const finalValue = Number(evt.currentTarget.value);

    try {
      await dispatch(setAttribute(hwoId, finalValue));
    } catch (error) {
      dispatch(showErrorPanel(true, error.message));
    }
  }

  useEffect(() => {
    if (isReady) {
      setLocalValue(null);
    }
  }, [isReady]);

  return (
    <div className={styles.controlWrapper}>
      <OverlayTrigger
        trigger="click"
        rootClose
        placement="bottom"
        overlay={
          <div className={styles.sliderContainer}>
            <Form.Range
              className={styles.sliderInput}
              step={0.1}
              min={light.limits[0]}
              max={light.limits[1]}
              value={localValue ?? light.value}
              disabled={!isReady}
              onChange={handleSliderChange}
              onPointerUp={handleSliderChangeEnd}
            />

            <div className={styles.sliderLabels}>
              <span>{light.limits[0]}</span>

              <span className={styles.sliderValue}>
                {(localValue ?? light.value).toFixed(1)}
              </span>

              <span>{light.limits[1]}</span>
            </div>
          </div>
        }
      >
        {({ ref, ...triggerHandlers }) => (
          <>
            <Button
              ref={ref}
              className={styles.lightBtn}
              data-default-styles
              active={lightSwitch.value === lightSwitch.commands[0]}
              title={`${label} on/off`}
              onClick={handleToggleClick}
            >
              <i className={`${styles.controlIcon} fas fa-lightbulb`} />
              <span className={styles.controlLabel}>{label}</span>
            </Button>

            <Button
              className={styles.lightArrowBtn}
              data-default-styles
              {...triggerHandlers}
            >
              <i className="fas fa-sort-down" />
            </Button>
          </>
        )}
      </OverlayTrigger>
    </div>
  );
}

export default LightControl;
