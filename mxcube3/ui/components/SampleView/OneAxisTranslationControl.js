import React from 'react';
import cx from 'classnames';
import { Button } from 'react-bootstrap';
import './motor.css';

export default class OneAxisTranslationControl extends React.Component {

  constructor(props) {
    super(props);
    this.state = { edited: false };
    this.handleKey = this.handleKey.bind(this);
    this.stepChange = this.stepChange.bind(this);
  }

  /* eslint-enable react/no-set-state */
  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.value) {
      this.refs.motorValue.value = nextProps.value.toFixed(this.props.decimalPoints);
      this.refs.motorValue.defaultValue = nextProps.value.toFixed(this.props.decimalPoints);
      this.setState({ edited: false });
    }
  }

  handleKey(e) {
    e.preventDefault();
    e.stopPropagation();

    this.setState({ edited: true });

    if ([13, 38, 40].includes(e.keyCode) && this.props.state === 2) {
      this.setState({ edited: false });
      this.props.save(e.target.name, e.target.valueAsNumber);
      this.refs.motorValue.value = this.props.value.toFixed(this.props.decimalPoints);
    } else if (this.props.state === 4) {
      this.setState({ edited: false });
      this.refs.motorValue.value = this.props.value.toFixed(this.props.decimalPoints);
    }
  }
  /* eslint-enable react/no-set-state */

  stepChange(name, step, operator) {
    const value = this.props.value;
    const newValue = value + step * operator;
    this.props.save(name, newValue);
  }

  render() {
    const { value, motorName, step, decimalPoints } = this.props;
    const valueCropped = value.toFixed(decimalPoints);

    let inputCSS = cx('form-control rw-input', {
      'input-bg-edited': this.state.edited,
      'input-bg-moving': this.props.state === 4 || this.props.state === 3,
      'input-bg-ready': this.props.state === 2,
      'input-bg-fault': this.props.state <= 1,
      'input-bg-onlimit': this.props.state === 5
    });

    return (
      <div className="arrow-control">
        <Button
          style={{ marginRight: '2px' }}
          className="arrow-small arrow-left"
          disabled={this.props.state !== 2 || this.props.disabled}
          onClick={() => this.stepChange(motorName, 10 * step, -1)}
        >
          <i className="fa fa-angle-double-left" />
        </Button>
        <Button
          className="arrow-small arrow-left"
          disabled={this.props.state !== 2 || this.props.disabled}
          onClick={() => this.stepChange(motorName, step, -1)}
        >
          <i className="fa fa-angle-left" />
        </Button>
        <input
          style={{ width: `${parseFloat(decimalPoints) + 2}em`,
                   height: '2.1em',
                   display: 'inline-block',
                   marginLeft: '5px',
                   marginRight: '5px' }}
          ref="motorValue"
          className={inputCSS}
          onKeyUp={this.handleKey}
          type="number"
          max={this.props.max}
          min={this.props.min}
          step={step}
          defaultValue={valueCropped}
          name={motorName}
          disabled={this.props.state !== 2 || this.props.disabled}
        />
        <Button
          className="arrow-small arrow-right"
          disabled={this.props.state !== 2 || this.props.disabled}
          onClick={() => this.stepChange(motorName, step, 1)}
        >
          <i className="fa fa-angle-right" />
        </Button>
        <Button
          style={{ marginLeft: '2px' }}
          className="arrow-small arrow-right"
          disabled={this.props.state !== 2 || this.props.disabled}
          onClick={() => this.stepChange(motorName, 10 * step, 1)}
        >
          <i className="fa fa-angle-double-right" />
        </Button>
      </div>
    );
  }
}
