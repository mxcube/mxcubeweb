import { Fragment } from 'react';
import { Badge, Button, Card } from 'react-bootstrap';
import { contextMenu, Item, Menu, Separator } from 'react-contexify';
import { FcCollect, FcRefresh, FcUpload } from 'react-icons/fc';
import { useDispatch, useSelector } from 'react-redux';

import {
  harvestAndLoadCrystal,
  harvestCrystal,
  refresh,
} from '../../actions/harvester.js';
import CopyToClipboard from '../CopyToClipboard/CopyToClipboard.jsx';
import ImageViewer from '../ImageViewer/ImageViewer.jsx';
import { sampleStateBackground } from '../SampleGrid/util.js';
import styles from './equipment.module.css';

export default function Harvester() {
  const dispatch = useDispatch();
  const contents = useSelector((state) => state.harvester.contents);

  const crystalUUID = contents.harvester_crystal_list;

  return (
    <Card>
      <Card.Header>
        <span style={{ marginLeft: '10px' }}>
          Number Of Available Pins : {contents.number_of_pins}
        </span>
      </Card.Header>
      <Card.Body>
        <div style={{ padding: '1em' }}>
          <Button
            variant="outline-secondary mb-2"
            onClick={() => dispatch(refresh())}
          >
            <FcRefresh /> Refresh
          </Button>
          <div className={styles.ha_grid_container}>
            {crystalUUID &&
              crystalUUID.map((item) => {
                const {
                  crystal_uuid: uuid,
                  name,
                  state,
                  img_url,
                  img_target_x,
                  img_target_y,
                } = item;

                return (
                  <Fragment key={uuid}>
                    <div
                      className={styles.ha_grid_item}
                      onContextMenu={(event) => {
                        contextMenu.show({
                          id: uuid,
                          event,
                          position: {
                            x: event.clientX,
                            y: event.clientY,
                          },
                        });
                      }}
                    >
                      <h6 className="text-center mt-1">
                        <Badge pill bg="light" style={{ color: 'brown' }}>
                          {name}
                        </Badge>
                      </h6>
                      <ImageViewer
                        galleryView={false}
                        imageUrl={img_url}
                        imageName={name}
                        imgAlt=""
                        imgTargetX={img_target_x}
                        imgTargetY={img_target_y}
                        drawTarget={false}
                      />
                      <div className={styles.crystal_uuid_caption}>
                        <div className="mt-1">
                          <Badge bg={sampleStateBackground(state)}>
                            {state ? state.replaceAll('_', ' ') : ''}
                          </Badge>
                        </div>
                        <div>
                          <span className="me-1">{uuid}</span>
                          <CopyToClipboard
                            text={uuid}
                            tittle="crystal uuid"
                            id={`copy_${uuid}`}
                          />
                        </div>
                      </div>
                    </div>

                    <Menu id={uuid}>
                      <Item onClick={() => dispatch(harvestCrystal(uuid))}>
                        <span>
                          harvest Crystal <FcCollect />
                        </span>
                      </Item>
                      <Separator />
                      <Item
                        onClick={() => dispatch(harvestAndLoadCrystal(uuid))}
                      >
                        <span>
                          <FcCollect /> harvest & Load Sample <FcUpload />
                        </span>
                      </Item>
                    </Menu>
                  </Fragment>
                );
              })}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
