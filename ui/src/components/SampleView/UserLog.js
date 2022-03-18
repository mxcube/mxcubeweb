import React from 'react';
import './userlog.css';

export default class UserLog extends React.Component {
  render() {
    return (
      <div className="logger-window">
        {this.props.messages.reverse().map((data, i) => (
          <p key={i}>{data.message}</p>
        ))}
      </div>
    );
  }
}
