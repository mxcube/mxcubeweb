/* eslint-disable jsx-a11y/control-has-associated-label */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Form, Modal, Row, Stack, Table } from 'react-bootstrap';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import {
  showGphlWorkflowParametersDialog,
  updateGphlWorkflowParameters,
  updateGphlWorkflowParametersDialog,
} from '../actions/workflow';
import { DraggableModal } from '../components/DraggableModal';
import styles from './WorkflowParametersDialog.module.css';

const DEFAULT_DIALOG_POSITION = { x: -100, y: 100 };

const uiOptions = 'ui:options';

function renderIndexingTable(indexingTable, selected, onSelectRow, tbodyRef) {
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
      <tbody ref={tbodyRef}>
        {indexingTable.content.map((tdContents) =>
          tdContents.map((tdContent, index) => (
            <tr
              key={tdContent}
              data-selected={selected.includes(index) || undefined}
              onClick={() => onSelectRow(index, tdContent)}
            >
              <td className="text-center">{index + 1}</td>
              <td
                className={`${styles.specialTdTh} text-center`}
                data-cell-highlight={
                  indexingTable.highlights[index]?.[0] || undefined
                }
              >
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

function validateNumber(rawValue, fieldProps) {
  if (rawValue === '') {
    return 'Please fill in this field.';
  }
  const numValue = Number(rawValue);
  const min = fieldProps.minimum ?? fieldProps.lowerBound;
  const max = fieldProps.maximum ?? fieldProps.upperBound;
  if (min !== undefined && numValue < min) {
    return `Value must be greater than or equal to ${min}.`;
  }
  if (max !== undefined && numValue > max) {
    return `Value must be less than or equal to ${max}.`;
  }
  return null;
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
  const [invalidFields, setInvalidFields] = useState({});
  const [validatedIndexingTable, setValidatedIndexingTable] = useState(false);
  const [selected, setSelected] = useState([]);

  const modalBodyRef = useRef(null);
  const tbodyRef = useRef(null);

  const updateTableHeight = useCallback(() => {
    if (!tbodyRef.current || !modalBodyRef.current) {
      return;
    }
    const modalContent = modalBodyRef.current.closest('.modal-content');
    if (!modalContent) {
      return;
    }
    const modalHeight = modalContent.clientHeight;
    const naturalHeight = tbodyRef.current.scrollHeight;
    const targetHeight = Math.min(Math.round(modalHeight * 0.3), naturalHeight);
    tbodyRef.current.style.height = `${targetHeight}px`;
    tbodyRef.current.style.overflowY =
      targetHeight < naturalHeight ? 'auto' : 'hidden';
  }, []);

  useEffect(() => {
    if (!show || !modalBodyRef.current) {
      return undefined;
    }
    const modalContent = modalBodyRef.current.closest('.modal-content');
    if (!modalContent) {
      return undefined;
    }
    const observer = new ResizeObserver(updateTableHeight);
    observer.observe(modalContent);
    return () => observer.disconnect();
  }, [show, schema, updateTableHeight]);

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
      setInvalidFields({});
    }
  }, [show, _initFormState]);

  useEffect(() => {
    if (fetchUpdated) {
      handleFormDataUpdated();
      resetUpdatedGphlWParameters();
    }
  }, [fetchUpdated, handleFormDataUpdated, resetUpdatedGphlWParameters]);

  function handleSubmit(e) {
    if (
      Object.keys(invalidFields).length > 0 ||
      hasInvalidatedFields ||
      formState?.indexing_solution === ''
    ) {
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
    const key = e.target.name;
    const fieldProps = schema.properties[key];

    let errorMsg = null;

    if (e.target.type === 'number') {
      errorMsg = validateNumber(e.target.value, fieldProps);
    } else if (!e.target.checkValidity()) {
      errorMsg = e.target.validationMessage;
    }

    const { [key]: _removed, ...rest } = invalidFields;
    const newInvalidFields = errorMsg ? { ...rest, [key]: errorMsg } : rest;
    setInvalidFields(newInvalidFields);

    if (errorMsg) {
      return;
    }

    const val =
      e.target.type === 'number'
        ? Number(e.target.value)
        : e.target.type === 'checkbox'
        ? e.target.checked
        : e.target.value;

    const newFormState = {
      ...formState,
      [key]: removeExtraDecimal(val, typeof val),
    };
    const signal = formData.ui_schema[uiOptions].return_signal;
    const parameter = { signal, instruction: key, data: newFormState };
    await updateGphlWorkflowParameters(parameter);
    setFormState(newFormState);
  }

  const handleIndexingTableChange = useCallback(
    async (value) => {
      const newFormState = { ...formState, indexing_solution: value };
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
      }
      setSelected(newSelected);
      handleIndexingTableChange(updatedValue);
    },
    [selected, handleIndexingTableChange],
  );

  function renderFieldControl(fieldKey, isEnumNoLabel) {
    const fieldProps = schema.properties[fieldKey];
    const highlight = fieldProps.highlight || undefined;
    const isInvalidated = fieldProps.invalidated === true;
    const isInvalid = isInvalidated || Boolean(invalidFields[fieldKey]);
    return (
      <div
        key={`${fieldKey}-value`}
        style={isEnumNoLabel ? { gridColumn: 'span 2' } : undefined}
      >
        {fieldProps.type === 'boolean' ? (
          <Form.Check
            type="checkbox"
            name={fieldKey}
            id={fieldKey}
            onChange={(e) => handleChange(e)}
            checked={formState[fieldKey]}
            data-highlight={highlight}
            isInvalid={isInvalid}
          />
        ) : fieldProps.enum ? (
          <Form.Select
            name={fieldKey}
            id={fieldKey}
            value={formState[fieldKey]}
            onChange={(e) => handleChange(e)}
            data-highlight={highlight}
            isInvalid={isInvalid}
          >
            {fieldProps.enum.map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </Form.Select>
        ) : fieldProps.type === 'textarea' ? (
          <Form.Control
            name={fieldKey}
            id={fieldKey}
            onChange={(e) => handleChange(e)}
            data-highlight={highlight}
            type={fieldProps.type}
            as="textarea"
            defaultValue={formState[fieldKey]}
            readOnly={fieldProps.readOnly}
            disabled={fieldProps.readOnly}
            isInvalid={isInvalid}
          />
        ) : fieldProps.type === 'spinbox' ? (
          <Form.Control
            className={styles.spinboxInput}
            name={fieldKey}
            id={fieldKey}
            onChange={(e) => handleChange(e)}
            data-highlight={highlight}
            type="number"
            required
            step={fieldProps.stepsize ?? 1}
            min={fieldProps.lowerBound ?? undefined}
            max={fieldProps.upperBound ?? undefined}
            defaultValue={formState[fieldKey]}
            readOnly={fieldProps.readOnly}
            disabled={fieldProps.readOnly}
            isInvalid={isInvalid}
          />
        ) : (
          <Form.Control
            name={fieldKey}
            id={fieldKey}
            onChange={(e) => handleChange(e)}
            data-highlight={highlight}
            type={fieldProps.type}
            required
            step="any"
            min={fieldProps.minimum ?? 'any'}
            max={fieldProps.maximum ?? 'any'}
            defaultValue={formState[fieldKey]}
            readOnly={fieldProps.readOnly}
            disabled={fieldProps.readOnly}
            isInvalid={isInvalid}
          />
        )}
        <Form.Control.Feedback type="invalid">
          {invalidFields[fieldKey] || null}
        </Form.Control.Feedback>
      </div>
    );
  }

  function renderGridFields(rowKey) {
    const uiSchema = formData.ui_schema;
    const colKeys = uiSchema[rowKey]['ui:order'] || [];
    if (colKeys.length === 0) {
      return null;
    }
    const maxFieldRows = Math.max(
      ...colKeys.map((ck) => uiSchema[rowKey][ck]['ui:order'].length),
    );
    const items = [];
    for (let rowIdx = 0; rowIdx < maxFieldRows; rowIdx++) {
      for (const ColKey of colKeys) {
        const fieldKey = uiSchema[rowKey][ColKey]['ui:order'][rowIdx];
        if (!fieldKey) {
          items.push(
            <span key={`${ColKey}-${rowIdx}-el`} />,
            <span key={`${ColKey}-${rowIdx}-ev`} />,
          );
        } else {
          const fieldTitle = schema.properties[fieldKey].title;
          const isEnumNoLabel = !fieldTitle && schema.properties[fieldKey].enum;
          if (!isEnumNoLabel) {
            items.push(
              <Form.Label
                key={`${fieldKey}-label`}
                htmlFor={fieldKey}
                column={false}
                className={`${styles.fieldLabel} text-end`}
              >
                {fieldTitle}
              </Form.Label>,
            );
          }
          items.push(renderFieldControl(fieldKey, isEnumNoLabel));
        }
      }
    }
    return (
      <div
        className={styles.fieldsRow}
        style={{
          gridTemplateColumns: `repeat(${colKeys.length}, max-content 1fr)`,
        }}
      >
        {items}
      </div>
    );
  }

  const hasInvalidatedFields = Boolean(
    schema &&
      Object.values(schema.properties).some((p) => p.invalidated === true),
  );
  const hasErrors =
    Object.keys(invalidFields).length > 0 || hasInvalidatedFields;

  let formName = '';
  let renderFormRow = '';

  if (show && schema !== null) {
    const { ui_schema } = formData;

    formName = schema.title;

    renderFormRow = (
      <Form
        noValidate
        className={`m-1 ${styles.formHolder}`}
        onSubmit={(e) => handleSubmit(e)}
      >
        {ui_schema
          ? ui_schema['ui:order'].map((rowKey) => (
              <Row
                key={rowKey}
                className={`${styles.gphlFormRowBox}${
                  rowKey === 'indexing_solution' ? ` ${styles.indexingRow}` : ''
                }`}
              >
                <div
                  className={`${validatedIndexingTable ? styles[rowKey] : ''} ${
                    styles.boxTitle
                  } mb-2`}
                >
                  <div className={`${styles.title} p-1`}>
                    {rowKey === 'indexing_solution'
                      ? schema.properties.indexing_solution?.title
                      : schema.properties[rowKey]?.type === 'textarea'
                      ? schema.properties[rowKey]?.title
                      : ui_schema[rowKey]['ui:title']}
                  </div>
                  <Row className="mx-0">
                    {rowKey === 'indexing_solution' ? (
                      ui_schema[rowKey]['ui:widget']?.includes('table') &&
                      renderIndexingTable(
                        ui_schema[rowKey][uiOptions],
                        selected,
                        onSelectRow,
                        tbodyRef,
                      )
                    ) : schema.properties[rowKey]?.type === 'textarea' ? (
                      <Form.Control
                        name={rowKey}
                        id={rowKey}
                        onChange={(e) => handleChange(e)}
                        data-highlight={
                          schema.properties[rowKey].highlight || undefined
                        }
                        type={schema.properties[rowKey].type}
                        as="textarea"
                        defaultValue={formState[rowKey]}
                        readOnly={schema.properties[rowKey].readOnly}
                        disabled={schema.properties[rowKey].readOnly}
                        isInvalid={
                          schema.properties[rowKey].invalidated === true
                        }
                      />
                    ) : rowKey === '_info' ? (
                      <pre className="p-2">
                        {schema.properties[rowKey].default}
                      </pre>
                    ) : (
                      renderGridFields(rowKey)
                    )}
                  </Row>
                </div>
              </Row>
            ))
          : null}
        <Stack direction="horizontal" gap={3} className={styles.buttonStack}>
          <div className="ms-auto">
            <Button variant="success" disabled={hasErrors} type="submit">
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
    <DraggableModal
      show={show}
      onHide={handleAbort}
      contentClassName={styles.resizableModalContent}
      defaultpos={DEFAULT_DIALOG_POSITION}
    >
      <Modal.Header closeButton>
        <Modal.Title>{formName}</Modal.Title>
      </Modal.Header>
      <Modal.Body ref={modalBodyRef} className={styles.modalBody}>
        <div className={`m-1 ${styles.formHolder}`} id="form-holder">
          {renderFormRow}
        </div>
      </Modal.Body>
      <Modal.Footer />
    </DraggableModal>
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
