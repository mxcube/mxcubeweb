import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { MenuItem, DropdownButton } from 'react-bootstrap';
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
      <div>
        <DropdownButton
          bsStyle="default"
          title={(<span>
                  <i className="fa fa-1x fa-camera" /> &nbsp;
                    Crystal snapshots ({this.props.queue.numSnapshots})
                 </span>)}
          key={1}
          id="numSnapshotsDropDown"
          onSelect={this.numSnapshotsOnSelect}
        >
          <MenuItem key="1" onClick={ () => (this.setNumSnapshots(1)) }>1</MenuItem>
          <MenuItem key="2" onClick={ () => (this.setNumSnapshots(2)) }>2</MenuItem>
          <MenuItem key="4" onClick={ () => (this.setNumSnapshots(4)) }>4</MenuItem>
          <MenuItem key="0" onClick={ () => (this.setNumSnapshots(0)) }>0</MenuItem>
        </DropdownButton>
      </div>
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

