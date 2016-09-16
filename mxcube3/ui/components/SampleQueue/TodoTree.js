import React from 'react';
import 'bootstrap-webpack';
import './app.less';
import cx from 'classnames';
import { Button } from 'react-bootstrap';


export default class TodoTree extends React.Component {
  constructor(props) {
    super(props);
    this.collapse = this.props.collapse.bind(this, 'todo');
  }

  render() {
    const bodyClass = cx('list-body', {
      hidden: this.props.show
    });
    return (
            <div className="m-tree">
                <div className="list-head">
                    <span className="queue-root" onClick={this.collapse}>Upcoming Samples</span>
                    <hr className="queue-divider" />
                </div>
                <div className={bodyClass}>
                {this.props.list.map((sampleId, id) => {
                  const sampleData = this.props.sampleInformation[sampleId];
                  return (
                    <div key={id} className="node node-sample node-todo">
                      <div className="task-head">
                        <p className="node-name">
                          {`Sample ${sampleData.sampleID}`}
                          <Button
                            className="pull-right"
                            bsSize="xs"
                            onClick={() => this.props.mount(sampleData.sampleID)}
                          >
                            Mount
                          </Button>
                        </p>
                      </div>
                    </div>
                  );
                })}
                </div>
            </div>
        );
  }
}
