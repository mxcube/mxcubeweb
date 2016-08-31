import React, { Component, PropTypes } from 'react';
import { Button, Collapse, ProgressBar } from 'react-bootstrap';
import { findDOMNode } from 'react-dom';
import { DragSource as dragSource, DropTarget as dropTarget } from 'react-dnd';
import cx from 'classnames';

const cardSource = {
  beginDrag(props) {
    return {
      id: props.id,
      index: props.index
    };
  },
  endDrag(props) {
    // insert call to server for changing order
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
  connectDropTarget: connect.dropTarget()
}))
@dragSource('task', cardSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging()
}))
export default class TaskItem extends Component {
  static propTypes = {
    connectDragSource: PropTypes.func.isRequired,
    connectDropTarget: PropTypes.func.isRequired,
    id: PropTypes.number.isRequired,
    index: PropTypes.number.isRequired,
    isDragging: PropTypes.bool.isRequired,
    moveCard: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    const { id, data } = this.props;
    this.showForm = this.showForm.bind(this);
    this.deleteTask = this.deleteTask.bind(this);
    this.toggleChecked = this.props.toggleChecked.bind(this, data, id);
    this.collapseTask = this.props.collapseTask.bind(this, data.sampleID, id);
  }

  deleteTask() {
    this.props.deleteTask(this.props.sampleId, this.props.id);
  }

  showForm() {
    const { data, sampleId } = this.props;
    const { type, parameters } = data;
    this.props.showForm(type, sampleId, data, parameters.point);
  }

  showTask(state) {
    let result = this.props.show;

    if (state === 1) {
      result = true;
    }

    return result;
  }

  render() {
    const { state,
            data,
            progress,
            isDragging,
            connectDragSource,
            connectDropTarget,
            rootPath } = this.props;

    const opacity = isDragging ? 0 : 1;

    let taskCSS = cx('task-head', {
      active: state === 1,
      success: state === 2,
      error: state === 3,
      warning: state === 4
    });

    return connectDragSource(connectDropTarget(
      <div className="node node-sample" style={{ opacity }}>
          <div className={taskCSS} onClick={this.collapseTask}>
            <p className="node-name">
              {`P${data.parameters.point} ${data.label}`}
            </p>
          </div>
          <Collapse in={this.showTask(state)}>
          <div className="task-body">
            <form>
              <div className="form-group row">
                <label className="col-sm-9">File path:</label>
                <label className="col-sm-3">Prefix:</label>
                  <div className="col-sm-9">
                    <input
                      type="text"
                      className="form-control"
                      value={`${rootPath}${data.parameters.path}`}
                      readOnly
                    />
                  </div>
                <div className="col-sm-3">
                  <input
                    type="text"
                    className="form-control"
                    value={data.parameters.prefix}
                    readOnly
                  />
                </div>
              </div>
                <ProgressBar now={progress} />
                <Button bsSize="sm" onClick={this.showForm}>Edit</Button>
                <Button bsSize="sm" onClick={this.deleteTask}>Delete</Button>
                <Button bsSize="sm" disabled={state !== 2}>Results</Button>
            </form>
          </div>
          </Collapse>
      </div>
    ));
  }
}
