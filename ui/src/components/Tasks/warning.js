function warn(values, props) {
  const warnings = {};
  if (!props.beamline.hardwareObjects) {
    // for some reason redux-form is loaded before the initial status
    return warnings;
  }
  const energy = Number.parseFloat(values.energy);
  const blEnergy = Number.parseFloat(
    props.beamline.hardwareObjects.energy.value,
  );
  const energyThreshold = blEnergy * 0.01;

  const resolution = Number.parseFloat(values.resolution);
  const blResolution = Number.parseFloat(
    props.beamline.hardwareObjects.resolution.value,
  );
  const resThreshold = blResolution * 0.01;

  const trans = Number.parseFloat(values.transmission);
  const blTrans = Number.parseFloat(
    props.beamline.hardwareObjects.transmission.value,
  );
  const transThreshold = blTrans * 0.01;

  if (
    blEnergy - energyThreshold > energy ||
    energy > blEnergy + energyThreshold
  ) {
    warnings.energy = 'Entered energy is different from current energy';
  }

  if (
    blResolution - resThreshold > resolution ||
    resolution > blResolution + resThreshold
  ) {
    warnings.resolution =
      'Entered resolution is different from current resolution';
  }

  if (blTrans - transThreshold > trans || trans > blTrans + transThreshold) {
    warnings.transmission =
      'Entered transmission is different from current transmission';
  }

  const phiPrecision =
    props.components.find((el) => el.attribute === 'diffractometer.phi')
      ?.precision ?? 2;

  if (
    Number.parseFloat(
      props.beamline.hardwareObjects['diffractometer.phi'].value.toFixed(
        phiPrecision,
      ),
    ) !==
    Number.parseFloat(Number.parseFloat(values.osc_start).toFixed(phiPrecision))
  ) {
    warnings.osc_start =
      'Entered Oscillation start angle is different from current omega';
  }

  if (
    props.pointID !== -1 &&
    props.pointID.includes('2D') &&
    Number.parseFloat(values.osc_range) * Number.parseFloat(values.num_images) >
      5
  ) {
    warnings.osc_range =
      'The given oscillation range might be to large for this centering';
  }

  return warnings;
}

export default warn;
