import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import "bootstrap-webpack!bootstrap-webpack/bootstrap.config.js";
import { Modal, Button } from "react-bootstrap";
import { showRestoreDialog, setState, sendClearQueue } from '../actions/queue';

export class QueueRestoreDialog extends React.Component {

    constructor(props){
        super(props)
        this.accept = this.accept.bind(this);
        this.reject = this.reject.bind(this);
    } 

    accept() {
        this.props.restoreQueueState(this.props.savedQueueState);
        this.props.hide();
    }

    reject() {
        this.props.hide();
        this.props.clearQueue();
    }

    render() {
        return (<Modal show={this.props.show} 
         onHide={this.props.hide}>
            <Modal.Body>
                Do you want to restore the saved queue?
            </Modal.Body>       
            <Modal.Footer>
                <Button onClick={this.accept} bsStyle="primary"> Yes </Button>
                <Button onClick={this.reject}> No </Button>
            </Modal.Footer>            
        </Modal>);
    }    
}

function mapStateToProps(state) {
        return { 
            show :state.queue.showRestoreDialog,
            savedQueueState : state.queue.queueRestoreState
        }
}

function mapDispatchToProps(dispatch) {
    return{
        hide : bindActionCreators(showRestoreDialog.bind(this, {}, false), dispatch),
        restoreQueueState : bindActionCreators(setState.bind(this), dispatch),
        clearQueue: bindActionCreators(sendClearQueue.bind(this), dispatch)
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(QueueRestoreDialog);
