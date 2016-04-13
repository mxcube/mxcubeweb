'use strict';

import React from "react";
import {Promise} from "bluebird";

import "bootstrap-webpack!bootstrap-webpack/bootstrap.config.js";
import {Button, OverlayTrigger, Popover, Input} from "react-bootstrap";
import {ButtonToolbar} from "react-bootstrap";

import "./style.css"


/**
 * A simple "Popover Input" input conrol, the value is displayed as text and
 * the associated input is displayed in an overlay when the text is clicked.
 *
 * Valid react properties are:
 *
 *   dataType:   The data type of the value (the input will addapt
 *               accordingly)
 *   inputSize:  Input field size, with any html unit; px, em, rem ...
 *   pkey:       Key used when retreiving or sending data to server
 *   name:       Name displayed in label
 *   suffix:     Suffix to display after value
 *   value:      Value
 *   title:      Title displayed at the top of popover
 *   placement:  Placement of Popover (left, right, bottom, top)
 *   onSave:     Callback called when user hits save button
 *   onCancel:   Callback called when user hits cancel button
 *
 * @class
 *
 */
export default class PopInput extends React.Component{
    constructor(props) {
        super(props);
        this.save = this.save.bind(this);
        this.cancel = this.cancel.bind(this);
        this.submit = this.submit.bind(this);
        this.showLoading = this.showLoading.bind(this);
        this.hideLoading = this.hideLoading.bind(this);
        this.handleError = this.handleError.bind(this);
        this.handleSuccess = this.handleSuccess.bind(this);
        this.state = {loading: false, value: "", msg: "", anim_class: ""};
        this._updateValueState(this.props.value);
    }


    componentDidMount() {
        this._updateValueState(this.props.value);
    }


    componentWillReceiveProps(nextProps){
        this._updateValueState(nextProps.value);
    }


    _updateValueState(value){
        var valueStr = value + " " + this.props.suffix;
        this.setState({"value": valueStr});
    }

    _updateSucessState(){
        this.setState({msg: "", anim_class: "value-label-enter-success"});
        setTimeout(function(){
            this.setState({anim_class: "value-label-leave-success"});
        }.bind(this), 100);
    }


    setValue(value){
        if ( this.props.onSave != undefined ) {
            // Only update if value actually changed
            if (value != this.props.value) {
                var dp = Deferred(this.handleSuccess, this.handleError);
                this.showLoading();
                this.props.onSave(this.props.pkey, value, dp);
            }
            else{
                this.refs.overlay.hide();
                this._updateSucessState();
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

    handleSuccess(data){
        this.hideLoading();

        // No message to display to user, hide overlay
        if( data.msg === "" ){
            this.refs.overlay.hide();
        }

        this._updateSucessState();
    }


    handleError(data){
        this.setState({msg: data.msg, anim_class: "value-label-enter-error"});
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
            this.props.onCancel(this.props.pkey);
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
        var linkClass = "editable-click";
        var loading = this.state.loading ? "" : "hidden";
        var input = !this.state.loading ? "" : "hidden";
        var title = (this.props.title === "") ? this.props.name : this.props.title

        var popover =(
        <Popover title={title}>
          <form ref="popinput-form" className={input + " form-inline"} onSubmit={this.submit}>
            <Input ref="input" type={this.props.dataType} style={{width: this.props.inputSize}} placeholder="" className="input-sm" defaultValue={this.props.value} />
            <ButtonToolbar className="editable-buttons">
              <Button bsStyle="primary" className="btn-sm" onClick={this.save}>
                <i className="glyphicon glyphicon-ok"/>
              </Button>
              <Button bsStyle="default" className="btn-sm" onClick={this.cancel}>
                <i className="glyphicon glyphicon-remove"/>
              </Button>
            </ButtonToolbar>
          </form>
          <div ref="statusMessage" className={input} >{this.state.msg}</div>
          <div ref="loadingDiv" className={loading + " " + "popinput-input-loading"} >
            <div className="popinput-input-busy">
            </div>
            <ButtonToolbar className="editable-buttons">
              <Button bsStyle="default" className="btn-sm" onClick={this.cancel}>
                <i className="glyphicon glyphicon-remove"/>
              </Button>
            </ButtonToolbar>
          </div>
        </Popover>);
        
        return (
            <div className={this.props.className + " popinput-input-container"}>
              <span className={"popinput-input-label " + this.props.ref}>
                {this.props.name}:
              </span>
              <OverlayTrigger ref="overlay" trigger="click" rootClose placement={this.props.placement} overlay={popover}>
                <span className={"popinput-input-value " + this.props.pkey}>
                  <a ref="valueLabel" key="valueLabel" href="javascript:;" className={linkClass + " " + this.state.anim_class} 
                     dangerouslySetInnerHTML={{__html:this.state.value}} />

                </span>
              </OverlayTrigger>
            </div>
        );
    }
}


PopInput.defaultProps = {
    className: "",
    dataType: "number",
    inputSize: "100px",
    name: "",
    title: "",
    suffix: "",
    value: 0,
    placement: "right",
    pkey: undefined,
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
