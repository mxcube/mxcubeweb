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
            <table>
              <tbody>
                <tr>
                  <td>
                    <PopInput
                      ref="transmission"
                      name="Transmission"
                      pkey="transmission"
                      suffix="%"
                      data={this.props.data.transmission}
                      onSave={this.onSaveHandler}
                      onCancel={this.onCancelHandler}
                    />
                  </td>
                  <td>
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
                  </td>
                </tr>
                <tr>
                  <td>
                    <PopInput
                      ref="energy"
                      name="Energy"
                      pkey="energy"
                      suffix="keV"
                      data={this.props.data.energy}
                      onSave={this.onSaveHandler}
                      onCancel={this.onCancelHandler}
                    />
                  </td>
                  <td>
                    <PopInput
                      ref="dtox"
                      name="Detector Distance"
                      pkey="dtox"
                      suffix="mm"
                      data={this.props.data.dtox}
                      onSave={this.onSaveHandler}
                      onCancel={this.onCancelHandler}
                    />
                  </td>
                  <td>
                  </td>
                </tr>
                <tr>
                  <td>
                    <InOutSwitch
                      onText="Open"
                      offText="Close"
                      labelText="Fast Shutter"
                      pkey="fast_shutter"
                      data={this.props.data.fast_shutter}
                      onSave={this.onSaveHandler}
                    />
                  </td>
                  <td>
                    <InOutSwitch
                      onText="Open"
                      offText="Close"
                      labelText="Safety Shutter"
                      pkey="safety_shutter"
                      data={this.props.data.safety_shutter}
                      onSave={this.onSaveHandler}
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <InOutSwitch
                      onText="In"
                      offText="Out"
                      labelText="Beamstop"
                      pkey="beamstop"
                      data={this.props.data.beamstop}
                      onSave={this.onSaveHandler}
                    />
                  </td>
                  <td>
                    <InOutSwitch
                      onText="In"
                      offText="Out"
                      labelText="Capillary"
                      pkey="capillary"
                      data={this.props.data.capillary}
                      onSave={this.onSaveHandler}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
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
