'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import "bootstrap-webpack!bootstrap-webpack/bootstrap.config.js";
import "x-editable/dist/bootstrap3-editable/js/bootstrap-editable.min.js";
import "x-editable/dist/bootstrap3-editable/css/bootstrap-editable.css";

var $ = require('jquery');

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
        this.disable_display = false;
    }


    componentDidMount() {
        var editable = ReactDOM.findDOMNode(this.refs.label);

        $(editable).editable({
            title: this.props.propertyName,
            mode: this.props.mode,
            onblur: 'ignore',
            url: (params) => {
                var d = new $.Deferred();
                this.setValue(params.value, d);
                return d.promise();
            },
            value: this.props.propertyValue,
            pk: this.props.ref,
            tpl: "<input type=" + this.props.dataType + " style='width:" +
                 this.props.inputSize + "'>"
//            display: (value) => {
                //this.setValue(value);
//            }
        });
    }


    componentWillReceiveProps(nextProps){
        this.setDisplayValue(nextProps.propertyValue);
    }


    setDisplayValue(value){
        // The setValue method calls the display callback of the editable
        // so disable the callback so that we dont set the value twice.
        var editable = ReactDOM.findDOMNode(this.refs.label);
        $(editable).editable("option", "display", false);
        $(editable).editable("setValue", value);
        $(editable).editable("option","display",
                             (value) => {this.setValue(value)})
    }


    setValue(value, promise){
        if ( this.props.valueChangedCb != undefined ) {
            // Only update if value actually changed
            if (value != this.props.propertyValue) {
                this.props.valueChangedCb(this.props.propertyKey, value, promise);
            }
        }
    }


    /**
     * Uses dangerouslySetInnerHTML to be able to display "special" characters
     * for units.
     */
    render(){
        var valueStr = this.props.propertyValue + " " + this.props.propertyUnit;

        return(
            <div className={this.props.className + " property-input-container"}>
              <span className={"property-input-label " + this.props.ref}>
                {this.props.propertyName}:
              </span>
              <span className={"property-input-value " + this.props.ref}>
                <a className={"property-input-value-inner " + this.props.ref}
                   href="#" ref="label"
                   data-type={this.props.dataType} data-clear="false"
                   data-inputclass="beamline-setup-input"
                   dangerouslySetInnerHTML={{__html:valueStr}}/>
              </span>
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
    valueChangedCb: undefined
}
