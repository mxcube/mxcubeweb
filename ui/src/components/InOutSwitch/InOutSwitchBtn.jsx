import React from 'react';
import {
  Popover,
  Button,
  OverlayTrigger,
  Badge,
  Spinner,
} from 'react-bootstrap';

export default class InOutSwitchBtn extends React.Component {
  constructor(props) {
    super(props);
    this.handleSetIn = this.handleSetIn.bind(this);
    this.handleSetOut = this.handleSetOut.bind(this);
  }

  handleSetIn() {
    if (this.props.onSave !== undefined) {
      this.props.onSave(this.props.id, this.props.closeFn);
    }
  }

  handleSetOut() {
    if (this.props.onSave !== undefined) {
      this.props.onSave(this.props.id, this.props.openFn);
    }
  }

  stringFormat(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  render() {
    let msgBgStyle = 'warning';
    let btn = (
      <Button variant="warning" disabled>
        ...
      </Button>
    );
    if (this.props.state && this.props.offText) {
      if (this.props.state === 'IN' || this.props.state === 'close') {
        msgBgStyle = 'danger';
        btn = (
          <Button variant="success" onClick={this.handleSetOut}>
            {this.props.onText}
          </Button>
        );
      } else if (
        this.props.state === this.props.onText ||
        this.props.state.toLowerCase() === 'opened' ||
        this.props.state === 'OUT'
      ) {
        msgBgStyle = 'success';
        btn = (
          <Button variant="danger" onClick={this.handleSetIn}>
            {this.props.offText}
          </Button>
        );
      } else if (
        this.props.state.toLowerCase() === this.props.moveText.toLowerCase()
      ) {
        btn = (
          <Button variant="warning">
            <Spinner
              as="span"
              animation="border"
              size="sm"
              aria-hidden="true"
            />
          </Button>
        );
      }
    }

    return (
      <div className="inoutswitch">
        <OverlayTrigger
          rootClose
          trigger="click"
          placement="right"
          overlay={
            <Popover
              style={{ padding: '5px', minWidth: '80px', textAlign: 'center' }}
              id={`${this.props.labelText} popover`}
            >
              {btn}
            </Popover>
          }
        >
          <Button variant="outline-secondary">
            {this.props.labelText}{' '}
            {this.props.state ? (
              <Badge className="" bg={msgBgStyle}>
                {this.stringFormat(this.props.status)}
              </Badge>
            ) : null}
          </Button>
        </OverlayTrigger>
      </div>
    );
  }
}

InOutSwitchBtn.defaultProps = {
  onText: 'Open',
  offText: 'Close',
  moveText: 'moving',
  labelText: '',
  id: undefined,
  onSave: undefined,
};
