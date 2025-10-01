/* eslint-disable react/destructuring-assignment */
import { Col, Container, Row } from 'react-bootstrap';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { executeCommand } from '../actions/beamline';
import {
  abort as haAbort,
  harvestAndLoadCrystal,
  harvestCrystal,
  refresh as haRefresh,
} from '../actions/harvester';
import {
  abort,
  mountSample,
  refresh,
  scan,
  select,
  unmountSample,
} from '../actions/sampleChanger';
import GenericEquipment from '../components/Equipment/GenericEquipment';
import GenericEquipmentControl from '../components/Equipment/GenericEquipmentControl';
import Harvester from '../components/Equipment/Harvester';
import HarvesterMaintenance from '../components/Equipment/HarvesterMaintenance';
import PlateManipulator from '../components/Equipment/PlateManipulator';
import PlateManipulatorMaintenance from '../components/Equipment/PlateManipulatorMaintenance';
import SampleChanger from '../components/Equipment/SampleChanger';
import SampleChangerMaintenance from '../components/Equipment/SampleChangerMaintenance';

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
                  <PlateManipulator />
                </Col>
                <Col sm={6}>
                  <PlateManipulatorMaintenance />
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
                  <SampleChangerMaintenance />
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
                  <HarvesterMaintenance />
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

    commands: state.sampleChangerMaintenance.commands,
    commands_state: state.sampleChangerMaintenance.commands_state,
    beamline: state.beamline,

    haContents: state.harvester.contents,
    haState: state.harvester.state,
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
    executeCommand: bindActionCreators(executeCommand, dispatch),

    harvestCrystal: (address) => dispatch(harvestCrystal(address)),
    harvestAndLoadCrystal: (address) =>
      dispatch(harvestAndLoadCrystal(address)),
    haRefresh: () => dispatch(haRefresh()),
    haAbort: () => dispatch(haAbort()),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(EquipmentContainer);
