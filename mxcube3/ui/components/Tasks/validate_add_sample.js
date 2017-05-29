const validate = (values, props) => {
  const errors = {};
  if (!props) {
    // for some reason redux-form is loaded before the initial status
    return errors;
  }
  const name = values.sampleName ? values.sampleName : '';
  const acr = values.proteinAcronym ? values.proteinAcronym : '';

  if (name.length === 0) {
    errors.sampleName = 'Missing sample name';
  }
  if (acr.length === 0) {
    errors.proteinAcronym = 'Missing protein acronym';
  }

  return errors;
};

export default validate;
