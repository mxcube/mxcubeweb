import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Navbar, Nav, Table, Popover } from 'react-bootstrap';
import PopInput from '../components/PopInput/PopInput';
import BeamlineActions from './BeamlineActionsContainer';
import BeamlineCamera from '../components/BeamlineCamera/BeamlineCamera';
import InOutSwitch from '../components/InOutSwitch/InOutSwitch';
import DeviceState from '../components/DeviceState/DeviceState';
import LabeledValue from '../components/LabeledValue/LabeledValue';
import MachInfo from '../components/MachInfo/MachInfo';
import OneAxisTranslationControl from '../components/MotorInput/OneAxisTranslationControl';
import * as sampleViewActions from '../actions/sampleview'; // eslint-disable-line import/no-namespace

import { find, filter } from 'lodash';

import { setAttribute } from '../actions/beamline';

import { sendCommand } from '../actions/sampleChanger';
import { stopBeamlineAction } from '../actions/beamlineActions';

function BeamlineSetupContainer(props) {
  const {
    beamline,
    sampleChanger,
    sampleview,
    sampleViewActions,
    uiproperties,
    setAttribute,
    stopBeamlineAction,
    sendCommand,
  } = props;

  function onCancelHandler(name) {
    stopBeamlineAction(name);
  }

  function handleSetAttribute(name, value) {
    setAttribute(name, value);
  }

  function renderBeamstopAlignmentOverlay() {
    const { hardwareObjects } = beamline;
    const motorInputList = [];
    let popover = null;

    const motor = hardwareObjects.beamstop_alignemnt_x;
    const step = sampleview.motorSteps.beamstop_distance;

    if (motor !== undefined && motor.state !== 0) {
      motorInputList.push(
        <div key={`bsao-${motor.name}`} style={{ padding: '0.5em' }}>
          <p className="motor-name"> Beamstop distance: </p>
          <OneAxisTranslationControl
            save={sampleViewActions.sendMotorPosition}
            value={motor.position}
            min={motor.limits[0]}
            max={motor.limits[1]}
            step={step}
            motorName={motor.name}
            suffix="mm"
            decimalPoints="3"
            state={motor.state}
            disabled={beamline.motorInputDisable}
          />
        </div>,
      );
    }

    if (motorInputList.length > 0) {
      popover = <Popover>{motorInputList}</Popover>;
    }

    return popover;
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
                <Nav.Item key={key}>
                  <InOutSwitch
                    openText={beamline.hardwareObjects[key].commands[0]}
                    offText={beamline.hardwareObjects[key].commands[1]}
                    openValue={beamline.hardwareObjects[key].commands[0]}
                    offValue={beamline.hardwareObjects[key].commands[1]}
                    labelText={uiprop.label}
                    pkey={key}
                    value={beamline.hardwareObjects[key].value}
                    onSave={handleSetAttribute}
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
                    onSave={handleSetAttribute}
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
          key={`bs-name-${uiprop.label}`}
          className="py-1 ps-3 pe-2 align-middle"
        >
          <span className="me-1">{uiprop.label}:</span>
        </td>,
        <td
          key={`bs-val-${uiprop.label}`}
          className="pe-3 align-middle"
          style={{
            fontWeight: 'bold',
            borderRight:
              uiprop_list.length !== uiprop_list.indexOf(uiprop) + 1
                ? '1px solid #ddd'
                : '',
          }}
        >
          {beamline_attribute.readonly ? (
            <LabeledValue
              suffix={uiprop.suffix}
              precision={uiprop.precision}
              format={uiprop.format || ''}
              name=""
              value={beamline_attribute.value}
              level="light"
            />
          ) : (
            <PopInput
              pkey={uiprop.attribute}
              {...beamline_attribute}
              precision={uiprop.precision}
              suffix={uiprop.suffix}
              inputSize="10"
              onSave={handleSetAttribute}
              onCancel={onCancelHandler}
            />
          )}
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
    (o) => o.value_type === 'MOTOR' || o.value_type === 'ACTUATOR',
  );

  return (
    <Navbar className="beamline-status" id="bmstatus" expand="lg">
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="d-flex  me-auto">
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
                      border: '0px',
                      borderLeft: '1px solid #ddd',
                      paddingLeft: '1em',
                    }}
                  />
                </tr>
              </tbody>
            </Table>
          </Nav.Item>
        </Nav>
        <Nav className="">
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
        </Nav>
        <Nav className="me-3">{renderActuatorComponent()}</Nav>
        <Nav className="me-3">
          <Nav.Item>
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
    sampleview: state.sampleview,
    sampleChanger: state.sampleChanger,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    sampleViewActions: bindActionCreators(sampleViewActions, dispatch),
    setAttribute: bindActionCreators(setAttribute, dispatch),
    sendCommand: bindActionCreators(sendCommand, dispatch),
    stopBeamlineAction: bindActionCreators(stopBeamlineAction, dispatch),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(BeamlineSetupContainer);
