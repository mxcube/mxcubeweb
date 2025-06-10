import { sendGetAttribute } from '../../api/hardware-object';

async function get_resolution_limits_for_energy(energy) {
  const result = await sendGetAttribute(
    'energy',
    'energy',
    'get_resolution_limits_for_energy',
    {
      energy,
    },
  );

  return result.return;
}

async function asyncValidate(values, _d, props) {
  const errors = {};

  if (!props.beamline) {
    // for some reason redux-form is loaded before the initial status
    return errors;
  }
  const currEnergy = Number.parseFloat(values.energy);
  const currRes = Number.parseFloat(values.resolution);

  let resMin = 0;
  let resMax = 0;

  if (!props.beamline.hardwareObjects.energy.readonly) {
    [resMin, resMax] = await get_resolution_limits_for_energy(currEnergy);
  } else {
    resMin = props.beamline.hardwareObjects.resolution.limits[0];
    resMax = props.beamline.hardwareObjects.resolution.limits[1];
  }

  if (!(currRes >= resMin && currRes <= resMax)) {
    errors.resolution = 'Entered Resolution outside working range';
    throw errors;
  }

  return true;
}

export default asyncValidate;
