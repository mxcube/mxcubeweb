import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Row, Col } from 'react-bootstrap';
import PopInput from '../components/PopInput/PopInput';
import BeamlineActions from './BeamlineActionsContainer';
import InOutSwitch2 from '../components/InOutSwitch2/InOutSwitch2';
import MachInfo from '../components/MachInfo/MachInfo';
import CryoInput from '../components/Cryo/CryoInput';

import { sendGetAllAttributes,
         sendSetAttribute,
         sendAbortCurrentAction } from '../actions/beamline';


class BeamlineSetupContainer extends React.Component {
  constructor(props) {
    super(props);
    this.onSaveHandler = this.onSaveHandler.bind(this);
    this.actuatorSaveHandler = this.actuatorSaveHandler.bind(this);
    this.movableSaveHandler = this.movableSaveHandler.bind(this);
    this.onCancelHandler = this.onCancelHandler.bind(this);
    this.createActuatorComponent = this.createActuatorComponent.bind(this);
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


  actuatorSaveHandler(name, value) {
    this.props.setAttribute(name, value, 'actuator');
  }


  movableSaveHandler(name, value) {
    this.props.setAttribute(name, value, 'movable');
  }


  createActuatorComponent() {
    const acts = [];
    for (let key in this.props.data.actuators) {
      if (this.props.data.actuators.hasOwnProperty(key)) {
        acts.push(<Col sm={1}>
                      <InOutSwitch2
                        onText="Open"
                        offText="Close"
                        labelText={ this.props.data.actuators[key].label }
                        pkey= { key }
                        data= { this.props.data.actuators[key] }
                        onSave= { this.actuatorSaveHandler }
                      />
                  </Col>
              );
      }
    }
    return acts;
  }

  render() {
    return (<Row style={{
      background: 'linear-gradient(to bottom, #ffffff 0%, #f6f6f6 47%, #ededed 100%)',
      borderBottom: '1px solid rgb(174, 165, 165)' }}
    >
              <Col sm={12}>
                <Row style={{ display: 'flex', alignItems: 'center' }}>
                  <Col sm={2}>
                    <BeamlineActions actionsList={this.props.data.beamlineActionsList} />
                  </Col>
                  {this.createActuatorComponent()}
                  <Col sm={1}>
                    <PopInput
                      ref="energy"
                      name="Energy"
                      pkey="energy"
                      suffix="keV"
                      data= { this.props.data.movables.energy }
                      onSave= { this.movableSaveHandler }
                      onCancel= { this.onCancelHandler }
                    />
                    <PopInput
                      ref="wavelength"
                      name="Wavelength"
                      pkey="wavelength"
                      placement="left"
                      suffix="&Aring;"
                      data={this.props.data.movables.wavelength}
                      onSave={this.movableSaveHandler}
                      onCancel={this.onCancelHandler}
                    />
                  </Col>
                  <Col sm={1}>
                    <PopInput
                      ref="resolution"
                      name="Resolution"
                      pkey="resolution"
                      suffix="A"
                      data={this.props.data.movables.resolution}
                      onSave={this.movableSaveHandler}
                      onCancel={this.onCancelHandler}
                    />
                    <PopInput
                      ref="detdist"
                      name="Detector"
                      pkey="detdist"
                      suffix="mm"
                      data={this.props.data.movables.detdist}
                      onSave={this.movableSaveHandler}
                      onCancel={this.onCancelHandler}
                    />
                  </Col>
                  <Col sm={1}>
                    <PopInput
                      ref="transmission"
                      name="Transmission"
                      pkey="transmission"
                      suffix="%"
                      data={this.props.data.movables.transmission}
                      onSave={this.movableSaveHandler}
                      onCancel={this.onCancelHandler}
                    />
                    <PopInput
                      ref="flux"
                      name="Flux"
                      pkey="flux"
                      suffix="p/s"
                      data={this.props.data.movables.flux}
                      onSave={this.movableSaveHandler}
                      onCancel={this.onCancelHandler}
                    />
                  </Col>
                  <Col sm={1}>
                    <CryoInput
                      ref="cryo"
                      name="Cryo"
                      pkey="cryo"
                      suffix="K"
                      data={this.props.data.cryo}
                      onSave={this.movableSaveHandler}
                      onCancel={this.onCancelHandler}
                    />
                  </Col>
                  <Col sm={3}>
                    <div className="pull-right">
                      <MachInfo
                        info={this.props.data.machinfo}
                      />
                    </div>
                  </Col>
                </Row>
            </Col>
          </Row>
    );
  }
}


function mapStateToProps(state) {
  return {
    data: state.beamline
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
