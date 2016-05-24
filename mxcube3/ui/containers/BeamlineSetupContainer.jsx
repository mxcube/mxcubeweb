import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import 'bootstrap-webpack!bootstrap-webpack/bootstrap.config.js';
import Switch from 'react-bootstrap-switch';
import 'react-bootstrap-switch/src/less/bootstrap3/build.less';

import PopInput from '../components/PopInput/PopInput';
import InOutSwitch from '../components/InOutSwitch/InOutSwitch';

import { getAllAttributes, setAttribute,
         abortCurrentAction } from '../actions/beamline';

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


  onSaveHandler(name, value, promise) {
    this.props.setAttribute(name, value, promise);
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
                    />
                  </td>
                  <td>
                  </td>
                </tr>
                <tr>
                  <td>
                    <InOutSwitch
                      onText="Opened"
                      offText="Closed"
                      data={this.props.data.fastShutter}
                      labelText="Fast Shutter"
                    />
                  </td>
                  <td>
                    <InOutSwitch
                      onText="Opened"
                      offText="Closed"
                      labelText="Safety Shutter"
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <InOutSwitch
                      onText="Opened"
                      offText="Closed"
                      labelText="Beamstop"
                    />
                  </td>
                  <td>
                    <InOutSwitch
                      onText="Opened"
                      offText="Closed"
                      labelText="Capillary"
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
    getAllAttributes: bindActionCreators(getAllAttributes, dispatch),
    setAttribute: bindActionCreators(setAttribute, dispatch),
    abortCurrentAction: bindActionCreators(abortCurrentAction, dispatch)
  };
}


export default connect(
    mapStateToProps,
    mapDispatchToProps
)(BeamlineSetupContainer);
