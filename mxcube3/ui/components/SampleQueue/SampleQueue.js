'use strict';
import React, { Component, PropTypes } from 'react'
import "bootstrap-webpack"
import Tree from 'react-ui-tree'
import cx from 'classnames'
import "./app.less"
import SampleQueueSearch from './SampleQueueSearch';


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
      <span className="node node-root">
        <span className="node-name">{node.module}</span>
      </span>
    );

  }

   renderSample(node){
    return (
      <span className="node node-sample" onClick={this.onClickNode.bind(this, node)}>
        {!node.finished ? 
        <input type="checkbox" onClick={() => this.props.toggleCheckBox(node.queue_id)} checked={this.props.data.checked.indexOf(node.queue_id) !== -1} />
        : ''}
        <span className="node-name">{node.module}</span>
        {!node.finished ? <span>
        <i className="fa fa-times" onClick={this.removeNode.bind(this, node)}></i>
        <i className="fa fa-play" onClick={() => this.props.run(node.queue_id)}></i>
        </span>: ''}
      </span>
    );
    
  }

   renderMethod(node){
    return (
      <span className="node node-method" onClick={this.onClickNode.bind(this, node)}>
        {!node.finished ? 
          <input type="checkbox" onClick={() => this.props.toggleCheckBox(node.queue_id,node.parent_id)} checked={this.props.data.checked.indexOf(node.queue_id) !== -1}/>
        : ''}
        <span className="node-name">{node.module}</span>
        {!node.finished ? <i className="fa fa-times" onClick={this.removeNode.bind(this, node)}></i>  : ''}
        { node.module !== "Centring" && !node.finished ? <i className="fa fa-cog" onClick={() => this.props.showForm(node.module.toLowerCase())}></i>: ''}
      </span>
    );
    
  }

  // Checking what queue node is pressed and selecting it
  onClickNode(node) {
    this.props.select(node.parent_id, node.queue_id, node.sample_id, node.method);
  }

  removeNode(node){
    //Checking if queue node is a sample or method, this is done in order to know what action to call
    if(!node.method){
      this.props.data.queueActions.sendDeleteSample(node.queue_id);
    }else{
      this.props.data.sampleActions.sendDeleteSampleMethod(node.parent_id, node.queue_id, node.sample_id ,node.list_index);
    }

  }

  // Handle when a user is changing the order in the tree
  handleChange(tree) {

  }

  render() {
    return (
        <div className="tree">
          <SampleQueueSearch />
        {/* Current Sample */}
           <i className="fa fa-check-circle-o" onClick={() => this.props.finishSample(this.props.current.queue_id)}> Press the icon to finish sample</i>
           <Tree
            paddingLeft={20}
            tree={this.props.current_tree}
            onChange={this.handleChange.bind(this)}
            isNodeCollapsed={this.isNodeCollapsed}
            renderNode={this.renderNode.bind(this)}/>
         {/* Todo list */}
          <Tree
            paddingLeft={20}
            tree={this.props.todo_tree}
            onChange={this.handleChange.bind(this)}
            isNodeCollapsed={this.isNodeCollapsed}
            renderNode={this.renderNode.bind(this)}/>
         {/* History list */}
          <Tree
            paddingLeft={20}
            tree={this.props.history_tree}
            onChange={this.handleChange.bind(this)}
            isNodeCollapsed={this.isNodeCollapsed}
            renderNode={this.renderNode.bind(this)}/>
        </div>
    );
  }

}