import React from 'react';
import classNames from 'classnames';
import { Button } from 'react-bootstrap';
import 'bootstrap-webpack!bootstrap-webpack/bootstrap.config.js';
import './SampleGrid.css';


export const SAMPLE_ITEM_WIDTH = 190;
export const SAMPLE_ITEM_HEIGHT = 130;
export const SAMPLE_ITEM_SPACE = 4;


export class SampleGridItem extends React.Component {

  constructor(props) {
    super(props);
    this.onClick = props.onClick.bind(this, props.selectKey);
    this._toggleMoveable = this._toggleMoveable.bind(this);
    this.moveItemUp = this.moveItemUp.bind(this);
    this.moveItemDown = this.moveItemDown.bind(this);
    this.moveItemRight = this.moveItemRight.bind(this);
    this.moveItemLeft = this.moveItemLeft.bind(this);
  }


  _toggleMoveable(e){
    e.stopPropagation();
    this.props.toggleMoveable(this.props.selectKey)
  }


  showMoveable(){
    if (this.props.selected) {
      return (
        <div>
          <Button
            className="samples-grid-item-move-button"
            bsStyle="primary"
            bsSize="xs"
            onClick={this._toggleMoveable}
          >
            <i className="glyphicon glyphicon-move"/>
          </Button>
        </div>
      );
    } else {
      return ""
    }
  }


  moveItemUp(e){
    e.stopPropagation();
    this.props.moveItem('UP');
  }


  moveItemDown(e){
    e.stopPropagation();
    this.props.moveItem('DOWN');
  }


  moveItemRight(e){
    e.stopPropagation();
    this.props.moveItem('RIGHT');
  }


  moveItemLeft(e){
    e.stopPropagation();
    this.props.moveItem('LEFT');
  }


  showMoveArrows(){
    let [displayUp, displayDown, displayLeft, displayRight] = ['', '', '', '']
    let [canMoveUp, canMoveDown, canMoveLeft, canMoveRight]= this.props.canMove(this.props.itemKey);

    if (!canMoveLeft) {
      displayLeft = 'none';
    }

    if (!canMoveUp) {
      displayUp = 'none';
    }

    if (!canMoveDown) {
      displayDown = 'none';
    }

    if (!canMoveRight) {
      displayRight = 'none';
    }

    if (this.props.moving) {
      return (
        <div>
          <div className="seq-id">{this.props.seqId}</div>
          <button
            style={{display:displayUp}}
            className="move-arrow move-arrow-up"
            onClick={this.moveItemUp}
          >
            <i className="glyphicon glyphicon-arrow-up" />
          </button>
          <button
            style={{display:displayLeft}}
            className="move-arrow move-arrow-left"
            onClick={this.moveItemLeft}
          >
            <i className="glyphicon glyphicon-arrow-left" />
          </button>
          <button
            style={{display:displayRight}}
            className="move-arrow move-arrow-right"
            onClick={this.moveItemRight}
          >
            <i className="glyphicon glyphicon-arrow-right" />
          </button>
          <button
            style={{display:displayDown}}
            className="move-arrow move-arrow-down"
            onClick={this.moveItemDown}
          >
            <i className="glyphicon glyphicon-arrow-down" />
          </button>
        </div>
      );
    } else {
      return (<div style={{display:"none"}} className="seq-id">{this.props.seqId}</div>);
    }
  }


  render() {
    let classes = classNames('samples-grid-item',
                             {'samples-grid-item-selected': this.props.selected,
                              'samples-grid-item-moving': this.props.moving});

    let scLocationClasses = classNames('sc_location', 'label', 'label-default',
                                       { 'label-success': this.props.loadable });

    return (
      <div className={classes} onClick={this.onClick}>
        {this.showMoveArrows()}
        {this.showMoveable()}
        <span className={scLocationClasses}>{this.props.location}</span>
        <br />
        <a href="#" ref="pacronym" className="protein-acronym" data-type="text"
          data-pk="1" data-url="/post" data-title="Enter protein acronym"
        >
          {this.props.name + (this.props.acronym ? ` ( ${this.props.acronym} )` : '')}
        </a>
        <br />
        <span className="dm">{this.props.dm}</span>
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
                  return this.props.showTaskParametersForm(tag.type, this.props.sampleID, tag);
                };

                let deleteTask = (e) => {
                  e.stopPropagation();
                  return this.props.deleteTask(tag.parent_id, tag.queueID, tag.sampleID);
                };

                content = (
                  <span key={i} className="btn-primary label" style={style} onClick={showForm}>
                    {`${tag.label} `}
                    <i className="fa fa-times" onClick={deleteTask} />
                  </span>
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
  itemKey: '',
  tags: '',
  acronym: '',
  dm: '',
  loadable: [],
  location: '',
  name: '',
  onClick: undefined,
  selected: false,
  moving: false,
  moveItem: undefined,
  canMove: undefined
};
