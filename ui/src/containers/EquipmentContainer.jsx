import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Container, Row, Col } from 'react-bootstrap';

import {
  select,
  mountSample,
  unmountSample,
  scan,
  abort,
  sendCommand,
  refresh,
  selectWell,
  setPlate,
  selectDrop,
} from '../actions/sampleChanger';

import {
  abort as haAbort,
  sendCommand as haSendCommand,
  refresh as haRefresh,
  harvestCrystal,
  harvestAndLoadCrystal,
  calibratePin as haCalibratePin,
  validateCalibration as haValidateCalibration,
  sendDataCollectionToCrims,
} from '../actions/harvester';

import { showErrorPanel } from '../actions/general';

import { syncWithCrims } from '../actions/sampleGrid';

import { executeCommand } from '../actions/beamline';

import SampleChanger from '../components/Equipment/SampleChanger';
import SampleChangerMaintenance from '../components/Equipment/SampleChangerMaintenance';

import PlateManipulator from '../components/Equipment/PlateManipulator';
import PlateManipulatorMaintenance from '../components/Equipment/PlateManipulatorMaintenance';

import Harvester from '../components/Equipment/Harvester';
import HarvesterMaintenance from '../components/Equipment/HarvesterMaintenance';

import GenericEquipment from '../components/Equipment/GenericEquipment';
import GenericEquipmentControl from '../components/Equipment/GenericEquipmentControl';

function EquipmentContainer(props) {
  return (
    <Container fluid className="mt-3">
      <Row className="d-flex">
        <Col sm={12}>
          <GenericEquipment
            state={props.sampleChangerState}
            name={props.contents?.name}
            initialOpen
          >
            {props.contents.name === 'PlateManipulator' ? (
              <Row className="row">
                <Col sm={6}>
                  <PlateManipulator
                    contents={props.contents}
                    loadedSample={props.loadedSample}
                    load={props.mountSample}
                    sendCommand={props.sendCommand}
                    refresh={props.refresh}
                    inPopover={false}
                    plates={props.plateGrid}
                    plateIndex={props.plateIndex}
                    selectedRow={props.selectedRow}
                    selectedCol={props.selectedCol}
                    selectedDrop={props.selectedDrop}
                    setPlate={props.setPlate}
                    selectWell={props.selectWell}
                    selectDrop={props.selectDrop}
                    crystalList={props.crystalList}
                    syncSamplesCrims={props.syncSamplesCrims}
                    showErrorPanel={props.showErrorPanel}
                    global_state={props.global_state}
                    state={props.sampleChangerState}
                  />
                </Col>
                <Col sm={6}>
                  <PlateManipulatorMaintenance
                    commands={props.commands}
                    global_state={props.global_state}
                    commands_state={props.commands_state}
                    message={props.message}
                    sendCommand={props.sendCommand}
                    contents={props.contents}
                  />
                </Col>
              </Row>
            ) : (
              <Row className="row">
                <Col sm={6}>
                  <SampleChanger
                    state={props.sampleChangerState}
                    loadedSample={props.loadedSample}
                    select={props.select}
                    load={props.mountSample}
                    unload={props.unmountSample}
                    abort={props.abort}
                    scan={props.scan}
                    contents={props.contents}
                    refresh={props.refresh}
                  />
                </Col>
                <Col sm={6}>
                  <SampleChangerMaintenance
                    commands={props.commands}
                    global_state={props.global_state}
                    commands_state={props.commands_state}
                    message={props.message}
                    sendCommand={props.sendCommand}
                  />
                </Col>
              </Row>
            )}
          </GenericEquipment>
          {props.haContents.use_harvester ? (
            <GenericEquipment
              state={props.haState}
              name={props.haContents?.name}
              initialOpen
            >
              <Row className="row">
                <Col sm={9}>
                  <Harvester
                    state={props.haState}
                    harvestCrystal={props.harvestCrystal}
                    harvestAndLoadCrystal={props.harvestAndLoadCrystal}
                    abort={props.haAbort}
                    contents={props.haContents}
                    handleRefresh={props.haRefresh}
                  />
                </Col>
                <Col sm={3}>
                  <HarvesterMaintenance
                    contents={props.haContents}
                    commands={props.haCommands}
                    global_state={props.haGlobal_state}
                    commands_state={props.haCommands_state}
                    message={props.haMessage}
                    sendCommand={props.haSendCommand}
                    calibratePin={props.haCalibratePin}
                    sendDataCollectionToCrims={props.sendDataCollectionToCrims}
                    validateCalibration={props.haValidateCalibration}
                  />
                </Col>
              </Row>
            </GenericEquipment>
          ) : null}
          <Row>
            <Col sm={12}>
              {Object.entries(props.beamline.hardwareObjects).map(([key]) => {
                const obj = props.beamline.hardwareObjects[key];
                if (
                  !Array.isArray(obj.commands) &&
                  Object.values(obj.commands).length > 0
                ) {
                  return (
                    <GenericEquipmentControl
                      equipment={obj}
                      executeCommand={props.executeCommand}
                      key={key}
                    />
                  );
                }
                return null;
              })}
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
}

function mapStateToProps(state) {
  return {
    contents: state.sampleChanger.contents,
    sampleChangerState: state.sampleChanger.state,
    loadedSample: state.sampleChanger.loadedSample,

    plateGrid: state.sampleChanger.plateGrid,
    plateIndex: state.sampleChanger.currentPlateIndex,
    selectedRow: state.sampleChanger.selectedRow,
    selectedCol: state.sampleChanger.selectedCol,
    selectedDrop: state.sampleChanger.selectedDrop,
    crystalList: state.sampleGrid.crystalList,

    commands: state.sampleChangerMaintenance.commands,
    commands_state: state.sampleChangerMaintenance.commands_state,
    global_state: state.sampleChangerMaintenance.global_state,
    message: state.sampleChangerMaintenance.message,
    beamline: state.beamline,

    haContents: state.harvester.contents,
    haState: state.harvester.state,
    haCommands: state.harvesterMaintenance.commands,
    haCommands_state: state.harvesterMaintenance.commands_state,
    haGlobal_state: state.harvesterMaintenance.global_state,
    haMessage: state.harvesterMaintenance.message,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    select: (address) => dispatch(select(address)),
    mountSample: (address) => dispatch(mountSample(address)),
    unmountSample: () => dispatch(unmountSample()),
    scan: (container) => dispatch(scan(container)),
    refresh: () => dispatch(refresh()),
    abort: () => dispatch(abort()),
    sendCommand: (cmd, args) => dispatch(sendCommand(cmd, args)),
    executeCommand: bindActionCreators(executeCommand, dispatch),
    showErrorPanel: bindActionCreators(showErrorPanel, dispatch),
    selectWell: (row, col) => dispatch(selectWell(row, col)),
    setPlate: (address) => dispatch(setPlate(address)),
    selectDrop: (address) => dispatch(selectDrop(address)),
    syncSamplesCrims: () => dispatch(syncWithCrims()),

    harvestCrystal: (address) => dispatch(harvestCrystal(address)),
    harvestAndLoadCrystal: (address) =>
      dispatch(harvestAndLoadCrystal(address)),
    haCalibratePin: () => dispatch(haCalibratePin()),
    sendDataCollectionToCrims: () => dispatch(sendDataCollectionToCrims()),
    haValidateCalibration: (validated) =>
      dispatch(haValidateCalibration(validated)),
    haRefresh: () => dispatch(haRefresh()),
    haAbort: () => dispatch(haAbort()),
    haSendCommand: (cmd, args) => dispatch(haSendCommand(cmd, args)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(EquipmentContainer);
