import React from 'react';
import './app.css';
import { Button } from 'react-bootstrap';
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
      <div>
        <div className="list-head">
          <div className="col-xs-7" style={{ paddingLeft: '0px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search Upcoming"
              onChange={this.setSearchWord}
            />
          </div>
          <div className="col-xs-5" style={{ paddingRight: '0px' }}>
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
        <div className="list-body">
          {list.map((key, id) => {
            const sampleData = this.props.sampleList[key];
            const sampleName = sampleData.sampleName ? sampleData.sampleName : '';
            const proteinAcronym = sampleData.proteinAcronym
              ? `${sampleData.proteinAcronym} -` : '';

            return (
              <div key={id} className="node node-sample">
                <div className="task-head">
                  <p className="node-name">
                    <b>
                      {`${sampleData.sampleID} `}
                    </b>
                    {`${proteinAcronym} ${sampleName}`}
                    <Button
                      className="pull-right"
                      bsSize="xs"
                      onClick={() => this.mountAndSwitchTab(sampleData)}
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
