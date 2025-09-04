import React from 'react';
import {connect}  from "react-redux";
import { sendREXPosition, fetchREXPosition } from "../../actions/sampleview";
import '../MotorInput/motor.css';
import '../input.css';
import cx from 'classnames';

class REXInput extends React.Component {
  constructor(props) {
    super(props);
    this.sendREXPosition = this.sendREXPosition.bind(this);
  }

  componentDidMount() {
    // 组件加载时获取最新状态
    this.props.fetchREXPosition();
  }

  sendREXPosition(event) {
    const position = event.target.value;
    this.props.sendREXPosition(position);
    }

  render() {
    console.log('Current device state:', this.props.state);
     const inputCSS = cx('form-control input-sm', {
      'input-bg-moving': (this.props.state !== 'READY'),
      'input-bg-ready': (this.props.state === 'READY'),
    });

    const rexPositions = ['CRYO_IN', 'CRYO_BACK', 'PARK', 'HUMIDIFIER'];

    return (
      <div className="motor-input-container">
        <select
          className={inputCSS}
          onChange={this.sendREXPosition}
          value={this.props.position || ''}
          // disabled={this.props.state !== 'READY'}
          disabled={false}
        >
          {rexPositions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  position: state.sampleview.rexPosition, //从Redux获取position
  state: state.sampleview.state,   // 设备状态
});

const  mapDispatchToProps = {
  sendREXPosition,
  fetchREXPosition,
};

export default connect(mapStateToProps, mapDispatchToProps)(REXInput);
