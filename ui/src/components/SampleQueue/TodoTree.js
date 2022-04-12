import React from 'react';
import './app.css';
import { ListGroup, Form, Button } from 'react-bootstrap';
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
    this.props.sendPrepareForNewSample();
    this.props.showForm('AddSample');
    this.props.showList('current');
  }

  mountAndSwitchTab(sampleData) {
    this.props.mount(sampleData);
    this.props.showList('current');
  }

  filter(list, searchWord) {
    const filteredList = list.filter(sampleID => String(sampleID).includes(searchWord));

    return filteredList;
  }

  render() {
    if (!this.props.show) { return <div />; }

    const list = this.filter(this.props.list, this.state.searchWord);

    return (
      <ListGroup variant="flush">
        <ListGroup.Item className="mt-2 d-flex list-head" style={{ borderBottom: 'none' }}>
          <div className="me-auto">
            <Form.Control
              type="text"
              size="sm"
              className="form-control"
              placeholder="Search Upcoming"
              onChange={this.setSearchWord}
            />
          </div>
          <div>
            <Button
              disabled={this.props.queueStatus === QUEUE_RUNNING}
              className="me-2 btn-primary"
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
            const sampleName = sampleData.sampleName ? sampleData.sampleName : '';
            const proteinAcronym = sampleData.proteinAcronym
              ? `${sampleData.proteinAcronym} -` : '';

            return (
              <div key={id} className="node node-sample">
                <div className="task-head">
                  <p className="d-flex node-name">
                    <div className='pt-1 me-auto'>
                      <b>
                        {`${sampleData.sampleID} `}
                      </b>
                    {`${proteinAcronym} ${sampleName}`}
                    </div>

                    <Button
                      variant='outline-secondary'
                      size="sm"
                      onClick={() => this.mountAndSwitchTab(sampleData)}
                    >
                      Mount
                    </Button>
                  </p>
                </div>
              </div>
            );
          })}
        </ListGroup.Item>
      </ListGroup>
    );
  }
}
