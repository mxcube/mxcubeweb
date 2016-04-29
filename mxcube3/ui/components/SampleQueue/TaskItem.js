import React, { Component, PropTypes } from 'react';
import { findDOMNode } from 'react-dom';
import { DragSource, DropTarget } from 'react-dnd';
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
    monitor.getItem().index = hoverIndex;
  }
};

@DropTarget('task', cardTarget, connect => ({
  connectDropTarget: connect.dropTarget()
}))
@DragSource('task', cardSource, (connect, monitor) => ({
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
    this.showForm = () => this.props.showForm(this.props.data.type, this.props.sampleId, this.props.data, this.props.data.parameters.point);
    this.deleteTask = () => this.props.deleteTask(this.props.id);
    this.onClick = this.onClick.bind(this);
  }

  onClick() {
    this.props.toggleChecked(this.props.id);
  }

  render() {
    const { data, isDragging, connectDragSource, connectDropTarget } = this.props;
    const opacity = isDragging ? 0 : 1;
    let taskCSS = cx('node node-sample', {
      'passive': this.props.checked.indexOf(this.props.id) === -1
    });
    return connectDragSource(connectDropTarget(
      <div className={taskCSS} style={{ opacity }}>
        <span className="node-name" onClick={this.onClick}>{data.parameters.point !== -1 ? 'P' + data.parameters.point + ' ' : ' '} {data.label}</span>
         <div className="pull-right">
             <i className="fa fa-cog" onClick={this.showForm}></i>
             <i className="fa fa-times" onClick={this.deleteTask}></i>
           </div>
      </div>
    ));
  }
}
