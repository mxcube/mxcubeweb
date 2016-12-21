import React from 'react';
import 'bootstrap-webpack';
import './app.less';
import cx from 'classnames';
import { Button } from 'react-bootstrap';

export default class TodoTree extends React.Component {
  constructor(props) {
    super(props);
    this.setSearchWord = this.setSearchWord.bind(this);
    this.state = {
      searchWord: ''
    };
  }

  setSearchWord(searchWord) {
    this.setState({ searchWord: searchWord.target.value });
  }

  filter(list, searchWord) {
    const filteredList = list.filter((sampleID) =>
      String(sampleID).includes(searchWord)
    );
    return filteredList;
  }

  render() {
    const bodyClass = cx('', {
      hidden: !this.props.show
    });

    const list = this.filter(this.props.list, this.state.searchWord);
    return (
            <div className={bodyClass}>
                <div className="list-head">
                    <span className="queue-root" onClick={this.collapse}>Upcoming Samples</span>
                    <hr className="queue-divider" />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search Upcoming"
                      onChange={this.setSearchWord}
                    />
                </div>
                <div className="list-body todo-body">
                {list.map((key, id) => {
                  const sampleData = this.props.queue[key];
                  return (
                    <div key={id} className="node node-sample">
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
