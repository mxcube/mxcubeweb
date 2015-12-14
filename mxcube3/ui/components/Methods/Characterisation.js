'use strict';

import React, { Component, PropTypes } from 'react'
import Modal from 'react-modal';


export default class Characterisation extends Component {

    constructor(props) {
        super(props);
        this.state = {show: false};
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            show: nextProps.show
         });
    }

    handleSave(){
        this.props.addMethod({name : "characterisation"});
        this.props.closeModal();
    }


    render() { 

        const style = {
          overlay : {
            position          : 'fixed',
            top               : 0,
            left              : 0,
            right             : 0,
            bottom            : 0,
            backgroundColor   : 'rgba(255, 255, 255, 0.75)'
        },
        content : {
            position                   : 'absolute',
            top                        : '40px',
            left                       : '40px',
            right                      : '40px',
            bottom                     : '40px',
            border                     : 'none',
            background                 : '#fff',
            overflow                   : 'auto',
            WebkitOverflowScrolling    : 'touch',
            borderRadius               : '4px',
            outline                    : 'none',
            padding                    : '20px'

        }
        };


        return (
        <Modal
          className="Modal__Bootstrap modal-dialog"
          closeTimeoutMS={150}
          isOpen={this.state.show}
          onRequestClose={this.handleModalCloseRequest}
          style={style}>
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" onClick={() => this.props.closeModal()}>
                <span aria-hidden="true">&times;</span>
                <span className="sr-only">Close</span>
              </button>
              <h4 className="modal-title">Characterisation</h4>
            </div>
            <div className="modal-body">

        <form className="form-horizontal">

            <div className="form-group">

                <label className="col-sm-2 control-label">Value</label>
                <div className="col-sm-10">
                    <input type="email" className="form-control" id="inputEmail3" placeholder="Set the parameter here"/>
                </div>

            </div>

            <div className="form-group">

                <label className="col-sm-2 control-label">Value</label>
                <div className="col-sm-10">
                    <input type="email" className="form-control" id="inputEmail3" placeholder="Set the parameter here"/>
                </div>

            </div>

            <div className="form-group">

                <label className="col-sm-2 control-label">Value</label>
                <div className="col-sm-10">
                    <input type="email" className="form-control" id="inputEmail3" placeholder="Set the parameter here"/>
                </div>

            </div>

            <div className="form-group">

                <label className="col-sm-2 control-label">Value</label>
                <div className="col-sm-10">
                    <input type="email" className="form-control" id="inputEmail3" placeholder="Set the parameter here"/>
                </div>

            </div>

        </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-default" onClick={() => this.props.closeModal()}>Close</button>
              <button type="button" className="btn btn-primary" onClick={() => this.handleSave()}>Add Characterisation</button>
            </div>
          </div>
        </Modal>
        );
    }
}