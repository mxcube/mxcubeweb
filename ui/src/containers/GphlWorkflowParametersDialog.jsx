/* eslint-disable unicorn/prefer-query-selector */
import React, { useState, useEffect, useCallback } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Modal, Row, Col, Form, Table, Button, Stack } from 'react-bootstrap';
import './WorkflowParametersDialog.css';

import {
  showGphlWorkflowParametersDialog,
  updateGphlWorkflowParameters,
  updateGphlWorkflowParametersDialog,
} from '../actions/workflow';

const uiOptions = 'ui:options';

function renderIndexingTable(indexingTable, selected, onSelectRow) {
  return (
    <Table
      id="indexing_table"
      bordered
      striped
      responsive
      className="indexing_table"
    >
      <thead>
        <tr>
          <th> </th>
          {indexingTable.header.map((thContent) => (
            <th key={thContent} className="indexing_table_special_td_th">
              <pre>{thContent}</pre>
            </th>
          ))}
          <th className="indexing_table_special_td_th"> </th>
        </tr>
      </thead>
      <tbody className="indexing_table_body">
        {indexingTable.content.map((tdContents) =>
          tdContents.map((tdContent, index) => (
            <tr
              key={tdContent}
              className={`${
                selected.includes(index) ? 'indexing_table_row_selected' : ''
              }
                  ${
                    indexingTable.highlights[index]
                      ? 'indexing_table_row_variant'
                      : ''
                  } trclass`}
              onClick={() => onSelectRow(index, tdContent)}
            >
              <td>{index + 1}</td>
              <td className="indexing_table_special_td_th">
                <pre>{tdContent}</pre>
              </td>
              <td className="indexing_table_special_td_th" />
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
      valueString.slice(valueString.indexOf('.') + 1, valueString.length)
        .length > 4 &&
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
    updateGphlWorkflowParameters,
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
      const initIndex =
        formData.ui_schema.indexing_solution[uiOptions].select_cell[0];
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
        if (val.value) {
          const newValue = removeExtraDecimal(val.value, typeof val.value);
          updatedDict[key] = newValue;
          newSchema.properties[key] = { ...newSchema.properties[key], ...val };
          // `key` may include a underscore (_), so we can't use `querySelector`
          if (document.getElementById(key)) {
            document.getElementById(key).value = newValue;
          }
        }
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

  if (show && schema) {
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
          ? // eslint-disable-next-line sonarjs/cognitive-complexity
            ui_schema['ui:order'].map((rowKey) => (
              <Row key={rowKey} className="mb-5 gphl_row_box">
                <div
                  className={`${
                    validatedIndexingTable ? rowKey : ''
                  } title_box`}
                  id="bill_to"
                >
                  <div className="p-2" id="title">
                    {ui_schema[rowKey]['ui:title'] ||
                      schema.properties.indexing_solution?.title ||
                      null}
                  </div>
                  <Row>
                    {ui_schema[rowKey]['ui:order'] ? (
                      ui_schema[rowKey]['ui:order'].map((ColKey) => (
                        <Col key={ColKey} sm>
                          {ui_schema[rowKey][ColKey]['ui:order'].map(
                            (fieldKey) => (
                              <Row key={fieldKey} className="mb-3">
                                <Form.Group as={Col} sm className="">
                                  <Form.Label>
                                    {schema.properties[fieldKey].type !==
                                    'boolean'
                                      ? schema.properties[fieldKey].title
                                      : null}
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
                                    />
                                  ) : schema.properties[fieldKey].enum ? (
                                    <Form.Select
                                      name={fieldKey}
                                      id={fieldKey}
                                      value={formState[fieldKey]}
                                      onChange={(e) => handleChange(e)}
                                    >
                                      {schema.properties[fieldKey].enum.map(
                                        (val) => (
                                          <option key={val} value={val}>
                                            {val}
                                          </option>
                                        ),
                                      )}
                                    </Form.Select>
                                  ) : (
                                    <Form.Control
                                      name={fieldKey}
                                      id={fieldKey}
                                      onChange={(e) => handleChange(e)}
                                      className="me-2"
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
                    ) : ui_schema[rowKey]['ui:widget'] ? (
                      ui_schema[rowKey]['ui:widget'].includes('table') ? (
                        renderIndexingTable(
                          ui_schema[rowKey][uiOptions],
                          selected,
                          onSelectRow,
                        )
                      ) : null
                    ) : (
                      <pre className="p-2">
                        {schema.properties[rowKey].default}
                      </pre>
                    )}
                  </Row>
                </div>
              </Row>
            ))
          : null}
        <Stack direction="horizontal" gap={3}>
          <div className="p-2 ms-auto">
            <Button variant="success" disabled={validated} type="submit">
              Continue{' '}
            </Button>
          </div>
          <div className="p-2">
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
