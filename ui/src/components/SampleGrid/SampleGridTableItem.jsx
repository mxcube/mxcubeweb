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
import { getSampleName, sampleStateBackground } from './util';

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

  const classes = cx(styles.samplesGridTableItem, {
    [containerStyles.samplesGridTableItemToBeCollected]: picked,
    [containerStyles.samplesGridTableItemCollected]: isCollected(sampleData),
  });

  const scLocationClasses = cx(styles.scLocation, 'label', 'label-default', {
    [styles.labelCustomSuccess]: sampleData.loadable === true,
  });

  const limsLink = sampleData.limsLink || '#';
  const sampleName = getSampleName(sampleData);

  return (
    <ListGroup variant="flush" id={sampleData.sampleID}>
      <ListGroup.Item className={classes}>
        <div className="d-flex">
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
                <CopyToClipboard
                  text={sampleName}
                  tittle="Sample Name"
                  id={`copy_${sampleName}`}
                />
                <span className="ms-1">{sampleName}</span>
              </Badge>
            </OverlayTrigger>

            <div className={`ps-1 pe-1 ${scLocationClasses}`}>
              {sampleData.location}
              {current ? (
                ' (MOUNTED)'
              ) : (
                <div className={styles.sampleStateBadge}>
                  <Badge
                    bg={sampleStateBackground(
                      sampleData?.container_info?.state,
                    )}
                  >
                    {sampleData?.container_info?.state?.replaceAll('_', ' ')}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          <div
            style={{ display: picked ? '' : 'none' }}
            className={styles.newQueueOrder}
          >
            {queueOrder}
          </div>
        </div>
        {children}
      </ListGroup.Item>
    </ListGroup>
  );
}
