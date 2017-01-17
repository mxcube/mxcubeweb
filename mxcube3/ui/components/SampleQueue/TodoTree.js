import React from 'react';
import 'bootstrap-webpack';
import './app.less';
import { Button } from 'react-bootstrap';
import { QUEUE_RUNNING } from '../../constants';

export default class TodoTree extends React.Component {
  constructor(props) {
    super(props);
    this.setSearchWord = this.setSearchWord.bind(this);
    this.showAddSampleForm = this.showAddSampleForm.bind(this);
    this.state = { searchWord: '' };
  }

  setSearchWord(searchWord) {
    this.setState({ searchWord: searchWord.target.value });
  }

  showAddSampleForm() {
    this.props.showForm('AddSample');
  }

  filter(list, searchWord) {
    const filteredList = list.filter((sampleID) =>
      String(sampleID).includes(searchWord)
    );

    return filteredList;
  }

  render() {
    if (! this.props.show) { return <div />; }

    const list = this.filter(this.props.list, this.state.searchWord);

    return (
            <div>
              <div className="list-head">
                <div className="col-xs-7" style={ { paddingLeft: '0px' } }>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search Upcoming"
                    onChange={this.setSearchWord}
                  />
                </div>
                <div className="col-xs-5" style={ { paddingRight: '0px' } }>
                  <Button
                    disabled={this.props.queueStatus === QUEUE_RUNNING}
                    className="btn-primary pull-right"
                    bsSize="sm"
                    onClick={this.showAddSampleForm}
                  >
                    Create new sample
                  </Button>
                </div>
              </div>
              <div className="col-xs-12 list-body todo-body">
                {list.map((key, id) => {
                  const sampleData = this.props.queue[key];
                  return (
                  <div key={id} className="node node-sample">
                    <div className="task-head">
                      <p className="node-name">
                        {`${sampleData.sampleID}`}
                        <Button
                          className="pull-right"
                          bsSize="xs"
                          onClick={() => this.props.mount(sampleData)}
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
