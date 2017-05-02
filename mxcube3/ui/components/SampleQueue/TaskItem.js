import React, { Component, PropTypes } from 'react';
import { Button, Collapse, FormControl } from 'react-bootstrap';
import { findDOMNode } from 'react-dom';
import { DragSource as dragSource, DropTarget as dropTarget } from 'react-dnd';
import cx from 'classnames';
import { TASK_UNCOLLECTED,
         TASK_COLLECTED,
         TASK_COLLECT_FAILED,
         TASK_COLLECT_WARNING,
         TASK_RUNNING } from '../../constants';
import ClipboardButton from 'react-clipboard.js';
import clippy from '../../img/clippy.png';

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
    this.collapseTask = this.collapseTask.bind(this);
    this.getResult = this.getResult.bind(this);
    this.state = {
      overInput: false
    };
  }

  getResult(state) {
    if (state !== TASK_COLLECTED) {
      return ('nothing yet');
    }
    return (
      <a href={this.props.data.limstResultData}> ISPyB link</a>
      );
  }

  toggleChecked() {
    this.props.toggleChecked(this.props.sampleId, this.props.index);
  }

  collapseTask() {
    this.props.collapseTask(this.props.sampleId, this.props.index);
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
    this.props.showForm(type, sampleId, data, parameters.point);
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
      paddingRight: '10px'
    };

    const pointID = data.parameters.shape;

    const value = `./${parameters.subdir}/${parameters.prefix}-${parameters.run_number}`;
    const element = (
      <div className="node node-sample" style={{ opacity }}>
            <div className={taskCSS} style={{ display: 'flex' }} onClick={this.collapseTask} >
              <p className="node-name" style={{ display: 'flex' }} >
                {`${pointID !== '' ? pointID : '?'} ${data.label}`}
              </p>
              <p className="fa fa-trash" onClick={this.deleteTask} style={delTaskCSS} >
              </p>
            </div>
          <Collapse in={Boolean(show)}>
          <div className="task-body">
            <form>
              <div className="form-group row">
                <label className="col-sm-12">File path:</label>
                <div className="col-sm-12" style={{ display: 'flex' }} >
                  <FormControl
                    readOnly
                    type="text"
                    defaultValue={value}
                    ref={value}
                  />
                  <ClipboardButton data-clipboard-text={value} style={{ maxWidth: '30' }} >
                    <img src="img/clippy.svg" width="15" alt="clipboard" />
                  </ClipboardButton>
                </div>
              </div>
              <div className="task-information">
                <label>Parameters summary:&nbsp;</label>
                <span className="task-parameters" onClick={this.showForm}>
                  osc: {parameters.osc_range},
                  exp.time: {`${parameters.exp_time * 1000} ms`},
                  num.images: {parameters.num_images},
                  resolution: {parameters.resolution},
                  Transmission: {`${parameters.transmission}%`}
                </span>
              <div>
                <label>Results:&nbsp;</label>
                <span className="task-result">
                  {this.getResult(state)}
                </span>
              </div>
              </div>
            </form>
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
