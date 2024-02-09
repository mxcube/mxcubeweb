import React from 'react';
import { Button, Row, Col } from 'react-bootstrap';
import MotorInputContainer from '../../containers/MotorInputContainer';

import TwoAxisTranslationControl from '../MotorInput/TwoAxisTranslationControl';
import { find } from 'lodash';

import '../MotorInput/motor.css';

export default class MotorControls extends React.Component {
  constructor(props) {
    super(props);
    this.state = { showAll: false };
  }

  renderMotorInputs(from, to) {
    return this.props.uiproperties.components
      .slice(from, to)
      .filter(
        ({ attribute }) =>
          this.props.hardwareObjects[attribute].type === 'MOTOR',
      )
      .map(({ attribute, role }) => (
        <Col key={attribute} sm={12}>
          <MotorInputContainer component="sample_view" role={role} />
        </Col>
      ));
  }

  render() {
    const sample_vertical_uiprop = find(this.props.uiproperties.components, {
      role: 'sample_vertical',
    });

    const sample_horizontal_uiprop = find(this.props.uiproperties.components, {
      role: 'sample_horizontal',
    });

    const sample_vertical =
      this.props.hardwareObjects[sample_vertical_uiprop.attribute];
    const sample_horizontal =
      this.props.hardwareObjects[sample_horizontal_uiprop.attribute];

    const numel = this.props.uiproperties.components.length;

    if (!sample_vertical || !sample_horizontal) {
      return <Row className="row">{this.renderMotorInputs(0, numel)}</Row>;
    }

    const { save } = this.props;
    const { saveStep } = this.props;
    const _stop = this.props.stop;

    const motors = {
      sample_vertical: Object.assign(sample_vertical_uiprop, sample_vertical),
      sample_horizontal: Object.assign(
        sample_horizontal_uiprop,
        sample_horizontal,
      ),
    };

    return (
      <Row className="row">
        {this.renderMotorInputs(0, 3)}
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
          <div>
            <Button
              variant="outline-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: '1rem',
                minWidth: '155px',
                whiteSpace: 'nowrap',
                textAlign: 'left',
              }}
              size="sm"
              onClick={() => {
                this.setState({ showAll: !this.state.showAll });
              }}
            >
              <i className="fas fa-cogs" style={{ marginRight: '0.5rem' }} />
              <span style={{ flex: '1 0 auto' }}>
                {this.state.showAll ? 'Hide motors' : 'Show motors'}
              </span>
              <i
                style={{ marginLeft: '0.5rem' }}
                className={`fas ${
                  this.state.showAll ? 'fa-caret-up' : 'fa-caret-down'
                }`}
              />
            </Button>

            {this.state.showAll && (
              <div style={{ marginTop: '0.5rem' }}>
                {this.renderMotorInputs(3, numel)}
              </div>
            )}
          </div>
        </div>
      </Row>
    );
  }
}
