import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Navbar, Nav, Table, Popover } from 'react-bootstrap';
import { find, filter } from 'lodash';

import BeamlineAttribute from '../components/BeamlineAttribute/BeamlineAttribute';
import BeamlineActions from './BeamlineActionsContainer';
import BeamlineCamera from '../components/BeamlineCamera/BeamlineCamera';
import InOutSwitch from '../components/InOutSwitch/InOutSwitch';
import DeviceState from '../components/DeviceState/DeviceState';
import MachInfo from '../components/MachInfo/MachInfo';
import OneAxisTranslationControl from '../components/MotorInput/OneAxisTranslationControl';

import { setAttribute } from '../actions/beamline';
import { sendCommand } from '../actions/sampleChanger';
import { stopBeamlineAction } from '../actions/beamlineActions';

function BeamlineSetupContainer(props) {
  const {
    beamline,
    sampleChanger,
    uiproperties,
    setAttribute,
    stopBeamlineAction,
    sendCommand,
  } = props;

  function renderBeamstopAlignmentOverlay() {
    const motor = beamline.hardwareObjects['diffractometer.beamstop_distance'];

    if (!motor) {
      return null;
    }

    return (
      <Popover>
        <Popover.Header as="h3">Beamstop distance</Popover.Header>
        <Popover.Body>
          <OneAxisTranslationControl
            // No `uiproperties` object defined for beamstop distance
            // https://github.com/mxcube/mxcubeweb/pull/1448#discussion_r1800643857
            motorProps={{ attribute: motor.name, step: 0.1, precision: 3 }}
          />
        </Popover.Body>
      </Popover>
    );
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  function renderActuatorComponent() {
    const acts = [];

    if ('beamline_setup' in uiproperties) {
      const blsetup_properties = uiproperties.beamline_setup.components;

      for (const key in beamline.hardwareObjects) {
        if (beamline.hardwareObjects[key] !== undefined) {
          const uiprop = find(blsetup_properties, { attribute: key });

          if (uiprop !== undefined && uiprop.value_type === 'NSTATE') {
            if (uiprop.label === 'Beamstop') {
              acts.push(
                <Nav.Item key={key} className="ms-3">
                  <InOutSwitch
                    openText={beamline.hardwareObjects[key].commands[0]}
                    offText={beamline.hardwareObjects[key].commands[1]}
                    openValue={beamline.hardwareObjects[key].commands[0]}
                    offValue={beamline.hardwareObjects[key].commands[1]}
                    labelText={uiprop.label}
                    pkey={key}
                    value={beamline.hardwareObjects[key].value}
                    onSave={setAttribute}
                    optionsOverlay={renderBeamstopAlignmentOverlay()}
                  />
                </Nav.Item>,
              );
            } else {
              acts.push(
                <Nav.Item key={key} className="ms-3">
                  <InOutSwitch
                    openText={beamline.hardwareObjects[key].commands[0]}
                    offText={beamline.hardwareObjects[key].commands[1]}
                    openValue={beamline.hardwareObjects[key].commands[0]}
                    offValue={beamline.hardwareObjects[key].commands[1]}
                    labelText={uiprop.label}
                    pkey={key}
                    value={beamline.hardwareObjects[key].value}
                    onSave={setAttribute}
                  />
                </Nav.Item>,
              );
            }
          } else if (
            uiprop !== undefined &&
            uiprop.value_type !== 'NSTATE' &&
            uiprop.value_type !== 'MOTOR' &&
            uiprop.value_type !== 'ACTUATOR' &&
            uiprop.value_type !== 'ENERGY'
          ) {
            acts.push(
              <Nav.Item key={key} className="ms-3">
                <DeviceState
                  labelText={uiprop.label}
                  data={beamline.hardwareObjects[key].state}
                />
              </Nav.Item>,
            );
          }
        }
      }
    }
    return acts;
  }

  function renderTableRow(uiprop_list) {
    const components = [];

    for (const uiprop of uiprop_list) {
      const beamline_attribute = beamline.hardwareObjects[uiprop.attribute];

      components.push(
        <td
          key={`bs-name-${uiprop.attribute}`}
          className="py-1 ps-3 pe-2 align-middle"
        >
          <span className="me-1">{uiprop.label}:</span>
        </td>,
        <td
          key={`bs-val-${uiprop.attribute}`}
          style={{
            padding: '0.125rem 0.625rem 0.125rem 0',
            verticalAlign: 'middle',
            borderRight:
              uiprop_list.indexOf(uiprop) !== uiprop_list.length - 1
                ? '1px solid #ddd'
                : undefined,
          }}
        >
          <BeamlineAttribute
            attribute={beamline_attribute}
            format={uiprop.format}
            precision={uiprop.precision}
            suffix={uiprop.suffix}
            onSave={(value) => setAttribute(uiprop.attribute, value)}
            onCancel={() => stopBeamlineAction(uiprop.attribute)}
          />
        </td>,
      );
    }

    return components;
  }

  if (!('beamline_setup' in uiproperties)) {
    return null;
  }

  const uiprops = uiproperties.beamline_setup.components;
  const uiprop_list = filter(
    uiprops,
    (o) =>
      o.value_type === 'MOTOR' ||
      o.value_type === 'ACTUATOR' ||
      o.value_type === 'ENERGY',
  );

  return (
    <Navbar className="beamline-status" id="bmstatus" expand="lg">
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="d-flex me-auto">
          <Nav.Item className="justify-content-start">
            <BeamlineCamera cameraSetup={uiproperties.camera_setup} />
            <BeamlineActions actionsList={beamline.beamlineActionsList} />
          </Nav.Item>
        </Nav>
        <Nav className="me-auto my-2 my-lg-0">
          <Nav.Item className="d-flex justify-content-start">
            <Table
              borderless
              responsive
              style={{
                margin: 0,
                fontWeight: 'bold',
                paddingLeft: '7em',
                paddingRight: '7em',
              }}
            >
              <tbody>
                <tr>
                  {renderTableRow(
                    uiprop_list.slice(0, (uiprop_list.length / 2).toFixed(0)),
                  )}
                </tr>
                <tr>
                  {renderTableRow(
                    uiprop_list.slice((uiprop_list.length / 2).toFixed(0)),
                  )}
                  <td
                    style={{
                      border: 0,
                      borderLeft: '1px solid #ddd',
                      paddingLeft: '1em',
                    }}
                  />
                </tr>
              </tbody>
            </Table>
          </Nav.Item>
        </Nav>
        <Nav className="me-3">
          <Nav.Item>
            <InOutSwitch
              openText="Power On"
              offText="Power Off"
              openValue="PowerOn"
              offValue="PowerOff"
              labelText="Sample Changer"
              value={sampleChanger.state}
              onSave={sendCommand}
            />
          </Nav.Item>
          {renderActuatorComponent()}
          <Nav.Item className="ms-3">
            <span className="blstatus-item">
              {beamline.hardwareObjects.machine_info && (
                <MachInfo info={beamline.hardwareObjects.machine_info.value} />
              )}
            </span>
          </Nav.Item>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
}

function mapStateToProps(state) {
  return {
    uiproperties: state.uiproperties,
    beamline: state.beamline,
    sampleChanger: state.sampleChanger,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    setAttribute: bindActionCreators(setAttribute, dispatch),
    sendCommand: bindActionCreators(sendCommand, dispatch),
    stopBeamlineAction: bindActionCreators(stopBeamlineAction, dispatch),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(BeamlineSetupContainer);
