import { useDispatch, useSelector } from 'react-redux';

import { changeAperture } from '../../actions/sampleview';
import { NStateSelect } from './NStateSelect';

/**
 * @typedef {Object} Props
 * @property {string?} tooltip - Optional hover tooltip text.
 *
 * @param {Props} props
 */
function ApertureInput({ tooltip }) {
  const dispatch = useDispatch();

  return (
    <NStateSelect
      id="ApertureInput"
      value={useSelector((state) => state.sampleview.currentAperture)}
      options={useSelector((state) => state.sampleview.apertureList)}
      isBusy={useSelector(
        (state) =>
          state.beamline.hardwareObjects['beam.aperture']?.state === 'BUSY',
      )}
      onSelect={(value) => dispatch(changeAperture(value))}
      tooltip={tooltip}
    />
  );
}

export default ApertureInput;
