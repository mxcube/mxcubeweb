import React from 'react';
import { Card, Button, ButtonGroup, InputGroup, Form } from 'react-bootstrap';
import './Equipment.css';

export class PlateManipulatorActionButton extends React.Component {
  render() {
    let disabled;
    if (this.props.enabled === true) {
      disabled = false;
    } else {
      disabled = true;
    }

    return (
      <Button
        variant="outline-secondary"
        disabled={disabled}
        onClick={() => this.props.send_command(this.props.cmd, this.props.args)}
      >
        {this.props.label}
      </Button>
    );
  }
}

export class PlateManipulatorActionGroup extends React.Component {
  render() {
    return (
      <Card className="mb-2">
        <Card.Header>{this.props.name}</Card.Header>
        <Card.Body>{this.props.actionComponent}</Card.Body>
      </Card>
    );
  }
}

export class PlateManipulatorAction extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      input_value: '',
    };
    this.inputRef = React.createRef();
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  handleInputChange(e) {
    if (this.props.inputType === 'number') {
      this.setState({ input_value: Number(e.target.value) });
    } else {
      this.setState({ input_value: e.target.value });
    }
  }

  actionComponent() {
    const props = { value: 8, vref: 'input' };

    let input = (
      <span>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <Form.Group size="small">
            <Form.Label>{this.props.label}</Form.Label>
            <br />
            <InputGroup>
              <Form.Control
                size="sm"
                required
                value={this.state.input_value}
                style={{
                  maxWidth: '13em',
                  minWidth: '13em',
                  marginRight: '0.5em',
                }}
                type={this.props.inputType}
                onChange={(e) => {
                  this.handleInputChange(e);
                }}
                ref={(ref) => {
                  this.inputRef = ref;
                }}
              />
              <PlateManipulatorActionButton
                label={this.props.btn_label}
                cmd={this.props.cmd}
                args={this.state.input_value}
                enabled
                send_command={this.props.send_command}
                key={this.props.btn_label}
              />
            </InputGroup>
          </Form.Group>
        </Form>
      </span>
    );

    input = React.cloneElement(input, props);

    return input;
  }

  render() {
    return (
      <PlateManipulatorActionGroup
        name={[
          `${this.props.header_msg} : ${this.props.value}`,
          this.props.viewComponent,
        ]}
        actionComponent={this.actionComponent()}
        key={`${this.props.header_msg}:${this.props.value}`}
      />
    );
  }
}

export default class PlateManipulatorMaintenance extends React.Component {
  buildActionButton(cmdinfo) {
    return (
      <PlateManipulatorActionButton
        label={cmdinfo[1]}
        cmd={cmdinfo[0]}
        args={cmdinfo[3]}
        enabled={this.props.commands_state[cmdinfo[0]]}
        send_command={this.props.send_command}
        key={cmdinfo[1]}
      />
    );
  }

  buildActionGroup(grpinfo) {
    const butgrp = [];

    for (const cmdinfo of grpinfo[1]) {
      butgrp.push(this.buildActionButton(cmdinfo));
    }

    return (
      <PlateManipulatorActionGroup
        name={grpinfo[0]}
        actionComponent={<ButtonGroup>{butgrp}</ButtonGroup>}
        key={grpinfo[0]}
      />
    );
  }

  render() {
    const groups = [];
    let msg = '';

    if (
      Object.keys(this.props.commands).length > 0 &&
      this.props.commands.cmds !== 'SC maintenance controller not defined'
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

    let scan_limits = '';
    if (this.props.global_state.scan_limits) {
      scan_limits = `[ ${this.props.global_state.scan_limits
        .toString()
        .split(',')
        .join(',   ')}]`;
    }

    let plateBarcode = '';
    if (this.props.global_state.plate_info) {
      plateBarcode =
        this.props.global_state.plate_info.plate_barcode.toString();
    }

    return (
      <div>
        {groups}
        {msg ? (
          <Card className="mb-2">
            <Card.Header>Status message</Card.Header>
            <Card.Body>
              <span className="scMessage">{msg}</span>
            </Card.Body>
          </Card>
        ) : null}
        <PlateManipulatorAction
          btn_label="Get Scan Limits"
          label="Desire Scan Speed"
          cmd="getOmegaMotorDynamicScanLimits"
          args={this.props.desireScanSpeed}
          send_command={this.props.send_command}
          global_state={this.props.global_state}
          header_msg="Omega Motor Dynamic ScanLimits Interval is"
          value={scan_limits}
          inputType="number"
          viewComponent=""
          key="Scan Limits"
        />
        <PlateManipulatorAction
          btn_label="Set Plate Barcode"
          label="Plate Barcode"
          cmd="setPlateBarcode"
          args={this.props.desireScanSpeed}
          send_command={this.props.send_command}
          global_state={this.props.global_state}
          header_msg="Actual Plate Barcode is"
          value={plateBarcode}
          inputType="text"
          viewComponent=""
          key="plate barcode"
        />
      </div>
    );
  }
}
