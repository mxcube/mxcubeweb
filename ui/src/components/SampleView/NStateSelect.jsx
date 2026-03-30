import { Form } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { setAttribute } from '../../actions/beamline';
import styles from './NStateSelect.module.css';

/**
 *
 * @typedef {Object} Props
 * @property {string} name - The name of the hardware object to control.
 * @property {string} id -The id for the select element.
 *
 * @param {Props} param0
 * @returns {JSX.Element}
 */
export function NStateSelect({ name, id }) {
  const dispatch = useDispatch();

  const ho = useSelector((state) => state.beamline.hardwareObjects[name]);

  if (!ho) {
    return null;
  }

  const { value, commands, state } = ho;
  const isBusy = state === 'BUSY';

  return (
    <Form.Select
      id={id}
      className={styles.select}
      value={value}
      data-busy={isBusy || undefined}
      disabled={isBusy}
      onChange={(evt) => {
        dispatch(setAttribute(name, evt.target.value));
      }}
    >
      {commands.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </Form.Select>
  );
}
