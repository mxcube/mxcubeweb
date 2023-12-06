import React from 'react';
import {
  Row,
  Col,
  Button,
  InputGroup,
  ButtonGroup,
  Card,
  Form,
} from 'react-bootstrap';

import InOutSwitchBtn from '../InOutSwitch/InOutSwitchBtn';

class HarvesterActionButton extends React.Component {
  render() {
    let disabled;

    if (this.props.enabled === true) {
      disabled = false;
    } else {
      disabled = true;
    }

    return (
      <Button
        disabled={disabled}
        onClick={() => this.props.send_command(this.props.cmd, this.props.args)}
        size="sm"
        className="me-2"
      >
        {this.props.label}
      </Button>
    );
  }
}

class HarvesterActionGroup extends React.Component {
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

class HarvesterAction extends React.Component {
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
    return (
      <span>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            this.props.send_command(this.props.cmd, this.state.input_value);
          }}
        >
          <Form.Group size="sm">
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
              <Button type="submit" size="sm">
                {this.props.btn_label}
              </Button>
            </InputGroup>
          </Form.Group>
        </Form>
      </span>
    );
  }

  render() {
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
        key={cmdinfo[1]}
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
      Object.keys(this.props.commands).length > 0 &&
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

    let calibrationState = false;
    if (this.props.contents) {
      calibrationState = this.props.contents.calibration_state;
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
        <Card className="mb-2">
          <Card.Header>Temperature Mode</Card.Header>
          <Card.Body>
            <InOutSwitchBtn
              labelText="Temperature :"
              onText="Set to Room Temperature"
              offText="Set to Cryo Temperature"
              openFn
              closeFn={false}
              state={this.props.contents.room_temperature_mode ? 'OUT' : 'IN'}
              status={
                this.props.contents.room_temperature_mode ? 'Room' : 'Cryo'
              }
              id="set_room_temperature_mode"
              onSave={(id, value) => this.props.send_command(id, value)}
            />
          </Card.Body>
        </Card>
        <div>
          <Card className="mb-2">
            <Card.Header> Procedure </Card.Header>
            <Card.Body>
              <Row>
                {calibrationState ? (
                  <Col sm={6}>
                    <Button
                      className="mt-1"
                      variant="outline-secondary"
                      onClick={() => this.props.calibratePin()}
                    >
                      Calibrate
                    </Button>
                  </Col>
                ) : (
                  <>
                    <Col sm={12}>
                      <h5>
                        Please align the tip of the pin with the center of the
                        beam
                      </h5>
                    </Col>
                    <Col sm={6}>
                      <Button
                        className="mt-1 text-nowrap"
                        onClick={() => this.props.validateCalibration(true)}
                        variant="outline-success"
                        style={{ marginRight: '2em' }}
                      >
                        Validate Calibration
                      </Button>
                    </Col>
                    <Col sm={6}>
                      <Button
                        className="mt-1"
                        onClick={() => this.props.validateCalibration(false)}
                        variant="outline-warning"
                      >
                        Cancel Calibration
                      </Button>
                    </Col>
                  </>
                )}
              </Row>
              <hr />
              <Row className="mt-2">
                <Col sm={6}>
                  <Button
                    className="mt-1"
                    disabled
                    variant="outline-secondary"
                    onClick={() => this.props.calibratePin()}
                    title="Send latest Data collection Groupd and to Crims"
                  >
                    Send Data to Crims
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </div>
      </div>
    );
  }
}
