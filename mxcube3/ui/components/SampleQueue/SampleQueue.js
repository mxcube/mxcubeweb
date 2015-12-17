'use strict';
import React, { Component, PropTypes } from 'react'
import "bootstrap-webpack"
import Tree from 'react-ui-tree'
import cx from 'classnames'
import "./app.less"

import Characterisation from '../Methods/Characterisation'


export default class SampleQueue extends Component {


  // The render function for each queue node
  renderNode(node) {
    return (
      <span className={cx('node', {
        'is-active': node.queue_id === this.props.data.selected.queue_id
        })} onClick={this.onClickNode.bind(this, node)}>
        {node.module}
        {!node.root && node.queue_id? <i className="fa fa-times" onClick={this.removeNode.bind(this, node)}></i>: ''}
        {node.method ? <i className="fa fa-cog" onClick={() => this.props.showForm(node.module.toLowerCase())}></i>: ''}
      </span>
    );
  }


  // Checking what queue node is pressed and selecting it
  onClickNode(node) {
    this.props.data.queueActions.selectSample(node.queue_id, node.sample_id, node.method);
  }


  // Checking if queue node is a sample or method, this is done in order to know what action to call
  removeNode(node){
    if(!node.method){
      this.props.data.queueActions.sendDeleteSample(node.queue_id, node.list_index);
    }else{
      this.props.data.sampleActions.sendDeleteSampleMethod(node.queue_id, node.sample_id ,node.list_index);
    }

  }

  // Handle when a user is changing the order in the tree
  handleChange(tree) {
    console.log("Update server with new order");
  }

  render() {
    return (
        <div className="tree">
          <Tree
            paddingLeft={20}
            tree={this.props.data.tree}
            onChange={this.handleChange.bind(this)}
            isNodeCollapsed={this.isNodeCollapsed}
            renderNode={this.renderNode.bind(this)}
          />
        </div>
    );
  }

}