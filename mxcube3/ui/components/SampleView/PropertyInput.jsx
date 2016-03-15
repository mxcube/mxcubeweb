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
 *   dataType:       The data type of the value (the input will addapt accordingly)
 *   getURL:         URL for data request
 *   inputSize:      Input field size, with any html unit; px, em, rem ...
 *   propertyKey:    Key used when retreiving or sending data to server
 *   propertyName:   Name displayed in label
 *   propertyUnit:   Unit of property
 *   propertyValue:  Initial value
 *   setURL:         URL used when sending data to server
 *
 * @class
 *
 */
export default class PropertyInput extends React.Component{
    constructor(props) {
        super(props);
        this.state = {value: props.propertyValue};
    }

    componentDidMount() {
        var props = this.props;
        var editable = ReactDOM.findDOMNode(this.refs.label);

        $(editable).editable({
            title: props.propertyName,
            mode: props.mode,
            pk: props.propertyKey,
//            url: props.setURL,
            tpl: "<input type=" + props.dataType + " style='width:" + props.inputSize + "'>",
            display: (value) => {
                this.setState({value: value + " " + props.propertyUnit});
            }
        });
    }

    /**
     * Uses dangerouslySetInnerHTML to be able to display "special" characters
     * for units.
     */
    render (){
        return(
            <div className="property-input">
              <span className="col-sm-6 control-label">{this.props.propertyName}:</span>
              <a className="" href="#" ref="label" data-type={this.props.dataType} data-clear="false" data-inputclass="beamline-setup-input">
                <span dangerouslySetInnerHTML={{__html:this.state.value}}/>
              </a>
            </div>
        );
    }
}

PropertyInput.propTypes = {
    dataType: React.PropTypes.string,
    getURL: React.PropTypes.string,
    inputSize: React.PropTypes.string,
    propertyKey: React.PropTypes.string,
    propertyName: React.PropTypes.string,
    propertyUnit: React.PropTypes.string,
    propertyValue: React.PropTypes.string,
    setURL: React.PropTypes.string
}

PropertyInput.defaultProps = {
    dataType: "number",
    getURL: "",
    inputSize: "100px",
    propertyKey: "",
    propertyName: "",
    propertyUnit: "",
    propertyValue: 0,
    setURL: ""
}