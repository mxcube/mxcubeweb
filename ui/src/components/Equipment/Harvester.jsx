import React from 'react';
import { Accordion, Card, Button, Badge } from 'react-bootstrap';
import { contextMenu, Menu, Item, Separator } from 'react-contexify';

import {CopyToClipboard} from 'react-copy-to-clipboard';
import { MdContentCopy } from 'react-icons/md';
import { FcCancel, FcRefresh, FcUpload, FcCollect } from 'react-icons/fc';

import ImageViewer from '../ImageViewer/ImageViewer.jsx';
// import '../SampleGrid/SampleGrid.css';
// import '../context-menu-style.css';

const getItems = (count) =>
  Array.from({ length: count }, (v, k) => k).map((k) => ({
    id: `item-${k}`,
    content: `item ${k}`,
  }));

// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

export default class Harvester extends React.Component {
  constructor(props) {
    super(props);
    this.harvestCrystal = this.harvestCrystal.bind(this);
    this.harvestAndLoadCrystal = this.harvestAndLoadCrystal.bind(this);
    this.unload = this.unload.bind(this);
    this.onCopy = this.onCopy.bind(this);
    this.state = {
      items: getItems(160),
      value: '',
      copied: false,
    };

    this.sampleItems = [];
  }

  componentDidMount() {}

  componentWillUnmount() {}

  showContextMenu(event, id) {
    let position = {
      x: event.clientX,
      y: event.clientY,
    };
    if (this.props.inPopover) {
      position = {
        x: event.offsetX,
        y: event.offsetY,
      };
    }

    contextMenu.show({
      id,
      event,
      position,
    });
  }

  harvestCrystal(UUID) {
    this.props.harvestCrystal(UUID);
  }

  harvestAndLoadCrystal(UUID) {
    this.props.harvestAndLoadCrystal(UUID);
  }
  unload() {
    this.props.unload('');
  }

  onCopy() {
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 1000);
  }

  // display some buttons depending on available features
  render() {

    const crystalUUID = this.props.contents.harverster_crystal_list;
    // const crystalUUID = crystalUUIDT? crystalUUIDT.concat(crystalUUIDT).concat(crystalUUIDT) : [];
    let sampleStateBackground = (key) => {
      if (key === 'ready_to_execute') {
        return 'success';
      } else if (key === 'harvested' || key === 'needs_repositionning') {
        return 'warning';
      } else if (key === 'failed') {
        return 'danger';
      } else {
        return 'info';
      }
    };

    const crystalMenu = (key) => (
      <Menu id={key} onShown={() => {}} onHidden={() => {}}>
        <Item onClick={() => this.harvestCrystal(key)}>
          <span>
            harvest Crystal <FcCollect />
          </span>
        </Item>
        <Item onClick={() => this.harvestAndLoadCrystal(key)}>
          <span>
            <FcCollect /> harvest & Load Sample <FcUpload />
          </span>
        </Item>
      </Menu>
    );

    return (
      <Accordion header="Contents" defaultActiveKey="0">
        <Accordion.Item eventKey="0">
          <Accordion.Header>
            <span style={{ marginLeft: '10px' }}>
              Number Of Available Pins : {this.props.contents.number_of_pins}
            </span>
          </Accordion.Header>
          <Accordion.Body>
            <div style={{ padding: '1em' }}>
              <Button variant="outline-secondary mb-2" onClick={this.props.refresh}>
                <FcRefresh /> Refresh
              </Button>
              <div
                className="ha-grid-container"
              >
                {crystalUUID
                  ? crystalUUID.map((item, index) => [
                      <div
                        key={item.crystal_uuid}
                        className="ha-grid-item"
                        // tabIndex={0}
                        role="button"
                        onContextMenu={(e) =>
                          this.showContextMenu(e, item.crystal_uuid)
                        }
                      >
                        <h6 className="text-center mt-1">
                          <Badge bg="primary" className="text-center">
                            {item.name}
                          </Badge>
                        </h6>
                        <ImageViewer
                          galleryView={false}
                          imgUrl={item.img_url}
                          imgAlt=""
                          imgTargetX={item.img_target_x}
                          imgTargetY={item.img_target_y}
                        />
                        <div className="crystal-uuid-caption">
                          <div className="mt-1">
                            <Badge
                              bg={sampleStateBackground(item.state)}
                            >
                              {item.state ? item.state.replace('_', ' ') : ''}
                            </Badge>
                          </div>
                          <div className="crystal-uuid-caption">
                            <span className='me-1'>{item.crystal_uuid}</span>
                            <CopyToClipboard
                              className="copy-link copy-link-ha"
                              text={item.crystal_uuid}
                              onCopy={this.onCopy}
                            >
                              <Button variant="content" className="btn-copy-link">
                                <MdContentCopy style={{ float: 'right' }} size="" />
                                <span
                                  className={`tooltiptext ${
                                    this.state.copied ? 'copy-link-glow' : ''
                                  }`}
                                  id="myTooltip"
                                >
                                  {this.state.copied
                                    ? 'crystal uuid Copied'
                                    : 'Copy crystal uuid to Clipboard'}
                                </span>
                              </Button>
                            </CopyToClipboard>
                          </div>
                        </div>
                      </div>,
                      crystalMenu(item.crystal_uuid),
                    ])
                  : null}
              </div>

              {/* <svg width="100%" height="100%" viewBox="0 0 100 100"
              >
                <image href="/files/2917/fxlogo.png" x="0" y="0" height="100" width="100" />
                <circle cx="50" cy="50" r="5"/>
              </svg> */}
            </div>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    );
  }
}
