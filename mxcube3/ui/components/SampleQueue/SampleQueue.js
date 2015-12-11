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
        {!node.root ? <i className="fa fa-times" onClick={this.removeNode.bind(this, node)}></i>: ''}
      </span>
    );
  }

  onClickNode(node) {
    this.props.data.actions.selectSample(node.queue_id, node.sample_id);
  }

  removeNode(node){
    this.props.data.actions.deleteSample(node.queue_id, node.list_index);
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