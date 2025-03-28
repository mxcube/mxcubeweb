/* eslint-disable react/no-array-index-key */
import './app.css';

import React from 'react';
import { Button, Form, ListGroup } from 'react-bootstrap';

import { QUEUE_RUNNING } from '../../constants';

export default class TodoTree extends React.Component {
  constructor(props) {
    super(props);
    this.setSearchWord = this.setSearchWord.bind(this);
    this.showAddSampleForm = this.showAddSampleForm.bind(this);
    this.mountAndSwitchTab = this.mountAndSwitchTab.bind(this);
    this.state = { searchWord: '' };
  }

  setSearchWord(searchWord) {
    this.setState({ searchWord: searchWord.target.value });
  }

  showAddSampleForm() {
    this.props.prepareBeamlineForNewSample();
    this.props.showForm('AddSample');
  }

  mountAndSwitchTab(sampleData) {
    this.props.mount(sampleData);
    this.props.showList('current');
  }

  filter(list, searchWord) {
    return list.filter((sampleID) => String(sampleID).includes(searchWord));
  }

  render() {
    if (!this.props.show) {
      return <div />;
    }

    const list = this.filter(this.props.list, this.state.searchWord); // eslint-disable-line unicorn/no-array-method-this-argument

    return (
      <ListGroup variant="flush">
        <ListGroup.Item
          className="d-flex list-head"
          style={{ borderBottom: 'none' }}
        >
          <div className="me-auto">
            <Form.Control
              type="text"
              size="sm"
              className="form-control"
              placeholder="Search Upcoming"
              onChange={this.setSearchWord}
              style={{ width: '90%' }}
            />
          </div>
          <div>
            <Button
              disabled={this.props.queueStatus === QUEUE_RUNNING}
              className="btn-primary"
              size="sm"
              onClick={this.showAddSampleForm}
            >
              Create new sample
            </Button>
          </div>
        </ListGroup.Item>
        <ListGroup.Item className="d-flex list-body">
          {list.map((key, id) => {
            const sampleData = this.props.sampleList[key];
            const sampleName = sampleData.sampleName || '';
            const proteinAcronym = sampleData.proteinAcronym
              ? `${sampleData.proteinAcronym} -`
              : '';

            return (
              <div key={id} className="node node-sample">
                <div className="task-head">
                  <div className="d-flex node-name">
                    <p className="pt-1 me-auto">
                      <b>{`${sampleData.sampleID} `}</b>
                      {`${proteinAcronym} ${sampleName}`}
                    </p>

                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => this.mountAndSwitchTab(sampleData)}
                    >
                      Mount
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </ListGroup.Item>
      </ListGroup>
    );
  }
}
