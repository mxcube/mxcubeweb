const everpolate = require('everpolate');

const validate = (values, props) => {
  const errors = {};
  if (!props.attributes) {
    // for some reason redux-form is loaded before the initial status
    return errors;
  }
  const currEnergy = Number.parseFloat(values.energy);
  const currRes = Number.parseFloat(values.resolution);
  const currTransmission = Number.parseFloat(values.transmission);
  const energies = props.attributes.resolution.limits.map((value) => value[0]);
  const limitsMin = props.attributes.resolution.limits.map((value) => value[1]);
  const limitsMax = props.attributes.resolution.limits.map((value) => value[2]);
  // here we update the resolution limits based on the energy the typed in the form,
  // the limits come from a table sent by the client

  /* eslint-disable no-useless-escape */
  const validPath = props.path.match(/^[\w/{}\-\-]+$/);
  const validFname = props.filename.match(/^[\w#[\]{}\-\-]+$/);
  /* eslint-enable no-useless-escape */

  if (!validFname) {
    errors.prefix =
      'Invalid character in path, only alphanumerical characters and -, _, : allowed';
  }

  if (!validPath) {
    errors.subdir =
      'Invalid character in path, only alphanumerical characters and -, _, : allowed';
  }

  let resMin = 0;
  let resMax = 0;

  if (energies.length > 2) {
    resMin = everpolate.linear(currEnergy, energies, limitsMin);
    resMax = everpolate.linear(currEnergy, energies, limitsMax);
  } else {
    resMin = props.attributes.resolution.limits[0];
    resMax = props.attributes.resolution.limits[1];
  }

  if (
    values.num_images === '' ||
    Number.parseInt(values.num_images, 10) >
      props.acqParametersLimits.number_of_images ||
    Number.parseInt(values.num_images, 10) < 1
  ) {
    errors.num_images = 'Number of images out of allowed range';
  }
  if (
    values.osc_range === '' ||
    Number.parseInt(values.osc_range, 10) > props.acqParametersLimits.osc_range ||
    Number.parseFloat(values.osc_range, 10) < 0
  ) {
    errors.osc_range = 'wrong value';
  }
  if (values.osc_start === '') {
    errors.osc_start = 'field empty';
  }

  const exptimemin = props.acqParametersLimits.exposure_time[0];
  const exptimemax = props.acqParametersLimits.exposure_time[1];
  if (
    values.exp_time === '' ||
    Number.parseFloat(values.exp_time, 10) > exptimemax ||
    Number.parseFloat(values.exp_time, 10) < exptimemin
  ) {
    errors.exp_time = 'Exposure time out of allowed limit';
  }

  if (!(currRes > resMin && currRes <= resMax)) {
    errors.resolution = 'Resolution outside working range';
  }

  if (energies.length > 2 && 
      !(
        currEnergy > props.attributes.energy.limits[0] &&
        currEnergy < props.attributes.energy.limits[1]
      )
    ) {
      errors.energy = 'Energy outside working range';
    }

  if (!(currTransmission >= 0 && currTransmission <= 100)) {
    errors.transmission = 'Transmission outside working range';
  }

  if (
    props.pointID !== -1 &&
    props.pointID.includes('2D') &&
    props.form === 'characterisation' &&
    Number.parseFloat(values.num_images) !== 1
  ) {
    errors.num_images =
      'Only 1 image allowed when characterizing from a 2D-point';
  }

  if (
    values.osc_range * values.num_images >
    props.acqParametersLimits.osc_max
  ) {
    errors.osc_range = 'Omega out of limits';
    errors.num_images = 'Omega out of limits';
  }

  return errors;
};

export default validate;
