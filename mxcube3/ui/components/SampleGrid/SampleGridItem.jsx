import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import classNames from 'classnames';
import 'bootstrap-webpack!bootstrap-webpack/bootstrap.config.js';

import './SampleGrid.css';


export const SAMPLE_ITEM_WIDTH = 190;
export const SAMPLE_ITEM_HEIGHT = 130;
export const SAMPLE_ITEM_SPACE = 4;


export class SampleGridItem extends React.Component {

  constructor(props) {
    super(props);
    this.toggleMovable = this.toggleMovable.bind(this);
    this.togglePicked = this.togglePicked.bind(this);
    this.moveItemUp = this.moveItemUp.bind(this);
    this.moveItemDown = this.moveItemDown.bind(this);
    this.moveItemRight = this.moveItemRight.bind(this);
    this.moveItemLeft = this.moveItemLeft.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);
  }


  componentDidMount() {
    this.refs.sampleItem.addEventListener('contextmenu', (e) => this.contextMenu(e), false);
  }


  onMouseDown(e) {
    if (e.target.className === 'samples-grid-item-button') {
      if (this.props.selected[this.props.itemKey]) {
        return;
      }
    }

    if (e.ctrlKey) {
      this.props.toggleSelectedSample(this.props.itemKey);
    } else if (e.shiftKey) {
      this.props.dragSelectItem(this.props.itemKey, this.props.seqId);
    } else {
      if (e.nativeEvent.buttons === 1) {
        this.props.dragStartSelection(this.props.itemKey, this.props.seqId);
      }
    }
  }


  onMouseEnter(e) {
    if (e.nativeEvent.buttons === 1) {
      this.props.dragSelectItem(this.props.itemKey, this.props.seqId);
    }
  }


  contextMenu(e) {
    e.preventDefault();
  }


  toggleMovable(e) {
    e.stopPropagation();
    this.props.toggleMovable(this.props.itemKey);
  }


  togglePicked(e) {
    e.stopPropagation();
    this.props.pickSelected();
  }


  showItemControls() {
    const itemKey = this.props.itemKey;
    let iconClassName = 'glyphicon glyphicon-unchecked';

    if (this.props.picked) {
      iconClassName = 'glyphicon glyphicon-check';
    }

    const pickButton = (
      <OverlayTrigger
        placement="top"
        overlay={(<Tooltip>Pick/Unpick sample for collect</Tooltip>)}
      >
        <button
          className="samples-grid-item-button"
          bsStyle="default"
          bsSize="s"
          onClick={this.togglePicked}
        >
          <i className={iconClassName} />
        </button>
      </OverlayTrigger>
    );

    const moveButton = (
      <OverlayTrigger
        placement="top"
        overlay={(<Tooltip>Move sample (change order in which sample is collected)</Tooltip>)}
      >
        <button
          className="samples-grid-item-button"
          onMouseDown={this.toggleMovable}
        >
          <i className="glyphicon glyphicon-move" />
        </button>
      </OverlayTrigger>
     );

    const collectButton = (
      <OverlayTrigger
        placement="top"
        overlay={(<Tooltip>Mount and collect THIS sample now</Tooltip>)}
      >
        <button
          className="samples-grid-item-button"
          onClick={ () => { location.href = '#/datacollection'; } }
        >
          <i className="glyphicon glyphicon-screenshot" />
        </button>
      </OverlayTrigger>
    );

    let content = (
      <div className="samples-item-controls-container">
      {pickButton}
      </div>
    );

    if (this.props.selected[itemKey] && !this.props.canMove().every(value => value === false)) {
      content = (
        <div className="samples-item-controls-container">
          {pickButton}
          {moveButton}
          {collectButton}
        </div>
      );
    }

    return content;
  }


  moveItemUp(e) {
    e.stopPropagation();
    this.props.moveItem('UP');
  }


  moveItemDown(e) {
    e.stopPropagation();
    this.props.moveItem('DOWN');
  }


  moveItemRight(e) {
    e.stopPropagation();
    this.props.moveItem('RIGHT');
  }


  moveItemLeft(e) {
    e.stopPropagation();
    this.props.moveItem('LEFT');
  }


  showSeqId() {
    const showId = this.props.picked ? '' : 'none';
    return (
      <div>
        <div style={{ display: 'none' }} className="seq-id">{this.props.seqId}</div>
        <div style={{ display: showId }} className="queue-order">{this.props.queueOrder}</div>
      </div>
    );
  }


  showMoveArrows() {
    let [displayUp, displayDown, displayLeft, displayRight] = ['', '', '', ''];
    const [up, down, left, right] = this.props.canMove(this.props.itemKey);

    if (!left) {
      displayLeft = 'none';
    }

    if (!up) {
      displayUp = 'none';
    }

    if (!down) {
      displayDown = 'none';
    }

    if (!right) {
      displayRight = 'none';
    }

    let content = (<div></div>);

    if (this.props.moving) {
      content = (
        <div>
          <button
            style={{ display: displayUp }}
            className="move-arrow move-arrow-up"
            onMouseDown={this.moveItemUp}
          >
            <i className="glyphicon glyphicon-arrow-up" />
          </button>
          <button
            style={{ display: displayLeft }}
            className="move-arrow move-arrow-left"
            onMouseDown={this.moveItemLeft}
          >
            <i className="glyphicon glyphicon-arrow-left" />
          </button>
          <button
            style={{ display: displayRight }}
            className="move-arrow move-arrow-right"
            onMouseDown={this.moveItemRight}
          >
            <i className="glyphicon glyphicon-arrow-right" />
          </button>
          <button
            style={{ display: displayDown }}
            className="move-arrow move-arrow-down"
            onMouseDown={this.moveItemDown}
          >
            <i className="glyphicon glyphicon-arrow-down" />
          </button>
        </div>
      );
    }

    return content;
  }


  render() {
    const itemKey = this.props.itemKey;
    let classes = classNames('samples-grid-item',
      { 'samples-grid-item-selected': this.props.selected[itemKey] && !this.props.moving,
        'samples-grid-item-moving': this.props.moving,
        'samples-grid-item-to-be-collected': this.props.picked });

    let scLocationClasses = classNames('sc_location', 'label', 'label-default',
                                       { 'label-success': this.props.loadable });

    return (
      <div
        ref="sampleItem"
        className={classes}
        draggable="true"
        onMouseDown={this.onMouseDown}
        onMouseEnter={this.onMouseEnter}
      >
        {this.showMoveArrows()}
        {this.showItemControls()}
        <span className={scLocationClasses}>{this.props.location}</span>
        <br />
        <a href="#" ref="pacronym" className="protein-acronym" data-type="text"
          data-pk="1" data-url="/post" data-title="Enter protein acronym"
        >
          {this.props.name + (this.props.acronym ? ` ( ${this.props.acronym} )` : '')}
        </a>
        <br />
        {this.showSeqId()}
        <span className="dm">{this.props.dm}</span>
        <br />
        <div className="samples-grid-item-tasks">
          {
            this.props.tags.map((tag, i) => {
              const style = { display: 'inline-block', margin: '3px', cursor: 'pointer' };
              let content;

              if ((typeof tag) === 'string') {
                content = <span key={i} className="label label-primary" style={style}>{tag}</span>;
              } else {
                // assuming a Task
                let showForm = (e) => {
                  e.stopPropagation();
                  return this.props.showTaskParametersForm(tag.type, this.props.sampleID, tag);
                };

                let deleteTask = (e) => {
                  e.stopPropagation();
                  return this.props.deleteTask(this.props.sampleID, i);
                };

                content = (
                  <span key={i} className="btn-primary label" style={style} onClick={showForm}>
                    {`${tag.label} `}
                    <i className="fa fa-times" onClick={deleteTask} />
                  </span>
                );
              }

              return content;
            })
          }
        </div>
      </div>
    );
  }
}


SampleGridItem.defaultProps = {
  seqId: '',
  itemKey: '',
  sampleID: '',
  acronym: '',
  name: '',
  dm: '',
  loadable: [],
  location: '',
  tags: '',
  selected: false,
  deleteTask: undefined,
  showTaskParametersForm: undefined,
  toggleMovable: undefined,
  picked: false,
  moving: false,
  moveItem: undefined,
  canMove: undefined,
  pickSelected: undefined,
  dragStartSelection: undefined,
  dragSelectItem: undefined
};
