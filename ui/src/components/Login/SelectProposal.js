import React from 'react';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { Modal, ButtonToolbar, Button, Table } from 'react-bootstrap';

class SelectProposal extends React.Component {
  constructor(props) {
    super(props);
    this.onClickRow = this.onClickRow.bind(this);
    this.sendProposal = this.sendProposal.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.state = {
        pID: 0,
    };
  }

  onClickRow(prop) {
    this.setState({ pID:  prop.proposalId});
    this.props.selectProposal(prop.code + prop.number);
  }

  sendProposal() {
    this.props.sendSelectProposal();
    this.props.hide();
  }

  handleCancel() {
    this.props.singOut();
    this.props.hide();
  }

  render() {
    const proposals = this.props.data.proposalList.map((prop) =>
    <tr key={prop.proposalId} style={this.state.pID === prop.proposalId ? { backgroundColor: '#d3d3d3'}: null} onClick={
        ()=>
        this.onClickRow(prop)
        }>
    <td>{prop.code + prop.number}</td>
    <td>{prop.person}</td>
    </tr>
    );

    return (
      <Modal
        show={this.props.show}
        backdrop="static"
        onHide={this.handleCancel}
      >
        <Modal.Header closeButton>
          <Modal.Title>Select a proposal</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            <Table bordered hover>
            <thead style={{overflow: 'auto'}}>
              <tr>
                <th>Proposal Number</th>
                <th>Person</th>
              </tr>
            </thead>
            <tbody>
              {proposals}
            </tbody>
            </Table>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <ButtonToolbar>
            <Button
              variant="outline-secondary"
              onClick={this.handleCancel}
            >
              Sign Out
            </Button>
            <Button
              variant="primary"
              className="pull-right"
              disabled={typeof this.props.selectedProposal === 'undefined'}
              onClick={this.sendProposal}
            >
              Select Proposal
            </Button>
          </ButtonToolbar>
        </Modal.Footer>
      </Modal>
    );
  }
}

SelectProposal = reduxForm({
  form: 'proposals'
})(SelectProposal);

SelectProposal = connect(state => ({ initialValues: { ...state.login.data } }))(SelectProposal);

export default SelectProposal;
