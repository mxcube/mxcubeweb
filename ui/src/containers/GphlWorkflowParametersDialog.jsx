/* eslint-disable jsx-a11y/control-has-associated-label */
import { useCallback, useEffect, useState } from 'react';
import { Button, Col, Form, Modal, Row, Stack, Table } from 'react-bootstrap';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import {
  showGphlWorkflowParametersDialog,
  updateGphlWorkflowParameters,
  updateGphlWorkflowParametersDialog,
} from '../actions/workflow';
import styles from './WorkflowParametersDialog.module.css';

const uiOptions = 'ui:options';

function renderIndexingTable(indexingTable, selected, onSelectRow) {
  return (
    <Table bordered responsive className={styles.indexingTableC}>
      <thead>
        <tr>
          <th className="text-center"> </th>
          {indexingTable.header.map((thContent) => (
            <th key={thContent} className={`${styles.specialTdTh} text-center`}>
              <pre>{thContent}</pre>
            </th>
          ))}
          <th className={styles.specialTdTh}> </th>
        </tr>
      </thead>
      <tbody>
        {indexingTable.content.map((tdContents) =>
          tdContents.map((tdContent, index) => (
            <tr
              key={tdContent}
              data-selected={selected.includes(index) || undefined}
              data-highlight={
                indexingTable.highlights[index]
                  ? indexingTable.highlights[index][0]
                  : undefined
              }
              onClick={() => onSelectRow(index, tdContent)}
            >
              <td className="text-center">{index + 1}</td>
              <td className={`${styles.specialTdTh} text-center`}>
                <pre className="align-items-center">{tdContent}</pre>
              </td>
              <td className={styles.specialTdTh} />
            </tr>
          )),
        )}
      </tbody>
    </Table>
  );
}

function removeExtraDecimal(value, type) {
  if (value !== undefined) {
    const valueString = value.toString();
    if (
      valueString.slice(valueString.indexOf('.') + 1).length > 4 &&
      type === 'number'
    ) {
      return Number(value.toFixed(4));
    }
  }
  return value;
}

function GphlWorkflowParametersDialog(props) {
  const {
    formData,
    show,
    updatedFormData,
    handleHide,
    updateGphlWorkflowParameters, // eslint-disable-line no-shadow
    resetUpdatedGphlWParameters,
    fetchUpdated,
  } = props;

  const [schema, setSchema] = useState(null);
  const [formState, setFormState] = useState({});
  const [errors, setErrors] = useState();
  const [validated, setValidated] = useState(false);
  const [validatedIndexingTable, setValidatedIndexingTable] = useState(false);
  const [selected, setSelected] = useState([]);

  const _initFormState = useCallback(() => {
    const dataDict = {};
    const newSchema = { ...formData.schema };
    setSchema(newSchema);
    Object.entries(newSchema.properties).forEach(([key, value]) => {
      dataDict[key] = removeExtraDecimal(value.default, value.type);
    });
    if (formData.ui_schema.indexing_solution) {
      const [initIndex] =
        formData.ui_schema.indexing_solution[uiOptions].select_cell;
      setSelected([initIndex]);
      dataDict.indexing_solution =
        formData.ui_schema.indexing_solution[uiOptions].content[0][initIndex];
    }
    return dataDict;
  }, [formData]);

  const handleAbort = useCallback(() => {
    // const signal = formData.ui_schema[uiOptions].return_signal;
    const parameter = {
      signal: 'GphlParameterReturn',
      instruction: 'PARAMETERS_CANCELLED',
      data: {},
    };
    updateGphlWorkflowParameters(parameter);
    handleHide();
  }, [updateGphlWorkflowParameters, handleHide]);

  const handleFormDataUpdated = useCallback(() => {
    if (updatedFormData) {
      const updatedDict = { ...formState };
      const newSchema = { ...formData.schema };
      Object.entries(updatedFormData).forEach(([key, val]) => {
        if (val.value !== undefined) {
          const newValue = removeExtraDecimal(val.value, typeof val.value);
          updatedDict[key] = newValue;
          // `key` may include a underscore (_), so we can't use `querySelector`
          if (document.getElementById(key)) {
            document.getElementById(key).value = newValue;
          }
        }
        newSchema.properties[key] = { ...newSchema.properties[key], ...val };
      });
      setSchema(newSchema);
      setFormState(updatedDict);
    }
  }, [formState, formData, updatedFormData]);

  useEffect(() => {
    if (show) {
      const initialDataDict = _initFormState();
      setFormState(initialDataDict);
    }
  }, [show, _initFormState]);

  useEffect(() => {
    if (fetchUpdated) {
      handleFormDataUpdated();
      resetUpdatedGphlWParameters();
    }
  }, [fetchUpdated, handleFormDataUpdated, resetUpdatedGphlWParameters]);

  function handleSubmit(e) {
    const form = e.currentTarget;
    if (form.checkValidity() === false || formState?.indexing_solution === '') {
      setValidated(true);
      e.preventDefault();
      e.stopPropagation();
    } else {
      const signal = formData.ui_schema[uiOptions].return_signal;
      const parameter = {
        signal,
        instruction: 'PARAMETERS_READY',
        data: formState,
      };
      updateGphlWorkflowParameters(parameter);
      setSchema(null);
      handleHide();
    }
  }

  async function handleChange(e) {
    const error = {};
    const key = e.target.name;
    const val =
      e.target.type === 'number'
        ? Number(e.target.value)
        : e.target.type === 'checkbox'
        ? e.target.checked
        : e.target.value;

    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      error[key] = e.target.validationMessage;
      setValidated(true);
    } else {
      setValidated(false);
      const newFormState = { ...formState };
      newFormState[key] = removeExtraDecimal(val, typeof val);
      const signal = formData.ui_schema[uiOptions].return_signal;
      const parameter = { signal, instruction: key, data: newFormState };
      await updateGphlWorkflowParameters(parameter);
      setFormState(newFormState);
    }

    setErrors({ ...errors, [key]: error[key] });
  }

  const handleIndexingTableChange = useCallback(
    async (value) => {
      const newFormState = { ...formState };
      newFormState.indexing_solution = value;
      setFormState(newFormState);
      const signal = formData.ui_schema[uiOptions].return_signal;
      const parameter = {
        signal,
        instruction: 'indexing_solution',
        data: newFormState,
      };
      await updateGphlWorkflowParameters(parameter);
    },
    [setFormState, formData, updateGphlWorkflowParameters, formState],
  );

  const onSelectRow = useCallback(
    (index, value) => {
      let newSelected = [...selected];
      let updatedValue = value;
      if (selected.includes(index)) {
        newSelected.splice(newSelected.indexOf(index), 1);
        updatedValue = '';
        setValidatedIndexingTable(true);
      } else {
        newSelected = [index];
        setValidatedIndexingTable(false);
        setValidated(false);
      }
      setSelected(newSelected);
      handleIndexingTableChange(updatedValue);
    },
    [selected, handleIndexingTableChange],
  );

  let formName = '';
  let renderFormRow = '';

  if (show && schema !== null) {
    const { ui_schema } = formData;

    formName = schema.title;

    renderFormRow = (
      <Form
        noValidate
        validated={validated}
        className="m-3"
        onSubmit={(e) => handleSubmit(e)}
      >
        {ui_schema
          ? ui_schema['ui:order'].map((rowKey) => (
              <Row key={rowKey} className={`${styles.gphlFormRowBox}`}>
                <div
                  className={`${validatedIndexingTable ? styles[rowKey] : ''} ${
                    styles.boxTitle
                  } mb-5`}
                >
                  <div className={`${styles.title} p-2`}>
                    {rowKey === 'reffiles'
                      ? schema.properties.reffiles?.title
                      : rowKey === 'indexing_solution'
                      ? schema.properties.indexing_solution?.title
                      : ui_schema[rowKey]['ui:title']}
                  </div>
                  <Row>
                    {rowKey === 'indexing_solution' ? (
                      ui_schema[rowKey]['ui:widget']?.includes('table') &&
                      renderIndexingTable(
                        ui_schema[rowKey][uiOptions],
                        selected,
                        onSelectRow,
                      )
                    ) : rowKey === 'reffiles' ? (
                      // Specific textarea for "reffiles"
                      schema.properties.reffiles.type === 'textarea' && (
                        <Form.Control
                          name="reffiles"
                          id="reffiles"
                          onChange={(e) => handleChange(e)}
                          data-highlight={
                            schema.properties.reffiles.highlight || undefined
                          }
                          type={schema.properties.reffiles.type}
                          as="textarea"
                          required
                          defaultValue={formState.reffiles}
                          readOnly={schema.properties.reffiles.readOnly}
                          disabled={schema.properties.reffiles.readOnly}
                        />
                      )
                    ) : rowKey === '_info' ? (
                      <pre className="p-2">
                        {schema.properties[rowKey].default}
                      </pre>
                    ) : (
                      ui_schema[rowKey]['ui:order']?.map((ColKey) => (
                        <Col key={ColKey} sm>
                          {ui_schema[rowKey][ColKey]['ui:order'].map(
                            (fieldKey) => (
                              <Row key={fieldKey} className="mb-3">
                                <Form.Group as={Col} sm>
                                  <Form.Label>
                                    {schema.properties[fieldKey].type !==
                                      'boolean' &&
                                      schema.properties[fieldKey].title}
                                  </Form.Label>
                                  {schema.properties[fieldKey].type ===
                                  'boolean' ? (
                                    <Form.Check
                                      type="checkbox"
                                      name={fieldKey}
                                      id={fieldKey}
                                      label={schema.properties[fieldKey].title}
                                      onChange={(e) => handleChange(e)}
                                      checked={formState[fieldKey]}
                                      data-highlight={
                                        schema.properties[fieldKey].highlight ||
                                        undefined
                                      }
                                    />
                                  ) : schema.properties[fieldKey].enum ? (
                                    <Form.Select
                                      name={fieldKey}
                                      id={fieldKey}
                                      value={formState[fieldKey]}
                                      onChange={(e) => handleChange(e)}
                                      data-highlight={
                                        schema.properties[fieldKey].highlight ||
                                        undefined
                                      }
                                    >
                                      {schema.properties[fieldKey].enum.map(
                                        (val) => (
                                          <option key={val} value={val}>
                                            {val}
                                          </option>
                                        ),
                                      )}
                                    </Form.Select>
                                  ) : // Generic any other textarea
                                  schema.properties[fieldKey].type ===
                                    'textarea' ? (
                                    <Form.Control
                                      name={fieldKey}
                                      id={fieldKey}
                                      onChange={(e) => handleChange(e)}
                                      data-highlight={
                                        schema.properties[fieldKey].highlight ||
                                        undefined
                                      }
                                      type={schema.properties[fieldKey].type}
                                      as="textarea"
                                      defaultValue={formState[fieldKey]}
                                      readOnly={
                                        schema.properties[fieldKey].readOnly
                                      }
                                      disabled={
                                        schema.properties[fieldKey].readOnly
                                      }
                                    />
                                  ) : (
                                    <Form.Control
                                      name={fieldKey}
                                      id={fieldKey}
                                      onChange={(e) => handleChange(e)}
                                      data-highlight={
                                        schema.properties[fieldKey].highlight ||
                                        undefined
                                      }
                                      type={schema.properties[fieldKey].type}
                                      required
                                      step="any"
                                      min={
                                        schema.properties[fieldKey].minimum ||
                                        'any'
                                      }
                                      max={
                                        schema.properties[fieldKey].maximum ||
                                        'any'
                                      }
                                      defaultValue={formState[fieldKey]}
                                      readOnly={
                                        schema.properties[fieldKey].readOnly
                                      }
                                      disabled={
                                        schema.properties[fieldKey].readOnly
                                      }
                                    />
                                  )}
                                  <Form.Control.Feedback type="invalid">
                                    {errors ? errors[fieldKey] : null}
                                  </Form.Control.Feedback>
                                </Form.Group>
                              </Row>
                            ),
                          )}
                        </Col>
                      ))
                    )}
                  </Row>
                </div>
              </Row>
            ))
          : null}
        <Stack direction="horizontal" gap={3}>
          <div className="ms-auto">
            <Button variant="success" disabled={validated} type="submit">
              Continue{' '}
            </Button>
          </div>
          <div>
            <Button variant="outline-secondary" onClick={handleAbort}>
              {' '}
              Abort{' '}
            </Button>
          </div>
        </Stack>
      </Form>
    );
  }

  return (
    <Modal show={show} onHide={handleAbort} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{formName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="m-3" id="form-holder">
          {renderFormRow}
        </div>
      </Modal.Body>
      <Modal.Footer />
    </Modal>
  );
}

function mapStateToProps(state) {
  return {
    show: state.workflow.showGphlDialog,
    formData: state.workflow.gphlParameters,
    updatedFormData: state.workflow.gphlUpdatedParameters,
    fetchUpdated: state.workflow.fetchUpdated,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    handleHide: bindActionCreators(
      () => showGphlWorkflowParametersDialog(null, false),
      dispatch,
    ),
    updateGphlWorkflowParameters: bindActionCreators(
      updateGphlWorkflowParameters,
      dispatch,
    ),
    resetUpdatedGphlWParameters: bindActionCreators(
      () => updateGphlWorkflowParametersDialog(null, false),
      dispatch,
    ),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(GphlWorkflowParametersDialog);
