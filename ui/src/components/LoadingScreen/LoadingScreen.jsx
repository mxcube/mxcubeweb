import React from 'react';
import logo from '../../img/mxcube_logo20.png';
import loadingAnimation from '../../img/loading-animation.gif';

export default class LoadingScreen extends React.Component {
  render() {
    return (
      <div id="loading">
      <img className="logo" src={logo} alt="logo" />
      <div>
        <h3>Loading, please wait</h3>{' '}
        <img
          className="loader-init"
          src={loadingAnimation}
          alt="loading"
        />
      </div>
    </div>
    );
  }
}
