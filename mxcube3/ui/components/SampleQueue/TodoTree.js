'use strict';
import React from 'react'
import "bootstrap-webpack"
import Tree from 'react-ui-tree'
import "./app.less"

export default class TodoTree extends React.Component {

  // The render method call from Tree, this checks what node is to be renderd and calls new function
  renderNode(node) {
    switch (node.type) {
      case 'Root':
        return this.renderRoot(node);
      case 'Sample':
        return this.renderSample(node);
      default:
        throw new Error("Type not found, tree"); 
    }
  }

  renderRoot(node){
    return (
        <p className="queue-root">{node.module}</p>
    );

  }

  renderSample(node){

    // This line shouldnt need to be here but it seems that react-ui-tree has some bug
    if(this.props.todoList.indexOf(node.queue_id) > -1){
      return (
        <span className="node node-sample" onClick={() => this.props.select(node.queue_id, node.sample_id)}>
          <span className="node-name">{node.module}</span>
          <i className="fa fa-times" onClick={() => this.props.deleteSample(node.queue_id)}></i>
          <i className="fa fa-sign-in"  onClick={() => this.props.mount(node.queue_id)}></i>
        </span>
        );
    }
  }

  createTree(){
    let todoFiltered = this.props.todoList.filter((queue_id) => {
        let sampleData = this.props.sampleInformation[this.props.lookup[queue_id]];
        return (this.props.searchString === "" || sampleData.id.indexOf(this.props.searchString) > -1 );
    });

    let tree = {
      module: 'ToDo',
      type: "Root",
      children:  todoFiltered.map((queue_id) => {
        let sampleData = this.props.sampleInformation[this.props.lookup[queue_id]];
        return {
          module: 'Vial ' + sampleData.id ,
          queue_id: queue_id,
          sample_id: sampleData.id,
          type: "Sample"

        };
      })
    };
    return tree;
  }


  render() {
    return (
          <Tree
            paddingLeft={20}
            tree={this.createTree()}
            isNodeCollapsed={this.isNodeCollapsed}
            renderNode={this.renderNode.bind(this)}/>
    );
  }

}