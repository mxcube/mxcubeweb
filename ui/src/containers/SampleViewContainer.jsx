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
import { addShape } from '../actions/sampleview';
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
    const { uiproperties } = this.props;
    const available = uiproperties.sample_view_video_controls.components.find(
      (component) => component.id === name && component.show === true,
    );

    return available?.show || false;
  }

  render() {
    const { uiproperties, currentSampleID, shapes = {} } = this.props;

    if (!('sample_view_motors' in uiproperties)) {
      return null;
    }

    const phase_control = uiproperties.sample_view?.components?.find(
      (c) => c.attribute === 'phase_control',
    );
    const beam_size = uiproperties?.sample_view?.components.find(
      (c) => c.attribute === 'beam_size',
    );

    const points = Object.fromEntries(
      Object.entries(shapes).filter(([_, shape]) => shape.t === 'P'),
    );
    const twoDPoints = Object.fromEntries(
      Object.entries(shapes).filter(([_, shape]) => shape.t === '2DP'),
    );
    const lines = Object.fromEntries(
      Object.entries(shapes).filter(([_, shape]) => shape.t === 'L'),
    );
    const grids = Object.fromEntries(
      Object.entries(shapes).filter(([_, shape]) => shape.t === 'G'),
    );
    const selectedGrids = Object.values(grids).filter((s) => s.selected);

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
                  addShape={this.props.addShape}
                  grids={grids}
                  selectedGrids={selectedGrids}
                  setAttribute={this.props.setAttribute}
                  sendExecuteCommand={this.props.sendExecuteCommand}
                />
              )}
              {this.props.sampleChangerContents.name === 'PlateManipulator' && (
                <PlateManipulator inPopover />
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
  };
}

function mapDispatchToProps(dispatch) {
  return {
    addShape: bindActionCreators(addShape, dispatch),
    showForm: bindActionCreators(showTaskForm, dispatch),
    setAttribute: bindActionCreators(setAttribute, dispatch),
    sendExecuteCommand: bindActionCreators(executeCommand, dispatch),
    logFrontEndTraceBack: bindActionCreators(logFrontEndTraceBack, dispatch),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SampleViewContainer);
