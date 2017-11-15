import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import SampleImage from '../components/SampleView/SampleImage';
import MotorControl from '../components/SampleView/MotorControl';
import PhaseInput from '../components/SampleView/PhaseInput';
import ApertureInput from '../components/SampleView/ApertureInput';
import ContextMenu from '../components/SampleView/ContextMenu';
import * as SampleViewActions from '../actions/sampleview';
import { showTaskForm } from '../actions/taskForm';
import BeamlineSetupContainer from './BeamlineSetupContainer';
import SampleQueueContainer from './SampleQueueContainer';
import { QUEUE_RUNNING } from '../constants';
import config from 'guiConfig';

class SampleViewContainer extends Component {

  render() {
    const { imageRatio, motorSteps } = this.props.sampleViewState;
    const { sendMotorPosition, setStepSize, sendStopMotor } = this.props.sampleViewActions;
    const sampleID = this.props.current.sampleID;
    const [points, lines, grids] = [{}, {}, {}];
    const selectedGrids = [];

    Object.keys(this.props.shapes).forEach((key) => {
      const shape = this.props.shapes[key];
      if (shape.t === 'P') {
        points[shape.id] = shape;
      } else if (shape.t === 'L') {
        lines[shape.id] = shape;
      } else if (shape.t === 'G') {
        grids[shape.id] = shape;

        if (shape.selected) {
          selectedGrids.push(shape);
        }
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
      </div>);

    const apertureControl = (
      <div>
      <p className="motor-name">Aperture Control:</p>
      <ApertureInput
        aperture={this.props.sampleViewState.currentAperture}
        apertureList={this.props.sampleViewState.apertureList}
        sendAperture={this.props.sampleViewActions.sendChangeAperture}
      />
      </div>);

    return (
        <div className="row">
        <div className="col-xs-12">
            <div className="row">
              <div className="col-xs-12">
                <BeamlineSetupContainer />
              </div>
            </div>
            <div className="row" style={ { display: 'flex', marginTop: '1em' } }>
              <div className="col-xs-1"
                style={ { paddingRight: '5px', paddingLeft: '1.5em' } }
              >
                {config.phaseControl ? phaseControl : null }
                {apertureControl}
                <MotorControl
                  save={sendMotorPosition}
                  saveStep={setStepSize}
                  motors={this.props.beamline.motors}
                  motorsDisabled={ this.props.beamline.motorInputDisable ||
                                   this.props.queueState === QUEUE_RUNNING }
                  steps={motorSteps}
                  stop={sendStopMotor}
                />
                </div>
              <div className="col-xs-7">
                <ContextMenu
                  {...this.props.contextMenu}
                  sampleActions={this.props.sampleViewActions}
                  showForm={this.props.showForm}
                  sampleID={sampleID}
                  sampleData={this.props.sampleList[sampleID]}
                  defaultParameters={this.props.defaultParameters}
                  imageRatio={imageRatio}
                  workflows={this.props.workflows}
                  savedPointId={this.props.sampleViewState.savedPointId}
                  groupFolder={this.props.groupFolder}
                  clickCentring={this.props.sampleViewState.clickCentring}
                />
                <SampleImage
                  sampleActions={this.props.sampleViewActions}
                  {...this.props.sampleViewState}
                  {...this.props.beamline}
                  contextMenuVisible={this.props.contextMenu.show}
                  shapes={this.props.shapes}
                  points={points}
                  lines={lines}
                  grids={grids}
                  selectedGrids={selectedGrids}
                  cellCounting={this.props.cellCounting}
                  cellSpacing={this.props.cellSpacing}
                  current={this.props.current}
                  sampleList={this.props.sampleList}
                  proposal={this.props.proposal}
                />
              </div>
              <div className="col-xs-4" style={ { display: 'flex' } }>
                <SampleQueueContainer />
            </div>
            </div>
        </div>
      </div>
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
    beamline: state.beamline,
    defaultParameters: state.taskForm.defaultParameters,
    shapes: state.shapes.shapes,
    workflows: state.workflow.workflows,
    cellCounting: state.taskForm.defaultParameters.mesh.cell_counting,
    cellSpacing: state.taskForm.defaultParameters.mesh.cell_spacing,
    proposal: state.login.selectedProposal
  };
}

function mapDispatchToProps(dispatch) {
  return {
    sampleViewActions: bindActionCreators(SampleViewActions, dispatch),
    showForm: bindActionCreators(showTaskForm, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleViewContainer);
