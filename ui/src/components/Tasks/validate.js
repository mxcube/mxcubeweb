const INVALID_CHAR_MSG =
  'Invalid character in path, only alphanumerical characters and -, _, : allowed';

// eslint-disable-next-line complexity
function validate(values, props) {
  const errors = {};
  if (!props.beamline.hardwareObjects) {
    // for some reason redux-form is loaded before the initial status
    return errors;
  }
  const currEnergy = Number.parseFloat(values.energy);
  const currTransmission = Number.parseFloat(values.transmission);
  // here we update the resolution limits based on the energy the typed in the form,
  // the limits come from a table sent by the client

  const validFname = /^[\w#\-[\]{}]+$/u.test(props.filename);

  const emptyField = 'field is empty';

  if (!validFname) {
    errors.prefix = INVALID_CHAR_MSG;
  }

  if (props.subdir && !/^[\w\-/{}]+$/u.test(props.subdir)) {
    errors.subdir = INVALID_CHAR_MSG;
  }

  if (props.experimentName === undefined) {
    errors.experimentName = 'Please give an experiment name';
  }

  if (
    props.experimentName !== undefined &&
    !/^[\w\-/{}]+$/u.test(props.experimentName)
  ) {
    errors.experimentName = INVALID_CHAR_MSG;
  }

  if (
    Number.parseInt(values.num_images, 10) >
      props.acqParametersLimits.number_of_images ||
    Number.parseInt(values.num_images, 10) < 1
  ) {
    errors.num_images = 'Entered Number of images out of allowed range';
  }

  if (values.num_images === '') {
    errors.num_images = emptyField;
  }

  if (
    Number.parseInt(values.osc_range, 10) >
      props.acqParametersLimits.osc_range ||
    Number.parseFloat(values.osc_range, 10) < 0
  ) {
    errors.osc_range = 'wrong value';
  }

  if (values.osc_range === '') {
    errors.osc_range = emptyField;
  }

  if (values.osc_start === '') {
    errors.osc_start = emptyField;
  }

  if (props.acqParametersLimits.exposure_time) {
    const [exptimemin, exptimemax] = props.acqParametersLimits.exposure_time;
    if (
      values.exp_time === '' ||
      Number.parseFloat(values.exp_time, 10) > exptimemax ||
      Number.parseFloat(values.exp_time, 10) < exptimemin
    ) {
      errors.exp_time = 'Entered Exposure time out of allowed limit';
    }
  }

  if (
    !props.beamline.hardwareObjects.energy.readonly &&
    !(
      currEnergy > props.beamline.hardwareObjects.energy.limits[0] &&
      currEnergy < props.beamline.hardwareObjects.energy.limits[1]
    )
  ) {
    errors.energy = `Entered Energy is outside working range [${props.beamline.hardwareObjects.energy.limits[0]},
        ${props.beamline.hardwareObjects.energy.limits[1]}]`;
  }

  if (!(currTransmission >= 0 && currTransmission <= 100)) {
    errors.transmission =
      'Entered Transmission is outside working range [0, 100]';
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

  // processing fields are required if at least one of them is filled in
  const processingFields = {
    space_group: values.space_group,
    cellA: values.cellA,
    cellB: values.cellB,
    cellC: values.cellC,
    cellAlpha: values.cellAlpha,
    cellBeta: values.cellBeta,
    cellGamma: values.cellGamma,
  };
  const processingFieldsRequired = Object.values(processingFields).some(
    (field) => field !== undefined && field !== '',
  );
  if (processingFieldsRequired) {
    Object.entries(processingFields).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        errors[key] = emptyField;
      }
    });
  }

  return errors;
}

export default validate;
