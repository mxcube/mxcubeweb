import ReactDOM from 'react-dom';
import React from 'react';
import { Modal, ProgressBar } from "react-bootstrap";

export default class PleaseWaitModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = { show: false };
        window.please_wait_dialog = this;
    }

    show() {
        this.setState({show: true});
    }

    hide() {
        this.setState({show: false});
    }

    render() {
        return (<Modal animation={false} show={this.state.show} onHide={this.hide}>
          <Modal.Header closeButton>
            <Modal.Title>Please wait</Modal.Title>
          </Modal.Header>   
          <Modal.Body>
            <ProgressBar active now={100}/>
          </Modal.Body>
        </Modal>); 
    }    
}
