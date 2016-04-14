'use strict';

import React from 'react';
import io from "socket.io-client";
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import "bootstrap-webpack!bootstrap-webpack/bootstrap.config.js";
import PopInput from "../components/PopInput/PopInput";
import "./beamline_setup_container.css";
import {getBeamlinePropertiesRequest, setBeamlinePropertyRequest} from '../actions/beamline_setup';
import {setPropertyValueDispatch} from '../actions/beamline_setup';
import {cancelValueChangeRequest} from '../actions/beamline_setup';


class BeamlineSetupContainer extends React.Component{
    constructor(props) {
        super(props);
        this.onSaveHandler = this.onSaveHandler.bind(this);
        this.onCancelHandler = this.onCancelHandler.bind(this);
    }
    
    
    componentDidMount() {
        this.props.getBeamlinePropertiesRequest();
        var ws = io.connect('http://' + document.domain + ':' + location.port + "/beamline/energy");
        ws.on('value_change', (value) => {
            this.refs.energy.setDisplayValue(value);
        });
    }


    onSaveHandler(name, value, promise){
        this.props.setBeamlinePropertyRequest(name, value, promise);
    }

    
    onCancelHandler(name){
        this.props.cancelValueChangeRequest(name);
    }


    render(){
        return(
            <div className="row">
              <div className="beamline-setup-container">
                <legend className="beamline-setup-header">
                  Beamline setup
                </legend>
                <div className="beamline-setup-content">
                  <table>
                    <tbody>
                      <tr>
                        <td>
                          <PopInput ref="energy" name="Energy" pkey="energy" 
                                    suffix="keV" value={this.props.data.energy.value} 
                                    onSave={this.onSaveHandler} onCancel={this.onCancelHandler} 
                                    inputSize="100px" dataType="number"/>
                        </td>
                        <td>
                          <PopInput ref="key1" name="Resolution" suffix="&Aring" 
                                    value="0" inputSize="100px" dataType="number"/>
                        </td>
                        <td>
                          <PopInput ref="key2" name="Transmission" suffix="%" 
                                    size="100px" dataType="number"/>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <PopInput ref="resolution" name="Resolution"
                                    pkey="resolution" suffix="&Aring"
                                    value={this.props.data.resolution.value}
                                    onSave={this.onSaveHandler}
                                    inputSize="100px" dataType="number">
                            <div key="loading"> A loading message !</div>
                          </PopInput>
                        </td>
                        <td>
                          <PopInput ref="key3" name="Energy" suffix="KeV"
                                    inputSize="100px" dataType="number"/>
                          </td>
                          <td>
                            <PopInput ref="key4" name="Transmission" suffix="%"
                                      inputSize="100px" dataType="number"/>
                          </td>
                      </tr>
                      <tr>
                        <td>
                          <PopInput ref="transmission" name="Transmission"
                                    pkey="transmission" suffix="%"
                                    value={this.props.data.transmission.value}
                                    onSave={this.onSaveHandler}
                                    inputSize="100px" dataType="number"/>
                        </td>
                        <td>
                          <PopInput ref="key5" name="Resolution" suffix="&Aring" 
                                    inputSize="100px" dataType="number"/>
                        </td>
                        <td>
                          <PopInput ref="key6" name="Energy" suffix="KeV"
                                    inputSize="100px" dataType="number"/>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
        )
    }
}


function mapStateToProps(state) {
    return {
        data: state.beamlineSetup
    }
}


function mapDispatchToProps(dispatch) {
    return {
        getBeamlinePropertiesRequest: bindActionCreators(getBeamlinePropertiesRequest, dispatch),
        setPropertyValue: bindActionCreators(setPropertyValueDispatch, dispatch),
        setBeamlinePropertyRequest: bindActionCreators(setBeamlinePropertyRequest, dispatch),
        cancelValueChangeRequest: bindActionCreators(cancelValueChangeRequest, dispatch)
    }
}


export default connect(
    mapStateToProps,
    mapDispatchToProps
)(BeamlineSetupContainer);