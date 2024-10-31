import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Row, Col, Container } from 'react-bootstrap';
import SampleImage from '../components/SampleView/SampleImage';
import MotorControls from '../components/SampleView/MotorControls';
import PhaseInput from '../components/SampleView/PhaseInput';
import ApertureInput from '../components/SampleView/ApertureInput';
import SSXChipControl from '../components/SSXChip/SSXChipControl';
import PlateManipulator from '../components/Equipment/PlateManipulator';
import ContextMenu from '../components/SampleView/ContextMenu';
import * as sampleViewActions from '../actions/sampleview'; // eslint-disable-line import/no-namespace
import { showErrorPanel, displayImage } from '../actions/general';
import { updateTask } from '../actions/queue';
import { showTaskForm } from '../actions/taskForm';
import BeamlineSetupContainer from './BeamlineSetupContainer';
import SampleQueueContainer from './SampleQueueContainer';
import { QUEUE_RUNNING } from '../constants';
import DefaultErrorBoundary from './DefaultErrorBoundary';
import { syncWithCrims } from '../actions/sampleGrid';
import {
  mountSample,
  refresh,
  selectWell,
  setPlate,
  selectDrop,
  sendCommand,
} from '../actions/sampleChanger';

import {
  executeCommand,
  logFrontEndTraceBack,
  setAttribute,
} from '../actions/beamline';

import '../components/SampleView/SampleView.css';
import styles from './SampleViewContainer.module.css';
import motorInputStyles from '../components/MotorInput/MotorInput.module.css';

class SampleViewContainer extends Component {
  constructor(props) {
    super(props);
    this.getControlAvailability = this.getControlAvailability.bind(this);
  }

  getControlAvailability(name) {
    const available =
      this.props.uiproperties.sample_view_video_controls.components.find(
        (component) => component.id === name && component.show === true,
      );

    return available?.show || false;
  }

  render() {
    const { uiproperties } = this.props;

    if (!('sample_view' in uiproperties)) {
      return null;
    }

    const { sourceScale, imageRatio } = this.props.sampleViewState;
    const { currentSampleID } = this.props;
    const [points, lines, grids, twoDPoints] = [{}, {}, {}, {}];
    const selectedGrids = [];

    if (this.props.shapes !== undefined) {
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
    }

    return (
      <Container fluid>
        <Row
          style={{
            background: '#fafafa',
            borderBottom: '1px solid lightgray',
            paddingBottom: '0em',
          }}
        >
          <Col sm={12}>
            <DefaultErrorBoundary>
              <BeamlineSetupContainer />
            </DefaultErrorBoundary>
          </Col>
        </Row>
        <Row className="gx-3 mt-2 pt-1">
          <Col sm={2} xxl={1} className={styles.controllers}>
            <DefaultErrorBoundary>
              <div className={motorInputStyles.container}>
                <label className={motorInputStyles.label} htmlFor="PhaseInput">
                  Phase Control
                </label>
                <PhaseInput />
              </div>

              <div className={motorInputStyles.container}>
                <label
                  className={motorInputStyles.label}
                  htmlFor="ApertureInput"
                >
                  Beam size
                </label>
                <ApertureInput />
              </div>

              {this.props.mode === 'SSX-CHIP' && (
                <SSXChipControl
                  showForm={this.props.showForm}
                  currentSampleID={currentSampleID}
                  sampleData={this.props.sampleList[currentSampleID]}
                  defaultParameters={this.props.defaultParameters}
                  groupFolder={this.props.groupFolder}
                  hardwareObjects={this.props.hardwareObjects}
                  uiproperties={uiproperties.sample_view}
                  sampleViewActions={this.props.sampleViewActions}
                  grids={grids}
                  selectedGrids={selectedGrids}
                  setAttribute={this.props.setAttribute}
                  sendExecuteCommand={this.props.sendExecuteCommand}
                />
              )}
              {this.props.sampleChangerContents.name === 'PlateManipulator' && (
                <PlateManipulator
                  contents={this.props.sampleChangerContents}
                  loadedSample={this.props.loadedSample}
                  select={this.props.select}
                  load={this.props.mountSample}
                  sendCommand={this.props.sendCommand}
                  refresh={this.props.refresh}
                  plates={this.props.plateGrid}
                  plateIndex={this.props.plateIndex}
                  selectedRow={this.props.selectedRow}
                  selectedCol={this.props.selectedCol}
                  selectedDrop={this.props.selectedDrop}
                  setPlate={this.props.setPlate}
                  selectWell={this.props.selectWell}
                  selectDrop={this.props.selectDrop}
                  crystalList={this.props.crystalList}
                  syncSamplesCrims={this.props.syncSamplesCrims}
                  showErrorPanel={this.props.showErrorPanel}
                  global_state={this.props.global_state}
                  state={this.props.sampleChangerState}
                  inPopover
                />
              )}

              <MotorControls />
            </DefaultErrorBoundary>
          </Col>
          <Col sm={6}>
            <DefaultErrorBoundary>
              <ContextMenu
                {...this.props.contextMenu}
                getControlAvailability={this.getControlAvailability}
                sampleViewActions={this.props.sampleViewActions}
                updateTask={this.props.updateTask}
                availableMethods={this.props.availableMethods}
                showForm={this.props.showForm}
                sampleID={currentSampleID}
                sampleData={this.props.sampleList[currentSampleID]}
                defaultParameters={this.props.defaultParameters}
                imageRatio={imageRatio * sourceScale}
                workflows={this.props.workflows}
                savedPointId={this.props.sampleViewState.savedPointId}
                groupFolder={this.props.groupFolder}
                clickCentring={this.props.sampleViewState.clickCentring}
                taskForm={this.props.taskForm}
                enable2DPoints={this.props.enable2DPoints}
                enableNativeMesh={this.props.enableNativeMesh}
                showErrorPanel={this.props.showErrorPanel}
              />
              <SampleImage
                sampleViewActions={this.props.sampleViewActions}
                {...this.props.sampleViewState}
                uiproperties={uiproperties}
                hardwareObjects={this.props.hardwareObjects}
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
                busy={this.props.queueState === QUEUE_RUNNING}
                setAttribute={this.props.setAttribute}
                displayImage={this.props.displayImage}
                meshResultFormat={this.props.meshResultFormat}
              />
            </DefaultErrorBoundary>
          </Col>
          <Col
            sm={4}
            xxl={5}
            className={styles.queue}
            style={{ display: 'flex' }}
          >
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
    currentSampleID: state.queue.currentSampleID,
    groupFolder: state.queue.groupFolder,
    queueState: state.queue.queueStatus,
    sampleViewState: state.sampleview,
    contextMenu: state.contextMenu,
    hardwareObjects: state.beamline.hardwareObjects,
    availableMethods: state.beamline.availableMethods,
    defaultParameters: state.taskForm.defaultParameters,
    shapes: state.shapes.shapes,
    workflows: state.workflow.workflows,
    cellCounting: state.taskForm.defaultParameters.mesh.cell_counting,
    cellSpacing: state.taskForm.defaultParameters.mesh.cell_spacing,
    remoteAccess: state.remoteAccess,
    uiproperties: state.uiproperties,
    taskForm: state.taskForm,
    mode: state.general.mode,
    enable2DPoints: state.general.enable2DPoints,
    meshResultFormat: state.general.meshResultFormat,
    enableNativeMesh: state.general.useNativeMesh,

    sampleChangerContents: state.sampleChanger.contents,
    sampleChangerState: state.sampleChanger.state,
    global_state: state.sampleChangerMaintenance.global_state,
    loadedSample: state.sampleChanger.loadedSample,
    plateGrid: state.sampleChanger.plateGrid,
    plateIndex: state.sampleChanger.currentPlateIndex,
    selectedRow: state.sampleChanger.selectedRow,
    selectedCol: state.sampleChanger.selectedCol,
    selectedDrop: state.sampleChanger.selectedDrop,
    crystalList: state.sampleGrid.crystalList,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    sampleViewActions: bindActionCreators(sampleViewActions, dispatch),
    updateTask: bindActionCreators(updateTask, dispatch),
    showForm: bindActionCreators(showTaskForm, dispatch),
    showErrorPanel: bindActionCreators(showErrorPanel, dispatch),
    setAttribute: bindActionCreators(setAttribute, dispatch),
    displayImage: bindActionCreators(displayImage, dispatch),
    sendExecuteCommand: bindActionCreators(executeCommand, dispatch),
    logFrontEndTraceBack: bindActionCreators(logFrontEndTraceBack, dispatch),

    mountSample: (address) => dispatch(mountSample(address)),
    refresh: () => dispatch(refresh()),
    selectWell: (row, col) => dispatch(selectWell(row, col)),
    setPlate: (address) => dispatch(setPlate(address)),
    selectDrop: (address) => dispatch(selectDrop(address)),
    syncSamplesCrims: () => dispatch(syncWithCrims()),
    sendCommand: (cmd, args) => dispatch(sendCommand(cmd, args)),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SampleViewContainer);
