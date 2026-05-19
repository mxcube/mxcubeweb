import { useDispatch, useSelector } from 'react-redux';

import { setAttribute } from '../../actions/beamline.js';
import { NStateSelect } from './NStateSelect';

/**
 * Generic NState input bound to an `AbstractNState` hardware object by name.
 *
 * @typedef {Object} Props
 * @property {string} name - Hardware object name.
 * @property {string} id - DOM id for the underlying select element.
 * @property {string?} description - Optional hover tooltip text.
 *
 * @param {Props} props
 */
export function NStateHOInput({ name, id, description }) {
  const dispatch = useDispatch();
  const ho = useSelector((state) => state.beamline.hardwareObjects[name]);
  if (!ho) {
    throw new Error(`Can't find ${name} hardware object.`);
  }

  return (
    <NStateSelect
      id={id}
      value={ho?.value ?? ''}
      options={ho?.commands ?? []}
      isBusy={ho?.state === 'BUSY'}
      onSelect={(value) => dispatch(setAttribute(name, value))}
      description={description}
    />
  );
}
