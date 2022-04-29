import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Dropdown, DropdownButton } from 'react-bootstrap';
import { sendSetNumSnapshots } from '../actions/queue';

class NumSnapshotsDropDown extends React.Component {
  constructor(props) {
    super(props);
    this.setNumSnapshots = this.setNumSnapshots.bind(this);
  }

  setNumSnapshots(n) {
    this.props.sendSetNumSnapshots(n);
  }

  render() {
    return (
      <DropdownButton
        variant="outline-secondary"
        align={{ lg: 'end' }}
        title={(<span>
                <i className="fas fa-1x fa-camera" /> &nbsp;
                  Crystal snapshots ({this.props.queue.numSnapshots})
                </span>)}
        id="numSnapshotsDropDown"
      >
        <Dropdown.Item key="0" onClick={ () => (this.setNumSnapshots(0)) }>0</Dropdown.Item>
        <Dropdown.Item key="1" onClick={ () => (this.setNumSnapshots(1)) }>1</Dropdown.Item>
        <Dropdown.Item key="2" onClick={ () => (this.setNumSnapshots(2)) }>2</Dropdown.Item>
        <Dropdown.Item key="4" onClick={ () => (this.setNumSnapshots(4)) }>4</Dropdown.Item>
      </DropdownButton>
    );
  }
}

function mapStateToProps(state) {
  return {
    queue: state.queue
  };
}

function mapDispatchToProps(dispatch) {
  return {
    sendSetNumSnapshots: bindActionCreators(sendSetNumSnapshots, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(NumSnapshotsDropDown);

