import React from 'react';
import withRouter from '../components/WithRouter'
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Row, Col,
} from 'react-bootstrap';


import "react-contexify/dist/ReactContexify.css";

import { QUEUE_STOPPED, QUEUE_RUNNING, isCollected, hasLimsData } from '../constants';

import { toggleMovableAction,
  selectSamplesAction,
  sendSetSampleOrderAction } from '../actions/sampleGrid';

import tempIMG from '../img/flexHCD.png';


class NewSampleFlexView extends React.Component {

  constructor(props) {
    super(props);

  }


  componentDidMount() {
    document.addEventListener('keydown', this.onKeyDown, false);

  }


  componentWillUnmount() {
  }

  render() {
    return (
      <Col sm={6}>
        <div>
          <svg version="1.1"
              width="800" height="850" fill='red'
            xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="395" cy="425" r="360" fill="green" />
              <text x="350" y="400" font-size="60" text-anchor="middle" fill="white">FlexHCD</text>
          </svg>
          {/* <img src={tempIMG} className="App-logo" alt="logo" style={{ width: '750px', height: '800px' }}/> */}
        </div>
      </Col>
    );
  }
}

function mapStateToProps(state) {
  return {
    workflows: state.workflow.workflows,
    queue: state.queue,
    selected: state.sampleGrid.selected,
    sampleList: state.sampleGrid.sampleList,
    filterOptions: state.sampleGrid.filterOptions,
    order: state.sampleGrid.order,
    sampleChanger: state.sampleChanger
  };
}

function mapDispatchToProps(dispatch) {
  return {
    sendSetSampleOrderAction: (order) => dispatch(sendSetSampleOrderAction(order)),
  };
}

NewSampleFlexView = withRouter(NewSampleFlexView);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(NewSampleFlexView);