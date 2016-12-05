var everpolate = require('everpolate');

const validate = (values, props) => {
  const errors = {};
  if (!props.motorLimits.resolution) {
    // for some reason redux-form is loaded before the initial status @##@!
    return errors;
  }
  let curr_energy = parseFloat(values.energy);
  let curr_res = parseFloat(values.resolution);
  let energies = props.motorLimits.resolution.limits.map(function(value,index) { return value[0]; });
  let limits_min = props.motorLimits.resolution.limits.map(function(value,index) { return value[1]; });
  let limits_max = props.motorLimits.resolution.limits.map(function(value,index) { return value[2]; });
  // here we update the resolution limits based on the energy the typed in the form,
  // the limits come from a table sent by the client
  let res_min = everpolate.linear(curr_energy, energies, limits_min);
  let res_max = everpolate.linear(curr_energy, energies, limits_max);

  if (values.num_images === '' ||
      parseInt(values.num_images, 10) > props.acqParametersLimits.number_of_images) {
    errors.num_images = 'Number of images above the limit';
  }
  if (values.osc_range === '') {
    errors.osc_range = 'field empty';
  }
  if (values.osc_start === '') {
    errors.osc_start = 'field empty';
  }
  if (values.exp_time === '' || values.exp_time > props.acqParametersLimits.exposure_time) {
    errors.exp_time = 'Exposure time above the limit';
  }
  if (!(curr_res > res_min && curr_res < res_max)) {
    errors.resolution = 'Resolution outside working range';
  }
  if (!(curr_energy > props.motorLimits.energy.limits[0] &&
        curr_energy < props.motorLimits.energy.limits[1])) {
    errors.energy = 'Energy outside working range';
  }
  if (values.num_images === '' || values.osc_range > props.acqParametersLimits.osc_range) {
    errors.osc_range = 'Oscillation range outside the limit';
  }
  return errors;
};

export default validate;
