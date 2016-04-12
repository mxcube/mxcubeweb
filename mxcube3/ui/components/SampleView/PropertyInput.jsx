'use strict';

import React from 'react';
import {Promise} from "bluebird";

import "bootstrap-webpack!bootstrap-webpack/bootstrap.config.js";
import {Button, OverlayTrigger, Popover, Input} from "react-bootstrap";
import {ButtonToolbar} from "react-bootstrap";


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
        this.showLoading = this.showLoading.bind(this);
        this.hideLoading = this.hideLoading.bind(this);
        this.handleError = this.handleError.bind(this);
        this.handleSucess = this.handleSucess.bind(this);
        this.state = {loading: false, value: "", msg: ""};
        this._updateValueState(this.props.propertyValue);
    }


    componentDidMount() {
        this._updateValueState(this.props.propertyValue);
    }


    componentWillReceiveProps(nextProps){
        this._updateValueState(nextProps.propertyValue);
    }


    _updateValueState(value){
        var valueStr = value + " " + this.props.propertyUnit;
        this.setState({"value": valueStr});
    }


    setValue(value){
        if ( this.props.onSave != undefined ) {
            // Only update if value actually changed
            if (value != this.props.propertyValue) {
                var dp = Deferred(this.handleSucess, this.handleError);
                this.showLoading();
                this.props.onSave(this.props.propertyKey, value, dp);
            }
            else{   
                this.refs.overlay.hide();
            }
        }
    }


    setDisplayValue(value){
        this._updateValueState(value);
    }


    showLoading() {
        this.setState({loading: true});
    }


    hideLoading(){
        this.setState({loading: false});
    }
   

    handleSucess(data){
        this.setState({"msg": ""});
        this.hideLoading();

        // No message to display to user, hide overlay
        if( data.msg === "" ){
            this.refs.overlay.hide();
        }
    }


    handleError(data){
        this.setState({"msg": data.msg});
        this.hideLoading();

        // No message to display to user, hide overlay
        if( data.msg === "" ){
            this.refs.overlay.hide();
        }
    }


    save() {
        this.setValue(this.refs.input.getValue());
    }


    cancel() {
        if ( this.props.onCancel != undefined ) {
            this.props.onCancel(this.props.propertyKey);
        }

        if ( this.state.loading ){
            this.hideLoading();
        } else {
            this.refs.overlay.hide();
        }
    }


    submit(event) {
        event.preventDefault();
        this.save();
    }


    render() {
        var linkClass = 'editable-click';
        var loading = this.state.loading ? "" : "hidden";
        var input = !this.state.loading ? "" : "hidden";

        var popover =(
        <Popover title={this.props.propertyName}>
          <form ref='input-form' className={input + ' form-inline'} onSubmit={this.submit}>
            <Input ref='input' type={this.props.dataType} style={{width: '100px'}} placeholder='Empty' className='input-sm' defaultValue={this.props.propertyValue} />
            <ButtonToolbar className='editable-buttons'>
              <Button bsStyle='primary' className='btn-sm' onClick={this.save}><i className='glyphicon glyphicon-ok'/></Button>
              <Button bsStyle='default' className='btn-sm' onClick={this.cancel}><i className='glyphicon glyphicon-remove'/></Button>
            </ButtonToolbar>
          </form>
          <div ref="statusMessage" className={input} >{this.state.msg}</div>
          <div ref='loadingDiv' className={loading +  ' ' + 'property-input-loading'} >
            <div className='property-input-busy'>
            </div>
            <ButtonToolbar className='editable-buttons'>
              <Button bsStyle='default' className='btn-sm' onClick={this.cancel}>
                <i className='glyphicon glyphicon-remove'/>
              </Button>
            </ButtonToolbar>
          </div>
        </Popover>);

        return (
            <div className={this.props.className + " property-input-container"}>
              <span className={"property-input-label " + this.props.ref}>
                {this.props.propertyName}:
              </span>
              <OverlayTrigger ref='overlay' trigger='click' rootClose={true} placement='right' overlay={popover}>
                <span className={"property-input-value " + this.props.ref}>
                  <a ref='valueLabel' href='javascript:;' className={linkClass} 
                     dangerouslySetInnerHTML={{__html:this.state.value}} />
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
    onSave: undefined,
    onCancel: undefined
}


function Deferred(_resolve, _reject) {
    var promise = new Promise(function(_resolve, _reject) {
    });

    return {
        resolve: _resolve,
        reject: _reject,
        promise: promise
    };
}
