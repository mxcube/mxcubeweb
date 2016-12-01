const validate = (values, props) => {
  const errors = {};
  if (!props.motorLimits.resolution) {
    return errors; //for some reason redux-form is loaded before the initial status @##@!
  }
  if (values.num_images == '' || parseInt(values.num_images, 10) > props.acqParametersLimits.number_of_images) {
    errors.num_images = 'Number of images above the limit';
  }
  if (values.osc_range == '') {
    errors.osc_range = 'field empty';
  }
  if (values.osc_start == '') {
    errors.osc_start = 'field empty';
  }
  if (values.exp_time == '' || values.exp_time > props.acqParametersLimits.exposure_time) {
    errors.exp_time = 'Exposure time above the limit';
  }
  if (!(parseInt(values.resolution, 10) > props.motorLimits.resolution.limits[0] && parseInt(values.resolution, 10) < props.motorLimits.resolution.limits[1])) {
    errors.resolution = 'Resolution outside working range';
  }
  if (!(parseInt(values.energy, 10) > props.motorLimits.energy.limits[0] && parseInt(values.energy, 10) < props.motorLimits.energy.limits[1])) {
    errors.energy = 'Energy outside working range';
  }
  if (values.num_images == '' || values.osc_range > props.acqParametersLimits.osc_range) {
    errors.osc_range = 'Oscillation range outside the limit';
  }
  return errors;
};
export default validate;
