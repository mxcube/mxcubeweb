import React from 'react';
import 'bootstrap-webpack';
import cx from 'classnames';
import './app.less';

export default class HistorySampleItem extends React.Component {
  constructor(props) {
    super(props);
    this.collapseSample = props.collapseSample.bind(this, props.id);
  }


  renderTask(node, key) {
    const taskClass = cx('node node-task', {
      passive: node.state === 0,
      active: node.state === 1,
      success: node.state === 2,
      error: node.state === 3,
      warning: node.state === 4
    });
    return (
      <div className={taskClass} key={key}>
        <span className="node-name">
          {node.parameters.point !== -1 ? `P ${node.parameters.point} ` : ' '} {node.label}
        </span>
      </div>
    );
  }

  render() {
    const { data, id, queue } = this.props;
    return (
        <div className="node node-sample">
          <span className="node-name" onClick={this.collapseSample}>Vial {data.id}</span>
            <div className="pull-right">
                <i className="fa fa-sign-in"></i>
            </div>
            <div className={this.props.show ? 'node-tasks' : 'hidden'}>
                {queue[id].map((id, i) => {
                  return this.renderTask(data.tasks[id], i);
                })}
            </div>
        </div>
    );
  }

}
