'use strict';
require("font-awesome-webpack");
import React, { Component, PropTypes } from 'react'


export default class SampleQueue extends Component {



    render() {
        
        return (
            <li>{this.props.data.text.info}</li>
        );
    }
}