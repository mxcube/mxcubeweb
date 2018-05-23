import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Row, Col, Table } from 'react-bootstrap';
import PopInput from '../components/PopInput/PopInput';
import BeamlineActions from './BeamlineActionsContainer';
import InOutSwitch2 from '../components/InOutSwitch2/InOutSwitch2';
import LabeledValue from '../components/LabeledValue/LabeledValue';
import MachInfo from '../components/MachInfo/MachInfo';

import { sendGetAllAttributes,
         sendSetAttribute,
         sendAbortCurrentAction } from '../actions/beamline';


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


  createActuatorComponent() {
    const acts = [];
    for (let key in this.props.data.attributes) {
      if (this.props.data.attributes[key].type === 'DUOSTATE') {
        acts.push(<Col key={key} sm={2} className="pull-right">
                    <InOutSwitch2
                      onText={ this.props.data.attributes[key].commands[0] }
                      offText={ this.props.data.attributes[key].commands[1] }
                      labelText={ this.props.data.attributes[key].label }
                      pkey={ key }
                      data={ this.props.data.attributes[key] }
                      onSave={ this.setAttribute }
                    />
                  </Col>
              );
      }
    }
    return acts;
  }


  dmState() {
    let state = 'READY';

    const notReady = Object.values(this.props.data.motors).
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
              <BeamlineActions actionsList={this.props.data.beamlineActionsList} />
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
                  { this.props.data.attributes.energy.readonly ?
                    (<LabeledValue
                      suffix="keV"
                      name=""
                      value={this.props.data.attributes.energy.value}
                    />)
                    :
                  (<PopInput
                    name=""
                    pkey="energy"
                    suffix="keV"
                    data={ this.props.data.attributes.energy }
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
                    data={this.props.data.attributes.resolution}
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
                    data={this.props.data.attributes.transmission}
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
                    value={this.props.data.attributes.cryo.value}
                  />
                </td>
              </tr>
              <tr>
                <td>
                  Wavelength:
                </td>
                <td>
                  { this.props.data.attributes.wavelength.readonly ?
                    (<LabeledValue
                      suffix="&Aring;"
                      name=""
                      value={this.props.data.attributes.wavelength.value}
                    />)
                    :
                  (<PopInput
                    name=""
                    pkey="wavelength"
                    placement="left"
                    suffix="&Aring;"
                    data={this.props.data.attributes.wavelength}
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
                    pkey="detdist"
                    suffix="mm"
                    data={this.props.data.attributes.detdist}
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
                    value={this.props.data.attributes.flux.value}
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
                  info={this.props.data.attributes.machinfo.value}
                />
              </Col>
              {this.createActuatorComponent()}
              <Col sm={2} className="pull-right">
                <LabeledValue
                  suffix=""
                  name="Sample changer"
                  value={this.props.sampleChanger.state}
                  level={this.props.sampleChanger.state === 'READY' ? 'info' : 'warning'}
                  look={"vertical"}
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
    data: state.beamline,
    sampleChanger: state.sampleChanger
  };
}


function mapDispatchToProps(dispatch) {
  return {
    getAllAttributes: bindActionCreators(sendGetAllAttributes, dispatch),
    setAttribute: bindActionCreators(sendSetAttribute, dispatch),
    abortCurrentAction: bindActionCreators(sendAbortCurrentAction, dispatch)
  };
}


export default connect(
    mapStateToProps,
    mapDispatchToProps
)(BeamlineSetupContainer);
