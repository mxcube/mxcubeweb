import React, { Component, PropTypes } from 'react';
import { ProgressBar, Button, Collapse, Table, OverlayTrigger, Popover } from 'react-bootstrap';
import { findDOMNode } from 'react-dom';
import { DragSource as dragSource, DropTarget as dropTarget } from 'react-dnd';
import cx from 'classnames';
import { TASK_UNCOLLECTED,
         TASK_COLLECTED,
         TASK_COLLECT_FAILED,
         TASK_COLLECT_WARNING,
         TASK_RUNNING } from '../../constants';

const cardSource = {
  beginDrag(props) {
    return {
      id: props.id,
      index: props.index,
      startIndex: props.index
    };
  },
  endDrag(props, monitor) {
    props.moveTask(props.sampleId, monitor.getItem().startIndex, props.index);
    return {
      id: props.id,
      index: props.index
    };
  }
};

const cardTarget = {

  hover(props, monitor, component) {
    const dragIndex = monitor.getItem().index;
    const hoverIndex = props.index;
    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return;
    }

    // Determine rectangle on screen
    const hoverBoundingRect = findDOMNode(component).getBoundingClientRect();

    // Get vertical middle
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

    // Determine mouse position
    const clientOffset = monitor.getClientOffset();

    // Get pixels to the top
    const hoverClientY = clientOffset.y - hoverBoundingRect.top;

    // Only perform the move when the mouse has crossed half of the items height
    // When dragging downwards, only move when the cursor is below 50%
    // When dragging upwards, only move when the cursor is above 50%

    // Dragging downwards
    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
      return;
    }

    // Dragging upwards
    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
      return;
    }

    // Time to actually perform the action
    props.moveCard(dragIndex, hoverIndex);

    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    monitor.getItem().index = hoverIndex; // eslint-disable-line no-param-reassign
  }
};

@dropTarget('task', cardTarget, connect => ({
  connectDropTarget: connect.dropTarget(),
}))
@dragSource('task', cardSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging()
}))
export default class TaskItem extends Component {
  static propTypes = {
    connectDragSource: PropTypes.func.isRequired,
    connectDropTarget: PropTypes.func.isRequired,
    id: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
    isDragging: PropTypes.bool.isRequired,
    moveCard: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.showForm = this.showForm.bind(this);
    this.deleteTask = this.deleteTask.bind(this);
    this.toggleChecked = this.toggleChecked.bind(this);
    this.taskHeaderOnClick = this.taskHeaderOnClick.bind(this);
    this.getResult = this.getResult.bind(this);
    this.state = {
      overInput: false,
      selected: false
    };
  }

  getResult(state) {
    if (state !== TASK_COLLECTED) {
      return (<span></span>);
    }
    return (
      <a href={this.props.data.limstResultData}> ISPyB link</a>
    );
  }

  toggleChecked() {
    this.props.toggleChecked(this.props.sampleId, this.props.index);
  }

  taskHeaderOnClick(e) {
    this.props.taskHeaderOnClickHandler(e, this.props.index);
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

  render() {
    const { state,
            data,
            isDragging,
            connectDragSource,
            connectDropTarget,
            show } = this.props;
    const parameters = data.parameters;
    const opacity = isDragging ? 0 : 1;
    let taskCSS = cx('task-head', {
      active: state === TASK_RUNNING,
      success: state === TASK_COLLECTED,
      error: state === TASK_COLLECT_FAILED,
      warning: state === TASK_COLLECT_WARNING
    });

    let delTaskCSS = {
      display: 'flex',
      marginLeft: 'auto',
      alignItems: 'center',
      paddingLeft: '10px',
      paddingRight: '10px',
      color: '#d9534f',
      cursor: 'pointer'
    };

    taskCSS = this.props.selected ? `${taskCSS} task-head-selected` : taskCSS;

    const pointID = data.parameters.shape;
    const value = `./${parameters.subdir}/${parameters.prefix}-${parameters.run_number}`;
    const path = parameters.path ? parameters.path : '';
    const element = (
      <div className="node node-sample" style={{ opacity }}>
        <div
          className={taskCSS}
          style={{ display: 'flex' }}
          onClick={this.taskHeaderOnClick}
        >
          <b>
            <p className="node-name" style={{ display: 'flex' }} >
              {`${pointID !== '' ? pointID : '?'} ${data.label}`}
              <span style={{ width: '150px', right: '60px', position: 'absolute' }}>
                <ProgressBar style={{ marginBottom: '0px', height: '18px' }} active now="0" />
              </span>
            </p>
          </b>
            { state === TASK_UNCOLLECTED ?
              <i className="fa fa-remove" onClick={this.deleteTask} style={delTaskCSS} /> : null
            }
        </div>
        <Collapse in={Boolean(show)}>
          <div className="task-body">
            <div style={ { borderLeft: '1px solid #DDD',
                           borderRight: '1px solid #DDD',
                           padding: '0.5em' } }
            >
              <b>Path:</b>
              <OverlayTrigger
                trigger="click"
                placement="top"
                rootClose
                overlay={(<Popover style={{ maxWidth: '600px', width: 'auto' }}>
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
              </OverlayTrigger>
            </div>
            <Table
              striped
              condensed
              bordered
              hover
              onClick={this.showForm}
              style={{ fontSize: 'smaller', marginBottom: '0px' }}
              className="task-parameters-table"
            >
              <thead>
                <tr>
                  <th>Start &deg; </th>
                  <th>Osc. &deg; </th>
                  <th># Img</th>
                  <th>t (ms)</th>
                  <th>T (%)</th>
                  <th>Res. (&Aring;)</th>
                  <th>E (KeV)</th>
                  <th>&phi; &deg;</th>
                  <th>&kappa; &deg;</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><a>{parameters.osc_start}</a></td>
                  <td><a>{parameters.osc_range}</a></td>
                  <td><a>{parameters.exp_time * 1000}</a></td>
                  <td><a>{parameters.num_images}</a></td>
                  <td><a>{parameters.resolution}</a></td>
                  <td><a>{parameters.transmission}</a></td>
                  <td><a>{parameters.energy}</a></td>
                  <td><a>{parameters.kappa_phi}</a></td>
                  <td><a>{parameters.kappa}</a></td>
                </tr>
              </tbody>
            </Table>
            <div style={ { borderLeft: '1px solid #DDD',
                           borderRight: '1px solid #DDD',
                           borderBottom: '1px solid #DDD',
                           padding: '0.5em' } }
            >
              {this.getResult(state)}
            </div>
          </div>
        </Collapse>
      </div>
      );
    if (this.state.overInput) {
      return element;
    }
    return connectDragSource(connectDropTarget(element));
  }
}
