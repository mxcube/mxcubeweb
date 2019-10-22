import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Row, Col, Table, Popover } from 'react-bootstrap';
import PopInput from '../components/PopInput/PopInput';
import BeamlineActions from './BeamlineActionsContainer';
import InOutSwitch from '../components/InOutSwitch/InOutSwitch';
import SampleChangerSwitch from '../components/SampleChangerSwitch/SampleChangerSwitch';
import LabeledValue from '../components/LabeledValue/LabeledValue';
import MachInfo from '../components/MachInfo/MachInfo';
import OneAxisTranslationControl from '../components/MotorInput/OneAxisTranslationControl';
import * as SampleViewActions from '../actions/sampleview';

import { sendGetAllAttributes,
  sendSetAttribute,
  sendAbortCurrentAction } from '../actions/beamline';

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


  componentDidMount() {
    this.props.getAllAttributes();
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
    const motors = this.props.beamline.motors;
    const motorInputList = [];
    let popover = null;

    const motor = motors.beamstop_distance;
    const step = this.props.sampleview.motorSteps.beamstop_distance;

    if (motor !== undefined && motor.state !== 0) {
      motorInputList.push((
        <div style={{ marginBottom: '1em' }}>
          <p className="motor-name">Beamstop distance:</p>
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
    for (const key in this.props.beamline.attributes) {
      if (this.props.beamline.attributes[key].type === 'DUOSTATE') {
        if (this.props.beamline.attributes[key].label === 'Beamstop') {
          acts.push(<Col key={key} sm={2} className="pull-right">
                    <InOutSwitch
                      onText={ this.props.beamline.attributes[key].commands[0] }
                      offText={ this.props.beamline.attributes[key].commands[1] }
                      labelText={ this.props.beamline.attributes[key].label }
                      pkey={ key }
                      data={ this.props.beamline.attributes[key] }
                      onSave={ this.setAttribute }
                      optionsOverlay={ this.beamstopAlignmentOverlay() }
                    />
                    </Col>
          );
        } else {
          acts.push(<Col key={key} sm={2} className="pull-right">
                    <InOutSwitch
                      onText={ this.props.beamline.attributes[key].commands[0] }
                      offText={ this.props.beamline.attributes[key].commands[1] }
                      labelText={ this.props.beamline.attributes[key].label }
                      pkey={ key }
                      data={ this.props.beamline.attributes[key] }
                      onSave={ this.setAttribute }
                    />
                    </Col>
          );
        }
      }
    }
    return acts;
  }


  dmState() {
    let state = 'READY';

    const notReady = Object.values(this.props.beamline.motors).
      filter((motor) => motor.state !== 2);

    if (notReady.length !== 0) {
      state = 'BUSY';
    }

    return state;
  }

  render() {
    return (
      <Row style={{
        paddingTop: '0.5em',
        paddingBottom: '0.5em',
        background: '#FAFAFA',
        borderBottom: '1px solid rgb(180,180,180)' }}
      >
        <Col sm={12}>
          <Row style={{ display: 'flex', alignItems: 'center' }}>
            <Col sm={1}>
              <BeamlineActions actionsList={this.props.beamline.beamlineActionsList} />
            </Col>
            <Col sm={5} smPush={1}>
              <Table
                condensed
                style={{ margin: '0px', fontWeight: 'bold',
                  paddingLeft: '7em', paddingRight: '7em' }}
              >
               <tr>
                 <td>
                   Energy:
                 </td>
                <td style={{ fontWeight: 'bold' }}>
                  { this.props.beamline.attributes.energy.readonly ?
                    (<LabeledValue
                      suffix="keV"
                      name=""
                      value={this.props.beamline.attributes.energy.value}
                    />)
                    :
                    (<PopInput
                      name=""
                      pkey="energy"
                      suffix="keV"
                      data={ this.props.beamline.attributes.energy }
                      onSave= { this.setAttribute }
                      onCancel= { this.onCancelHandler }
                    />)
                  }

                </td>
                <td style={{ borderLeft: '1px solid #ddd', paddingLeft: '1em' }}>
                  Resolution:
                </td>
                <td>
                  <PopInput
                    name=""
                    pkey="resolution"
                    suffix="&Aring;"
                    data={this.props.beamline.attributes.resolution}
                    onSave={this.setAttribute}
                    onCancel={this.onCancelHandler}
                  />
                </td>
                <td style={{ borderLeft: '1px solid #ddd', paddingLeft: '1em' }}>
                  Transmission:
                </td>
                <td>
                  <PopInput
                    name=""
                    pkey="transmission"
                    suffix="%"
                    data={this.props.beamline.attributes.transmission}
                    onSave={this.setAttribute}
                    onCancel={this.onCancelHandler}
                  />
                </td>
                <td style={{ borderLeft: '1px solid #ddd', paddingLeft: '1em' }}>
                  Cryo:
                </td>
                <td>
                  <LabeledValue
                    name=""
                    suffix="K"
                    value={this.props.beamline.attributes.cryo.value}
                  />
                </td>
              </tr>
              <tr>
                <td>
                  Wavelength:
                </td>
                <td>
                  { this.props.beamline.attributes.wavelength.readonly ?
                    (<LabeledValue
                      suffix="&Aring;"
                      name=""
                      value={this.props.beamline.attributes.wavelength.value}
                    />)
                    :
                    (<PopInput
                      name=""
                      pkey="wavelength"
                      placement="left"
                      suffix="&Aring;"
                      data={this.props.beamline.attributes.wavelength}
                      onSave={this.setAttribute}
                      onCancel={this.onCancelHandler}
                    />)
                  }
                </td>
                <td style={{ borderLeft: '1px solid #ddd', paddingLeft: '1em' }}>
                  Detector:
                </td>
                <td>
                  <PopInput
                    name=""
                    pkey="detector_distance"
                    suffix="mm"
                    data={this.props.beamline.attributes.detector_distance}
                    onSave={this.setAttribute}
                    onCancel={this.onCancelHandler}
                  />
                </td>
                <td style={{ borderLeft: '1px solid #ddd', paddingLeft: '1em' }}>
                  Flux:
                </td>
                <td>
                  <LabeledValue
                    suffix="ph/s"
                    name=""
                    value={this.props.beamline.attributes.flux.value}
                  />
                </td>
                <td style={{ borderLeft: '1px solid #ddd', paddingLeft: '1em' }}>
                </td>
                <td>
                </td>
              </tr>
            </Table>
            </Col>
            <Col sm={5} smPush={1}>
              <Col sm={2} className="pull-right">
                <MachInfo
                  info={this.props.beamline.attributes.machine_info.value}
                />
              </Col>
              {this.createActuatorComponent()}
              <Col sm={2} className="pull-right">
                <SampleChangerSwitch
                  labelText={ 'Sample Changer' }
                  data = { this.props.sampleChanger.state }
                  onSave={ this.props.sendCommand }
                />
              </Col>
            </Col>
          </Row>
        </Col>
      </Row>
    );
  }
}


function mapStateToProps(state) {
  return {
    beamline: state.beamline,
    sampleview: state.sampleview,
    sampleChanger: state.sampleChanger
  };
}


function mapDispatchToProps(dispatch) {
  return {
    getAllAttributes: bindActionCreators(sendGetAllAttributes, dispatch),
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
