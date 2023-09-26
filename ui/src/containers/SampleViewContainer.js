import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  Row,
  Col,
  Container,
  OverlayTrigger,
  Popover,
  Button,
} from 'react-bootstrap';
import SampleImage from '../components/SampleView/SampleImage';
import MotorControl from '../components/SampleView/MotorControl';
import PhaseInput from '../components/SampleView/PhaseInput';
import ApertureInput from '../components/SampleView/ApertureInput';
import SSXChipControl from '../components/SSXChip/SSXChipControl';
import PlateManipulator from '../components/Equipment/PlateManipulator';
import ContextMenu from '../components/SampleView/ContextMenu';
import * as sampleViewActions from '../actions/sampleview'; // eslint-disable-line import/no-namespace
import * as generalActions from '../actions/general'; // eslint-disable-line import/no-namespace
import { updateTask } from '../actions/queue';
import { showTaskForm } from '../actions/taskForm';
import BeamlineSetupContainer from './BeamlineSetupContainer';
import SampleQueueContainer from './SampleQueueContainer';
import { QUEUE_RUNNING } from '../constants';
import DefaultErrorBoundary from './DefaultErrorBoundary';
import { syncWithCrims } from '../actions/sampleGrid';
import {
  loadSample,
  refresh,
  selectWell,
  setPlate,
  selectDrop,
  sendCommand,
} from '../actions/sampleChanger';

import {
  sendSetAttribute,
  sendAbortCurrentAction,
  setBeamlineAttribute,
  sendDisplayImage,
  executeCommand,
  sendLogFrontEndTraceBack,
} from '../actions/beamline';

class SampleViewContainer extends Component {
  render() {
    const { uiproperties } = this.props;

    if (!('sample_view' in uiproperties)) {
      return null;
    }

    const { sourceScale, imageRatio, motorSteps } = this.props.sampleViewState;
    const { setStepSize } = this.props.sampleViewActions;
    const { sampleID } = this.props.current;
    const [points, lines, grids, twoDPoints] = [{}, {}, {}, {}];
    const selectedGrids = [];

    if (typeof this.props.shapes !== 'undefined') {
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
    const diffractometerHo = this.props.hardwareObjects.diffractometer;

    const phaseControl = (
      <div>
        <p className="motor-name">Phase Control:</p>
        <PhaseInput
          phase={this.props.sampleViewState.currentPhase}
          phaseList={this.props.sampleViewState.phaseList}
          sendPhase={this.props.sampleViewActions.sendCurrentPhase}
          state={diffractometerHo.state}
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
          <Col sm={1}>
            <DefaultErrorBoundary>
              {process.env.REACT_APP_PHASECONTROL === 'true'
                ? phaseControl
                : null}
              {apertureControl}
              {this.props.mode === 'SSX-CHIP' ? (
                <SSXChipControl
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
              ) : null}
              {this.props.sampleChangerContents.name === 'PlateManipulator' ? (
                <div className="mb-4">
                  <OverlayTrigger
                    trigger="click"
                    rootClose
                    placement="auto-end"
                    overlay={
                      <Popover id="platePopover" style={{ maxWidth: '800px' }}>
                        <Popover.Header>
                          {this.props.global_state.plate_info.plate_label}
                        </Popover.Header>
                        <Popover.Body style={{ padding: '0px' }}>
                          <PlateManipulator
                            contents={this.props.sampleChangerContents}
                            loadedSample={this.props.loadedSample}
                            select={this.props.select}
                            load={this.props.loadSample}
                            send_command={this.props.send_command}
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
                            generalActions={this.props.generalActions}
                            global_state={this.props.global_state}
                            state={this.props.sampleChangerState}
                            inPopover
                          />
                        </Popover.Body>
                      </Popover>
                    }
                  >
                    <Button
                      variant="outline-secondary"
                      style={{
                        marginTop: '1em',
                        minWidth: '155px',
                        width: 'fit-conent',
                        whiteSpace: 'nowrap',
                      }}
                      size="sm"
                    >
                      <i className="fa fa-th" /> Plate Navigation
                      <i className="fa fa-caret-right" />
                    </Button>
                  </OverlayTrigger>
                  <Button
                    style={{
                      marginTop: '1em',
                      minWidth: '155px',
                      width: 'fit-conent',
                      whiteSpace: 'nowrap',
                    }}
                    variant="outline-secondary"
                    size="sm"
                    title={
                      this.props.hasCrystal
                        ? 'Move to Crystal position'
                        : 'No Crystal Found / Crims not Sync'
                    }
                    onClick={() =>
                      this.props.send_command('moveToCrystalPosition')
                    }
                    disabled={!this.props.hasCrystal}
                  >
                    <i className="fas fa-gem" /> Move to Crystal
                  </Button>
                </div>
              ) : null}
              <MotorControl
                save={this.props.sendSetAttribute}
                saveStep={setStepSize}
                uiproperties={uiproperties.sample_view}
                hardwareObjects={this.props.hardwareObjects}
                motorsDisabled={
                  this.props.motorInputDisable ||
                  this.props.queueState === QUEUE_RUNNING
                }
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
    sampleViewActions: bindActionCreators(sampleViewActions, dispatch),
    updateTask: bindActionCreators(updateTask, dispatch),
    showForm: bindActionCreators(showTaskForm, dispatch),
    generalActions: bindActionCreators(generalActions, dispatch),
    sendSetAttribute: bindActionCreators(sendSetAttribute, dispatch),
    sendAbortCurrentAction: bindActionCreators(
      sendAbortCurrentAction,
      dispatch,
    ),
    setBeamlineAttribute: bindActionCreators(setBeamlineAttribute, dispatch),
    sendDisplayImage: bindActionCreators(sendDisplayImage, dispatch),
    sendExecuteCommand: bindActionCreators(executeCommand, dispatch),
    sendLogFrontEndTraceBack: bindActionCreators(
      sendLogFrontEndTraceBack,
      dispatch,
    ),

    loadSample: (address) => dispatch(loadSample(address)),
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
