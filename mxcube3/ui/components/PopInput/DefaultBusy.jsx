import React from 'react';

import { Button, ButtonToolbar } from 'react-bootstrap';

import './style.css';

export default class DefaultBusy extends React.Component {

  constructor(props) {
    super(props);
    this.cancel = this.cancel.bind(this);
  }

  cancel() {
    this.props.onCancel();
  }

  render() {
    return (
      <div>
        <div className="popinput-input-busy" />
        <ButtonToolbar className="popinput-busy-buttonbar">
          <Button bsStyle="danger" className="btn-sm" onClick={this.cancel}>
            <i className="glyphicon glyphicon-remove" />
          </Button>
        </ButtonToolbar>
      </div>
    );
  }
}


DefaultBusy.defaultProps = {
  onCancel: undefined,
};
