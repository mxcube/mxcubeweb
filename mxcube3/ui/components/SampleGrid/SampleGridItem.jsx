import ReactDOM from 'react-dom';
import React from 'react';
import classNames from 'classnames';
import "bootstrap-webpack!bootstrap-webpack/bootstrap.config.js";
import "x-editable/dist/bootstrap3-editable/js/bootstrap-editable.min.js";
import "x-editable/dist/bootstrap3-editable/css/bootstrap-editable.css";
import "./SampleGrid.css";

export default class SampleGridItem extends React.Component {
        propTypes: {
          onClick: React.PropTypes.func.isRequired,
          loadable: React.PropTypes.bool.isRequired,
          tags: React.PropTypes.array,
          selected: React.PropTypes.bool.isRequired,
          name: React.PropTypes.string.isRequired,
          acronym: React.PropTypes.string,
          location: React.PropTypes.string,
          dm: React.PropTypes.string,
          sample_id: React.PropTypes.number.isRequired
        }

	constructor(props) {
        super(props)
        this.defaultProps = { tags: [], loadable: false, selected: false }
  }

	componentDidMount() {
    	let editable = ReactDOM.findDOMNode(this.refs.pacronym);
      $(editable).editable({ placement: "right", container: "body" });
	}

	render() {
                let sample_id = this.props.sample_id;
		let classes = classNames('samples-grid-item', {'samples-grid-item-selected': this.props.selected});
		let sc_location_classes = classNames("sc_location", "label", "label-default", {"label-success": this.props.loadable});

		return <div className={classes} onClick={this.props.onClick}>
			<span className={sc_location_classes}>{this.props.location}</span>
			<br></br>
			<a href="#" ref='pacronym' className="protein-acronym" data-type="text" data-pk="1" data-url="/post" data-title="Enter protein acronym">{this.props.name+(this.props.acronym ? ' ('+this.props.acronym+')' : "")}</a>
			<br></br>
			<span className="dm">{this.props.dm}</span>
			<br></br>
      {this.props.tags.map((tag) => {
      	return <span key={tag} className="label label-primary" style={{display: 'inline-block', margin: '3px' }}>{tag}</span>
      })}
		  </div>;
	}
}
