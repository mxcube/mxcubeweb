import React from 'react';
import { OverlayTrigger, Tooltip, Popover } from 'react-bootstrap';
import classNames from 'classnames';
import { isCollected } from '../../constants';

import './SampleGrid.css';


export const SAMPLE_ITEM_WIDTH = 192;
export const SAMPLE_ITEM_HEIGHT = 130;
export const SAMPLE_ITEM_SPACE = 8;


export class SampleGridItem extends React.Component {

  constructor(props) {
    super(props);
    this.pickButtonOnClick = this.pickButtonOnClick.bind(this);
    this.sampleItemOnClick = this.sampleItemOnClick.bind(this);
    this.moveButtonOnClick = this.moveButtonOnClick.bind(this);
    this.pickButtonMouseUp = this.pickButtonMouseUp.bind(this);
    this.pickButtonMouseDown = this.pickButtonMouseDown.bind(this);

    this.moveItem = this.moveItem.bind(this);
    this.moveItemUp = this.moveItemUp.bind(this);
    this.moveItemDown = this.moveItemDown.bind(this);
    this.moveItemRight = this.moveItemRight.bind(this);
    this.moveItemLeft = this.moveItemLeft.bind(this);

    this.sampleInformation = this.sampleInformation.bind(this);
  }


  componentDidMount() {
    this.refs.sampleItem.addEventListener('contextmenu', (e) => this.contextMenu(e), false);
  }

  contextMenu(e) {
    e.preventDefault();
  }

  pickButtonOnClick(e) {
    if (this.props.pickButtonOnClickHandler) {
      this.props.pickButtonOnClickHandler(e, this.props.sampleData.sampleID);
    }
  }

  moveButtonOnClick(e) {
    if (this.props.moveButtonOnClickHandler) {
      this.props.moveButtonOnClickHandler(e, this.props.sampleData.sampleID);
    }
  }

  pickButtonMouseDown(e) {
    e.stopPropagation();
  }

  pickButtonMouseUp(e) {
    e.stopPropagation();
  }

  moveItem(e, direction) {
    if (this.props.onMoveHandler) {
      this.props.onMoveHandler(e, this.props.sampleData.sampleID, direction);
    }
  }

  itemControls() {
    let iconClassName = 'glyphicon glyphicon-unchecked';

    if (this.props.picked) {
      iconClassName = 'glyphicon glyphicon-check';
    }

    const pickButton = (
      <OverlayTrigger
        placement="top"
        overlay={(<Tooltip id="pick-sample">Pick/Unpick sample for collect</Tooltip>)}
      >
        <button
          className="samples-grid-item-button"
          onClick={this.pickButtonOnClick}
          onMouseUp={this.pickButtonMouseUp}
          onMouseDown={this.pickButtonMouseDown}
          disabled={this.props.current}
        >
          <i className={iconClassName} />
        </button>
      </OverlayTrigger>
    );

    const moveButton = (
      <OverlayTrigger
        placement="top"
        overlay={(
          <Tooltip id="move-sample">
            Move sample (change order in which sample is collected)
          </Tooltip>)}
      >
        <button
          className="samples-grid-item-button"
          onClick={this.moveButtonOnClick}
        >
          <i className="glyphicon glyphicon-move" />
        </button>
      </OverlayTrigger>
     );

    let content = (
      <div className="samples-item-controls-container">
      {pickButton}
      </div>
    );

    if (this.props.selected && !this.props.allowedDirections.every(value => value === false)) {
      content = (
        <div className="samples-item-controls-container">
          {pickButton}
          {moveButton}
        </div>
      );
    }

    return content;
  }


  moveItemUp(e) {
    this.moveItem(e, 'UP');
  }


  moveItemDown(e) {
    this.moveItem(e, 'DOWN');
  }


  moveItemRight(e) {
    this.moveItem(e, 'RIGHT');
  }


  moveItemLeft(e) {
    this.moveItem(e, 'LEFT');
  }


  seqId() {
    const showId = this.props.picked ? '' : 'none';
    return (
      <div>
        <div style={{ display: showId }} className="queue-order">{this.props.queueOrder}</div>
      </div>
    );
  }


  moveArrows() {
    let [displayUp, displayDown, displayLeft, displayRight] = ['', '', '', ''];
    const [up, down, left, right] = this.props.allowedDirections;

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
            onClick={this.moveItemUp}
          >
            <i className="glyphicon glyphicon-arrow-up" />
          </button>
          <button
            style={{ display: displayLeft }}
            className="move-arrow move-arrow-left"
            onClick={this.moveItemLeft}
          >
            <i className="glyphicon glyphicon-arrow-left" />
          </button>
          <button
            style={{ display: displayRight }}
            className="move-arrow move-arrow-right"
            onClick={this.moveItemRight}
          >
            <i className="glyphicon glyphicon-arrow-right" />
          </button>
          <button
            style={{ display: displayDown }}
            className="move-arrow move-arrow-down"
            onClick={this.moveItemDown}
          >
            <i className="glyphicon glyphicon-arrow-down" />
          </button>
        </div>
      );
    }

    return content;
  }


  sampleDisplayName() {
    let name = this.props.sampleData.proteinAcronym || '';

    if (this.props.sampleData.sampleName && name) {
      name += ` - ${this.props.sampleData.sampleName}`;
    } else {
      name = this.props.sampleData.sampleName || '';
    }

    return name;
  }


  sampleInformation() {
    const sampleData = this.props.sampleData;
    const limsData = (
      <div>
        <div className="row">
          <span className="col-sm-6">Space group:</span>
          <span className="col-sm-6">{sampleData.crystalSpaceGroup}</span>
        </div>
        <div className="row">
          <span style={{ 'padding-top': '0.5em' }} className="col-sm-12">
            <b>Crystal unit cell:</b>
          </span>
          <span className="col-sm-1">A:</span>
          <span className="col-sm-2">{sampleData.cellA}</span>
          <span className="col-sm-1">B:</span>
          <span className="col-sm-2">{sampleData.cellB}</span>
          <span className="col-sm-1">C:</span>
          <span className="col-sm-2">{sampleData.cellC}</span>
        </div>
        <div className="row">
          <span className="col-sm-1">&alpha;:</span>
          <span className="col-sm-2">{sampleData.cellAlpha}</span>
          <span className="col-sm-1">&beta;:</span>
          <span className="col-sm-2">{sampleData.cellBeta}</span>
          <span className="col-sm-1">&gamma;:</span>
          <span className="col-sm-2">{sampleData.cellGamma}</span>
        </div>
      </div>);

    return (
      <div>
        <div className="row">
          <span className="col-sm-6">Location:</span>
          <span className="col-sm-6">{sampleData.location}</span>
          <span className="col-sm-6">Data matrix:</span>
          <span className="col-sm-6">{sampleData.code}</span>
        </div>
        { sampleData.limsID ? limsData : '' }
      </div>
    );
  }


  popoverPosition() {
    const viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    let result = 'bottom';

    if (this.refs.sampleItem) {
      if (parseInt(this.refs.sampleItem.style.top, 10) <= (viewportHeight / 2)) {
        result = 'bottom';
      } else {
        result = 'top';
      }
    }

    return result;
  }


  sampleItemOnClick(e) {
    if (this.props.onClick) {
      this.props.onClick(e, this.props.sampleData.sampleID);
    }
  }


  render() {
    let classes = classNames('samples-grid-item',
      { 'samples-grid-item-selected': this.props.selected && !this.props.moving,
        'samples-grid-item-moving': this.props.moving,
        'samples-grid-item-to-be-collected':
          this.props.picked && (!isCollected(this.props.sampleData) || this.props.current),
        'samples-grid-item-current': this.props.current && !isCollected(this.props.sampleData),
        'samples-grid-item-collected': isCollected(this.props.sampleData) });

    let scLocationClasses = classNames('sc_location', 'label', 'label-default',
      { 'label-success': this.props.sampleData.loadable === true });

    const limsLink = this.props.sampleData.limsLink ? this.props.sampleData.limsLink : '#';

    return (
      <div
        id={this.props.sampleData.sampleID}
        ref="sampleItem"
        className={classes}
        onClick={this.sampleItemOnClick}
      >
        {this.moveArrows()}
        {this.itemControls()}
        <div className={scLocationClasses}>{this.props.sampleData.location}</div>
        <div style={{ display: 'block', clear: 'both' }}>
        <OverlayTrigger
          ref="sampleInfoPopoverTrigger"
          placement={this.popoverPosition()}
          overlay={(
            <Popover id={this.sampleDisplayName()} title={(<b>{this.sampleDisplayName()}</b>)}>
              {this.sampleInformation()}
            </Popover>)}
        >
          <a href={limsLink} ref="pacronym" className="protein-acronym" data-type="text"
            data-pk="1" data-url="/post" data-title="Enter protein acronym"
          >
            {this.sampleDisplayName()}
          </a>
        </OverlayTrigger>
        </div>
        {this.seqId()}
        <br />
        <div className="samples-grid-item-tasks">
          { this.props.children }
        </div>
      </div>
    );
  }
}


SampleGridItem.defaultProps = {
  itemKey: '',
  sampleData: {},
  queueOrder: [],
  selected: false,
  current: false,
  picked: false,
  moving: false,
  allowedDirections: [],
  pickButtonOnClickHandler: undefined,
  moveButtonOnClickHandler: undefined,
  onMoveHandler: undefined
};
