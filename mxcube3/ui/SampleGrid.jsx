import ReactDOM from 'react-dom';
import React from 'react';
import Isotope from 'isotope-layout';
import classNames from 'classnames';
import "bootstrap-webpack!bootstrap-webpack/bootstrap.config.js";
import "x-editable/dist/bootstrap3-editable/js/bootstrap-editable.min.js";
import "x-editable/dist/bootstrap3-editable/css/bootstrap-editable.css";
import "./css/SampleGrid.css";

export default class SampleGrid extends React.Component {
    constructor(props) {
        super(props);
        this.state = { isotope: null, samples_list: [] };
    }

    componentDidMount() {
        let container = ReactDOM.findDOMNode(this);
        if (! this.state.isotope) {
            this.setState({ isotope: new Isotope(container, {itemSelector: '.samples-grid-item', layoutMode: 'fitRows'})});
        }
    }

    componentDidUpdate(new_props, new_state) {
        if (new_state.samples_list != this.state.samples_list) {
            if (this.state.isotope) {
                this.state.isotope.reloadItems();
                this.state.isotope.layout();
                this.state.isotope.arrange();
            }
        }
    }

    render() {
        let samples_list = this.state.samples_list;
        return <div className='samples-grid'>
            {samples_list.map(function(sample_info, i) {
            let exp_type = sample_info.experimentType || "";
           let sc_loc = sample_info.containerSampleChangerLocation+":"+sample_info.sampleLocation
           return <SampleGridItem key={sample_info.sampleId} ref={sample_info.sampleId} sample_id={sample_info.sampleId} acronym={sample_info.proteinAcronym} name={sample_info.sampleName} dm="HA1234567" location={sc_loc} tags={exp_type}/>
       })}
        </div>;
    }
    
    add_samples(samples_list) {
        this.setState({'samples_list': samples_list});
    }
    
}

class SampleGridItem extends React.Component {
    constructor(props) {
        super(props);

        let tags;
        if (this.props.tags === "") {
            tags = [];
        } else {
            tags = this.props.tags.match(/[^ ]+/g);
        }
        
        this.state = { selected: false, loadable: false, 'tags': tags };
    }
    
    componentDidMount() {
    	let editable = ReactDOM.findDOMNode(this.refs.pacronym);
        $(editable).editable({ placement: "right", container: "body" });
    }
    
    toggleSelected() {
        let selected = !this.state.selected;
    	if (! this.state.loadable) { selected = false; }
        this.setState({ 'selected': selected });
    }
    
    setLoadable(loadable) {
        if (loadable === undefined) { loadable = true };
        this.setState({loadable: loadable, selected: false });
    }
    
    addTag(tag) {
        let tags = this.state.tags;
        tags.push(tag);
        this.setState({tags: tags}); 
    }
    
    render() {
    	let sample_id = this.props.sample_id;
        let classes = classNames('samples-grid-item', {'samples-grid-item-selected': this.state.selected});
        let sc_location_classes = classNames("sc_location", "label", "label-default", {"label-success": this.state.loadable});  
       
        return <div className={classes} onClick={this.toggleSelected.bind(this)}>
            <span className={sc_location_classes}>{this.props.location}</span>
            <br></br>
            <a href="#" ref='pacronym' className="protein-acronym" data-type="text" data-pk="1" data-url="/post" data-title="Enter protein acronym">{this.props.name+' ('+this.props.acronym+')'}</a>
            <br></br>
            <span className="dm">{this.props.dm}</span>
            <br></br>
            {this.state.tags.map(function(tag) {
               return <span key={tag}><span className="label label-primary">{tag}</span>&nbsp;</span>
            })}
        </div>;
    }
}
