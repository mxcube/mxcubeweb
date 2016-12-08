import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import 'bootstrap-webpack!bootstrap-webpack/bootstrap.config.js';
import 'react-bootstrap-switch/src/less/bootstrap3/build.less';

import PopInput from '../components/PopInput/PopInput';
import InOutSwitch from '../components/InOutSwitch/InOutSwitch';

import { sendGetAllAttributes,
         sendSetAttribute,
         sendAbortCurrentAction } from '../actions/beamline';

import './beamline_setup_container.css';


class BeamlineSetupContainer extends React.Component {
  constructor(props) {
    super(props);
    this.onSaveHandler = this.onSaveHandler.bind(this);
    this.onCancelHandler = this.onCancelHandler.bind(this);
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


  render() {
    return (
        <div className="beamline-setup-container">
          <div className="beamline-setup-content">
            <div className="row" style={{ marginBottom: '1em' }}>
              <div className="col-sm-6">
                <div style={{ paddingLeft: '0px', display: 'inline-block' }}>
                <InOutSwitch
                  onText="Open"
                  offText="Close"
                  labelText="Fast Shutter"
                  pkey="fast_shutter"
                  data={this.props.data.fast_shutter}
                  onSave={this.onSaveHandler}
                />
              </div>
              <div style={{ marginLeft: '4em', display: 'inline-block' }}>
                <InOutSwitch
                  onText="Open"
                  offText="Close"
                  labelText="Safety Shutter"
                  pkey="safety_shutter"
                  data={this.props.data.safety_shutter}
                  onSave={this.onSaveHandler}
                />
              </div>
              <div style={{ marginLeft: '4em', display: 'inline-block' }}>
                <InOutSwitch
                  onText="In"
                  offText="Out"
                  labelText="Beamstop"
                  pkey="beamstop"
                  data={this.props.data.beamstop}
                  onSave={this.onSaveHandler}
                />
              </div>
              <div style={{ marginLeft: '4em', display: 'inline-block' }}>
                <InOutSwitch
                  onText="In"
                  offText="Out"
                  labelText="Capillary"
                  pkey="capillary"
                  data={this.props.data.capillary}
                  onSave={this.onSaveHandler}
                />
              </div>
            </div>
            <div className="col-sm-6">
              <div style={{ paddingTop: '1em', marginLeft: '4em', display: 'inline-block' }}>
                <PopInput
                  ref="energy"
                  name="Energy"
                  pkey="energy"
                  suffix="keV"
                  data={this.props.data.energy}
                  onSave={this.onSaveHandler}
                  onCancel={this.onCancelHandler}
                />
                <PopInput
                  ref="resolution"
                  name="Resolution"
                  pkey="resolution"
                  placement="left"
                  suffix="&Aring;"
                  data={this.props.data.resolution}
                  onSave={this.onSaveHandler}
                  onCancel={this.onCancelHandler}
                />
              </div>
              <div style={{ paddingTop: '1em', marginLeft: '4em', display: 'inline-block' }}>
                <PopInput
                  ref="transmission"
                  name="Transmission"
                  pkey="transmission"
                  suffix="%"
                  data={this.props.data.transmission}
                  onSave={this.onSaveHandler}
                  onCancel={this.onCancelHandler}
                />
                <PopInput
                  ref="detdist"
                  name="Detector Distance"
                  pkey="detdist"
                  suffix="mm"
                  data={this.props.data.detdist}
                  onSave={this.onSaveHandler}
                  onCancel={this.onCancelHandler}
                />
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
