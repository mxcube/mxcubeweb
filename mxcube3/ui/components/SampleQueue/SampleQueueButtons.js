'use strict';
require("font-awesome-webpack");

import React, { Component, PropTypes } from 'react'
import Modal from 'react-modal';
import "./app.less"

export default class SampleQueueButtons extends Component {

    render() { 
        console.log(this.props);
        let selected = this.props.selected;
        return (
             <div className='footer-buttons'>
                 <a className='btn btn-primary queue-button' onClick={() => this.props.addMethod(selected.queue_id, selected.sample_id,{name: "centring"})}>
                            <i className='fa fa-fw fa-plus-square'></i>
                                Centring
                        </a>
                        <a className='btn btn-primary queue-button' onClick={() => this.props.showForm("characterisation")}>
                            <i className='fa fa-fw fa-plus-square'></i>
                                Characterisation
                        </a>
                        <a className='btn btn-primary queue-button' onClick={() => this.props.addMethod(selected.queue_id, selected.sample_id,{name: "datacollection"})}>
                            <i className='fa fa-fw fa-plus-square'></i>
                                Datacollection
                        </a>
                        <a className='btn btn-success queue-run-stop'>
                            <i className='fa fa-fw fa-play'></i>
                                Run
                        </a>
                        <a className='btn btn-danger queue-run-stop'>
                            <i className='fa fa-fw fa-stop'></i>
                                Stop
                        </a>
            </div>
        );
    }
}