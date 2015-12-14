'use strict';
require("font-awesome-webpack");

import React, { Component, PropTypes } from 'react'
import Modal from 'react-modal';
import "./app.less"

import Characterisation from '../Methods/Characterisation'




export default class SampleQueueButtons extends Component {

    constructor(props) {
        super(props);
        this.state = {
            showCenter: false,
            showCharac: false,
            showDataColl: false
        };
    }

    closeModal(){
         this.setState({
            showCenter: false,
            showCharac: false,
            showDataColl: false
        });
    }


    render() { 
        return (
             <div className='footer-buttons'>
                 <a className='btn btn-primary queue-button' onClick={() => this.setState({showCenter: true})}>
                            <i className='fa fa-fw fa-plus-square'></i>
                                Centring
                        </a>
                        <a className='btn btn-primary queue-button' onClick={() => this.setState({showCharac: true})}>
                            <i className='fa fa-fw fa-plus-square'></i>
                                Characterisation
                        </a>
                        <a className='btn btn-primary queue-button' onClick={() => this.setState({showDataColl: true}) }>
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

                    <Characterisation show={this.state.showCharac} addMethod={this.props.addMethod} closeModal={() => this.closeModal()}/>
            </div>
        );
    }
}