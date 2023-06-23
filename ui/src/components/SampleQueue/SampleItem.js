import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class SampleItem extends Component {
  static propTypes = {
    id: PropTypes.number.isRequired,
    index: PropTypes.number.isRequired,
    isDragging: PropTypes.bool.isRequired,
    moveCard: PropTypes.func.isRequired,
    text: PropTypes.string.isRequired
  };

  constructor(props) {
    super(props);
    this.mountSample = () => this.props.mountSample(this.props.id);
    this.deleteSample = () => this.props.deleteSample(this.props.id, this.props.sampleId);
  }


  render() {
    return (
      <div className="node node-sample">
        <span className="node-name">{this.props.text}</span>
         <div className="float-end">
             <i className="fas fa-sign-in" onClick={this.mountSample} />
             <i className="fas fa-times" onClick={this.deleteSample} />
        </div>
      </div>
    );
  }
}
