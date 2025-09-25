/* eslint-disable react/destructuring-assignment */
import cx from 'classnames';
import React from 'react';
import {
  Badge,
  Button,
  ListGroup,
  OverlayTrigger,
  Popover,
} from 'react-bootstrap';
import { BsCheck2Square, BsSquare } from 'react-icons/bs';

import CopyToClipboard from '../../components/CopyToClipboard/CopyToClipboard';
import { isCollected } from '../../constants';
import containerStyles from '../../containers/SampleGridTableContainer.module.css';
import TooltipTrigger from '../TooltipTrigger';
import styles from './SampleGridTableItem.module.css';

export class SampleGridTableItem extends React.Component {
  static defaultProps = {
    itemKey: '',
    sampleData: {},
    queueOrder: [],
    selected: false,
    current: false,
    picked: false,
    allowedDirections: [],
    pickButtonOnClickHandler: undefined,
  };

  constructor(props) {
    super(props);
    this.pickButtonOnClick = this.pickButtonOnClick.bind(this);
    this.handleItemClick = this.handleItemClick.bind(this);
    this.sampleInformation = this.sampleInformation.bind(this);
  }

  pickButtonOnClick(e) {
    if (this.props.pickButtonOnClickHandler) {
      this.props.pickButtonOnClickHandler(e, this.props.sampleData.sampleID);
    }
  }

  itemControls() {
    return (
      <div className={styles.samplesItemControlsContainer}>
        <TooltipTrigger
          id="pick-sample"
          placement="auto"
          tooltipContent="Pick/Unpick sample for collect"
        >
          <Button
            variant="link"
            disabled={this.props.current && this.props.picked}
            className={styles.samplesGridTableItemButton}
            onClick={(e) => {
              this.pickButtonOnClick(e);
            }}
          >
            <i>
              {this.props.picked ? (
                <BsCheck2Square size="1em" />
              ) : (
                <BsSquare size="0.9em" />
              )}
            </i>
          </Button>
        </TooltipTrigger>
      </div>
    );
  }

  seqId() {
    const showId = this.props.picked ? '' : 'none';
    return (
      <div>
        <div style={{ display: showId }} className={styles.newQueueOrder}>
          {this.props.queueOrder}
        </div>
      </div>
    );
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
    const { sampleData } = this.props;
    const limsData = (
      <div>
        <div className="row">
          <span className="col-sm-6">Space group:</span>
          <span className="col-sm-6">{sampleData.crystalSpaceGroup}</span>
        </div>
        <div className="row">
          <span style={{ paddingTop: '0.5em' }} className="col-sm-12">
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
      </div>
    );

    return (
      <div>
        <div className="row">
          <span className="col-sm-6">Location:</span>
          <span className="col-sm-6">{sampleData.location}</span>
          <span className="col-sm-6">Data matrix:</span>
          <span className="col-sm-6">{sampleData.code}</span>
        </div>
        {sampleData.limsID ? limsData : ''}
      </div>
    );
  }

  handleItemClick(e) {
    if (this.props.onClick) {
      this.props.onClick(e, this.props.sampleData.sampleID);
    }
  }

  currentSampleText() {
    return this.props.current ? '(MOUNTED)' : '';
  }

  render() {
    const classes = cx(styles.samplesGridTableItem, {
      [containerStyles.samplesGridTableItemToBeCollected]: this.props.picked,
      [containerStyles.samplesGridTableItemCollected]: isCollected(
        this.props.sampleData,
      ),
    });

    const scLocationClasses = cx(styles.scLocation, 'label', 'label-default', {
      [styles.labelCustomSuccess]: this.props.sampleData.loadable === true,
    });

    const limsLink = this.props.sampleData.limsLink || '#';
    return (
      <ListGroup
        variant="flush"
        id={this.props.sampleData.sampleID}
        ref={(ref) => {
          this.sampleItem = ref; // eslint-disable-line react/no-unused-class-component-methods
        }}
        onClick={this.handleItemClick}
      >
        <ListGroup.Item className={classes}>
          <div className="d-flex">
            {this.itemControls()}
            <div>
              <OverlayTrigger
                placement="right"
                overlay={
                  <Popover id={this.sampleDisplayName()}>
                    <Popover.Header className="d-flex">
                      <div>
                        <b className={styles.samplesGridTableItemNamePt}>
                          {this.sampleDisplayName()}
                        </b>
                      </div>
                    </Popover.Header>
                    <Popover.Body>{this.sampleInformation()}</Popover.Body>
                  </Popover>
                }
              >
                <Badge
                  href={limsLink}
                  target="_blank"
                  bg="light"
                  text="primary"
                  ref={(ref) => {
                    this.pacronym = ref; // eslint-disable-line react/no-unused-class-component-methods
                  }}
                  className={`${styles.samplesGridTableItemNameProteinAcronym} ms-1 mt-2`}
                  data-type="text"
                  data-pk="1"
                  data-url="/post"
                  data-title="Enter protein acronym"
                >
                  {this.sampleDisplayName()}
                </Badge>
              </OverlayTrigger>
              <div
                style={{ pointerEvents: 'none' }}
                className={`ps-1 pe-1 ${scLocationClasses}`}
              >
                {this.props.sampleData.location} {this.currentSampleText()}
              </div>
            </div>
            <CopyToClipboard
              text={this.sampleDisplayName()}
              tittle="Sample Name"
              id={`copy_${this.sampleDisplayName()}`}
            />
            {this.seqId()}
          </div>
          {this.props.children}
        </ListGroup.Item>
      </ListGroup>
    );
  }
}
