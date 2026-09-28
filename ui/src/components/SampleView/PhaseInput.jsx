import { useDispatch, useSelector } from 'react-redux';

import { changeCurrentPhase } from '../../actions/sampleview';
import { NStateSelect } from './NStateSelect';

/**
 * @typedef {Object} Props
 * @property {string?} tooltip - Optional hover tooltip text.
 *
 * @param {Props} props
 */
function PhaseInput({ tooltip }) {
  const dispatch = useDispatch();

  return (
    <NStateSelect
      id="PhaseInput"
      value={useSelector((state) => state.sampleview.currentPhase)}
      options={useSelector((state) => state.sampleview.phaseList)}
      isBusy={useSelector(
        (state) =>
          state.beamline.hardwareObjects.diffractometer?.state === 'BUSY',
      )}
      onSelect={(value) => dispatch(changeCurrentPhase(value))}
      tooltip={tooltip}
    />
  );
}

export default PhaseInput;
