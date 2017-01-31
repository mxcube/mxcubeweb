import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import 'bootstrap-webpack!bootstrap-webpack/bootstrap.config.js';
import 'react-bootstrap-switch/src/less/bootstrap3/build.less';

import PopInput from '../components/PopInput/PopInput';
import BeamlineActions from '../components/BeamlineActions/BeamlineActions';
import InOutSwitch2 from '../components/InOutSwitch2/InOutSwitch2';
import MachInfo from '../components/MachInfo/MachInfo';
import CryoInput from '../components/Cryo/CryoInput';

import { sendGetAllAttributes,
         sendSetAttribute,
         sendAbortCurrentAction } from '../actions/beamline';

import './beamline_setup_container.css';


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
      acts.push(<div className="list-head" style={{ paddingRight: '2em' }}>
                      <InOutSwitch2
                        onText="Open"
                        offText="Close"
                        labelText={ this.props.data.actuators[key].label }
                        pkey= { key }
                        data= { this.props.data.actuators[key] }
                        onSave= { this.actuatorSaveHandler }
                      />
                    </div>
              );
    }
    return acts;
  }

  render() {
    // this.createActuatorComponent()
    return (
        <div className="beamline-setup-container">
          <div className="beamline-setup-content">
            <div className="row" style={{ marginBottom: '1em' }}>
              <div className="col-sm-12" style={{ alignItems: 'stretch', display: 'flex' }}>
                <div style={{ marginLeft: '0em', display: 'flex' }}>
                  <div className="m-tree" style={{ overflow: 'visible',
                    alignItems: 'center', display: 'flex' }}
                  >
                    <div className="list-head" >
                      <BeamlineActions />
                    </div>
                  </div>
                </div>
                <div style={{ paddingLeft: '1em', display: 'flex' }}>
                <div className="m-tree" style={{ display: 'flex' }}>
                {this.createActuatorComponent()}
                </div>
                </div>
              <div style={{ paddingTop: '0em', marginLeft: '1em', display: 'flex' }}>
              <div className="m-tree" style={{ alignItems: 'center', display: 'flex' }}>
                <div className="list-head" style={{ paddingRight: '0em' }}>
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
              </div>
              </div>
              </div>
              <div style={{ paddingTop: '0em', marginLeft: '0em', display: 'flex' }}>
              <div className="m-tree" style={{ alignItems: 'center', display: 'flex' }}>
                <div className="list-head" style={{ paddingRight: '0em' }}>
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
              </div>
              </div>
              </div>
              <div style={{ paddingTop: '0em', marginLeft: '0em', display: 'flex' }}>
              <div className="m-tree" style={{ alignItems: 'center', display: 'flex' }}>
                <div className="list-head" style={{ paddingRight: '0em' }}>
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
              </div>
              </div>
              </div>
              <div style={{ paddingTop: '0em', marginLeft: '0em', display: 'flex' }}>
              <div className="m-tree" style={{ alignItems: 'center', display: 'flex' }}>
                <div className="list-head" style={{ paddingLeft: '2em' }}>
                <CryoInput
                  ref="cryo"
                  name="Cryo"
                  pkey="cryo"
                  suffix="K"
                  data={this.props.data.cryo}
                  onSave={this.movableSaveHandler}
                  onCancel={this.onCancelHandler}
                />
              </div>
              </div>
              </div>
              <div style={{ paddingTop: '0em', marginLeft: '1em', display: 'flex' }}>
              <div className="m-tree" style={{ overflow: 'visible',
                alignItems: 'center', display: 'flex' }}
              >
                <div className="list-head">
                  <MachInfo
                    info={this.props.data.machinfo}
                  />
              </div>
              </div>
              </div>

              </div>
            </div>
          </div>
        </div>
    );
  }
}


function mapStateToProps(state) {
  return {
    data: state.beamline,
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
