'use strict';

import React from 'react';
import io from "socket.io-client";
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import "bootstrap-webpack!bootstrap-webpack/bootstrap.config.js";
import PropertyInput from "../components/SampleView/PropertyInput";
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
                          <PropertyInput ref="energy" propertyName="Energy"
                                         propertyKey="energy" propertyUnit="keV"
                                         propertyValue={this.props.data.energy.value}
                                         onSave={this.onSaveHandler}
                                         onCancel={this.onCancelHandler}
                                         inputSize="100px" dataType="number" />
                        </td>
                        <td>
                          <PropertyInput propertyName="Resolution" 
                                         propertyUnit="&Aring" propertyValue="0"
                                         ref="key1" inputSize="100px"
                                         dataType="number"/>
                        </td>
                        <td>
                          <PropertyInput propertyName="Transmission"
                                         propertyUnit="%" ref="key2"
                                         inputSize="100px" dataType="number"/>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <PropertyInput ref="resolution" propertyName="Resolution"
                                         propertyKey="resolution" propertyUnit="&Aring"
                                         propertyValue={this.props.data.resolution.value}
                                         onSave={this.onSaveHandler}
                                         inputSize="100px" dataType="number"/>
                        </td>
                        <td>
                          <PropertyInput propertyName="Energy" propertyUnit="KeV"
                                         ref="key3" inputSize="100px"
                                         dataType="number"/>
                          </td>
                          <td>
                            <PropertyInput propertyName="Transmission"
                                           propertyUnit="%" ref="key4"
                                           inputSize="100px" dataType="number"/>
                          </td>
                      </tr>
                      <tr>
                        <td>
                          <PropertyInput ref="transmission" propertyName="Transmission"
                                         propertyKey="transmission" propertyUnit="%"
                                         propertyValue={this.props.data.transmission.value}
                                         onSave={this.onSaveHandler}
                                         inputSize="100px" dataType="number"/>
                        </td>
                        <td>
                          <PropertyInput propertyName="Resolution"
                                         propertyUnit="&Aring" ref="key5"
                                         inputSize="100px" dataType="number"/>
                        </td>
                        <td>
                          <PropertyInput propertyName="Energy" propertyUnit="KeV"
                                         ref="key6" inputSize="100px"
                                         dataType="number"/>
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