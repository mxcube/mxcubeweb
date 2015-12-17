'use strict';
require("font-awesome-webpack");

import React, { Component, PropTypes } from 'react'
import Modal from 'react-modal';
import "./app.less"

export default class SampleQueueButtons extends Component {

    render() { 

        return (
             <div className='footer-buttons'>
                 <a className='btn btn-primary queue-button'>
                            <i className='fa fa-fw fa-plus-square'></i>
                                Centring
                        </a>
                        <a className='btn btn-primary queue-button' onClick={() => this.props.showForm("characterisation")}>
                            <i className='fa fa-fw fa-plus-square'></i>
                                Characterisation
                        </a>
                        <a className='btn btn-primary queue-button'>
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