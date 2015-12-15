import ReactDOM from 'react-dom';
import React from 'react';
import classNames from 'classnames';
import "bootstrap-webpack!bootstrap-webpack/bootstrap.config.js";
import { Alert } from "react-bootstrap";

export class ErrorNotificationPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
        window.error_notification = this;
    }

    notify(err) {
        this.setState({error: err});
    }

    clear() {
        this.setState({error: null});
    }

    render() {
        if (this.state.error) {
            return (<div style={{marginBottom: '-20px'}}><Alert bsStyle="danger" onDismiss={this.clear.bind(this)}>
		        <strong>Error:&nbsp;</strong>{this.state.error}
                   </Alert></div>);
            
        }
        return (<div></div>); 
    }    
}

export class Logging extends React.Component {
    constructor(props) {
        super(props);
        this.state = { log_records: [] };
        window.logging = this;
    }

    register() {
        log_records_source = new EventSource('mxcube/api/v0.1/logging');
        log_records_source.addEventListener('message', (e) => {
            this.state.log_records.push(e.data);
            this.setState({"log_records": log_records});
        }, false);
    }

    render() {
        var log_output = [];

        for (log_record of this.state.log_records) {
            log_output.push(<pre style={{margin: "0px", display:"inline"}}>{log_record.message}</pre>)
        }
        
        return (<div style={{overflow: 'auto'}}>
                    <h1><b>Log messages</b></h1>
                    {log_output}
               </div>)
    }
}
