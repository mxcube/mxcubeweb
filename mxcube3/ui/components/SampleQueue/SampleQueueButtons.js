'use strict';
require("font-awesome-webpack");

import React from 'react'
import "./app.less"

export default class SampleQueueButtons extends React.Component {

    render() { 
        return (
                    <div>
                        <button type="button" className="btn queue-controlls" onClick={() => this.props.pauseQueue()}>
                            <i className="fa fa-pause"></i>
                        </button>
                        <button type="button" className="btn queue-controlls" onClick={() => this.props.runQueue()}>
                            <i className="fa fa-play"></i>
                        </button>
                        <button type="button" className="btn queue-controlls" onClick={() => this.props.stopQueue()}>
                            <i className="fa fa-stop"></i>
                        </button>
                    </div>

        );
    }
}