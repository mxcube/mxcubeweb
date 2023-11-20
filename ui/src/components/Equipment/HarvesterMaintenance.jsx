import React from 'react';
import { Button, InputGroup, ButtonGroup, Card, Form } from 'react-bootstrap';

import InOutSwitchBtn from '../InOutSwitch/InOutSwitchBtn';

export class HarvesterActionButton extends React.Component {
  render() {
    let disabled;

    if (this.props.enabled === true) {
      disabled = false;
    } else {
      disabled = true;
    }

    return (
      <Button
        bsStyle="default"
        disabled={disabled}
        onClick={() => this.props.send_command(this.props.cmd, this.props.args)}
      >
        {this.props.label}
      </Button>
    );
  }
}

export class HarvesterActionGroup extends React.Component {
  render() {
    return (
      <Card className="mb-2">
        <Card.Header>{this.props.name}</Card.Header>
        <Card.Body>
          <ButtonGroup>{this.props.buttons}</ButtonGroup>
        </Card.Body>
      </Card>
    );
  }
}

export class HarvesterAction extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      input_value: null,
    };
    this.inputRef = React.createRef();
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  handleInputChange(e) {
    if (this.props.inputType == 'number') {
      this.setState({ input_value: Number(e.target.value) });
    } else this.setState({ input_value: e.target.value });
  }

  actionComponent() {
    const props = {
      value: 8,
      ref: 'input',
      onSubmit: this.submit,
      onCancel: this.cancel,
      onSave: this.save,
      precision: 0.5,
      step: 'any',
    };

    let input = (
      <span>
        <Form
          inline
          onSubmit={(e) => {
            e.preventDefault();
            this.props.send_command(this.props.cmd, this.state.input_value);
          }}
        >
          <Form.Group bsSize="small">
            <Form.Label>{this.props.label}</Form.Label>
            <br />
            <InputGroup>
              <Form.Control
                bsSize="sm"
                required
                value={this.state.input_value}
                style={{
                  maxWidth: '13em',
                  minWidth: '13em',
                  marginRight: '0.2em',
                }}
                type={this.props.inputType}
                onChange={(e) => {
                  this.handleInputChange(e);
                }}
                ref={(ref) => {
                  this.inputRef = ref;
                }}
              />
              <Button
                bsStyle="default"
                // disabled={disabled}
                type="submit"
                bsSize="small"
              >
                {this.props.btn_label}
              </Button>
            </InputGroup>
          </Form.Group>
        </Form>
      </span>
    );

    input = React.cloneElement(input, props);

    return input;
  }

  render() {
    let plateBarcode = '';
    if (this.props.global_state.plate_info) {
      plateBarcode = `[ ${this.props.global_state.plate_info.plate_barcode
        .toString()
        .split(',')
        .join(',   ')}]`;
    }
    return (
      <HarvesterActionGroup
        name={`${this.props.header_msg} : ${this.props.value}`}
        buttons={this.actionComponent()}
      />
    );
  }
}

export default class HarvesterMaintenance extends React.Component {
  buildActionButton(cmdinfo) {
    return (
      <HarvesterActionButton
        label={cmdinfo[1]}
        cmd={cmdinfo[0]}
        args={cmdinfo[3]}
        enabled={this.props.commands_state[cmdinfo[0]]}
        send_command={this.props.send_command}
      />
    );
  }

  buildActionGroup(grpinfo) {
    const butgrp = [];

    for (const cmdinfo of grpinfo[1]) {
      butgrp.push(this.buildActionButton(cmdinfo));
    }

    return <HarvesterActionGroup name={grpinfo[0]} buttons={butgrp} />;
  }

  render() {
    const groups = [];
    let msg = '';

    if (
      Object.keys(this.props.commands).length !== 0 &&
      this.props.commands.cmds !==
        'Harvester maintenance controller not defined'
    ) {
      for (const cmdgrp of this.props.commands.cmds) {
        groups.push(this.buildActionGroup(cmdgrp));
      }
    } else {
      return <div />;
    }

    if (this.props.message !== '') {
      msg = this.props.message;
    }

    let plateBarcode = '';
    if (this.props.global_state.plate_barecode) {
      plateBarcode = this.props.global_state.plate_barecode.toString();
    }

    let calibration_state = false;
    if (this.props.contents) {
      calibration_state = this.props.contents.calibration_state;
    }

    return (
      <div>
        {groups}
        {msg ? (
          <Card>
            <Card.Header>Status message</Card.Header>
            <Card.Body>
              <span className="scMessage">{msg}</span>
            </Card.Body>
          </Card>
        ) : null}
        {
          <HarvesterAction
            btn_label="Set"
            label="Plate Barcode"
            cmd="loadPlateWithBarcode"
            args={this.props.currentPlateBarcode}
            send_command={this.props.send_command}
            global_state={this.props.global_state}
            header_msg="Actual Plate Barcode is"
            value={plateBarcode}
            inputType="text"
          />
        }
        <Card className="mb-2">
          <Card.Header>Temperature Mode</Card.Header>
          <Card.Body>
            <InOutSwitchBtn
              labelText="Temperature :"
              onText="Set to Room Temperature"
              offText="Set to Cryo Temperature"
              openFn={true}
              closeFn={false}
              state={this.props.contents.room_temperature ? 'OUT' : 'IN'}
              status={this.props.contents.room_temperature ? 'Room' : 'Cryo'}
              id="setTemeratureMode"
              onSave={(id, value) => this.props.send_command(id, value)}
            />
          </Card.Body>
        </Card>
        <div>
          <Card className="mb-2">
            <Card.Header> Calibration Procedure </Card.Header>
            <Card.Body>
              {!calibration_state ? (
                <Button
                  variant="outline-secondary"
                  onClick={() => this.props.calibratePin()}
                >
                  Calibrate
                </Button>
              ) : (
                <>
                  <h5>
                    Please align the tip of the pin with the center of the beam
                  </h5>
                  <Button
                    onClick={() => this.props.validateCalibration(true)}
                    variant="outline-success"
                    style={{ marginRight: '2em' }}
                  >
                    Validate Calibration
                  </Button>
                  <Button
                    onClick={() => this.props.validateCalibration(false)}
                    variant="outline-danger"
                  >
                    Cancel Calibration
                  </Button>
                </>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    );
  }
}
