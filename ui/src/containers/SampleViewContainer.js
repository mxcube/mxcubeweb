import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Row, Col, Stack, Container } from 'react-bootstrap';

import SampleImage from '../components/SampleView/SampleImage';
import MotorControl from '../components/SampleView/MotorControl';
import ApertureInput from '../components/SampleView/ApertureInput';
import ContextMenu from '../components/SampleView/ContextMenu';
import * as SampleViewActions from '../actions/sampleview';
import * as GeneralActions from '../actions/general';
import { updateTask } from '../actions/queue';
import { showTaskForm } from '../actions/taskForm';
import BeamlineSetupContainer from './BeamlineSetupContainer';
import SampleQueueContainer from './SampleQueueContainer';
import { QUEUE_RUNNING } from '../constants';

import {
  sendSetAttribute,
  sendAbortCurrentAction,
  setBeamlineAttribute
} from '../actions/beamline';


class SampleViewContainer extends Component {
  render() {
    const uiproperties = this.props.uiproperties;

    if (!uiproperties.hasOwnProperty('sample_view')) {
      return null;
    }

    const { sourceScale, imageRatio, motorSteps } = this.props.sampleViewState;
    const { setStepSize } = this.props.sampleViewActions;
    const { sampleID } = this.props.current;
    const [points, lines, grids, twoDPoints] = [{}, {}, {}, {}];
    const selectedGrids = [];

    Object.keys(this.props.shapes).forEach((key) => {
      const shape = this.props.shapes[key];
      if (shape.t === 'P') {
        points[shape.id] = shape;
      } else if (shape.t === '2DP') {
        twoDPoints[shape.id] = shape;
      } else if (shape.t === 'L') {
        lines[shape.id] = shape;
      } else if (shape.t === 'G') {
        grids[shape.id] = shape;

        if (shape.selected) {
          selectedGrids.push(shape);
        }
      }
    });

    const apertureControl = (
      <div>
        <p className="motor-name">Beam size:</p>
        <ApertureInput
          aperture={this.props.sampleViewState.currentAperture}
          apertureList={this.props.sampleViewState.apertureList}
          sendAperture={this.props.sampleViewActions.sendChangeAperture}
        />
      </div>
    );

    return (
        <Stack>
          <Row>
            <Col sm={12} style={{ marginTop: '-45px' }}>
              <BeamlineSetupContainer />
            </Col>
          </Row>
          <Container fluid>
            <Row style={{ display: 'flex', marginTop: '1em' }}>
              <Col
                sm={1}
                style={{ paddingRight: '1px', paddingLeft: '0.7em' }}
              >
                {apertureControl}
                <MotorControl
                  save={this.props.sendSetAttribute}
                  saveStep={setStepSize}
                  uiproperties={uiproperties.sample_view}
                  attributes={this.props.attributes}
                  motorsDisabled={this.props.motorInputDisable
                                    || this.props.queueState === QUEUE_RUNNING}
                  steps={motorSteps}
                  stop={this.props.sendAbortCurrentAction}
                  sampleViewActions={this.props.sampleViewActions}
                  sampleViewState={this.props.sampleViewState}
                />
              </Col>
              <Col sm={8}>
                <ContextMenu
                  {...this.props.contextMenu}
                  sampleActions={this.props.sampleViewActions}
                  updateTask={this.props.updateTask}
                  availableMethods={this.props.availableMethods}
                  showForm={this.props.showForm}
                  sampleID={sampleID}
                  sampleData={this.props.sampleList[sampleID]}
                  defaultParameters={this.props.defaultParameters}
                  imageRatio={imageRatio * sourceScale}
                  workflows={this.props.workflows}
                  savedPointId={this.props.sampleViewState.savedPointId}
                  groupFolder={this.props.groupFolder}
                  clickCentring={this.props.sampleViewState.clickCentring}
                />
                <SampleImage
                  generalActions={this.props.generalActions}
                  sampleActions={this.props.sampleViewActions}
                  {...this.props.sampleViewState}
                  uiproperties={uiproperties.sample_view}
                  attributes={this.props.attributes}
                  steps={motorSteps}
                  imageRatio={imageRatio * sourceScale}
                  contextMenuVisible={this.props.contextMenu.show}
                  shapes={this.props.shapes}
                  points={points}
                  twoDPoints={twoDPoints}
                  lines={lines}
                  grids={grids}
                  selectedGrids={selectedGrids}
                  cellCounting={this.props.cellCounting}
                  cellSpacing={this.props.cellSpacing}
                  current={this.props.current}
                  sampleList={this.props.sampleList}
                  proposal={this.props.proposal}
                  busy={this.props.queueState === QUEUE_RUNNING}
                  sendSetAttribute={this.props.sendSetAttribute}
                  sendAbortCurrentAction={this.props.sendAbortCurrentAction}
                  setBeamlineAttribute={this.props.setBeamlineAttribute}
                />
              </Col>
              <Col sm={3} style={{ display: 'flex' }}>
                <SampleQueueContainer />
              </Col>
            </Row>
          </Container>
        </Stack>
    );
  }
}


function mapStateToProps(state) {
  return {
    sampleList: state.sampleGrid.sampleList,
    current: state.queue.current,
    groupFolder: state.queue.groupFolder,
    queueState: state.queue.queueStatus,
    sampleViewState: state.sampleview,
    contextMenu: state.contextMenu,
    motorInputDisable: state.beamline.motorInputDisable,
    attributes: state.beamline.attributes,
    availableMethods: state.beamline.availableMethods,
    defaultParameters: state.taskForm.defaultParameters,
    shapes: state.shapes.shapes,
    workflows: state.workflow.workflows,
    cellCounting: state.taskForm.defaultParameters.mesh.cell_counting,
    cellSpacing: state.taskForm.defaultParameters.mesh.cell_spacing,
    proposal: state.login.selectedProposal,
    remoteAccess: state.remoteAccess,
    uiproperties: state.uiproperties,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    sampleViewActions: bindActionCreators(SampleViewActions, dispatch),
    updateTask: bindActionCreators(updateTask, dispatch),
    showForm: bindActionCreators(showTaskForm, dispatch),
    generalActions: bindActionCreators(GeneralActions, dispatch),
    sendSetAttribute: bindActionCreators(sendSetAttribute, dispatch),
    sendAbortCurrentAction: bindActionCreators(sendAbortCurrentAction, dispatch),
    setBeamlineAttribute: bindActionCreators(setBeamlineAttribute, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleViewContainer);
