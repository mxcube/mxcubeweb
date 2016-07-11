import React from 'react';


export default class UserLog extends React.Component {

  render() {
    return (
      <div className="logger-window">
        {this.props.messages.reverse().map((data) => (<p>{data.message}</p>))}
      </div>
      );
  }
}
