import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Navbar, Nav, Table, Popover } from 'react-bootstrap';
import PopInput from '../components/PopInput/PopInput';
import BeamlineActions from './BeamlineActionsContainer';
import InOutSwitch from '../components/InOutSwitch/InOutSwitch';
import SampleChangerSwitch from '../components/SampleChangerSwitch/SampleChangerSwitch';
import DeviceState from '../components/DeviceState/DeviceState';
import LabeledValue from '../components/LabeledValue/LabeledValue';
import MachInfo from '../components/MachInfo/MachInfo';
import OneAxisTranslationControl from '../components/MotorInput/OneAxisTranslationControl';
import * as SampleViewActions from '../actions/sampleview';

import { find, filter } from 'lodash';

import {
  sendGetAllhardwareObjects,
  sendSetAttribute,
  sendAbortCurrentAction
} from '../actions/beamline';

import { sendCommand } from '../actions/sampleChanger';

class BeamlineSetupContainer extends React.Component {
  constructor(props) {
    super(props);
    this.onSaveHandler = this.onSaveHandler.bind(this);
    this.setAttribute = this.setAttribute.bind(this);
    this.onCancelHandler = this.onCancelHandler.bind(this);
    this.createActuatorComponent = this.createActuatorComponent.bind(this);
    this.dmState = this.dmState.bind(this);
  }

  onSaveHandler(name, value) {
    this.props.setAttribute(name, value);
  }

  onCancelHandler(name) {
    this.props.abortCurrentAction(name);
  }

  setAttribute(name, value) {
    this.props.setAttribute(name, value);
  }

  beamstopAlignmentOverlay() {
    const { hardwareObjects } = this.props.beamline;
    const motorInputList = [];
    let popover = null;

    const motor = hardwareObjects.beamstop_alignemnt_x;
    const step = this.props.sampleview.motorSteps.beamstop_distance;

    if (motor !== undefined && motor.state !== 0) {
      motorInputList.push((
        <div key={`bsao-${motor.name}`} style={{ padding: '0.5em' }}>
          <p className="motor-name"> Beamstop distance: </p>
          <OneAxisTranslationControl
            save={this.props.sampleViewActions.sendMotorPosition}
            value={motor.position}
            min={motor.limits[0]} max={motor.limits[1]}
            step={step}
            motorName={motor.name}
            suffix="mm"
            decimalPoints="3"
            state={motor.state}
            disabled={this.props.beamline.motorInputDisable}
          />
        </div>
      ));
    }

    if (motorInputList.length > 0) {
      popover = (<Popover>{motorInputList}</Popover>);
    }

    return popover;
  }


  createActuatorComponent() {
    const acts = [];

    const { uiproperties } = this.props;
    if (uiproperties.hasOwnProperty('beamline_setup')) {
      const blsetup_properties = uiproperties.beamline_setup.components;

      for (const key in this.props.beamline.hardwareObjects) {
        if (this.props.beamline.hardwareObjects[key] !== undefined) {
          const uiprop = find(blsetup_properties, { attribute: key });

          if (uiprop !== undefined && uiprop.value_type === 'NSTATE') {
            if (uiprop.label === 'Beamstop') {
              acts.push(
                <Nav.Item key={key} className="ms-3">
                  <InOutSwitch
                    onText={this.props.beamline.hardwareObjects[key].commands[0]}
                    offText={this.props.beamline.hardwareObjects[key].commands[1]}
                    labelText={uiprop.label}
                    pkey={key}
                    data={this.props.beamline.hardwareObjects[key]}
                    onSave={this.setAttribute}
                    optionsOverlay={this.beamstopAlignmentOverlay()}
                  />
                </Nav.Item>
              );
            } else {
              acts.push(
                <Nav.Item key={key} className="ms-3">
                  <InOutSwitch
                    onText={this.props.beamline.hardwareObjects[key].commands[0]}
                    offText={this.props.beamline.hardwareObjects[key].commands[1]}
                    labelText={uiprop.label}
                    pkey={key}
                    data={this.props.beamline.hardwareObjects[key]}
                    onSave={this.setAttribute}
                  />
                </Nav.Item>
              );
            }
          }
        }
      }
    }
    return acts;
  }


  dmState() {
    return this.props.beamline.hardwareObjects.diffractometer.state;
  }

  render_table_row(uiprop_list) {
    const components = [];

    for (const uiprop of uiprop_list) {
      const beamline_attribute = this.props.beamline.hardwareObjects[uiprop.attribute];

      components.push(
        <td key={`bs-name-${uiprop.label}`} className="py-1 ps-3 pe-2 align-middle">
          <span className='me-1'>{uiprop.label}:</span>
        </td>);
      components.push(
        <td
        key={`bs-val-${uiprop.label}`}
        className='pe-3'
        style={{
          fontWeight: 'bold',
          border: '0px',
          borderRight: uiprop_list.length != uiprop_list.indexOf(uiprop) + 1 ? '1px solid #ddd': '',
          padding: '0em'}}>
          { beamline_attribute.readonly ?
            (<LabeledValue
              suffix={uiprop.suffix}
              precision={uiprop.precision}
              format={uiprop.format || ''}
              name=""
              value={beamline_attribute.value}
              level="light"
            />)
            :
            (<PopInput
              name=""
              pkey= {uiprop.attribute}
              suffix={uiprop.suffix }
              precision={ uiprop.precision }
              inputSize="10"
              data={ beamline_attribute }
              onSave= { this.setAttribute }
              onCancel= { this.onCancelHandler }
            />)
          }
        </td>
      );
    }

    return components;
  }

  render() {
    const { uiproperties } = this.props;

    if (!uiproperties.hasOwnProperty('beamline_setup')) {
      return null;
    }


    const uiprops = this.props.uiproperties.beamline_setup.components;
    const uiprop_list = filter(uiprops, (o) =>
    o.value_type === 'MOTOR' || o.value_type === 'ACTUATOR'
    );

    return (
    <Navbar
      style={{
        background: '#FAFAFA',
        borderBottom: '1px solid lightgray',
        paddingBottom: '0em',
      }}
      className="beamline-status ps-3 pe-3"
      id="bmstatus"
      bg='light'
      expand="lg"
    >
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="d-flex  me-auto my-2 my-lg-0">
            <Nav.Item className=" d-flex justify-content-start">
              <span className="blstatus-item" style={{ marginRight: '1em' }}>
                <BeamlineActions actionsList={this.props.beamline.beamlineActionsList} />
              </span>
            </Nav.Item>
          </Nav>
          <Nav className="me-auto my-2 my-lg-0">
            <Nav.Item className="d-flex justify-content-start" >
              <Table
                borderless
                responsive
                style={{
                  margin: '0px', fontWeight: 'bold',
                  paddingLeft: '7em', paddingRight: '7em'
                }}
              >
                <tbody>
                  <tr>
                    {this.render_table_row(uiprop_list.slice(0, (uiprop_list.length / 2).toFixed(0)))}
                  </tr>
                  <tr>
                    {this.render_table_row(uiprop_list.slice((uiprop_list.length / 2).toFixed(0)))}
                    {/* <td style={{ border: '0px', borderLeft: '1px solid #ddd', paddingLeft: '1em' }} />
                    <td style={{ border: '0px' }} /> */}
                  </tr>
                </tbody>
              </Table>
            </Nav.Item>
          </Nav>
          <Nav className="me-3">
            <Nav.Item>
              <DeviceState
                labelText="Detector"
                data={this.props.beamline.hardwareObjects.detector.state.acq_satus}
              />
            </Nav.Item>
          </Nav>
          <Nav className="me-3">
            <Nav.Item>
              <SampleChangerSwitch
                labelText="Sample Changer"
                data={this.props.sampleChanger.state}
                onSave={this.props.sendCommand}
              />
            </Nav.Item>
          </Nav>
          <Nav className="me-3">
            {this.createActuatorComponent()}
          </Nav>
          <Nav className="">
            <Nav.Item>
              <span className="blstatus-item">
                {this.props.beamline.hardwareObjects.machine_info ?
                  <MachInfo
                    info={this.props.beamline.hardwareObjects.machine_info.value}
                  />
                  :
                  null
                }
              </span>
            </Nav.Item>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    );
  }
}


function mapStateToProps(state) {
  return {
    uiproperties: state.uiproperties,
    beamline: state.beamline,
    sampleview: state.sampleview,
    sampleChanger: state.sampleChanger
  };
}


function mapDispatchToProps(dispatch) {
  return {
    getAllhardwareObjects: bindActionCreators(sendGetAllhardwareObjects, dispatch),
    sampleViewActions: bindActionCreators(SampleViewActions, dispatch),
    setAttribute: bindActionCreators(sendSetAttribute, dispatch),
    sendCommand: bindActionCreators(sendCommand, dispatch),
    abortCurrentAction: bindActionCreators(sendAbortCurrentAction, dispatch)
  };
}


export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BeamlineSetupContainer);
