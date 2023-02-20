import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Row, Col, Container } from 'react-bootstrap';
import SampleImage from '../components/SampleView/SampleImage';
import MotorControl from '../components/SampleView/MotorControl';
import PhaseInput from '../components/SampleView/PhaseInput';
import ApertureInput from '../components/SampleView/ApertureInput';
import SSXChipControl from '../components/SSXChip/SSXChipControl';
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
  setBeamlineAttribute,
  sendDisplayImage,
  executeCommand,
} from '../actions/beamline';
import { TiAdjustContrast } from 'react-icons/ti';

class DefaultErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  componentDidCatch(error, errorInfo) {
    // Catch errors in any components below and re-render with error message
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
    // You can also log error messages to an error reporting service here
  }

  render() {
    if (this.state.errorInfo) {
      // Error path
      return (
        <div>
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    // Normally, just render children
    return this.props.children;
  }
}

class SampleViewContainer extends Component {
  render() {
    const { uiproperties } = this.props;

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
      switch (shape.t) {
        case 'P': {
          points[shape.id] = shape;

          break;
        }
        case '2DP': {
          twoDPoints[shape.id] = shape;

          break;
        }
        case 'L': {
          lines[shape.id] = shape;

          break;
        }
        case 'G': {
          grids[shape.id] = shape;

          if (shape.selected) {
            selectedGrids.push(shape);
          }

          break;
        }
        // No default
      }
    });

    const phaseControl = (
      <div>
        <p className="motor-name">Phase Control:</p>
        <PhaseInput
          phase={this.props.sampleViewState.currentPhase}
          phaseList={this.props.sampleViewState.phaseList}
          sendPhase={this.props.sampleViewActions.sendCurrentPhase}
        />
      </div>
    );

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
      <Container fluid>
        <Row>
          <Col sm={12} style={{ paddingLeft: '0px', paddingRight: '0px' }}>
            <DefaultErrorBoundary>
              <BeamlineSetupContainer />
            </DefaultErrorBoundary>
          </Col>
        </Row>
        <Row style={{ marginTop: '0.7em', marginRight: '0px' }}>
          <Col
            sm={1}
            style={{ paddingRight: '1px', paddingLeft: '0.7em' }}
          >
            <DefaultErrorBoundary>
              {process.env.REACT_APP_PHASECONTROL ? phaseControl : null}
              {apertureControl}
              {this.props.mode === 'SSX-CHIP' ?
                (<SSXChipControl
                  showForm={this.props.showForm}
                  sampleID={sampleID}
                  sampleData={this.props.sampleList[sampleID]}
                  defaultParameters={this.props.defaultParameters}
                  groupFolder={this.props.groupFolder}
                  hardwareObjects={this.props.hardwareObjects}
                  uiproperties={uiproperties.sample_view}
                  sampleActions={this.props.sampleViewActions}
                  grids={grids}
                  selectedGrids={selectedGrids}
                  sendSetAttribute={this.props.sendSetAttribute}
                  sendExecuteCommand={this.props.sendExecuteCommand}
                />
                ) : null
              }
              <MotorControl
                save={this.props.sendSetAttribute}
                saveStep={setStepSize}
                uiproperties={uiproperties.sample_view}
                hardwareObjects={this.props.hardwareObjects}
                motorsDisabled={this.props.motorInputDisable
                  || this.props.queueState === QUEUE_RUNNING}
                steps={motorSteps}
                stop={this.props.sendAbortCurrentAction}
                sampleViewActions={this.props.sampleViewActions}
                sampleViewState={this.props.sampleViewState}
              />
            </DefaultErrorBoundary>
          </Col>
          <Col sm={7}>
            <DefaultErrorBoundary>
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
                taskForm={this.props.taskForm}
              />
              <SampleImage
                generalActions={this.props.generalActions}
                sampleActions={this.props.sampleViewActions}
                {...this.props.sampleViewState}
                uiproperties={uiproperties.sample_view}
                hardwareObjects={this.props.hardwareObjects}
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
                sendDisplayImage={this.props.sendDisplayImage}
              />
            </DefaultErrorBoundary>
          </Col>
          <Col sm={4} style={{ display: 'flex' }}>
            <DefaultErrorBoundary>
              <SampleQueueContainer />
            </DefaultErrorBoundary>
          </Col>
        </Row>
      </Container>
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
    hardwareObjects: state.beamline.hardwareObjects,
    availableMethods: state.beamline.availableMethods,
    defaultParameters: state.taskForm.defaultParameters,
    shapes: state.shapes.shapes,
    workflows: state.workflow.workflows,
    cellCounting: state.taskForm.defaultParameters.mesh.cell_counting,
    cellSpacing: state.taskForm.defaultParameters.mesh.cell_spacing,
    proposal: state.login.selectedProposal,
    remoteAccess: state.remoteAccess,
    uiproperties: state.uiproperties,
    taskForm: state.taskForm,
    mode: state.general.mode
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
    setBeamlineAttribute: bindActionCreators(setBeamlineAttribute, dispatch),
    sendDisplayImage: bindActionCreators(sendDisplayImage, dispatch),
    sendExecuteCommand: bindActionCreators(executeCommand, dispatch),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleViewContainer);
