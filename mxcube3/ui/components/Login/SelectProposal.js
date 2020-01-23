import React from 'react';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { Modal, ButtonToolbar, Button } from 'react-bootstrap';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';

class SelectProposal extends React.Component {
  constructor(props) {
    super(props);
    this.onClickRow = this.onClickRow.bind(this);
    this.sendProposal = this.sendProposal.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
  }

  onClickRow(event) {
    if (this.props.selectedProposal === null ||
      this.props.selectedProposal === 'undefined') {
      // select a proposal
      this.props.selectProposal(event.Number);
    } else if (this.props.selectedProposal === event.Number) {
      // unselect
      this.props.unselectProposal();
    } else {
      // override provious selection
      this.props.selectProposal(event.Number);
    }
  }

  sendProposal() {
    this.props.sendSelectProposal(this.props.selectedProposal);
    this.props.hide();
  }

  handleCancel() {
    this.props.singOut();
    this.props.hide();
  }

  render() {
    const selectRowProp = {
      mode: 'radio',
      clickToSelect: true,
      bgColor: '#d3d3d3',
      onSelect: this.onClickRow,
      clickToSelectAndEditCell: false,
      hideSelectColumn: true,
    };
    const proposals = this.props.data.proposalList.map((prop) => ({
      Number: prop.Proposal.code + prop.Proposal.number,
      Person: prop.Person.familyName,
      Session: prop.Session[0].startDate.split(' ')[0]
    }));
    const selectedProposal = this.props.selectedProposal;
    return (
      <Modal show={this.props.show} backdrop="static" onHide={this.handleCancel}>
        <Modal.Header closeButton>
          <Modal.Title>Select a proposal</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <div>
        <BootstrapTable data={ proposals } bordered selectRow={ selectRowProp }>
          <TableHeaderColumn dataField="Number" isKey editable={ false }>Proposal Number
          </TableHeaderColumn>
          <TableHeaderColumn dataField="Person" editable={ false }>Person</TableHeaderColumn>
          <TableHeaderColumn dataField="Session" editable={ false }>Session</TableHeaderColumn>
        </BootstrapTable>
        </div>
        </Modal.Body>
        <Modal.Footer>
          <ButtonToolbar>
            <Button bsStyle="default"
              onClick={this.handleCancel}
            >
              Sign Out
            </Button>
            <Button bsStyle="primary" className="pull-right"
              disabled={selectedProposal === 'undefined' || selectedProposal === null ||
                selectedProposal === ''}
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

SelectProposal = connect(state =>
  ({ initialValues: { ...state.login.data } })
)(SelectProposal);

export default SelectProposal;
