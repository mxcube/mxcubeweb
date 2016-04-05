'use strict';

import React from 'react';
import "bootstrap-webpack!bootstrap-webpack/bootstrap.config.js";
import PropertyInput from "./PropertyInput";
import "./beamline_setup_container.css";

export default class BeamlineSetupComponent extends React.Component{
    componentDidMount() {
    }

    render(){
        return(
            <div className="container-fluid">
            <div className="row">
              <div className="beamline-setup-container">
                <legend>Beamline setup</legend>
                <div className="beamline-setup-inner">
                  <form className="form-horizontal">

                    <div className="row">
                      <div className="form-group" className="col-sm-3">
                        <PropertyInput propertyName="Energy" propertyUnit="keV" propertyValue="0" propertyKey="energy" inputSize="100px" dataType="number" setURL="/set-var" getURL="/get-var"/>
                      </div>
                      <div className="form-group" className="col-sm-3">
                        <PropertyInput propertyName="Resolution" propertyUnit="&Aring"  propertyValue="0" propertyKey="key1" inputSize="100px" dataType="number"/>
                      </div>
                      <div className="form-group" className="col-sm-3">
                        <PropertyInput propertyName="Transmission" propertyUnit="%" propertyKey="key2" inputSize="100px" dataType="number"/>
                      </div>
                    </div>

                    <div className="row top10">
                      <div className="form-group" className="col-sm-3">
                        <PropertyInput propertyName="Resolution" propertyUnit="&Aring" propertyKey="resolution" inputSize="100px" dataType="number"/>
                      </div>
                      <div className="form-group" className="col-sm-3">
                        <PropertyInput propertyName="Energy" propertyUnit="KeV" propertyKey="key3" inputSize="100px" dataType="number"/>
                      </div>
                      <div className="form-group" className="col-sm-3">
                        <PropertyInput propertyName="Transmission" propertyUnit="%" propertyKey="key4" inputSize="100px" dataType="number"/>
                      </div>
                    </div>

                    <div className="row top10">
                      <div className="form-group" className="col-sm-3">
                        <PropertyInput propertyName="Transmission" propertyUnit="%" propertyKey="Transmission" inputSize="100px" dataType="number"/>
                      </div>
                      <div className="form-group" className="col-sm-3">
                        <PropertyInput propertyName="Resolution" propertyUnit="&Aring" propertyKey="key5" inputSize="100px" dataType="number"/>
                      </div>
                      <div className="form-group" className="col-sm-3">
                        <PropertyInput propertyName="Energy" propertyUnit="KeV" propertyKey="key6" inputSize="100px" dataType="number"/>
                      </div>
                    </div>

                </form>
                </div>
              </div>
            </div>
            </div>
        )
    }
}