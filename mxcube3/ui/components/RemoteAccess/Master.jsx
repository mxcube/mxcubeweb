import React from 'react';
import { connect } from 'react-redux';


class Master extends React.Component {
  getObservers() {
    const observers = [];

    for (const observer of this.props.remoteAccess.observers) {
      observers.push((
        <div key={observer.host}>
          <div className="col-xs-6">{observer.name}</div>
          <div className="col-xs-6">{observer.host}</div>
        </div>
      ));
    }

    return observers;
  }

  render() {
    return (
      <div className="col-xs-3">
        <div className="col-xs-6"><b>Name</b></div>
        <div className="col-xs-6"><b>Host</b></div>
        {this.getObservers()}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    remoteAccess: state.remoteAccess
  };
}

export default connect(
  mapStateToProps
)(Master);
