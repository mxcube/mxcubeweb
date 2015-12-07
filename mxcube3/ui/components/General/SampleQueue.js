'use strict';
require("font-awesome-webpack");
import React, { Component, PropTypes } from 'react'


export default class SampleQueue extends Component {

    render() { 
        return (
            <p>{this.props.sampledata.id} - {this.props.sampledata.proteinAcronym}</p>
        );
    }
}