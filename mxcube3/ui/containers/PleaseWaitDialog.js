import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal, ProgressBar } from "react-bootstrap";
import { setLoading } from '../actions/general';

export default class PleaseWaitDialog extends React.Component {

    render() {
        return (<Modal animation={false} show={this.props.loading} onHide={this.props.setLoading}>
          <Modal.Header closeButton>
            <Modal.Title>Please wait</Modal.Title>
          </Modal.Header>   
          <Modal.Body>
            <ProgressBar active now={100}/>
          </Modal.Body>
        </Modal>); 
    }    
}


function mapStateToProps(state) {
        return { 
            loading : state.general.loading
        }
}

function mapDispatchToProps(dispatch) {
    return{
        setLoading : bindActionCreators(setLoading.bind(this, false), dispatch)
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(PleaseWaitDialog);
