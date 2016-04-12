'use strict';
import './SampleView.css';
import React from 'react'

export default class PopOver extends React.Component {

render() {

  let {
    style,
    title,
    children
  } = this.props;
return (
    <div className="overlay-box" style={{ ...style}}>
      <div className="overlay-arrow"/>
        <div className="overlay-head">
            <button type="button" className="close" onClick={this.props.closePopOver}><span aria-hidden="true">×</span></button>
            {title}
        </div>
        <div className="overlay-body">
            {children}
        </div>
    </div>
  );
}      
}



