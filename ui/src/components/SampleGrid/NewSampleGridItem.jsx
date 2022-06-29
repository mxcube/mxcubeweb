import React from 'react';
import { ListGroup, OverlayTrigger, Tooltip, Popover, Badge, Button } from 'react-bootstrap';
import classNames from 'classnames';
import { isCollected } from '../../constants';

import { BsSquare, BsCheck2Square, BsArrowsMove  } from "react-icons/bs";
import './NewSampleGrid.css';


export const SAMPLE_ITEM_WIDTH = 943.5;
export const SAMPLE_ITEM_HEIGHT = 30;
export const SAMPLE_ITEM_SPACE = 4;


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
    this.sampleItem.addEventListener('contextmenu', this.contextMenu, false);
  }

  componentWillUnmount() {
    this.sampleItem.removeEventListener('contextmenu', this.contextMenu);
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
    let icon = <BsSquare size='0.9em'/>;

    if (this.props.picked) {
      icon = <BsCheck2Square size='0.9em'/>;
    }

    const pickButton = (
      <OverlayTrigger
        placement="auto"
        overlay={(<Tooltip id="pick-sample">Pick/Unpick sample for collect</Tooltip>)}
        trigger={["hover", "focus"]}
      >
        <Button
          variant="content"
          disabled={this.props.current && this.props.picked}
          className="new-samples-grid-item-button"
          onClick={this.pickButtonOnClick}
          onMouseUp={this.pickButtonMouseUp}
          onMouseDown={this.pickButtonMouseDown}
        >
          <i>{icon}</i>
        </Button>
      </OverlayTrigger>
    );

    let content = (
      <div className="samples-item-controls-container">
        {pickButton}
      </div>
    );

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
        <div style={{ display: showId }} className="new-queue-order">{this.props.queueOrder}</div>
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

    let content = (<div />);

    if (this.props.moving) {
      content = (
        <div>
          <button
            style={{ display: displayUp }}
            className="move-arrow move-arrow-up"
            onClick={this.moveItemUp}
          >
            <i className="fas fa-arrow-up" />
          </button>
          <button
            style={{ display: displayLeft }}
            className="move-arrow move-arrow-left"
            onClick={this.moveItemLeft}
          >
            <i className="fas fa-arrow-left" />
          </button>
          <button
            style={{ display: displayRight }}
            className="move-arrow move-arrow-right"
            onClick={this.moveItemRight}
          >
            <i className="fas fa-arrow-right" />
          </button>
          <button
            style={{ display: displayDown }}
            className="move-arrow move-arrow-down"
            onClick={this.moveItemDown}
          >
            <i className="fas fa-arrow-down" />
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
    const {sampleData} = this.props;
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


  sampleItemOnClick(e) {
    if (this.props.onClick) {
      this.props.onClick(e, this.props.sampleData.sampleID);
    }
  }

  currentSampleText() {
    return this.props.current ? '(MOUNTED)' : '';
  }


  render() {
    const classes = classNames('new-samples-grid-item',
      { 
        // 'new-samples-grid-item-selected': this.props.selected && !this.props.moving,
        // 'new-samples-grid-item-moving': this.props.moving,
        'new-samples-grid-item-to-be-collected': this.props.picked,
        'new-samples-grid-item-collected': isCollected(this.props.sampleData) });

    const scLocationClasses = classNames('sc_location', 'label', 'label-default',
      { 'label-custom-success': this.props.sampleData.loadable === true });

    const limsLink = this.props.sampleData.limsLink ? this.props.sampleData.limsLink : '#';

    return (
      <ListGroup
        variant="flush"
        id={this.props.sampleData.sampleID}
        ref={(ref) => { this.sampleItem = ref; }}
        onClick={this.sampleItemOnClick}
        // style={{ width: `${SAMPLE_ITEM_WIDTH}px`, height: `${SAMPLE_ITEM_HEIGHT}px` }}
        style={{ width: 'inherit', minHeight: `${SAMPLE_ITEM_HEIGHT}px` }}
      >
        <ListGroup.Item className={classes}>
          <div className="d-flex">
            {this.itemControls()}
            <div className='me-auto d-flex' style={{ marginTop: '0.4em'}}>
              <div style={{ display: 'block', clear: 'both', pointerEvents: 'none' }}>
                <OverlayTrigger
                    placement='auto'
                    overlay={(
                      <Popover id={this.sampleDisplayName()}>
                        <Popover.Header>
                          <b>{this.sampleDisplayName()}</b>
                        </Popover.Header>
                        <Popover.Body>
                          {this.sampleInformation()}
                        </Popover.Body>
                      </Popover>)}
                  >
                    <Badge href={limsLink}
                      target="_blank"
                      bg="light"
                      text="primary"
                      ref={(ref) => { this.pacronym = ref; }}
                      className="protein-acronym ms-1"
                      data-type="text" data-pk="1" data-url="/post" data-title="Enter protein acronym"
                    >
                      {this.sampleDisplayName()}
                    </Badge>
                  </OverlayTrigger>
                  <div className={`ps-1 pe-1 ${scLocationClasses}`}>
                    {this.props.sampleData.location} {this.currentSampleText()}
                  </div>
                  {this.seqId()}
                </div>
              </div>
          </div>
        </ListGroup.Item>
      </ListGroup>
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
