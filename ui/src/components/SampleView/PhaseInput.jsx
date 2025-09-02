import { Form } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { changeCurrentPhase } from '../../actions/sampleview';
import styles from './PhaseInput.module.css';

function PhaseInput() {
  const dispatch = useDispatch();

  const value = useSelector((state) => state.sampleview.currentPhase);
  const options = useSelector((state) => state.sampleview.phaseList);
  const isBusy = useSelector(
    (state) => state.beamline.hardwareObjects.diffractometer?.state === 'BUSY',
  );

  return (
    <Form.Select
      id="PhaseInput"
      className={styles.select}
      value={value}
      data-busy={isBusy || undefined}
      onChange={(evt) => {
        dispatch(changeCurrentPhase(evt.target.value));
      }}
    >
      <option hidden key="Unknown">
        Unknown
      </option>

      {options.map((option) => (
        // The "Unknown" option is hidden, so that it only appears as the selected value
        // when the diffractometer hardware object sets it.
        <option key={option} hidden={option === 'Unknown'}>
          {option}
        </option>
      ))}
    </Form.Select>
  );
}

export default PhaseInput;
