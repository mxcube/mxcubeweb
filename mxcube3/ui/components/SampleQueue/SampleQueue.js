'use strict';
import React, { Component, PropTypes } from 'react'
import "bootstrap-webpack"
import Tree from 'react-ui-tree'
import cx from 'classnames'
import "./app.less"

export default class SampleQueue extends Component {


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
      <span className="node">
        <span className="node-name">{node.module}</span>
      </span>
    );

  }

   renderSample(node){
    return (
      <span className={cx('node', {'is-active': node.queue_id === this.props.selected.queue_id})} onClick={this.onClickNode.bind(this, node)}>
        <input type="checkbox" onClick={() => this.props.toggleCheckBox(node.queue_id)} checked={this.props.data.checked.indexOf(node.queue_id) !== -1}/>
        <span className="node-name">{node.module}</span>
        <i className="fa fa-times" onClick={this.removeNode.bind(this, node)}></i>
        <i className="fa fa-play" onClick={this.executeNode.bind(this, node)}></i>
      </span>
    );
    
  }

   renderMethod(node){
    return (
      <span className={cx('node', {'is-active': node.queue_id === this.props.selected.queue_id})} onClick={this.onClickNode.bind(this, node)}>
        <input type="checkbox" onClick={() => this.props.toggleCheckBox(node.queue_id,node.parent_id)} checked={this.props.data.checked.indexOf(node.queue_id) !== -1}/>
        <span className="node-name">{node.module}</span>
        <i className="fa fa-times" onClick={this.removeNode.bind(this, node)}></i>
        { node.module !== "Centring" ? <i className="fa fa-cog" onClick={() => this.props.showForm(node.module.toLowerCase())}></i>: ''}
        <i className="fa fa-play" onClick={this.executeNode.bind(this, node)}></i>
      </span>
    );
    
  }

  // Checking what queue node is pressed and selecting it
  onClickNode(node) {
    this.props.data.queueActions.selectSample(node.parent_id, node.queue_id, node.sample_id, node.method);
  }

  removeNode(node){
    //Checking if queue node is a sample or method, this is done in order to know what action to call
    if(!node.method){
      this.props.data.queueActions.sendDeleteSample(node.queue_id);
    }else{
      this.props.data.sampleActions.sendDeleteSampleMethod(node.parent_id, node.queue_id, node.sample_id ,node.list_index);
    }

  }

  executeNode(node){
    console.log("run node");
  }

  // Handle when a user is changing the order in the tree
  handleChange(tree) {
    // console.log("reorder");
    // let sample_list = [];

    // tree.children.map((sample,index) =>{
    //   sample_list.push({sample_id: sample.sample_id, queue_id: sample.queue_id});
    // });
    // this.props.changeOrder(sample_list);
    // console.log(sample_list);
  }

  render() {
    return (
        <div className="tree">
          <Tree
            paddingLeft={20}
            tree={this.props.tree}
            onChange={this.handleChange.bind(this)}
            isNodeCollapsed={this.isNodeCollapsed}
            renderNode={this.renderNode.bind(this)}
          />
        </div>
    );
  }

}