import ReactDOM from 'react-dom'
import React from 'react'
import "./SampleGrid.css"
import SampleGridItem from './SampleGridItem'
import Isotope from 'isotope-layout'

export default class SampleGrid extends React.Component {
    propTypes: {
	samples_list: React.PropTypes.array.isRequired,
        toggleSelected: React.PropTypes.func.isRequired
    }

    componentDidMount() {
        if (! this.isotope) {
		let container = ReactDOM.findDOMNode(this);
		this.isotope = new Isotope(container, {itemSelector: '.samples-grid-item', layoutMode: 'masonry', masonry: { isFitWidth: true }});
	}
    }

    componentDidUpdate(prevProps, prevState) {
        if ((this.isotope) && (this.props.samples_list != prevProps.samples_list)) { 
	    this.isotope.reloadItems();
	    this.isotope.layout();
	    this.isotope.arrange();
	} 
    }

    addTag(index, tag) {
    }

    setLoadable(index, loadable) {
    }

    render() {
        let samples_list = this.props.samples_list;
        var sample_grid = [];
        Object.keys(samples_list).forEach(function (key) {
                let exp_type = samples_list[key].experimentType || "";
                let sc_loc = samples_list[key].location;
                sample_grid.push(<SampleGridItem key={key} sample_id={samples_list[key].id} acronym={samples_list[key].proteinAcronym} name={samples_list[key].sampleName} dm="HA1234567" location={sc_loc} tags={exp_type} selected={this.props.samples_list[key].selected} onClick={() => this.props.toggleSelected(key)}/>);
        }.bind(this));
    return <div className='samples-grid col-xs-12'>
                {sample_grid}
            </div>;

    }    
}
