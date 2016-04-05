'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import "bootstrap-webpack!bootstrap-webpack/bootstrap.config.js";
import PropertyInput from "../components/SampleView/PropertyInput";
import "./beamline_setup_container.css";
import {getBeamlineProperties, setBeamlineProperty} from '../actions/beamline_setup';

class BeamlineSetupContainer extends React.Component{
    constructor(props) {
       super(props);
       this.valueChange = this.valueChange.bind(this);
    }


    componentDidMount() {
        this.props.getBeamlineProperties();
    }


    valueChange(name, value){
        console.log("valueChange: " + name + " " + value);
        this.props.setBeamlineProperty(name, value);
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
                                         valueChangedCb={this.valueChange}
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
                                         valueChangedCb={this.valueChange}
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
                                         valueChangedCb={this.valueChange}
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
        getBeamlineProperties: bindActionCreators(getBeamlineProperties, dispatch),
        setBeamlineProperty: bindActionCreators(setBeamlineProperty, dispatch)
    }
}


export default connect(
    mapStateToProps,
    mapDispatchToProps
)(BeamlineSetupContainer);