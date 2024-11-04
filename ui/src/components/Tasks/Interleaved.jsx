/* eslint-disable react/jsx-handler-names */
import React from 'react';
import { connect } from 'react-redux';
import { reduxForm, formValueSelector } from 'redux-form';
import { DraggableModal } from '../DraggableModal';
import {
  Modal,
  Button,
  Form,
  Row,
  Col,
  ButtonToolbar,
  Table,
} from 'react-bootstrap';
import { FieldsHeader, StaticField, InputField } from './fields';

const wedgeColorTable = {
  0: 'rgba(175,238,238, 0.1)',
  1: 'rgba(238,232,170, 0.2)',
  2: 'rgba(0,206,209, 0.1)',
  3: 'rgba(255,218,185, 0.2)',
  4: 'rgba(95,158,160, 0.1)',
  5: 'rgba(255,228,181, 0.2)',
};

function getSubWedges(swNumImg, wedgeList) {
  const subWedges = {
    swSizes: [],
    numWedges: wedgeList.length,
  };

  wedgeList.forEach((wedge, wedgeIdx) => {
    const swSize = wedge.parameters.num_images / swNumImg;
    const wedgeSize = wedge.parameters.osc_range * wedge.parameters.num_images;
    const swSizeDeg = wedgeSize / swSize;

    subWedges[wedgeIdx] = [];
    subWedges.swSizes.push(swSizeDeg);

    for (let _swSizeDeg = 0; _swSizeDeg < wedgeSize; _swSizeDeg += swSizeDeg) {
      const subWedge = { ...wedge, parameters: { ...wedge.parameters } };

      subWedge.parameters.osc_start = (
        _swSizeDeg + wedge.parameters.osc_start
      ).toPrecision(4);
      subWedge.parameters.osc_range = wedge.parameters.osc_range;
      subWedge.parameters.num_images = swNumImg;
      subWedges[wedgeIdx].push(subWedge);
      subWedge.wedge = wedgeIdx;
    }

    if (wedgeSize % swSizeDeg) {
      const subWedge = { ...wedge, parameters: { ...wedge.parameters } };
      const numSubWedges = wedge.parameters.num_images / swNumImg;

      subWedge.parameters.osc_start = (
        swSizeDeg * numSubWedges +
        wedge.parameters.osc_start
      ).toPrecision(4);
      subWedge.parameters.osc_range = wedge.parameters.osc_range;
      subWedge.parameters.num_images = swNumImg;
      subWedges[wedgeIdx].push(subWedge);
      subWedge.wedge = wedgeIdx;
    }
  });

  return subWedges;
}

function interleave(subWedgeObject) {
  const swList = [];
  // Assume that all wedges are divided into the same number of sub-wedges
  const numSubWedges = subWedgeObject[0].length;

  for (let swIndex = 0; swIndex < numSubWedges; swIndex++) {
    for (
      let wedgeIndex = 0;
      wedgeIndex < subWedgeObject.numWedges;
      wedgeIndex++
    ) {
      swList.push(subWedgeObject[wedgeIndex][swIndex]);
      swList[swList.length - 1].swIndex = `${wedgeIndex + 1}:${swIndex + 1}`;
    }
  }

  return swList;
}

class Interleaved extends React.Component {
  constructor(props) {
    super(props);

    this.submitAddToQueue = this.submitAddToQueue.bind(this);
    this.submitRunNow = this.submitRunNow.bind(this);
    this.addToQueue = this.addToQueue.bind(this);
  }

  submitAddToQueue() {
    this.props.handleSubmit(this.addToQueue.bind(this, false))();
  }

  submitRunNow() {
    this.props.handleSubmit(this.addToQueue.bind(this, true))();
  }

  addToQueue(runNow, params) {
    const parameters = {
      ...params,
      type: 'Interleaved',
      label: 'Interleaved',
      helical: false,
      mesh: false,
      shape: this.props.shapeId,
      suffix: this.props.suffix,
      taskIndexList: this.props.taskIndexList,
      swNumImages: this.props.subWedgeSize,
      wedges: this.props.wedges,
    };

    // Form gives us all parameter values in strings so we need to transform numbers back
    const stringFields = [
      'centringMethod',
      'prefix',
      'subdir',
      'type',
      'shape',
      'label',
      'suffix',
      'taskIndexList',
      'wedges',
    ];

    this.props.addTask(parameters, stringFields, runNow);
    this.props.hide();
  }

  render() {
    const params = this.props.wedges[0].parameters;
    const wedgeNumImages = params.num_images;
    const wedgeSize = params.osc_range * params.num_images;

    return (
      <DraggableModal show={this.props.show} onHide={this.props.hide}>
        <Modal.Header closeButton>
          <Modal.Title>Interleaved data collection</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FieldsHeader title="Data location" />
          <Form>
            <Table
              striped
              bordered
              hover
              style={{ fontSize: 'smaller', marginBottom: 0 }}
              className="task-parameters-table"
            >
              <thead>
                <tr>
                  <th>Wedge </th>
                  <th width="0">Path </th>
                </tr>
              </thead>
              <tbody>
                {this.props.wedges.map((task, i) => {
                  const filename = task.parameters.fileName;

                  return (
                    // eslint-disable-next-line react/jsx-key
                    <tr style={{ backgroundColor: wedgeColorTable[i] }}>
                      <td>{i + 1}</td>
                      <td>
                        {task.parameters.path}/{filename}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <br />
            <br />
            <FieldsHeader title="Interleaved parameters" />
            <Row className="mt-2">
              <Col xs={6}>
                <StaticField
                  label="Wedge size"
                  col1="4"
                  col2="4"
                  data={<span> {wedgeSize} &deg; </span>}
                />
              </Col>
              <Col xs={6}>
                <StaticField
                  label="No of images per wedge"
                  col1="6"
                  col2="4"
                  data={<span> {wedgeNumImages} </span>}
                />
              </Col>
            </Row>
            <Row className="mt-3">
              <Col xs={6} style={{ marginTop: '10px' }}>
                <InputField
                  propName="subWedgeSize"
                  label="Sub wedge size: (images)"
                  col1="6"
                  col2="4"
                />
              </Col>
              <Col xs={6} style={{ marginTop: '10px' }}>
                <StaticField
                  label="Sub wedge size"
                  col1="6"
                  col2="4"
                  data={
                    <span> {this.props.subWedgeObject.swSizes[0]} &deg;</span>
                  }
                />
              </Col>
            </Row>
            <div style={{ overflowY: 'scroll', height: '400px' }}>
              <Table
                striped
                bordered
                hover
                style={{ fontSize: 'smaller', marginBottom: 0 }}
                className="task-parameters-table mt-3"
              >
                <thead>
                  <tr>
                    <th>Subwedge </th>
                    <th>Start &deg; </th>
                    <th>Osc. &deg; </th>
                    <th># Img</th>
                    <th>t (s)</th>
                    <th>T (%)</th>
                    <th>Res. (&Aring;)</th>
                    <th>E (keV)</th>
                    <th>&phi; &deg;</th>
                    <th>&kappa; &deg;</th>
                  </tr>
                </thead>
                <tbody>
                  {interleave(this.props.subWedgeObject).map((task) => (
                    // eslint-disable-next-line react/jsx-key
                    <tr
                      style={{ backgroundColor: wedgeColorTable[task.wedge] }}
                    >
                      <td>{task.swIndex}</td>
                      <td>{task.parameters.osc_start}</td>
                      <td>{task.parameters.osc_range}</td>
                      <td>{task.parameters.num_images}</td>
                      <td>{task.parameters.exp_time}</td>
                      <td>{task.parameters.transmission}</td>
                      <td>{task.parameters.resolution}</td>
                      <td>{task.parameters.energy}</td>
                      <td>{task.parameters.kappa_phi}</td>
                      <td>{task.parameters.kappa}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Form>
        </Modal.Body>

        {this.props.taskData.state ? (
          ''
        ) : (
          <Modal.Footer>
            <ButtonToolbar className="float-end">
              <Button
                variant="success"
                disabled={
                  this.props.taskData.parameters.shape === -1 ||
                  this.props.invalid
                }
                onClick={this.submitRunNow}
              >
                Run Now
              </Button>
              <Button
                className="ms-3"
                variant="primary"
                disabled={this.props.invalid}
                onClick={this.submitAddToQueue}
              >
                {this.props.taskData.sampleID ? 'Change' : 'Add to Queue'}
              </Button>
            </ButtonToolbar>
          </Modal.Footer>
        )}
      </DraggableModal>
    );
  }
}

const InterleavedForm = reduxForm({
  form: 'interleaved',
})(Interleaved);

const selector = formValueSelector('interleaved');

export default connect((state) => {
  const fileSuffix = state.taskForm.fileSuffix === 'h5' ? '_master.h5' : 'cbf';
  const shapeId = state.taskForm.pointID;
  const subWedgeSize = selector(state, 'subWedgeSize');
  const { wedges } = state.taskForm.taskData.parameters;

  const { type } = state.taskForm.taskData;
  const { limits } = state.taskForm.defaultParameters[type.toLowerCase()];

  return {
    subWedgeSize,
    acqParametersLimits: limits,
    wedges,
    taskIndexList: state.taskForm.taskData.parameters.taskIndexList,
    subWedgeObject: getSubWedges(subWedgeSize || 10, wedges),
    shapeId,
    suffix: fileSuffix,
    beamline: state.beamline,
    initialValues: {
      subWedgeSize:
        state.taskForm.defaultParameters.datacollection.acq_parameters
          .sub_wedge_size,
    },
  };
})(InterleavedForm);
