'use strict';
import React from 'react';
import 'bootstrap-webpack';
import cx from 'classnames';
import './app.less';
import HistorySampleItem from './HistorySampleItem';

export default class HistoryTree extends React.Component {
  constructor(props) {
    super(props);
    this.collapse = this.props.collapse.bind(this, 'history');
  }


  render() {
    var bodyClass = cx('list-body', {
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
                      return <HistorySampleItem data={sampleData} show={this.props.collapsedSamples[id]} collapseSample={this.props.collapseSample} queue={this.props.queue} id={id} key={i} />;
                    })}
                </div>
            </div>
        );
  }

}
