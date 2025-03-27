import React from 'react';
import {
  ListGroup,
  OverlayTrigger,
  Popover,
  Badge,
  Button,
} from 'react-bootstrap';
import cx from 'classnames';

import CopyToClipboard from '../../components/CopyToClipboard/CopyToClipboard';

import { isCollected } from '../../constants';

import { BsSquare, BsCheck2Square } from 'react-icons/bs';
import './SampleGridTable.css';
import TooltipTrigger from '../TooltipTrigger';

export default function SampleGridTableItem(props) {
  const {
    itemKey = '',
    sampleData = {},
    queueOrder = [],
    // selected = false,
    current = false,
    picked = false,
    pickButtonOnClickHandler = undefined,
  } = props;

  function pickButtonOnClick(e) {
    if (pickButtonOnClickHandler) {
      pickButtonOnClickHandler(e, sampleData.sampleID);
    }
  }

  function itemControls() {
    return (
      <div className="samples-item-controls-container">
        <TooltipTrigger
          id="pick-sample"
          placement="auto"
          tooltipContent="Pick/Unpick sample for collect"
        >
          <Button
            variant="link"
            disabled={current && picked}
            className="samples-grid-table-item-button"
            onClick={(e) => {
              pickButtonOnClick(e);
            }}
          >
            <i>
              {picked ? (
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

  function seqId() {
    const showId = picked ? '' : 'none';
    return (
      <div>
        <div style={{ display: showId }} className="new-queue-order">
          {queueOrder}
        </div>
      </div>
    );
  }

  function sampleDisplayName() {
    let name = sampleData.proteinAcronym || '';

    if (sampleData.sampleName && name) {
      name += ` - ${sampleData.sampleName}`;
    } else {
      name = sampleData.sampleName || '';
    }

    return name;
  }

  function sampleInformation() {
    const { sampleData } = props;
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

  // function handleItemClick(e) {
  //   // if (onClick) {
  //   //   onClick(e, sampleData.sampleID);
  //   // }
  // }

  function currentSampleText() {
    return current ? '(MOUNTED)' : '';
  }

  const classes = cx('samples-grid-table-item', {
    'samples-grid-table-item-to-be-collected': picked,
    'samples-grid-table-item-collected': isCollected(sampleData),
  });

  const scLocationClasses = cx('sc_location', 'label', 'label-default', {
    'label-custom-success': sampleData.loadable === true,
  });

  const limsLink = sampleData.limsLink || '#';
  return (
    <ListGroup
      key={itemKey}
      variant="flush"
      id={sampleData.sampleID}
      // onClick={handleItemClick}
    >
      <ListGroup.Item className={classes}>
        <div className="samples-grid-table-item-top d-flex">
          {itemControls()}
          <div>
            <OverlayTrigger
              placement="right"
              overlay={
                <Popover id={sampleDisplayName()}>
                  <Popover.Header className="d-flex">
                    <div>
                      <b className="samples-grid-table-item-name-pt">
                        {sampleDisplayName()}
                      </b>
                    </div>
                  </Popover.Header>
                  <Popover.Body>{sampleInformation()}</Popover.Body>
                </Popover>
              }
            >
              <Badge
                href={limsLink}
                target="_blank"
                bg="light"
                text="primary"
                className="samples-grid-table-item-name-protein-acronym ms-1 mt-2"
                data-type="text"
                data-pk="1"
                data-url="/post"
                data-title="Enter protein acronym"
              >
                {sampleDisplayName()}
              </Badge>
            </OverlayTrigger>
            <div
              style={{ pointerEvents: 'none' }}
              className={`ps-1 pe-1 ${scLocationClasses}`}
            >
              {sampleData.location} {currentSampleText()}
            </div>
          </div>
          <CopyToClipboard
            text={sampleDisplayName()}
            tittle="Sample Name"
            id={`copy_${sampleDisplayName()}`}
          />
          {seqId()}
        </div>
        {props.children}
      </ListGroup.Item>
    </ListGroup>
  );
}
