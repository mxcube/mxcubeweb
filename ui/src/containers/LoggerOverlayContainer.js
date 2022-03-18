import React from 'react';
import { connect } from 'react-redux';
import UserLog from '../components/SampleView/UserLog';

export class LoggerOverlayContainer extends React.Component {
  toggleWindow() {
    const { body } = document;
    const wrapper = document.querySelector('#o-wrapper');
    const log = document.querySelector('#log-window--slide-bottom');
    const button = document.querySelector('#toggle-button');

    const open = log.classList.contains('is-active');

    if (open) {
      body.classList.remove('has-active-log');
      wrapper.classList.remove('has-slide-bottom');
      log.classList.remove('is-active');
      button.innerHTML = 'Open Log';
    } else {
      body.classList.add('has-active-log');
      wrapper.classList.add('has-slide-bottom');
      log.classList.add('is-active');
      button.innerHTML = 'Close Log';
    }
  }

  render() {
    return (
      <nav
        id="log-window--slide-bottom"
        className="log-window log-window--slide-bottom"
      >
        <button
          id="toggle-button"
          className="log-window__close"
          onClick={this.toggleWindow}
        >
          Open Log
        </button>
        <UserLog messages={this.props.logMessages} />
      </nav>
    );
  }
}

function mapStateToProps(state) {
  return {
    logMessages: state.logger.logRecords,
  };
}

export default connect(mapStateToProps)(LoggerOverlayContainer);
