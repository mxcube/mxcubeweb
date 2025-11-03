import cx from 'classnames';
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
import SampleInformation from './SampleInformation';

export default function SampleGridTableItem({
  sampleData = {},
  queueOrder = '',
  current = false,
  picked = false,
  pickButtonOnClickHandler,
  children,
}) {
  function pickButtonOnClick(e) {
    pickButtonOnClickHandler?.(e, sampleData.sampleID);
  }

  function getItemControls() {
    return (
      <div className={styles.samplesItemControlsContainer}>
        <TooltipTrigger
          id="pick-sample"
          placement="auto"
          tooltipContent="Pick/Unpick sample for collect"
        >
          <Button
            variant="link"
            disabled={current && picked}
            className={styles.samplesGridTableItemButton}
            onClick={pickButtonOnClick}
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

  function getsequenceId() {
    const showId = picked ? '' : 'none';
    return (
      <div>
        <div style={{ display: showId }} className={styles.newQueueOrder}>
          {queueOrder}
        </div>
      </div>
    );
  }

  function getSampleName() {
    let name = sampleData.proteinAcronym || '';

    if (sampleData.sampleName && name) {
      name += ` - ${sampleData.sampleName}`;
    } else {
      name = sampleData.sampleName || '';
    }

    return name;
  }
  const currentSampleText = current ? '(MOUNTED)' : '';

  const classes = cx(styles.samplesGridTableItem, {
    [containerStyles.samplesGridTableItemToBeCollected]: picked,
    [containerStyles.samplesGridTableItemCollected]: isCollected(sampleData),
  });

  const scLocationClasses = cx(styles.scLocation, 'label', 'label-default', {
    [styles.labelCustomSuccess]: sampleData.loadable === true,
  });

  const limsLink = sampleData.limsLink || '#';
  const sampleName = getSampleName();

  return (
    <ListGroup variant="flush" id={sampleData.sampleID}>
      <ListGroup.Item className={classes}>
        <div className="d-flex">
          {getItemControls()}
          <div>
            <OverlayTrigger
              placement="right"
              overlay={
                <Popover id={sampleName}>
                  <Popover.Header className="d-flex">
                    <div>
                      <b className={styles.samplesGridTableItemNamePt}>
                        {sampleName}
                      </b>
                    </div>
                  </Popover.Header>
                  <Popover.Body>
                    <SampleInformation sampleData={sampleData} />
                  </Popover.Body>
                </Popover>
              }
            >
              <Badge
                href={limsLink}
                target="_blank"
                rel="noopener noreferrer"
                bg="light"
                text="primary"
                className={`${styles.samplesGridTableItemNameProteinAcronym} ms-1 mt-2`}
              >
                {sampleName}
              </Badge>
            </OverlayTrigger>
            <div
              style={{ pointerEvents: 'none' }}
              className={`ps-1 pe-1 ${scLocationClasses}`}
            >
              {sampleData.location} {currentSampleText}
            </div>
          </div>
          <CopyToClipboard
            text={sampleName}
            tittle="Sample Name"
            id={`copy_${sampleName}`}
          />
          {getsequenceId()}
        </div>
        {children}
      </ListGroup.Item>
    </ListGroup>
  );
}
