'use strict';
import React, { Component, PropTypes } from 'react'
import "bootstrap-webpack"
import Tree from 'react-ui-tree'
import cx from 'classnames'
import "./app.less"


export default class SampleQueue extends Component {

  renderNode(node) {

    return (
      <span className={cx('node', {
        'is-active': node.queue_id === this.props.data.selected.queue_id
        })} onClick={this.onClickNode.bind(this, node)}>
        {node.module}
        {!node.root && node.queue_id? <i className="fa fa-times" onClick={this.removeNode.bind(this, node)}></i>: ''}
        {node.method ? <i className="fa fa-cog"></i>: ''}
      </span>
    );
  }

  onClickNode(node) {
    this.props.data.queueActions.selectSample(node.queue_id, node.sample_id);
  }

  removeNode(node){
    // Checking if queue node is a sample or method, this is done in order to know what action to call
    if(!node.method){
      this.props.data.queueActions.sendDeleteSample(node.queue_id, node.list_index);
    }else{
      console.log(node);
      this.props.data.sampleActions.sendDeleteSampleMethod(node.queue_id, node.sample_id ,node.list_index);
    }

  }

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