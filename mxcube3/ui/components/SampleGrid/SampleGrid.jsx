import ReactDOM from 'react-dom'
import React from 'react'
import "./SampleGrid.css"
import SampleGridItem from './SampleGridItem'
import Isotope from 'isotope-layout'

export default class SampleGrid extends React.Component {
  
    componentDidMount() {
        if (! this.isotope) {
            let container = ReactDOM.findDOMNode(this);
            this.isotope = new Isotope(container, {itemSelector: '.samples-grid-item', layoutMode: 'masonry', masonry: { isFitWidth: true }, filter: (elem) => { return this._filter(elem) }});
  }
    }

    componentDidUpdate(prevProps) {
        if (this.isotope) {
          if (this.props.samples_list != prevProps.samples_list) { 
            this.isotope.reloadItems();
            this.isotope.layout();
          }
          this.isotope.arrange(); 
        }
    }

    _filter(elem) {
        if (this.props.filter_text) {
          // find index of elem DOM element (= index of element in samples list)
          let i = 0;
          while (elem == elem.previousSibling) { ++i }
          //
          let sample_props = this.refs[i].props;
          let sample_desc = sample_props.name+" "+sample_props.acronym+" "+sample_props.code+" "+sample_props.location;
          let keep = sample_desc.includes(this.props.filter_text);
          if (! keep) {
              // a filtered sample is automatically unselected (we don't want to be able to add it, for example)
              if (sample_props.selected) { this.props.toggleSelected(sample_props.selectKey) }
          }
          return keep;
        }
        return true;
    }    

    render() {
        var samples_list = this.props.samples_list;
        var sample_grid = [];
        var i = 0;
        Object.keys(samples_list).forEach(key => {
            let sample = samples_list[key];
            let sample_info = sample.sample_info;
            let acronym = "?";
            let name = "unnamed";

            try {
                acronym = sample_info.proteinAcronym;
                name = sample_info.sampleName;
                //exp_type is diffraction plan, should be added to Queue
                //automatically, then it would be displayed here like any
                //data collection
                //exp_type = sample_info.experimentType;
            } catch(e) { 
                acronym = "Undefined";
                name = "No name";
            }

            let tags = [];
            for(let id in sample.tasks){
                tags.push(sample.tasks[id]); //.name);
            }
            sample_grid.push(<SampleGridItem ref={i} key={key} selectKey={key} sample_id={sample.id} acronym={acronym} name={name} dm={sample.code} loadable={false} location={sample.location} tags={tags} selected={this.props.selected[key] ? true : false} deleteTask={this.props.deleteTask} showTaskParametersForm={this.props.showTaskParametersForm} onClick={this.props.toggleSelected}/>);
            ++i;
      });
      return (<div className='samples-grid'>
                  {sample_grid}
             </div>);
    }
}

SampleGrid.propTypes = {
    filter_text: React.PropTypes.string, 
    toggleSelected: React.PropTypes.func.isRequired
}

