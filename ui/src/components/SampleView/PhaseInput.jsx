import React from 'react';
import { Form } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { changeCurrentPhase } from '../../actions/sampleview';
import styles from './PhaseInput.module.css';

function PhaseInput() {
  const dispatch = useDispatch();

  const value = useSelector((state) => state.sampleview.currentPhase);
  const options = useSelector((state) => state.sampleview.phaseList);
  const state = useSelector(
    (state) => state.beamline.hardwareObjects.diffractometer?.state,
  );

  return (
    <Form.Select
      id="PhaseInput"
      className={styles.select}
      value={value}
      data-busy={state === 'BUSY' || undefined}
      onChange={(evt) => {
        if (evt.target.value !== 'Unknown') {
          dispatch(changeCurrentPhase(evt.target.value));
        }
      }}
    >
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </Form.Select>
  );
}

export default PhaseInput;
