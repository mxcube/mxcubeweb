import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { contextMenu, Menu, Item, Separator } from 'react-contexify';

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
    this.abort = this.abort.bind(this);
    this.state = {
      items: getItems(160),
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

  abort() {
    this.props.abort();
  }

  // display some buttons depending on available features
  render() {
    let current = '';
    let abortButton = '';

    const crystalUUID = this.props.contents.harverster_crystal_list;
    // const crystalUUID = crystalUUIDT? crystalUUIDT.concat(crystalUUIDT).concat(crystalUUIDT) : [];
    let sampleStateBackground = (key) => {
      if (key === 'ready_to_execute') {
        return 'label-success';
      } else if (key === 'harvested' || key === 'needs_repositionning') {
        return 'label-warning';
      } else if (key === 'failed') {
        return 'label-danger';
      } else {
        return 'label-info';
      }
    };

    if (this.props.state === 'MOVING') {
      abortButton = (
        <Button bsStyle="default" className="abortButton" onClick={this.abort}>
          <FcCancel /> Abort
        </Button>
      );
    } else {
      abortButton = '';
    }

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
      <Card header="Contents">
        <Card.Header style={{ marginBottom: '1em' }}>
          <span style={{ marginLeft: '10px' }}>
            Number Of Available Pins : {this.props.contents.number_of_pins}
          </span>
        </Card.Header>
        <div style={{ padding: '1em' }}>
          <Button variant="outline-secondary" onClick={this.props.refresh}>
            <FcRefresh /> Refresh
          </Button>
          <span style={{ marginLeft: '1em' }}>{abortButton}</span>
          {current}
          <div style={{ marginBottom: '1em' }} />
          <div
            className="grid-container"
            style={{ maxHeight: '70vh', overflowY: 'auto' }}
          >
            {crystalUUID
              ? crystalUUID.map((item, index) => [
                  <div
                    key={item.crystal_uuid}
                    className="grid-item"
                    onMouseDown={this.onMouseDown}
                    onMouseUp={this.onMouseUp}
                    onMouseMove={this.onMouseMove}
                    tabIndex={0}
                    role="button"
                    onContextMenu={(e) =>
                      this.showContextMenu(e, item.crystal_uuid)
                    }
                  >
                    <div
                      className="selection-rubber-band"
                      id="selectionRubberBand"
                    />
                    <h4 className="text-center">
                      <span className="label label-primary">{item.name}</span>
                    </h4>
                    <img src={item.img_url} className="img-responsive" />
                    <ImageViewer
                      galleryView={false}
                      imgUrl={item.img_url}
                      imgAlt=""
                      imgTargetX={item.img_target_x}
                      imgTargetY={item.img_target_y}
                    />
                    <div className="row crystal-uuid-caption">
                      <div className="col-md-12">
                        <span
                          className={`label ${sampleStateBackground(
                            item.state,
                          )} btn-product`}
                        >
                          {item.state ? item.state.replace('_', ' ') : ''}
                        </span>
                      </div>
                      <div className="crystal-uuid-caption">
                        <p>{item.crystal_uuid}</p>
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
      </Card>
    );
  }
}
