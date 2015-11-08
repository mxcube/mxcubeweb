import ReactDOM from 'react-dom';
import React from 'react';
import classNames from 'classnames';
import "bootstrap-webpack!bootstrap-webpack/bootstrap.config.js";
import { Alert } from "react-bootstrap";

export default class ErrorPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    log_error(err) {
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
