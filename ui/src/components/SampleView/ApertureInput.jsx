import React from 'react';
import { Form } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { changeAperture } from '../../actions/sampleview';
import styles from './ApertureInput.module.css';

function ApertureInput() {
  const dispatch = useDispatch();

  const value = useSelector((state) => state.sampleview.currentAperture);
  const options = useSelector((state) => state.sampleview.apertureList);
  const state = useSelector(
    (state) => state.beamline.hardwareObjects['beam.aperture']?.state,
  );

  return (
    <Form.Select
      id="ApertureInput"
      className={styles.select}
      value={value}
      data-busy={state === 'BUSY' || undefined}
      onChange={(evt) => {
        dispatch(changeAperture(evt.target.value));
      }}
    >
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </Form.Select>
  );
}

export default ApertureInput;
