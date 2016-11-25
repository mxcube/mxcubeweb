import React from 'react';
import { OverlayTrigger, Tooltip, Popover } from 'react-bootstrap';
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
    this.sampleInformation = this.sampleInformation.bind(this);
    this.taskTagName = this.taskTagName.bind(this);
    this.taskSummary = this.taskSummary.bind(this);
    this.taskTitle = this.taskTitle.bind(this);
    this.taskStateClass = this.taskStateClass.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.taskResult = this.taskResult.bind(this);
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

    // If the ctrl key pressesd then toggle selection and add to preivous
    // selection.
    if (e.ctrlKey) {
      this.props.toggleSelectedSample(this.props.itemKey);

    // If shift key is pressed select range from first selected item to this
    // (currently clicked item)
    } else if (e.shiftKey) {
      this.props.dragSelectItem(this.props.itemKey, this.props.seqId);
    } else {
      // On left click just select the clicked item, on left click only
      // select if the item is not already selected. This makes selection
      // feature work nicely with the context menu.
      if (e.nativeEvent.buttons === 1) {
        this.props.dragStartSelection(this.props.itemKey, this.props.seqId);
      } else if (e.nativeEvent.button === 2) {
        if (!this.props.selected[this.props.itemKey]) {
          this.props.dragStartSelection(this.props.itemKey, this.props.seqId);
        }
      }
    }
  }


  onMouseEnter(e) {
    if (e.nativeEvent.buttons === 1 || e.nativeEvent.button === 2) {
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
        overlay={(<Tooltip id="pick-sample">Pick/Unpick sample for collect</Tooltip>)}
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
        overlay={(
          <Tooltip id="move-sample">
            Move sample (change order in which sample is collected)
          </Tooltip>)}
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
        overlay={(<Tooltip id="mount-and-collect" >Mount and collect THIS sample now</Tooltip>)}
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


  sampleDisplayName() {
    let name = this.props.sampleData.sampleName;

    if (this.props.sampleData.proteinAcronym) {
      name += ` - ${this.props.sampleData.proteinAcronym}`;
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


  taskTagName(type) {
    let res = 'DC';

    if (type === 'DataCollection') {
      res = 'DC';
    } else if (type === 'Characterisation') {
      res = 'C';
    }

    return res;
  }


  taskSummary(task) {
    let filePath = `${this.props.rootPath}/${task.parameters.path}/${task.parameters.prefix}`;
    filePath += `_${task.parameters.run_number}_xxxx.cbf`;
    return (
      <div>
        <div className="row">
          <span style={{ paddingBottom: '0.5em' }} className="col-sm-12">
            <b>Path: {filePath}</b>
          </span>
          <span className="col-sm-3">Oscillation range:</span>
          <span className="col-sm-3">{task.parameters.osc_range}&deg;</span>
          <span className="col-sm-3">First image</span>
          <span className="col-sm-3">{task.parameters.first_image}</span>

          <span className="col-sm-3">Oscillation start:</span>
          <span className="col-sm-3">{task.parameters.osc_start}&deg;</span>
          <span className="col-sm-3">Number of images</span>
          <span className="col-sm-3">{task.parameters.num_images}</span>

          <span className="col-sm-3">Exposure time:</span>
          <span className="col-sm-3">{`${task.parameters.exp_time}s`}</span>
          <span className="col-sm-3">Transmission</span>
          <span className="col-sm-3">{`${task.parameters.transmission} %`}</span>

          <span className="col-sm-3">Energy:</span>
          <span className="col-sm-3">{`${task.parameters.energy} KeV`}</span>
          <span className="col-sm-3">Resolution</span>
          <span className="col-sm-3">{`${task.parameters.resolution} Å`}</span>
        </div>
      </div>
   );
  }


  taskResult(task) {
    let content = (<div></div>);
    let lImageUrl = '';
    let fImageUrl = '';

    const r = task.limsResultData;
    if (task.limsResultData && Object.keys(task.limsResultData).length > 0) {
      if (task.limsResultData.firstImageId) {
        fImageUrl = '/mxcube/api/v0.1/lims/dc/thumbnail/';
        fImageUrl += task.limsResultData.firstImageId.toString();
      }

      if (task.limsResultData.lastImageId) {
        lImageUrl = '/mxcube/api/v0.1/lims/dc/thumbnail/';
        lImageUrl += task.limsResultData.lastImageId.toString();
      }

      const sFlux = parseInt(r.flux, 10) / Math.pow(10, 9);
      const eFlux = parseInt(r.flux_end, 10) / Math.pow(10, 9);

      content = (
        <div>
          <div
            className="row"
            style={ { paddingLeft: '1em', paddingTop: '1em', paddingBottom: '0.2em' } }
          >
            <b>Status: {r.runStatus}</b>
          </div>

          <div className="row">
            <span className="col-sm-3">Resolution at collect</span>
            <span className="col-sm-3">{`${r.resolution} Å`}</span>
            <span className="col-sm-3">Resolution at corner:</span>
            <span className="col-sm-3">{`${r.resolutionAtCorner} Å`}</span>
          </div>

          <div className="row">
            <span className="col-sm-3">Wavelength</span>
            <span className="col-sm-3">{`${r.wavelength} Å`}</span>
            <span className="col-sm-3"> </span>
            <span className="col-sm-3"> </span>
          </div>

          <div className="row" style={ { paddingTop: '1em' } }>
            <span className="col-sm-2">Start time:</span>
            <span className="col-sm-4">{r.startTime}</span>
            <span className="col-sm-2">End time</span>
            <span className="col-sm-4">{r.endTime}</span>
          </div>

          <div className="row">
            <span className="col-sm-2">Flux at start:</span>
            <span className="col-sm-4">{sFlux}e+9 (Giga) ph/s</span>
            <span className="col-sm-2">Flux at end</span>
            <span className="col-sm-4">{eFlux}e+9 (Giga) ph/s</span>
          </div>

          <div className="row" style={ { paddingTop: '0.5em' } } >
            <span className="col-sm-6">
              <b>First image: </b>
              <img ref="fimage" alt="First" src={fImageUrl} />
            </span>
            <span className="col-sm-6">
              <b>Last image: </b>
              <img ref="limage" alt="Last" src={lImageUrl} />
            </span>
          </div>
        </div>
      );
    }

    return content;
  }

  taskTitle(task) {
    const point = task.parameters.point !== -1 ? ` at P-${task.parameters.point}` : '';
    let taskStatus = 'To be collected';

    if (task.state === 1) {
      taskStatus = 'In progress';
    } else if (task.state === 2) {
      taskStatus = 'Collected';
    }

    return `${task.label}${point} (${taskStatus})`;
  }

  taskStateClass(task) {
    let cls = 'btn-primary';

    if (task.state === 1) {
      cls = 'btn-warning';
    } else if (task.state === 2) {
      cls = 'btn-success';
    }

    return cls;
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


  handleClick(task) {
    if (task.state === 0) {
      this.props.showTaskParametersForm(task.type, task.sampleID, task);
    }
  }


  render() {
    const itemKey = this.props.itemKey;

    let classes = classNames('samples-grid-item',
      { 'samples-grid-item-selected': this.props.selected[itemKey] && !this.props.moving,
        'samples-grid-item-moving': this.props.moving,
        'samples-grid-item-to-be-collected': this.props.picked &&
                                             !(this.props.collected || this.props.current),
        'samples-grid-item-current': this.props.current && !this.props.collected,
        'samples-grid-item-collected': this.props.collected });

    let scLocationClasses = classNames('sc_location', 'label', 'label-default',
                                       { 'label-success': this.props.loadable });

    const limsLink = this.props.sampleData.limsLink ? this.props.sampleData.limsLink : '#';

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
        <div className={scLocationClasses}>{this.props.location}</div>
        <div style={{ display: 'block', clear: 'both' }}>
        <OverlayTrigger
          ref="sampleInfoPopoverTrigger"
          placement={this.popoverPosition()}
          overlay={(
            <Popover title={(<b>{this.sampleDisplayName()}</b>)}>
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
        {this.showSeqId()}
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
                  return this.handleClick(tag, this.props.sampleID);
                };

                let deleteTask = (e) => {
                  e.stopPropagation();
                  return this.props.deleteTask(this.props.sampleID, i);
                };

                content = (
                  <div key={i}>
                    <OverlayTrigger
                      ref="taskSummaryPopoverTrigger"
                      placement={this.popoverPosition()}
                      overlay={(
                        <Popover
                          style={{ minWidth: '700px !important', paddingBottom: '1em' }}
                          title={(<b>{this.taskTitle(tag)}</b>)}
                        >
                           {this.taskSummary(tag)}
                           {this.taskResult(tag)}
                        </Popover>) }
                    >
                      <span
                        className={`${this.taskStateClass(tag)} label`}
                        style={style}
                        onClick={showForm}
                      >
                        {this.taskTagName(tag.type)}
                        <i className="fa fa-times" onClick={deleteTask} />
                      </span>
                    </OverlayTrigger>
                  </div>
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
