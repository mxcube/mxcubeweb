const everpolate = require('everpolate');

const validate = (values, props) => {
  const errors = {};
  if (!props.beamline.hardwareObjects) {
    // for some reason redux-form is loaded before the initial status
    return errors;
  }
  const currEnergy = Number.parseFloat(values.energy);
  const currRes = Number.parseFloat(values.resolution);
  const currTransmission = Number.parseFloat(values.transmission);
  const energies = props.beamline.hardwareObjects.resolution.limits.map(value => value[0]);
  const limitsMin = props.beamline.hardwareObjects.resolution.limits.map(value => value[1]);
  const limitsMax = props.beamline.hardwareObjects.resolution.limits.map(value => value[2]);
  // here we update the resolution limits based on the energy the typed in the form,
  // the limits come from a table sent by the client

  /* eslint-disable no-useless-escape */
  const validFname = /^[-\w\-\#\_\{\}\[\]]+$/.test(props.filename);
  /* eslint-enable no-useless-escape */

  const emptyField = 'field is empty';
    
  if (!validFname) {
    errors.prefix = 'Invalid character in path, only alphanumerical characters and -, _, : allowed';
  }

  if (props.subdir && !/^[-\w\-\/\_\{\}]+$/.test(props.subdir)) {
    errors.subdir = 'Invalid character in path, only alphanumerical characters and -, _, : allowed';
  }

  if (props.experimentName === undefined) {
    errors.experimentName = 'Please give an experiment name';
  }
    
  if (props.experimentName !== undefined && !/^[-\w\-\/\_\{\}]+$/.test(props.experimentName)) {
    errors.experimentName = 'Invalid character in path, only alphanumerical characters and -, _, : allowed';
  }

  let resMin = 0;
  let resMax = 0;

  if (energies.length > 2) {
    resMin = everpolate.linear(currEnergy, energies, limitsMin);
    resMax = everpolate.linear(currEnergy, energies, limitsMax);
  } else {
    resMin = props.beamline.hardwareObjects.resolution.limits[0];
    resMax = props.beamline.hardwareObjects.resolution.limits[1];
  }

  if (Number.parseInt(values.num_images, 10) > props.acqParametersLimits.number_of_images
    || Number.parseInt(values.num_images, 10) < 1) {
    errors.num_images = 'Entered Number of images out of allowed range';
  }

  if (values.num_images === '') {
    errors.num_images = emptyField;
  }

  if (Number.parseInt(values.osc_range, 10) > props.acqParametersLimits.osc_range
    || Number.parseFloat(values.osc_range, 10) < 0) {
    errors.osc_range = 'wrong value';
  }

  if (values.osc_range === '') {
    errors.osc_range = emptyField;
  }

  if (values.osc_start === '') {
    errors.osc_start = emptyField;
  }

  if (props.acqParametersLimits.exposure_time) {
    const exptimemin = props.acqParametersLimits.exposure_time[0];
    const exptimemax = props.acqParametersLimits.exposure_time[1];
    if (values.exp_time === '' || Number.parseFloat(values.exp_time, 10) > exptimemax
      || Number.parseFloat(values.exp_time, 10) < exptimemin) {
      errors.exp_time = 'Entered Exposure time out of allowed limit';
    }
  }

  if (!(currRes >= resMin && currRes <= resMax)) {
    errors.resolution = 'Entered Resolution outside working range';
  }

  if (energies.length >= 2 && !(currEnergy > props.beamline.hardwareObjects.energy.limits[0]
    && currEnergy < props.beamline.hardwareObjects.energy.limits[1])) {
    errors.energy = `Entered Energy is outside working range [${props.beamline.hardwareObjects.energy.limits[0]},
        ${props.beamline.hardwareObjects.energy.limits[1]}]`;
  }

  if (!(currTransmission >= 0 && currTransmission <= 100)) {
    errors.transmission = 'Entered Transmission is outside working range [0, 100]';
  }

  if (props.pointID !== -1 && props.pointID.includes('2D') && props.form === 'characterisation'
    && Number.parseFloat(values.num_images) !== 1) {
    errors.num_images = 'Only 1 image allowed when characterizing from a 2D-point';
  }

  if (values.osc_range * values.num_images > props.acqParametersLimits.osc_max) {
    errors.osc_range = 'Omega out of limits';
    errors.num_images = 'Omega out of limits';
  }

  return errors;
};

export default validate;
