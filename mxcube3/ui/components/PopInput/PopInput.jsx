'use strict';

import React from "react";

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
        this.state = {value: "", anim_class: ""};
        this._updateValueState(this.props.data.value);
    }


    componentDidMount() {
        this._updateValueState(this.props.data.value);
    }


    componentWillReceiveProps(nextProps){
        this._updateValueState(nextProps.data.value);

        if( nextProps.data.status === "BUSY" ){
            this.handleBusy();
        } else if ( nextProps.data.status === "IDLE" ){
            this.handleIdle(nextProps.data);
        } else if ( nextProps.data.status === "ABORTED" ){
            this.handleError(nextProps.data);
        } else {
            this.handleError(nextProps.data);
        }
    }


    _updateValueState(value){
        var valueStr = value + " " + this.props.suffix;
        this.setState({"value": valueStr});
    }


    setValue(value){
        if ( this.props.onSave != undefined ) {
            // Only update if value actually changed
            if (value != this.props.data.value) {
                this.props.onSave(this.props.pkey, value);
            }
            else{
                this.refs.overlay.hide();
                this.setState({anim_class: "value-label-enter-success"});
            }
        }
    }

    setDisplayValue(value){
        this._updateValueState(value);
    }


    handleIdle(data){
        // No message to display to user, hide overlay
        if( data.msg === "" ){
            this.refs.overlay.hide();
        }

        this.setState({anim_class: "value-label-enter-success"});
    }


    handleBusy(){
        this.setState({anim_class: "value-label-enter-loading"});
    }


    handleError(data){
        this.setState({anim_class: "value-label-enter-error"});

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

        if ( this.props.data.status !== "BUSY" ){
            this.refs.overlay.hide();
        }
    }


    submit(event) {
        event.preventDefault();
        this.save();
    }


    loadingDivContent(){
        var children = this.props.children
        var content = (
            <div>
              <div className="popinput-input-busy">
              </div>
              <ButtonToolbar className="editable-buttons">
                <Button bsStyle="default" className="btn-sm" onClick={this.cancel}>
                  <i className="glyphicon glyphicon-remove"/>
                </Button>
              </ButtonToolbar>
            </div>);

        // We need to create a real array here since react is so kind to give
        // us undefined if there is no children and an object of there is only
        // one.
        if( this.props.children == undefined ){
            children = [];
        }
        else if( !Array.isArray(this.props.children) ){
            children = [this.props.children];
        }

        for( let child in children ){
            if ( children[child].key === "loading" ){
                content = children[child]
            }
        }

       return content;
    }


    render() {
        var linkClass = "editable-click";
        var loading = (this.props.data.status === "BUSY") ? "" : "hidden";
        var input = (this.props.data.status !== "BUSY") ? "" : "hidden";
        var title = (this.props.title === "") ? this.props.name : this.props.title

        var popover =(
        <Popover title={title}>
          <form ref="popinput-form" className={input + " form-inline"} onSubmit={this.submit}>
            <Input ref="input" type={this.props.dataType} style={{width: this.props.inputSize}} placeholder="" className="input-sm" defaultValue={this.props.data.value} />
            <ButtonToolbar className="editable-buttons">
              <Button bsStyle="primary" className="btn-sm" onClick={this.save}>
                <i className="glyphicon glyphicon-ok"/>
              </Button>
              <Button bsStyle="default" className="btn-sm" onClick={this.cancel}>
                <i className="glyphicon glyphicon-remove"/>
              </Button>
            </ButtonToolbar>
          </form>
          <div ref="statusMessage" className={input} >{this.props.data.msg}</div>
          <div ref="loadingDiv" className={loading + " " + "popinput-input-loading"} >
            {this.loadingDivContent()}
          </div>
        </Popover>);

        return (
            <div className={this.props.className + " popinput-input-container"}>
              <span className={"popinput-input-label " + this.props.ref}>
                {this.props.name}:
              </span>
              <span className={"popinput-input-value " + this.props.pkey}>
                <OverlayTrigger ref="overlay" trigger="click" rootClose placement={this.props.placement} overlay={popover}>
                  <a ref="valueLabel" key="valueLabel" href="javascript:;" className={linkClass + " " + this.state.anim_class} 
                     dangerouslySetInnerHTML={{__html:this.state.value}} />
                </OverlayTrigger>
                </span>
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
    onCancel: undefined,
    data: {value:0}
}