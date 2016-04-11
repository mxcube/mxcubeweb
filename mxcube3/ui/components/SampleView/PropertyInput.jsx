'use strict';

import React from 'react';
import "bootstrap-webpack!bootstrap-webpack/bootstrap.config.js";
import {Button, OverlayTrigger, Popover, Input} from "react-bootstrap"
import {ButtonToolbar} from "react-bootstrap"

/**
 * Provides a simple input ui for a physical properties, displays a label,
 * value and unit for the value.
 *
 * Valid react properties (html attributes) are:
 *
 *   dataType:       The data type of the value (the input will addapt
 *                   accordingly)
 *   inputSize:      Input field size, with any html unit; px, em, rem ...
 *   propertyKey:    Key used when retreiving or sending data to server
 *   propertyName:   Name displayed in label
 *   propertyUnit:   Unit of property
 *   propertyValue:  Value
 *
 * @class
 *
 */
export default class PropertyInput extends React.Component{
    constructor(props) {
        super(props);
        this.save = this.save.bind(this);
        this.cancel = this.cancel.bind(this);
        this.submit = this.submit.bind(this);
        this.state = {loading: false}
    }


    setValue(value){
        if ( this.props.valueChangedCb != undefined ) {
            // Only update if value actually changed
            if (value != this.props.propertyValue) {
                this.props.valueChangedCb(this.props.propertyKey, value);
            }
        }
    }


    save() {
        this.setState({loading: true});
        this.setValue(this.refs.input.getValue());
        this.refs.overlay.hide();
        this.setState({loading: false});
    }


    cancel() {
        this.refs.overlay.hide();
    }
    
    
    submit(event) {
		    event.preventDefault();
		    this.save();
    }


    render() {
        var valueStr = this.props.propertyValue + " " + this.props.propertyUnit;
        var linkClass = 'editable-click';
        var loading = this.state.loading ? "" : "hidden";
        var input = !this.state.loading ? "" : "hidden";

        var popover =(
        <Popover title={this.props.propertyName}>
          <form ref='input-form' className={input + ' form-inline'} onSubmit={this.submit}>
            <Input ref='input' type={this.props.dataType} style={{width: '100px'}} 
                   placeholder='Empty' className='input-sm' 
                   defaultValue={this.props.propertyValue} />
            <ButtonToolbar className='editable-buttons'>
              <Button bsStyle='primary' className='btn-sm' onClick={this.save}>
                <i className='glyphicon glyphicon-ok'/>
              </Button>
              <Button bsStyle='default' className='btn-sm' onClick={this.cancel}>
                <i className='glyphicon glyphicon-remove'/>
              </Button>
            </ButtonToolbar>
          </form>
          <div ref='loading-div' className={loading +  ' ' + 'property-input-loading'} >
          </div>
        </Popover>);
        
        return (
            <div className={this.props.className + " property-input-container"}>
              <span className={"property-input-label " + this.props.ref}>
                {this.props.propertyName}:
              </span>
              <OverlayTrigger ref='overlay' trigger='click' rootClose={true} placement='top' overlay={popover}>
                <span className={"property-input-value " + this.props.ref}>
                  <a ref='valueLabel' href='javascript:;' className={linkClass} 
                     dangerouslySetInnerHTML={{__html:valueStr}} />
                </span>
              </OverlayTrigger>
            </div>
            
        );
    }
}

PropertyInput.defaultProps = {
    className: "",
    dataType: "number",
    inputSize: "100px",
    propertyName: "",
    propertyUnit: "",
    propertyValue: 0,
    propertyKey: undefined,
    valueChangedCb: undefined,
}
