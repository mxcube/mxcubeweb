import React, { useState, useEffect } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Modal, Row, Col, Form as Form, Button, Stack } from 'react-bootstrap';
import RcInputNumber from 'rc-input-number';

import {
  showGphlWorkflowParametersDialog,
  updateGphlWorkflowParameters,
} from '../actions/workflow';

import './WorkflowParametersDialog.css';

function GphlWorkflowParametersDialog(props) {
  const { formData, show, handleHide, updateGphlWorkflowParameters } = props;

  const [formDataDict, setFormDataDict] = useState();
  const [errors, setErrors] = useState();
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    if (show) {
      _setDataDict();
    }
  });

  function _setDataDict() {
    const dict = {}
    Object.entries(formData.schema.properties).forEach(
      ([key, value]) => {
        dict[key] = value.default;
      }
    )
    setFormDataDict(dict);
  }

  function handleSubmit(e) {
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
    }
    else {
      const signal  = formData.ui_schema['ui:options'].return_signal;
      const parameter = {'signal': signal, 'instruction': 'PARAMETERS_READY', 'data': formDataDict}
      updateGphlWorkflowParameters(parameter);
      handleHide();
    }
    setValidated(true);
  }

  function handleChange(e) { 
    const error = {};
    const key = e.target.name;
    const val = e.target.value;
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      error[key] = e.target.validationMessage;
      setValidated(true);
    } else {
      setValidated(false);
    }

    setFormDataDict({...formDataDict, [key] : val});
    
    setErrors({...errors, [key] : error[key]});
    // const signal  = formData.ui_schema['ui:options'].return_signal;
    // const parameter = {'signal': signal, 'instruction': key, 'data': formDataDict}
    // updateGphlWorkflowParameters(parameter);
  }

  function handleAbort() {
    const signal  = formData.ui_schema['ui:options'].return_signal;
    const parameter = {'signal': signal, 'instruction': 'PARAMETERS_CANCELLED', 'data': formDataDict}
    updateGphlWorkflowParameters(parameter);
    handleHide();
  }

  let schema = null;
  let uiSchema = null;
  let formName = '';
  let renderFormRow = '';

  if(show) {
    schema = formData.schema;
    uiSchema = formData.ui_schema;
    formName = schema["title"];

    renderFormRow = (
      <Form noValidate validated={validated} className='m-3' onSubmit={handleSubmit}>
        { uiSchema?
          uiSchema["ui:order"].map((rowKey) => (
            <Row className='mb-5'>
              <div className="title_box" id="bill_to">
                <div className="p-2" id="title">{uiSchema[rowKey]["ui:title"]}</div>
                <Row>
                  {uiSchema[rowKey]["ui:order"] ?
                    uiSchema[rowKey]["ui:order"].map((ColKey) => (
                    <Col sm>
                      {uiSchema[rowKey][ColKey]["ui:order"].map((fieldKey) => (
                        <Row className='mb-3'>
                          <Form.Group as={Col} sm  className=''>
                            <Form.Label>{schema.properties[fieldKey]["title"]}</Form.Label>
                            {schema.properties[fieldKey]["type"] === "boolean"?
                              <Form.Check
                                type='checkbox'
                                name={fieldKey}
                                label={fieldKey.replaceAll('_', ' ')}
                                onChange={(e) => handleChange(e)}
                                defaultChecked={schema.properties[fieldKey]["default"]}
                              />
                            :
                            schema.properties[fieldKey]["enum"] ?
                            <Form.Select
                              name={fieldKey}
                              defaultValue={schema.properties[fieldKey]["default"]}
                              onChange={(e) => handleChange(e)}
                            >
                              {schema.properties[fieldKey]["enum"].map((val) =>(
                                <option value={val} >
                                  {val}
                                </option>
                              ))}
                            </Form.Select>
                            :
                            <Form.Control
                              name={fieldKey}
                              onChange={(e) => handleChange(e)}
                              className='me-2'
                              type={schema.properties[fieldKey]["type"]}
                              step="any"
                              required
                              min={schema.properties[fieldKey]["minimum"] || 'any'}
                              max={schema.properties[fieldKey]["maximum"] || 'any'}
                              defaultValue={schema.properties[fieldKey]["default"]}
                              readOnly={schema.properties[fieldKey]["readOnly"]}
                              disabled={schema.properties[fieldKey]["readOnly"]}
                            />
                            }
                            <Form.Control.Feedback type="invalid">
                              {errors? errors[fieldKey] : null}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Row>
                      ))}
                    </Col>
                  )):
                    <pre className="p-2">
                      {schema.properties[rowKey]["default"]}
                    </pre>
                  }
                </Row>
              </div>
            </Row>
          ))
        :
        null
      }
        <Stack direction="horizontal" gap={3}>
          <div className="p-2 ms-auto"><Button variant="success" disabled={validated} type="submit">Continue </Button></div>
          <div className="p-2"><Button variant='outline-secondary' onClick={handleAbort}> Abort </Button></div>
        </Stack>
      </Form>
    )
  }

  return (
    <Modal show={show} onHide={handleHide} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{formName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className='m-3' id="form-holder">
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
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(GphlWorkflowParametersDialog);
