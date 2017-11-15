import React, { Component, PropTypes } from 'react';
import { ProgressBar, Button, Collapse, OverlayTrigger, Popover, Modal } from 'react-bootstrap';
import { ContextMenuTrigger } from 'react-contextmenu';
import Plot1D from '../Plot1D';

import { TASK_UNCOLLECTED,
         TASK_COLLECTED,
         TASK_COLLECT_FAILED,
         TASK_RUNNING } from '../../constants';

export default class XRFTaskItem extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
    moveCard: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.showForm = this.showForm.bind(this);
    this.deleteTask = this.deleteTask.bind(this);
    this.toggleChecked = this.toggleChecked.bind(this);
    this.taskHeaderOnClick = this.taskHeaderOnClick.bind(this);
    this.taskHeaderOnContextMenu = this.taskHeaderOnContextMenu.bind(this);
    this.getResult = this.getResult.bind(this);
    this.showXRFPlot = this.showXRFPlot.bind(this);
    this.showPlotModal = this.showPlotModal.bind(this);
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);

    this.state = {
      overInput: false,
      selected: false,
      showModal: false
    };
  }

  getResult(state, data) {
    if (state !== TASK_COLLECTED) {
      return (<span></span>);
    }
    const link = this.props.data.limsResultData ? this.props.data.limsResultData.limsTaskLink : '';

    return (
      <div style={ { borderLeft: '1px solid #DDD',
                     borderRight: '1px solid #DDD',
                     borderBottom: '1px solid #DDD',
                     marginRight: '1px',
                     padding: '0.5em' } }
      >
        <a href={link} target="_blank"> View Results in ISPyB</a>
        {this.getDiffPlan(data)}
      </div>
    );
  }

  getIspybLink(state) {
    if (state !== TASK_COLLECTED) {
      return (<span></span>);
    }

    return (<a href={this.props.data.limstResultData}> ISPyB link</a>);
  }

  getPlot(state) {
    if (state === TASK_UNCOLLECTED) {
      return (<span></span>);
    }

    return (
      <div className="pull-right">
      <a href="#"
        onClick={this.showXRFPlot}
      >
      Plot available
      </a>
      </div>
    );
  }

  showPlotModal() {
    return (
      <div>
      <Modal show={this.state.showModal} onHide={this.close}>
        <Modal.Header closeButton>
          <Modal.Title>XRF Plot</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h4>Text in a modal</h4>
        </Modal.Body>
        <Plot1D displayedPlotCallback={this.newPlotDisplayed}
          plotId={'this.plotIdByAction[currentActionName'} autoNext={'True'}
        />
        <Modal.Footer>
          <Button onClick={this.close}>Close</Button>
        </Modal.Footer>
      </Modal>
      </div>
      );
  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  showXRFPlot() {
    this.open();
  }

  toggleChecked() {
    this.props.toggleChecked(this.props.sampleId, this.props.index);
  }

  taskHeaderOnClick(e) {
    this.props.taskHeaderOnClickHandler(e, this.props.index);
  }

  taskHeaderOnContextMenu(e) {
    this.props.taskHeaderOnContextMenuHandler(e, this.props.index);
  }

  deleteTask(e) {
    e.stopPropagation();
    this.props.deleteTask(this.props.sampleId, this.props.index);
  }


  deleteButton() {
    let content = (<Button bsSize="sm" onClick={this.deleteTask}>Delete</Button>);

    if (this.props.state !== TASK_UNCOLLECTED) {
      content = (<span> </span>);
    }

    return content;
  }

  showForm() {
    const { data, sampleId } = this.props;
    const { type, parameters } = data;
    this.props.showForm(type, sampleId, data, parameters.shape);
  }

  pointIDString(parameters) {
    let res = '';

    if (parameters.shape !== -1) {
      res = `${parameters.shape} `;
    }
    return res;
  }

  path(parameters) {
    const value = parameters.fileName;
    const path = parameters.path ? parameters.path : '';

    return (
      <OverlayTrigger
        trigger="click"
        placement="top"
        rootClose
        overlay={(<Popover id="wedge-popover" style={{ maxWidth: '600px', width: 'auto' }}>
                    <input
                      type="text"
                      onFocus={(e) => {e.target.select();}}
                      value={path}
                      size={path.length + 10}
                    />
                  </Popover>)}
      >
        <a>
          { value }
        </a>
      </OverlayTrigger>);
  }

  render() {
    const { state,
            data,
            show } = this.props;
    const plotId = this.props.id;
    const parameters = data.parameters;

    const result = this.props.data.result;
    const plotAlreadyStored = result !== null;

    let delTaskCSS = {
      display: 'flex',
      marginLeft: 'auto',
      alignItems: 'center',
      paddingLeft: '10px',
      paddingRight: '10px',
      color: '#d9534f',
      cursor: 'pointer'
    };

    const taskCSS = this.props.selected ? 'task-head task-head-selected' : 'task-head';

    let pbarBsStyle = 'info';

    if (state === TASK_RUNNING) {
      pbarBsStyle = 'info';
    } else if (state === TASK_COLLECTED) {
      pbarBsStyle = 'success';
    } else if (state === TASK_COLLECT_FAILED) {
      pbarBsStyle = 'danger';
    }

    return (
      <div className="node node-sample">
      <ContextMenuTrigger id="currentSampleQueueContextMenu">
        <div
          className={taskCSS}
          style={{ display: 'flex' }}
          onClick={this.taskHeaderOnClick}
          onContextMenu={this.taskHeaderOnContextMenu}
        >
          <b>
            <span className="node-name" style={{ display: 'flex' }} >
              {this.pointIDString(parameters)} {data.label}
              <span style={{ width: '150px', right: '60px', position: 'absolute' }}>
                <ProgressBar
                  bsStyle={pbarBsStyle}
                  striped
                  style={{ marginBottom: '0px', height: '18px' }}
                  min={0}
                  max={1}
                  active={ this.props.progress < 1 }
                  label={ `${(this.props.progress * 100).toPrecision(3)} %` }
                  now={this.props.progress}
                />
              </span>
            </span>
          </b>
            { state === TASK_UNCOLLECTED ?
              <i className="fa fa-remove" onClick={this.deleteTask} style={delTaskCSS} /> : null
            }
        </div>
        <Collapse in={Boolean(show)}>
          <div className="task-body">
            <div>
              <div style={ { border: '1px solid #DDD',
                             marginRight: '1px' } }
              >
                <div
                  style={ { padding: '0.5em' } }
                  onClick={this.showForm}
                >
                  <b>Path:</b> { this.path(parameters) }
                  <br />
                  <b>Count time:</b> {parameters.countTime}
                </div>
              </div>
              {this.getResult(state)}
              <Modal show={this.state.showModal} onHide={this.close}>
                <Modal.Header closeButton>
                  <Modal.Title>XRF Plot</Modal.Title>
                </Modal.Header>
                <Plot1D
                  plotId={plotId} autoNext saved={plotAlreadyStored} data={result}
                />
                <Modal.Footer>
                  <Button onClick={this.close}>Close</Button>
                </Modal.Footer>
              </Modal>
            </div>
            </div>
        </Collapse>
      </ContextMenuTrigger>
      </div>);
  }
}
