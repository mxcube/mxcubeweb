import { useDispatch, useSelector } from 'react-redux';

import { changeCurrentPhase } from '../../actions/sampleview';
import { NStateSelect } from './NStateSelect';

const READ_ONLY_OPTIONS = ['Unknown'];

/**
 * Source hook for the diffractometer phase.
 *
 * @returns {NStateSource}
 */

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
      readOnlyOptions={READ_ONLY_OPTIONS}
      tooltip={tooltip}
    />
  );
}

export default PhaseInput;
