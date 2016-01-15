'use strict';
import React, { Component, PropTypes } from 'react'
import "bootstrap-webpack"
import Tree from 'react-ui-tree'
import cx from 'classnames'
import "./app.less"

export default class HistoryTree extends Component {

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
      <span className="node node-sample" onClick={() => this.props.select(node.queue_id, node.sample_id)}>
        <span className="node-name">{node.module}</span>
      </span>
    );
    
  }

   renderMethod(node){
    return (
      <span className="node node-method" onClick={() => this.props.select(node.queue_id, node.sample_id, node.parent_id, true)}>
        <span className="node-name">{node.module}</span>
      </span>
    );
    
  }

  // Checking what queue node is pressed and selecting it
  // Handle when a user is changing the order in the tree
  handleChange(tree) {

  }

  createTree(){

    let tree = {
      module: 'Sample Queue - History',
      type: "Root",
      children:  this.props.historyList.map((queue_id) => {
        let sampleData = this.props.sampleInformation[this.props.lookup[queue_id]];
        return {
          module: 'Vial ' + sampleData.id + " " + sampleData.proteinAcronym,
          queue_id: queue_id,
          sample_id: sampleData.id,
          type: "Sample",
          children : this.props.queue[queue_id].map( (method_id) =>{
            let methodData = sampleData.methods[method_id];
            return {
              module: methodData.name,
              sample_id: sampleData.id,
              queue_id: method_id,
              parent_id: queue_id,
              type: "Method"
            };
          }) 

        };
      })
    };
    return tree;
  }

  render() {
   let tree = this.createTree();

    return (
          <Tree
            paddingLeft={20}
            tree={tree}
            onChange={this.handleChange.bind(this)}
            renderNode={this.renderNode.bind(this)}/>
    );
  }

}