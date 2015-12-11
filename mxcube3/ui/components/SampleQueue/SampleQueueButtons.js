'use strict';
require("font-awesome-webpack");

import React, { Component, PropTypes } from 'react'
import "./app.less"



export default class SampleQueueButtons extends Component {

    addCentering(){
        //Here a modal will be called for parameters
        this.props.addMethod({name : "centring"});
    }

        
    addCharacterisation(){
        //Here a modal will be called for parameters
        this.props.addMethod({name : "characterisation"});
    }

    addDatacollection(){
        //Here a modal will be called for parameters
        this.props.addMethod({name : "datacollection"});
    }

    render() { 
        return (
             <div className='footer-buttons'>
                 <a className='btn btn-primary queue-button' onClick={() => this.addCentering()}>
                            <i className='fa fa-fw fa-plus-square'></i>
                                Centring
                        </a>
                        <a className='btn btn-primary queue-button' onClick={() => this.addCharacterisation()}>
                            <i className='fa fa-fw fa-plus-square'></i>
                                Characterisation
                        </a>
                        <a className='btn btn-primary queue-button' onClick={() => this.addDatacollection()}>
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