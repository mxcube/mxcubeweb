import React from 'react';
import classNames from 'classnames';
import 'bootstrap-webpack!bootstrap-webpack/bootstrap.config.js';
import 'x-editable/dist/bootstrap3-editable/js/bootstrap-editable.min.js';
import 'x-editable/dist/bootstrap3-editable/css/bootstrap-editable.css';
import './SampleGrid.css';


export default class SampleGridItem extends React.Component {

  constructor(props) {
    super(props);
    this.defaultProps = { tags: [], loadable: false, selected: false };
    this.onClick = props.onClick.bind(this, props.selectKey);
  }

  componentDidMount() {
        // let editable = ReactDOM.findDOMNode(this.refs.pacronym);
        // $(editable).editable({ placement: "right", container: "body" });
  }

  render() {
    let classes = classNames('samples-grid-item', { 'samples-grid-item-selected': this.props.selected });
    let sc_location_classes = classNames('sc_location', 'label', 'label-default', { 'label-success': this.props.loadable });
    return (<div className={classes} onClick={this.onClick}>
                 <span className={sc_location_classes}>{this.props.location}</span>
                 <br></br>
                 <a href="#" ref="pacronym" className="protein-acronym" data-type="text" data-pk="1" data-url="/post" data-title="Enter protein acronym">
                   {this.props.name + (this.props.acronym ? ' (' + this.props.acronym + ')' : '')}
                 </a>
                 <br></br>
                 <span className="dm">{this.props.dm}</span>
                 <br></br>
                 {this.props.tags.map((tag, i) => {
                   const style = { display: 'inline-block', margin: '3px', cursor: 'pointer' };
                   if ((typeof tag) === 'string') {
                     return <span key={i} className="label label-primary" style={style}>{tag}</span>;
                   } else {
                          // assuming a Task
                     let showForm = (e) => {
                       e.stopPropagation();
                       return this.props.showTaskParametersForm(tag.type, this.props.sample_id, tag);
                     };
                     let deleteTask = (e) => {
                       e.stopPropagation();
                       return this.props.deleteTask(tag.parent_id, tag.queue_id, tag.sample_id);
                     };
                     return (<span key={i} className="btn-primary label" style={style} onClick={showForm}>
                              {tag.label + ' '}
                              <i className="fa fa-times" onClick={deleteTask} />
                          </span>);
                   }
                 })}
               </div>);
  }
}

SampleGridItem.propTypes = {
  acronym: React.PropTypes.string,
  dm: React.PropTypes.string,
  loadable: React.PropTypes.bool.isRequired,
  location: React.PropTypes.string,
  name: React.PropTypes.string.isRequired,
  onClick: React.PropTypes.func.isRequired,
  selected: React.PropTypes.bool.isRequired
};

