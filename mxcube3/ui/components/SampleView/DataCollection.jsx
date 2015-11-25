'use strict';
require("font-awesome-webpack");
import React, { Component, PropTypes } from 'react'


export default class DataCollection extends Component {


    addCentring() {
       
    }


    addCharacterisation() {
        
    }


    addStandardCollection() {
       
    }


    addHelicalCollection() {
    }


    addMeshCollection() {
    }


    render() {
        return (
            <div >
                    <div className='panel body'>
                        <a className='btn btn-primary'
                            onClick={this.addCentring}>
                            <i className='fa fa-fw fa-plus-square'></i>
                                Centring</a>
                        <a className='btn btn-primary'
                            onClick={this.addCharacterisation}>
                            <i className='fa fa-fw fa-plus-square'></i>
                                Characterization</a>
                        <a className='btn btn-primary'
                            onClick={this.addStandardCollection}>
                            <i className='fa fa-fw fa-plus-square'></i>
                                Standard Collection</a>
                        <div className='btn-group'>
                            <a className='btn btn-primary dropdown-toggle'
                                data-toggle='dropdown'>
                                <span className='fa fa-caret-down'></span>
                                Advanced </a>
                            <ul className='dropdown-menu' role='menu'>
                                <li>
                                    <a href='#'>Helical</a>
                                </li>
                                <li>
                                    <a href='#'>Mesh</a>
                                </li>
                                <li>
                                    <a href='#'>Fancy Method</a>
                                </li>
                            </ul>
                        </div>
                    </div>
            </div>
        );
    }
}


