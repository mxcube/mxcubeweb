'use strict';
import React, { Component, PropTypes } from 'react'
import "bootstrap-webpack"
import Tree from 'react-ui-tree'
import cx from 'classnames'
import "./app.less"

export default class CurrentTree extends Component {

  // The render method call from Tree, this checks what node is to be renderd and calls new function
  renderNode(node) {
    switch (node.type) {
      case 'Root':
        return this.renderRoot(node);
      case 'Sample':
        return this.renderSample(node);
      case 'Method':
        return this.renderMethod(node);
      default:
        console.log('Type not found');
    }
    return this.renderRoot(node);
  }

  renderRoot(node){
    return (
      <span className="node node-root">
        <span className="node-name">{node.module}</span>
      </span>
    );

  }

   renderSample(node){
    return (
      <span className="node node-root">
        <span className="node-name">{node.module}</span>
      </span>
     
    );
    
  }

   renderMethod(node){
    return (
      <span className="node node-root">
        <span className="node-name">{node.module}</span>
      </span>
    );
    
  }

  // Checking what queue node is pressed and selecting it
  // Handle when a user is changing the order in the tree
  handleChange(tree) {

  }

  render() {
    return (
          <p>Current Tree</p>
    );
  }

}