'use strict';
import React from 'react'
import "bootstrap-webpack"
import cx from 'classnames'
import "./app.less"

export default class HistoryTree extends React.Component {
    constructor(props) {
        super(props);
        this.collapse = this.props.collapse.bind(this,"history");
    }

   renderSample(node, queueId, key){

    return (
        <div className="node node-sample" key={key}>
            <span className="node-name">Vial {node.id}</span>
             {this.props.queue[queueId].map((id, i) => {
                    return this.renderMethod(node.methods[id], i);
            })}
        </div>
    );
    
  }

   renderMethod(node, key){
      var methodClass = cx('node node-method',{
      'passive': node.state===0,
      'active': node.state===1,
      'success': node.state===2,
      'error': node.state===3,
      'warning': node.state===4
    }); 
    return (
      <div className={methodClass} key={key}>
        <span className="node-name">{'P' + node.parameters.point + ' ' + node.name}</span>
      </div>
    );
    
  }

  render() {
          var bodyClass = cx('list-body',{
            'hidden': this.props.show
        }); 
        return (
            <div className="m-tree">
                <div className="list-head">
                    <span className="queue-root" onClick={this.collapse}>History</span>
                    <hr className="queue-divider" />
                </div>
                <div className={bodyClass}>
                    {this.props.list.map((id, i) => {
                    let sampleData = this.props.sampleInformation[this.props.lookup[id]];
                    return this.renderSample(sampleData, id, i);
                })}
                </div>
            </div>
        );
  }

}