const validate = (values, props) => {
  const errors = {};
  if (!props) {
    // for some reason redux-form is loaded before the initial status
    return errors;
  }
  const name = values.sampleName ? values.sampleName : '';
  const acr = values.proteinAcronym ? values.proteinAcronym : '';
  const regex = new RegExp(/^[a-zA-Z0-9:+_-]*$/);

  if (name.length === 0 || !regex.test(name)) {
    errors.sampleName = 'Missing sample name';
  }
  if (acr.length === 0 || !regex.test(acr)) {
    errors.proteinAcronym = 'Missing protein acronym';
  }

  return errors;
};

export default validate;
