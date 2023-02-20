import React from 'react';
import { Button, Row, Col } from 'react-bootstrap';
import MotorInputContainer from '../../containers/MotorInputContainer';

import TwoAxisTranslationControl from '../MotorInput/TwoAxisTranslationControl';
import PhaseInput from './PhaseInput';
import { find } from 'lodash';


import '../MotorInput/motor.css';

export default class MotorControl extends React.Component {
  constructor(props) {
    super(props);
    this.state = { showAll: false };
  }

  getMotorComponents(from, to) {
    const to_arg = to !== null ? to : this.props.uiproperties.components.length;

    return Object.values(this.props.uiproperties.components).
      slice(from, to_arg).map((motor_uiprop) => {
        return (
          <Col key={`mc-${motor_uiprop.attribute}`} sm={12}>
            <MotorInputContainer
              component={"sample_view"}
              role={motor_uiprop.role}
            />
          </Col>
        );
      });
  }

  horVerTranslationAvailable() {
    const sample_vertical_uiprop = find(
      this.props.uiproperties.components, { role: 'sample_vertical' }
    );

    const sample_horizontal_uiprop = find(
      this.props.uiproperties.components, { role: 'sample_vertical' }
    );

    const sample_vertical = this.props.hardwareObjects[sample_vertical_uiprop.attribute];
    const sample_horizontal = this.props.hardwareObjects[sample_horizontal_uiprop.attribute];

    return sample_vertical !== undefined && sample_horizontal !== undefined;
  }

  renderAllMotors() {
    const diffractometerHo = this.props.hardwareObjects['diffractometer'];

    const phaseControl = (
      <div>
        <p className="motor-name">Phase Control:</p>
        <PhaseInput
          phase={this.props.sampleViewState.currentPhase}
          phaseList={this.props.sampleViewState.phaseList}
          sendPhase={this.props.sampleViewActions.sendCurrentPhase}
          state={diffractometerHo.state}
        />
      </div>
    );

    return (
      <div>
        {this.getMotorComponents(3, 8)}
        <div className="col-sm-12">
          {process.env.REACT_APP_PHASECONTROL ? phaseControl : null}
        </div>
      </div>
    );
  }

  renderTranslationCross() {
    const { save } = this.props;
    const { saveStep } = this.props;
    const _stop = this.props.stop;

    const sample_vertical_uiprop = find(
      this.props.uiproperties.components, { role: 'sample_vertical' }
    );

    const sample_horizontal_uiprop = find(
      this.props.uiproperties.components, { role: 'sample_horizontal' }
    );

    const sample_vertical = this.props.hardwareObjects[sample_vertical_uiprop.attribute];
    const sample_horizontal = this.props.hardwareObjects[sample_horizontal_uiprop.attribute];

    const motors = {
      sample_vertical: Object.assign(sample_vertical_uiprop, sample_vertical),
      sample_horizontal: Object.assign(sample_horizontal_uiprop, sample_horizontal)
    };

    return (
      <div>
        <div>
          <TwoAxisTranslationControl
            save={save}
            saveStep={saveStep}
            motors={motors}
            motorsDisabled={this.props.motorsDisabled}
            steps={this.props.steps}
            stop={_stop}
          />
        </div>
        {this.state.showAll
          ? (
            <div>
              <Button
                variant="outline-secondary"
                style={{ marginTop: '1em', }}
                size="sm"
                onClick={() => { this.setState({ showAll: false }); }}
              >
                <i className="fas fa-cogs" />
                {' '}
                Hide motors

                <i style={{ marginLeft: '0.5em', }} className="fas fa-caret-up" />
              </Button>
              {this.renderAllMotors()}
            </div>
          )
          : (
            <Button
              variant="outline-secondary"
              size='sm'
              style={{ marginTop: '1em' }}
              onClick={() => { this.setState({ showAll: true }); }}
            >
              <i className="fas fa-cogs" />
              {' '}
              Show motors
              <i style={{ marginLeft: '0.5em', }} className="fas fa-caret-down" />
            </Button>
          )
        }
      </div>
    );
  }

  render() {
    return (
      <Row className="row">
        {this.getMotorComponents(0, 3)}
        {this.horVerTranslationAvailable()
          ? this.renderTranslationCross() : this.renderAllMotors()
        }
      </Row>
    );
  }
}
