/* eslint-disable react/destructuring-assignment */
import { Component } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import {
  executeCommand,
  logFrontEndTraceBack,
  setAttribute,
} from '../actions/beamline';
import { showErrorPanel } from '../actions/general';
import {
  mountSample,
  refresh,
  selectDrop,
  selectWell,
  sendCommand,
  setPlate,
} from '../actions/sampleChanger';
import { syncWithCrims } from '../actions/sampleGrid';
import { showTaskForm } from '../actions/taskForm';
import PlateManipulator from '../components/Equipment/PlateManipulator';
import motorInputStyles from '../components/MotorInput/MotorInput.module.css';
import ApertureInput from '../components/SampleView/ApertureInput';
import ContextMenu from '../components/SampleView/ContextMenu';
import MotorControls from '../components/SampleView/MotorControls';
import PhaseInput from '../components/SampleView/PhaseInput';
import SampleImage from '../components/SampleView/SampleImage';
import SSXChipControl from '../components/SSXChip/SSXChipControl';
import BeamlineSetupContainer from './BeamlineSetupContainer';
import DefaultErrorBoundary from './DefaultErrorBoundary';
import SampleQueueContainer from './SampleQueueContainer';
import styles from './SampleViewContainer.module.css';

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

    if (!('sample_view_motors' in uiproperties)) {
      return null;
    }
    const { currentSampleID } = this.props;
    const [points, lines, grids, twoDPoints] = [{}, {}, {}, {}];
    const selectedGrids = [];
    const phase_control = uiproperties.sample_view?.components?.find(
      (c) => c.attribute === 'phase_control',
    );
    const beam_size = uiproperties?.sample_view?.components.find(
      (c) => c.attribute === 'beam_size',
    );

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
              {phase_control !== undefined && (
                <div className={motorInputStyles.container}>
                  <label
                    className={motorInputStyles.label}
                    htmlFor="PhaseInput"
                  >
                    {phase_control.label}
                  </label>
                  <PhaseInput />
                </div>
              )}
              {beam_size !== undefined && (
                <div className={motorInputStyles.container}>
                  <label
                    className={motorInputStyles.label}
                    htmlFor="ApertureInput"
                  >
                    {beam_size.label}
                  </label>
                  <ApertureInput />
                </div>
              )}

              {this.props.mode === 'SSX-CHIP' && (
                <SSXChipControl
                  showForm={this.props.showForm}
                  currentSampleID={currentSampleID}
                  sampleData={this.props.sampleList[currentSampleID]}
                  defaultParameters={this.props.defaultParameters}
                  groupFolder={this.props.groupFolder}
                  hardwareObjects={this.props.hardwareObjects}
                  uiproperties={uiproperties.sample_view_motors}
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
                getControlAvailability={this.getControlAvailability}
              />
              <SampleImage
                points={points}
                twoDPoints={twoDPoints}
                lines={lines}
                grids={grids}
                selectedGrids={selectedGrids}
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
    hardwareObjects: state.beamline.hardwareObjects,
    defaultParameters: state.taskForm.defaultParameters,
    shapes: state.shapes.shapes,
    remoteAccess: state.remoteAccess,
    uiproperties: state.uiproperties,
    mode: state.general.mode,
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
    showForm: bindActionCreators(showTaskForm, dispatch),
    showErrorPanel: bindActionCreators(showErrorPanel, dispatch),
    setAttribute: bindActionCreators(setAttribute, dispatch),
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
