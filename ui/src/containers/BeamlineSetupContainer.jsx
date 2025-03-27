import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
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

function BeamlineSetupContainer() {
  const dispatch = useDispatch();
  const beamlineProperties = useSelector(
    (state) => state.uiproperties?.beamline_setup?.components,
  );
  const hardwareObjects = useSelector(
    (state) => state.beamline.hardwareObjects,
  );
  const sampleChangerState = useSelector((state) => state.sampleChanger.state);

  function renderBeamstopAlignmentOverlay() {
    const motor = hardwareObjects['diffractometer.beamstop_distance'];

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

  function renderActuatorComponent() {
    const acts = [];

    if (beamlineProperties) {
      for (const key in hardwareObjects) {
        if (hardwareObjects[key] !== undefined) {
          const uiprop = find(beamlineProperties, { attribute: key });

          if (uiprop !== undefined && uiprop.value_type === 'NSTATE') {
            // eslint-disable-next-line max-depth
            if (uiprop.label === 'Beamstop') {
              acts.push(
                <Nav.Item key={key} className="ms-3">
                  <InOutSwitch
                    openText={hardwareObjects[key].commands[0]}
                    offText={hardwareObjects[key].commands[1]}
                    openValue={hardwareObjects[key].commands[0]}
                    offValue={hardwareObjects[key].commands[1]}
                    labelText={uiprop.label}
                    pkey={key}
                    value={hardwareObjects[key].value}
                    onSave={(name, value) =>
                      dispatch(setAttribute(name, value))
                    }
                    optionsOverlay={renderBeamstopAlignmentOverlay()}
                  />
                </Nav.Item>,
              );
            } else {
              acts.push(
                <Nav.Item key={key} className="ms-3">
                  <InOutSwitch
                    openText={hardwareObjects[key].commands[0]}
                    offText={hardwareObjects[key].commands[1]}
                    openValue={hardwareObjects[key].commands[0]}
                    offValue={hardwareObjects[key].commands[1]}
                    labelText={uiprop.label}
                    pkey={key}
                    value={hardwareObjects[key].value}
                    onSave={(name, value) =>
                      dispatch(setAttribute(name, value))
                    }
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
                  data={hardwareObjects[key].state}
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
      const beamline_attribute = hardwareObjects[uiprop.attribute];

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
            onSave={(value) => dispatch(setAttribute(uiprop.attribute, value))}
            onCancel={() => dispatch(stopBeamlineAction(uiprop.attribute))}
          />
        </td>,
      );
    }

    return components;
  }

  if (!beamlineProperties) {
    return null;
  }

  const uiprop_list = filter(
    beamlineProperties,
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
            <BeamlineCamera />
            <BeamlineActions />
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
              value={sampleChangerState}
              onSave={(cmdparts, args) => dispatch(sendCommand(cmdparts, args))}
            />
          </Nav.Item>
          {renderActuatorComponent()}
          <Nav.Item className="ms-3">
            <span className="blstatus-item">
              {hardwareObjects.machine_info && (
                <MachInfo info={hardwareObjects.machine_info.value} />
              )}
            </span>
          </Nav.Item>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
}

export default BeamlineSetupContainer;
